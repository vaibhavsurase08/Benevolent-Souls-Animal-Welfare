
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DonationStatus = "pending" | "approved" | "rejected";
type StatusFilter = DonationStatus | "all";

type Donation = {
  id: number;
  created_at: string;
  donor_name: string | null;
  email: string | null;
  phone: string | null;
  amount: number | null;
  payment_method: string | null;
  transaction_id: string | null;
  message: string | null;
  status: DonationStatus | null;
};

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const formatRupees = (amount: number | null | undefined) => {
  if (amount == null || !Number.isFinite(Number(amount))) return "—";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const statusStyles: Record<DonationStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminDonationsPage() {
  const router = useRouter();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Donation | null>(null);

  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") !== "true") {
      router.replace("/admin/login");
      return;
    }

    void fetchDonations();
  }, [router]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => setSuccessMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("donations")
      .select(
        "id, created_at, donor_name, email, phone, amount, payment_method, transaction_id, message, status"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching donations:", error);
      setErrorMessage(
        "Could not load donations. Check the database columns and Supabase permissions."
      );
      setLoading(false);
      return;
    }

    setDonations((data ?? []) as Donation[]);
    setLoading(false);
  }, []);

  const stats = useMemo(() => {
    const pending = donations.filter((d) => d.status === "pending").length;
    const approved = donations.filter((d) => d.status === "approved").length;
    const rejected = donations.filter((d) => d.status === "rejected").length;

    const verifiedAmount = donations
      .filter((d) => d.status === "approved")
      .reduce((total, d) => total + Number(d.amount ?? 0), 0);

    return {
      total: donations.length,
      pending,
      approved,
      rejected,
      verifiedAmount,
    };
  }, [donations]);

  const filteredDonations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return donations.filter((donation) => {
      const statusMatches =
        filterStatus === "all" || donation.status === filterStatus;

      const searchMatches =
        !query ||
        [
          donation.donor_name,
          donation.email,
          donation.phone,
          donation.transaction_id,
        ].some((value) => value?.toLowerCase().includes(query));

      return statusMatches && searchMatches;
    });
  }, [donations, filterStatus, searchQuery]);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const amount = donations
        .filter((donation) => {
          const createdAt = new Date(donation.created_at);
          return (
            createdAt >= date &&
            createdAt < nextDate &&
            donation.status === "approved"
          );
        })
        .reduce((total, donation) => total + Number(donation.amount ?? 0), 0);

      return {
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        date: date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        amount,
      };
    });
  }, [donations]);

  const maxChartAmount = Math.max(...chartData.map((day) => day.amount), 1);

  const graphPoints = chartData.map((day, index) => ({
    ...day,
    x: 5 + (index / 6) * 90,
    y: 78 - (day.amount / maxChartAmount) * 58,
  }));

  const updateStatus = async (
    donation: Donation,
    nextStatus: DonationStatus
  ) => {
    if (donation.status === nextStatus) return;

    const action = nextStatus === "approved" ? "verify" : "reject";

    const confirmed = window.confirm(
      nextStatus === "approved"
        ? `Have you independently confirmed receipt of ${formatRupees(
            donation.amount
          )} from ${donation.donor_name || "this donor"}? Only confirm if the payment is visible in the foundation's bank or UPI records.`
        : `Reject the payment record for ${
            donation.donor_name || "this donor"
          }? Verify the details before continuing.`
    );

    if (!confirmed) return;

    setUpdatingId(donation.id);
    setErrorMessage("");
    setSuccessMessage("");

    const { data, error } = await supabase
      .from("donations")
      .update({ status: nextStatus })
      .eq("id", donation.id)
      .eq("status", donation.status ?? "pending")
      .select("id, status")
      .maybeSingle();

    if (error || !data) {
      console.error("Donation status update failed:", error);
      setErrorMessage(
        error?.message ||
          "The donation status was not changed. It may have been updated already."
      );
      setUpdatingId(null);
      return;
    }

    setDonations((current) =>
      current.map((item) =>
        item.id === donation.id
          ? { ...item, status: nextStatus }
          : item
      )
    );

    setSuccessMessage(
      nextStatus === "approved"
        ? "Donation marked as verified."
        : "Donation marked as rejected."
    );

    setUpdatingId(null);
  };

  const deleteDonation = async () => {
    if (!deleteTarget) return;

    const donationId = deleteTarget.id;
    setErrorMessage("");

    const { error } = await supabase
      .from("donations")
      .delete()
      .eq("id", donationId);

    if (error) {
      console.error("Error deleting donation:", error);
      setErrorMessage("Could not delete the donation. Check Supabase permissions.");
      setDeleteTarget(null);
      return;
    }

    setDonations((current) =>
      current.filter((donation) => donation.id !== donationId)
    );

    setDeleteTarget(null);
    setSuccessMessage("Donation record deleted.");
  };

  const printReport = () => window.print();

  return (
    <main className="min-h-screen bg-[#FAF8F0] text-[#25283B]">
      <header className="bg-[#25283B] px-6 py-6 text-white lg:px-10 print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC928]">
              Admin Panel
            </p>
            <h1 className="mt-2 text-3xl font-bold">Donations</h1>
            <p className="mt-1 text-sm text-white/60">
              Manage donation records and review payment status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="border border-white/30 px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-[#25283B]"
          >
            Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#25283B]/50">
              Donation Management
            </p>
            <h2 className="mt-1 text-2xl font-bold">Overview</h2>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void fetchDonations()}
              className="border border-[#25283B]/20 bg-white px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-100"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={printReport}
              className="bg-[#FFC928] px-4 py-3 text-xs font-bold uppercase tracking-wider hover:brightness-95"
            >
              Print Report
            </button>
          </div>
        </div>

        {successMessage && (
          <div role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total Donations", value: String(stats.total) },
            { label: "Pending", value: String(stats.pending) },
            { label: "Verified", value: String(stats.approved) },
            { label: "Rejected", value: String(stats.rejected) },
            { label: "Verified Amount", value: formatRupees(stats.verifiedAmount) },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-[#25283B]/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {card.label}
              </p>
              <p className="mt-3 break-words text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-[#25283B]/10 bg-white p-5 shadow-sm sm:p-7 print:hidden">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-700">
              Donation Analytics
            </p>
            <h2 className="mt-2 text-xl font-bold">Verified donations — last 7 days</h2>
            <p className="mt-1 text-sm text-gray-500">
              Only donations marked verified are included in this chart.
            </p>
          </div>

          <div className="mt-6">
            <svg
              viewBox="0 0 100 85"
              role="img"
              aria-label="Verified donation amounts over the last seven days"
              className="h-64 w-full overflow-visible"
              preserveAspectRatio="none"
            >
              {[20, 35, 50, 65, 80].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#25283B"
                  strokeOpacity="0.1"
                  strokeWidth="0.25"
                />
              ))}

              <polyline
                points={graphPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
                stroke="#42A5F5"
                strokeWidth="1.2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />

              {graphPoints.map((point) => (
                <circle
                  key={point.date}
                  cx={point.x}
                  cy={point.y}
                  r="1.3"
                  fill="#42A5F5"
                >
                  <title>{`${point.date}: ${formatRupees(point.amount)}`}</title>
                </circle>
              ))}
            </svg>

            <div className="grid grid-cols-7 gap-1">
              {graphPoints.map((point) => (
                <div key={point.date} className="text-center">
                  <p className="text-xs font-semibold">{point.label}</p>
                  <p className="mt-1 text-[10px] text-gray-500">{point.date}</p>
                  <p className="mt-1 break-words text-[10px] text-gray-600">
                    {formatRupees(point.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-[#25283B]/10 bg-white p-5 shadow-sm print:hidden">
          <label htmlFor="donation-search" className="mb-2 block text-sm font-semibold">
            Search donations
          </label>
          <input
            id="donation-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, email, phone or transaction ID..."
            className="w-full rounded-lg border border-[#25283B]/20 bg-[#FAF8F0] px-4 py-3 text-sm outline-none focus:border-[#25283B]"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm text-gray-600">Status:</span>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filterStatus === option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                  filterStatus === option.value
                    ? "border-[#25283B] bg-[#25283B] text-white"
                    : "border-[#25283B]/20 bg-white hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Donation Records</h2>
            <p className="text-sm text-gray-500">
              {filteredDonations.length} record{filteredDonations.length === 1 ? "" : "s"}
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl border bg-white px-6 py-12 text-center text-gray-500">
              Loading donations...
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="rounded-xl border bg-white px-6 py-12 text-center">
              <h3 className="font-bold">No donations found</h3>
              <p className="mt-2 text-sm text-gray-500">
                There are no records matching your search and status filters.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredDonations.map((donation) => {
                const status: DonationStatus = donation.status ?? "pending";

                return (
                  <article
                    key={donation.id}
                    className="rounded-xl border border-[#25283B]/10 bg-white p-5 shadow-sm sm:p-7"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold">
                          {donation.donor_name || "Anonymous Donor"}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {donation.created_at
                            ? new Date(donation.created_at).toLocaleString("en-IN")
                            : "Date unavailable"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatRupees(donation.amount)}</p>
                        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${statusStyles[status]}`}>
                          {status === "approved"
                            ? "Verified"
                            : status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        { label: "Email", value: donation.email || "—" },
                        { label: "Phone", value: donation.phone || "—" },
                        { label: "Payment Method", value: donation.payment_method || "—" },
                        { label: "Transaction ID / UTR", value: donation.transaction_id || "—" },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {item.label}
                          </p>
                          <p className="mt-2 break-words text-sm">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {donation.message && (
                      <div className="mt-5 border-t border-gray-100 pt-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Message
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                          {donation.message}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-5 print:hidden">
                      {status !== "approved" && (
                        <button
                          type="button"
                          disabled={updatingId === donation.id}
                          onClick={() => void updateStatus(donation, "approved")}
                          className="rounded-lg bg-green-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-50"
                        >
                          {updatingId === donation.id ? "Updating..." : "Verify Payment"}
                        </button>
                      )}

                      {status !== "rejected" && (
                        <button
                          type="button"
                          disabled={updatingId === donation.id}
                          onClick={() => void updateStatus(donation, "rejected")}
                          className="rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(donation)}
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-bold hover:bg-gray-100"
                      >
                        Delete Record
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10 hidden print:block">
          <h2 className="mb-4 text-xl font-bold">Donation Report</h2>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-y">
                <th className="p-2">Date</th>
                <th className="p-2">Donor</th>
                <th className="p-2">Email</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Method</th>
                <th className="p-2">Transaction ID</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((donation) => (
                <tr key={donation.id} className="border-b">
                  <td className="p-2">
                    {new Date(donation.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-2">{donation.donor_name || "Anonymous"}</td>
                  <td className="break-all p-2">{donation.email || "—"}</td>
                  <td className="p-2">{formatRupees(donation.amount)}</td>
                  <td className="p-2">{donation.payment_method || "—"}</td>
                  <td className="break-all p-2">{donation.transaction_id || "—"}</td>
                  <td className="p-2">{donation.status || "pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-xl bg-white p-7 shadow-xl"
          >
            <h2 id="delete-title" className="text-xl font-bold">
              Delete donation record?
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              This permanently deletes the selected record from the database.
              This action cannot be undone.
            </p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteDonation()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
