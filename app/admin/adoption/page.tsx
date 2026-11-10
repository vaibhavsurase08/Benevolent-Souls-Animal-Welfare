"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Enquiry = {
  id: number;
  created_at: string;
  animal_id: number | null;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  status: string;
};

type Animal = {
  id: number;
  name: string;
};

type EnquiryStatus = "pending" | "approved" | "rejected";

export default function AdminAdoptionPage() {
  const router = useRouter();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const [enquiryResult, animalResult] = await Promise.all([
      supabase
        .from("adoption_enquiries")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("animals").select("id, name"),
    ]);

    if (enquiryResult.error) {
      console.error("Failed to load adoption enquiries:", enquiryResult.error);
      setErrorMessage(
        "Could not load adoption enquiries. Check your Supabase permissions."
      );
      setLoading(false);
      return;
    }

    if (animalResult.error) {
      console.error("Failed to load animal names:", animalResult.error);
    }

    setEnquiries((enquiryResult.data ?? []) as Enquiry[]);
    setAnimals((animalResult.data ?? []) as Animal[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") !== "true") {
      router.replace("/admin/login");
      return;
    }

    void loadData();
  }, [router, loadData]);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [successMessage, errorMessage]);

  const animalNames = useMemo(() => {
    return new Map(animals.map((animal) => [animal.id, animal.name]));
  }, [animals]);

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enquiries.filter((enquiry) => {
      const animalName = enquiry.animal_id
        ? animalNames.get(enquiry.animal_id) ?? ""
        : "";

      const matchesSearch =
        !query ||
        enquiry.name?.toLowerCase().includes(query) ||
        enquiry.email?.toLowerCase().includes(query) ||
        enquiry.phone?.toLowerCase().includes(query) ||
        animalName.toLowerCase().includes(query);

      const matchesStatus =
        filterStatus === "all" || enquiry.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [enquiries, animalNames, search, filterStatus]);

  const pendingCount = enquiries.filter(
    (item) => item.status === "pending"
  ).length;
  const approvedCount = enquiries.filter(
    (item) => item.status === "approved"
  ).length;
  const rejectedCount = enquiries.filter(
    (item) => item.status === "rejected"
  ).length;

  async function updateStatus(
    enquiryId: number,
    newStatus: EnquiryStatus
  ) {
    setUpdatingId(enquiryId);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("adoption_enquiries")
      .update({ status: newStatus })
      .eq("id", enquiryId);

    if (error) {
      console.error("Failed to update enquiry:", error);
      setErrorMessage(
        "Could not update the enquiry status. Check your Supabase permissions."
      );
      setUpdatingId(null);
      return;
    }

    setEnquiries((current) =>
      current.map((enquiry) =>
        enquiry.id === enquiryId
          ? { ...enquiry, status: newStatus }
          : enquiry
      )
    );

    setSuccessMessage(`Enquiry status changed to ${newStatus}.`);
    setUpdatingId(null);
  }

  async function deleteEnquiry(enquiryId: number) {
    setDeletingId(enquiryId);
    setErrorMessage("");
    setSuccessMessage("");

    const { data, error } = await supabase
      .from("adoption_enquiries")
      .delete()
      .eq("id", enquiryId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Failed to delete adoption enquiry:", error);
      setErrorMessage(
        "Could not delete this enquiry. Check your Supabase permissions and try again."
      );
      setDeletingId(null);
      setConfirmDeleteId(null);
      return;
    }

    if (!data) {
      setErrorMessage(
        "The enquiry was not deleted. It may no longer exist or your Supabase permissions do not allow deletion."
      );
      setDeletingId(null);
      setConfirmDeleteId(null);
      return;
    }

    setEnquiries((current) =>
      current.filter((enquiry) => enquiry.id !== enquiryId)
    );
    setSuccessMessage("Adoption enquiry deleted successfully.");
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  function getStatusClasses(status: string) {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-amber-100 text-amber-800";
    }
  }

  function getActionButtonClasses(
    buttonStatus: EnquiryStatus,
    currentStatus: string
  ) {
    const selected = buttonStatus === currentStatus;

    if (buttonStatus === "approved") {
      return selected
        ? "border border-green-700 bg-green-700 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white"
        : "border border-green-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-green-700 transition hover:bg-green-50";
    }

    if (buttonStatus === "rejected") {
      return selected
        ? "border border-red-600 bg-red-600 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white"
        : "border border-red-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-50";
    }

    return selected
      ? "border border-amber-600 bg-amber-500 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B]"
      : "border border-amber-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-amber-800 transition hover:bg-amber-50";
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-[#25283B]">
      {/* HEADER */}
      <header className="bg-[#25283B] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFC928]">
              Administration
            </p>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Adoption Enquiries
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Review and manage adoption applications.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="shrink-0 bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#25283B] transition hover:bg-[#FFC928]"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* NOTIFICATIONS */}
        {successMessage && (
          <div
            role="status"
            className="mb-5 border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-800"
          >
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {/* COLOURFUL SUMMARY CARDS */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Total Enquiries",
              value: enquiries.length,
              backgroundColor: "#E8EBF5",
              borderColor: "#25283B",
              labelColor: "#25283B",
            },
            {
              label: "Pending",
              value: pendingCount,
              backgroundColor: "#FFF0B3",
              borderColor: "#D6A900",
              labelColor: "#805D00",
            },
            {
              label: "Approved",
              value: approvedCount,
              backgroundColor: "#DDF7E7",
              borderColor: "#22A06B",
              labelColor: "#12663D",
            },
            {
              label: "Rejected",
              value: rejectedCount,
              backgroundColor: "#FCE0E0",
              borderColor: "#E5484D",
              labelColor: "#A51D24",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="border-l-4 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
              style={{
                backgroundColor: item.backgroundColor,
                borderLeftColor: item.borderColor,
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.12em] sm:text-xs"
                style={{ color: item.labelColor }}
              >
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-bold text-[#25283B]">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* SEARCH AND COLOUR STATUS FILTERS */}
        <section className="mt-8 border border-[#E8E3D5] bg-[#FFFDF7] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="search-enquiries"
                className="text-xs font-bold uppercase tracking-[0.1em] text-gray-600"
              >
                Search Enquiries
              </label>
              <input
                id="search-enquiries"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, phone or animal..."
                className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25283B] focus:ring-2 focus:ring-[#FFC928]/40"
              />
            </div>

            <div className="min-w-0 xl:max-w-[610px]">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-600">
                Filter by Status
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilterStatus("all")}
                  aria-pressed={filterStatus === "all"}
                  className={`border px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] transition ${
                    filterStatus === "all"
                      ? "border-[#25283B] bg-[#25283B] text-white"
                      : "border-gray-200 bg-white text-[#25283B] hover:border-[#25283B]"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("pending")}
                  aria-pressed={filterStatus === "pending"}
                  className={`border px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] transition ${
                    filterStatus === "pending"
                      ? "border-[#D6A900] bg-[#FFC928] text-[#25283B]"
                      : "border-amber-200 bg-[#FFF7D6] text-[#8A6500] hover:border-[#D6A900]"
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("approved")}
                  aria-pressed={filterStatus === "approved"}
                  className={`border px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] transition ${
                    filterStatus === "approved"
                      ? "border-green-700 bg-green-700 text-white"
                      : "border-green-200 bg-[#E9F9EF] text-green-800 hover:border-green-700"
                  }`}
                >
                  Approved
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("rejected")}
                  aria-pressed={filterStatus === "rejected"}
                  className={`border px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] transition ${
                    filterStatus === "rejected"
                      ? "border-red-700 bg-red-700 text-white"
                      : "border-red-200 bg-[#FDECEC] text-red-700 hover:border-red-700"
                  }`}
                >
                  Rejected
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              className="self-start bg-[#25283B] px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#FFC928] hover:text-[#25283B] xl:self-end"
            >
              Refresh
            </button>
          </div>
        </section>

        {/* ENQUIRY LIST */}
        <section className="mt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B28A00]">
                Applications
              </p>
              <h2 className="mt-2 text-2xl font-bold">Enquiry Records</h2>
            </div>
            <p className="text-sm text-gray-500">
              {filteredEnquiries.length} shown
            </p>
          </div>

          {loading ? (
            <div className="bg-white p-10 text-center text-sm text-gray-500">
              Loading adoption enquiries...
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-bold">No enquiries found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredEnquiries.map((enquiry) => {
                const animalName = enquiry.animal_id
                  ? animalNames.get(enquiry.animal_id)
                  : undefined;
                const currentStatus = (enquiry.status || "pending").toLowerCase();

                return (
                  <article
                    key={enquiry.id}
                    className="bg-white p-5 shadow-sm sm:p-7"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#B28A00]">
                          Adoption Application #{enquiry.id}
                        </p>
                        <h3 className="mt-2 text-xl font-bold">
                          {enquiry.name || "Unnamed applicant"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Animal: {animalName || "Animal not available"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] ${getStatusClasses(currentStatus)}`}
                      >
                        {currentStatus}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                          Email
                        </p>
                        <p className="mt-2 break-all text-sm">
                          {enquiry.email || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                          Phone
                        </p>
                        <p className="mt-2 text-sm">
                          {enquiry.phone || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                          Submitted
                        </p>
                        <p className="mt-2 text-sm">
                          {new Date(enquiry.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {enquiry.message && (
                      <div className="mt-5 border-t border-gray-100 pt-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                          Applicant Message
                        </p>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                          {enquiry.message}
                        </p>
                      </div>
                    )}

                    {/* ALWAYS AVAILABLE: change decision any time */}
                    <div className="mt-6 border-t border-gray-100 pt-5">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                        Change Decision — You Can Update This Anytime
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={updatingId === enquiry.id}
                          onClick={() => void updateStatus(enquiry.id, "pending")}
                          aria-pressed={currentStatus === "pending"}
                          className={`${getActionButtonClasses("pending", currentStatus)} disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {currentStatus === "pending" ? "✓ Pending" : "Set Pending"}
                        </button>

                        <button
                          type="button"
                          disabled={updatingId === enquiry.id}
                          onClick={() => void updateStatus(enquiry.id, "approved")}
                          aria-pressed={currentStatus === "approved"}
                          className={`${getActionButtonClasses("approved", currentStatus)} disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {currentStatus === "approved" ? "✓ Approved" : "Approve"}
                        </button>

                        <button
                          type="button"
                          disabled={updatingId === enquiry.id}
                          onClick={() => void updateStatus(enquiry.id, "rejected")}
                          aria-pressed={currentStatus === "rejected"}
                          className={`${getActionButtonClasses("rejected", currentStatus)} disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {currentStatus === "rejected" ? "✓ Rejected" : "Reject"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingId === enquiry.id ||
                            deletingId === enquiry.id
                          }
                          onClick={() => setConfirmDeleteId(enquiry.id)}
                          className="border border-red-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-red-700 transition hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>

                        {updatingId === enquiry.id && (
                          <span className="self-center text-xs text-gray-500">
                            Saving decision...
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {confirmDeleteId !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#171B2B]/65 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && deletingId === null) {
              setConfirmDeleteId(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-enquiry-title"
            className="w-full max-w-md border border-gray-100 bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="m19 6-1 14H6L5 6" />
                <path d="M10 11v5M14 11v5" />
              </svg>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
              Delete application
            </p>
            <h2
              id="delete-enquiry-title"
              className="mt-2 text-xl font-bold text-[#25283B]"
            >
              Are you sure?
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              This adoption enquiry will be permanently deleted. You cannot
              undo this action.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => setConfirmDeleteId(null)}
                className="border border-gray-200 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => void deleteEnquiry(confirmDeleteId)}
                className="bg-red-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === confirmDeleteId ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[110] flex max-w-[calc(100%-3rem)] items-center gap-3 border border-green-200 bg-white px-5 py-4 shadow-xl"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-[#25283B]">Success</p>
            <p className="mt-0.5 text-sm text-gray-600">
              {successMessage}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
