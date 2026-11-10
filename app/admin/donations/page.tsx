
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
type DonationStatus = "pending" | "approved" | "rejected";
type StatusFilter = DonationStatus | "all";
type GraphPeriod = "weekly" | "monthly" | "yearly";

type Donation = {
  id: number;
  created_at: string;
  verified_at: string | null;
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
  const [graphPeriod, setGraphPeriod] = useState<GraphPeriod>("weekly");
  const [confirmation, setConfirmation] = useState<{
    donation: Donation;
    nextStatus: DonationStatus;
  } | null>(null);

  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") !== "true") {
      router.replace("/admin/login");
      return;
    }

    void fetchDonations();
  }, [router]);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [successMessage, errorMessage]);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("donations")
      .select(
        "id, created_at, verified_at, donor_name, email, phone, amount, payment_method, transaction_id, message, status"
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
    const now = new Date();
    const periods =
      graphPeriod === "weekly"
        ? 7
        : graphPeriod === "monthly"
          ? 12
          : 5;

    return Array.from({ length: periods }, (_, index) => {
      const date = new Date(now);

      if (graphPeriod === "weekly") {
        date.setDate(now.getDate() - (periods - 1 - index));
        date.setHours(0, 0, 0, 0);
      } else if (graphPeriod === "monthly") {
        date.setDate(1);
        date.setMonth(now.getMonth() - (periods - 1 - index));
        date.setHours(0, 0, 0, 0);
      } else {
        date.setMonth(0, 1);
        date.setFullYear(now.getFullYear() - (periods - 1 - index));
        date.setHours(0, 0, 0, 0);
      }

      const nextDate = new Date(date);
      if (graphPeriod === "weekly") {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (graphPeriod === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      const amount = donations
        .filter((donation) => {
          if (!donation.verified_at || donation.status !== "approved") {
            return false;
          }

          const verifiedAt = new Date(donation.verified_at);
          return verifiedAt >= date && verifiedAt < nextDate;
        })
        .reduce((total, donation) => total + Number(donation.amount ?? 0), 0);

      let label = "";
      let periodDate = "";

      if (graphPeriod === "weekly") {
        label = date.toLocaleDateString("en-IN", { weekday: "short" });
        periodDate = date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
      } else if (graphPeriod === "monthly") {
        label = date.toLocaleDateString("en-IN", { month: "short" });
        periodDate = date.toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        });
      } else {
        label = date.toLocaleDateString("en-IN", { year: "numeric" });
        periodDate = label;
      }

      return { label, date: periodDate, amount };
    });
  }, [donations, graphPeriod]);

  const maxChartAmount = Math.max(...chartData.map((period) => period.amount), 1);

  const graphPoints = chartData.map((period, index) => ({
    ...period,
    x: chartData.length === 1 ? 50 : 5 + (index / (chartData.length - 1)) * 90,
    y: 78 - (period.amount / maxChartAmount) * 58,
  }));

  const updateStatus = (donation: Donation, nextStatus: DonationStatus) => {
    if (donation.status === nextStatus || updatingId === donation.id) return;
    setConfirmation({ donation, nextStatus });
  };

  const confirmStatusUpdate = async () => {
    if (!confirmation) return;

    const { donation, nextStatus } = confirmation;
    const verifiedAt =
      nextStatus === "approved" ? new Date().toISOString() : null;

    setConfirmation(null);
    setUpdatingId(donation.id);
    setErrorMessage("");
    setSuccessMessage("");

    const { data, error } = await supabase
      .from("donations")
      .update({
        status: nextStatus,
        verified_at: verifiedAt,
      })
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
          ? { ...item, status: nextStatus, verified_at: verifiedAt }
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

  const printReport = () => window.print();

  return (
    <main className="min-h-screen bg-[#FAF8F0] text-[#25283B]">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: #ffffff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          body * {
            visibility: hidden !important;
          }

          .print-report,
          .print-report * {
            visibility: visible !important;
          }

          .print-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-report h2 {
            margin-bottom: 16px !important;
          }

          .print-report table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
          }

          .print-report th,
          .print-report td {
            border-bottom: 1px solid #25283B !important;
            padding: 8px 6px !important;
            text-align: left !important;
            vertical-align: top !important;
            color: #25283B !important;
          }

          .print-report thead {
            display: table-header-group;
          }

          .print-report tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
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
          <div
            role="status"
            className="fixed bottom-6 right-6 z-[100] w-[min(92vw,380px)] rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-2xl print:hidden"
          >
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="fixed bottom-6 right-6 z-[100] w-[min(92vw,380px)] rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-2xl print:hidden"
          >
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 print:hidden">
          {[
            {
              label: "Total Donations",
              value: String(stats.total),
              bgColor: "bg-blue-50",
              borderColor: "border-blue-200",
              textColor: "text-blue-600",
            },
            {
              label: "Pending",
              value: String(stats.pending),
              bgColor: "bg-amber-50",
              borderColor: "border-amber-200",
              textColor: "text-amber-600",
            },
            {
              label: "Verified",
              value: String(stats.approved),
              bgColor: "bg-emerald-50",
              borderColor: "border-emerald-200",
              textColor: "text-emerald-600",
            },
            {
              label: "Rejected",
              value: String(stats.rejected),
              bgColor: "bg-rose-50",
              borderColor: "border-rose-200",
              textColor: "text-rose-600",
            },
            {
              label: "Verified Amount",
              value: formatRupees(stats.verifiedAmount),
              bgColor: "bg-violet-50",
              borderColor: "border-violet-200",
              textColor: "text-violet-600",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`${card.bgColor} ${card.borderColor} rounded-xl p-5 shadow-sm transition-all hover:shadow-md`}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {card.label}
              </p>
              <p className={`mt-3 break-words text-2xl font-bold ${card.textColor}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-[#25283B]/10 bg-white p-5 shadow-sm sm:p-7 print:hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-green-700">
                Donation Analytics
              </p>
              <h2 className="mt-2 text-xl font-bold">
                {graphPeriod === "weekly"
                  ? "Verified donations — last 7 days"
                  : graphPeriod === "monthly"
                    ? "Verified donations — last 12 months"
                    : "Verified donations — last 5 years"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Only donations marked verified are included in this chart.
              </p>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose graph time period">
              {([
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={graphPeriod === option.value}
                  onClick={() => setGraphPeriod(option.value)}
                  className={`rounded-lg border px-4 py-2 text-xs font-bold transition-colors ${
                    graphPeriod === option.value
                      ? "border-[#25283B] bg-[#25283B] text-white"
                      : "border-[#25283B]/20 bg-white text-[#25283B] hover:bg-[#FAF8F0]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <svg
              viewBox="0 0 100 85"
              role="img"
              aria-label={`Verified donation amounts for the ${graphPeriod} view`}
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

            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${graphPoints.length}, minmax(0, 1fr))` }}>
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

                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="print-report mt-10 hidden print:block">
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

      {confirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#171927]/65 px-4 py-6 backdrop-blur-sm print:hidden"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmation(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="donation-confirmation-title"
            className="w-full max-w-md rounded-2xl border border-[#FFC928]/30 bg-[#FAF8F0] p-6 shadow-2xl sm:p-7"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC928]/20 text-2xl">
              {confirmation.nextStatus === "approved" ? "✓" : "!"}
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A6A00]">
              Donation management
            </p>
            <h2
              id="donation-confirmation-title"
              className="mt-2 text-xl font-bold text-[#25283B]"
            >
              {confirmation.nextStatus === "approved"
                ? "Verify this payment?"
                : "Reject this payment?"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#25283B]/75">
              {confirmation.nextStatus === "approved"
                ? `Confirm that ${formatRupees(
                    confirmation.donation.amount
                  )} has been received from ${
                    confirmation.donation.donor_name || "this donor"
                  }. Only continue after checking the foundation's bank or UPI records.`
                : `Are you sure you want to reject the payment record for ${
                    confirmation.donation.donor_name || "this donor"
                  }? Please verify the details before continuing.`}
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="rounded-lg border border-[#25283B]/20 bg-white px-5 py-3 text-sm font-bold text-[#25283B] transition hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmStatusUpdate()}
                className={`rounded-lg px-5 py-3 text-sm font-bold text-white transition hover:brightness-95 ${
                  confirmation.nextStatus === "approved"
                    ? "bg-green-700"
                    : "bg-red-600"
                }`}
              >
                {confirmation.nextStatus === "approved"
                  ? "Confirm Verification"
                  : "Confirm Rejection"}
              </button>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}

