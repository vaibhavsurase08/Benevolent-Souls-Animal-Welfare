"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DonationForm = {
  donor_name: string;
  email: string;
  phone: string;
  amount: string;
  payment_method: string;
  transaction_id: string;
  message: string;
};

type CopyField = "account" | "ifsc";

const initialForm: DonationForm = {
  donor_name: "",
  email: "",
  phone: "",
  amount: "",
  payment_method: "",
  transaction_id: "",
  message: "",
};

const bankDetails = {
  account: "50200111951032",
  ifsc: "HDFC0001796",
};

const UPI_ID = "9673987994-1@okbizaxis";
const UPI_LINK = `upi://pay?pa=${UPI_ID}&pn=Benevolent%20Souls%20Foundation`;
const QUICK_AMOUNTS = [100, 250, 500, 1000];

const IMPACT_AREAS = [
  {
    title: "Food & Nutrition",
    text: "Help provide nutritious food and clean drinking water for animals in need.",
    path: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  },
  {
    title: "Medical Care",
    text: "Support veterinary consultations, medicines, wound treatment, and recovery care.",
    path: "M12 5v14M5 12h14",
  },
  {
    title: "Rescue & Shelter",
    text: "Help support rescue-related expenses, temporary shelter, and essential supplies for vulnerable animals.",
    path: "M3 10.5 12 3l9 7.5V21H3z",
  },
  {
    title: "Adoption & Rehabilitation",
    text: "Help animals recover and prepare for a safer life with responsible adopters.",
    path: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z",
  },
];

const AMOUNT_NOTES: Record<number, string> = {
  100: "A small act of kindness",
  250: "Support for essential animal-care supplies",
  500: "A contribution towards animal welfare needs",
  1000: "Greater support for rescue and care activities",
};

export default function DonatePage() {
  const [form, setForm] = useState<DonationForm>(initialForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<Record<CopyField, string>>({
    account: "",
    ifsc: "",
  });

  const isUPI = form.payment_method === "UPI";
  const isBankTransfer = form.payment_method === "Bank Transfer";

  useEffect(() => {
    if (!showQrModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowQrModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showQrModal]);

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!form.donor_name.trim()) {
      errors.donor_name = "Full name is required";
    }

    if (!form.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address";
    }

    const amount = Number(form.amount);

    if (!form.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      errors.amount = "Enter a valid donation amount greater than zero";
    }

    if (!form.payment_method) {
      errors.payment_method = "Select a payment method";
    }

    return errors;
  }, [form]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setSuccess(false);
    setError("");

    if (formErrors[name]) {
      setFormErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  const selectAmount = (amount: number) => {
    setForm((current) => ({
      ...current,
      amount: String(amount),
    }));

    setFormErrors((current) => {
      const next = { ...current };
      delete next.amount;
      return next;
    });

    setSuccess(false);
    setError("");
  };

  const copyToClipboard = async (value: string, field: CopyField) => {
    try {
      await navigator.clipboard.writeText(value);

      setCopyFeedback((current) => ({
        ...current,
        [field]: "Copied!",
      }));
    } catch {
      setCopyFeedback((current) => ({
        ...current,
        [field]: "Copy failed",
      }));
    }

    window.setTimeout(() => {
      setCopyFeedback((current) => ({
        ...current,
        [field]: "",
      }));
    }, 2000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      const { error: supabaseError } = await supabase.from("donations").insert({
        donor_name: form.donor_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        amount: Number(form.amount),
        payment_method: form.payment_method,
        transaction_id: form.transaction_id.trim() || null,
        message: form.message.trim() || null,
      });

      if (supabaseError) {
        console.error("Donation submission failed:", supabaseError);
        setError(
          "We couldn't save your details. Please check your connection and try again."
        );
        return;
      }

      setSuccess(true);
      setForm({ ...initialForm });
    } catch (submissionError) {
      console.error("Donation submission failed:", submissionError);
      setError("Something went wrong while submitting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field: string) =>
    `mt-2 w-full rounded-lg border bg-[#FAF8F0] px-4 py-3 text-sm text-[#20222B] outline-none transition placeholder:text-[#777987] focus:border-[#C49A00] focus:ring-2 focus:ring-[#C49A00]/15 ${
      formErrors[field] ? "border-red-500" : "border-[#36394F]/20"
    }`;

  return (
    <main className="min-h-screen bg-[#FAF8F0] text-[#20222B]">
      <header className="border-b border-white/10 bg-[#25283B]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <a
            href="/"
            className="text-xs font-bold tracking-[0.16em] text-white sm:text-sm"
          >
            BENEVOLENT SOULS FOUNDATION
          </a>

          <a
            href="/#donate"
            className="text-xs font-semibold tracking-wide text-[#FFC928] transition hover:text-white sm:text-sm"
          >
            ← BACK TO HOME
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-10 pt-14 sm:px-8 lg:px-10 lg:pt-20">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#9B7900]">
          Support the mission
        </p>

        <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-[#25283B] sm:text-5xl md:text-7xl">
          Help support
          <br className="hidden sm:block" /> animal welfare.
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-[#20222B]/70 sm:text-lg">
          Your contribution can support animal welfare initiatives and
          community activities. Thank you for caring.
        </p>
      </section>

      {/* =================================================
          DONATION INTRODUCTION
      ================================================= */}
      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
        <div className="rounded-xl bg-white p-8 shadow-lg sm:p-12">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#B28A00]">
            Why give
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[#36394F] sm:text-4xl">
            Every Contribution Gives an Animal a Better Chance
          </h2>
          <p className="mb-6 max-w-2xl text-lg leading-relaxed text-[#596172]">
            Many stray animals face hunger, injuries, illness, and unsafe
            living conditions. Your support can help provide food, veterinary
            treatment, emergency rescue assistance, and opportunities for
            animals to find loving homes.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="#donation-form"
              className="inline-flex items-center gap-2 bg-[#FFC928] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#C39A00]"
            >
              Donate Now →
            </a>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-2 bg-[#25283B] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#36394F]"
            >
              Scan UPI QR →
            </button>
          </div>
        </div>
      </section>

      {/* =================================================
          WHY YOUR DONATION MATTERS
      ================================================= */}
      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {IMPACT_AREAS.map((item) => (
            <div key={item.title}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFC928]">
                  <svg
                    className="h-5 w-5 text-[#36394F]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={item.path} />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#36394F]">
                {item.title}
              </h3>
              <p className="text-sm text-[#687080]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =================================================
          DONATION FORM + PAYMENT OPTIONS
      ================================================= */}
      <section
        id="donation-form"
        className="mx-auto max-w-7xl scroll-mt-6 px-5 pb-20 sm:px-8 lg:px-10"
      >
        <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <aside className="rounded-2xl bg-[#25283B] p-6 text-white shadow-xl sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFC928]">
              How would you like to donate?
            </p>

            <label
              htmlFor="payment_method"
              className="mt-6 block text-xs font-bold uppercase tracking-[0.12em] text-white/80"
            >
              Payment method
            </label>

            <select
              id="payment_method"
              name="payment_method"
              value={form.payment_method}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-white/20 bg-[#FAF8F0] px-4 py-3 text-sm text-[#20222B] outline-none focus:border-[#FFC928]"
              aria-invalid={Boolean(formErrors.payment_method)}
            >
              <option value="">Select a method</option>
              <option value="UPI">UPI — Scan QR code</option>
              <option value="Bank Transfer">Bank Transfer — HDFC Bank</option>
              <option value="Online Payment">
                Online Payment — not configured
              </option>
              <option value="Other">Other — contact us</option>
            </select>

            {formErrors.payment_method && (
              <p className="mt-2 text-xs text-red-300">
                {formErrors.payment_method}
              </p>
            )}

            {(!form.payment_method || isUPI) && (
              <div className="mt-7 rounded-xl border border-white/15 bg-white/5 p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFC928]">
                  Scan to donate
                </p>

                <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                  <div className="w-full max-w-[260px] shrink-0 text-center">
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="inline-block w-full cursor-zoom-in rounded-xl bg-white p-3 transition hover:ring-2 hover:ring-[#FFC928]"
                      aria-label="View QR code in full size"
                    >
                      <img
                        src="/ngo-upi-qr.jpeg"
                        alt="UPI QR code for Benevolent Souls Foundation"
                        width={360}
                        height={360}
                        className="block h-auto w-full rounded-md"
                      />
                    </button>

                    <a
                      href="/ngo-upi-qr.jpeg"
                      download="benevolent-souls-upi-qr.jpeg"
                      className="mt-3 inline-block text-xs font-bold text-[#FFC928] underline underline-offset-4 hover:text-white"
                    >
                      Download QR code
                    </a>

                    <a
                      href={UPI_LINK}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#FFC928] px-4 py-3 text-sm font-bold text-[#25283B] transition hover:bg-yellow-300"
                    >
                      Pay using UPI app
                    </a>

                    <p className="mt-2 text-[11px] leading-5 text-white/60">
                      On supported phones, this opens an available UPI app.
                      You may need to enter the donation amount.
                    </p>
                  </div>

                  <div className="text-sm leading-6 text-white/75">
                    <p className="font-semibold text-white">
                      Benevolent Souls Foundation
                    </p>

                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#FFC928]">
                      Before you pay
                    </p>

                    <p className="mt-1 text-sm">
                      Confirm the recipient name shown in your UPI app before
                      completing the payment.
                    </p>

                    <p className="mt-3 text-sm">
                      After payment, enter the transaction reference in the
                      form. Submitting this form only records your details; it
                      does not verify the payment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isBankTransfer && (
              <div className="mt-7 rounded-xl border border-[#FFC928]/30 bg-[#FFC928]/5 p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFC928]">
                  Bank transfer details
                </p>

                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <dt className="text-xs font-bold uppercase tracking-wide text-white/60">
                      Account name
                    </dt>
                    <dd className="font-semibold text-white">
                      Benevolent Souls Foundation
                    </dd>
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <dt className="text-xs font-bold uppercase tracking-wide text-white/60">
                      Bank
                    </dt>
                    <dd className="font-semibold text-white">HDFC Bank</dd>
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <dt className="text-xs font-bold uppercase tracking-wide text-white/60">
                      Branch / location
                    </dt>
                    <dd className="font-semibold text-white">
                      Near Pratik Nagar
                    </dd>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-xs font-bold uppercase tracking-wide text-white/60">
                      Account number
                    </dt>
                    <dd className="flex items-center gap-2">
                      <code className="rounded bg-white px-2 py-1.5 font-mono text-xs font-semibold text-[#20222B] sm:text-sm">
                        {bankDetails.account}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(bankDetails.account, "account")
                        }
                        className="rounded border border-white/25 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
                      >
                        {copyFeedback.account || "Copy"}
                      </button>
                    </dd>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-xs font-bold uppercase tracking-wide text-white/60">
                      IFSC code
                    </dt>
                    <dd className="flex items-center gap-2">
                      <code className="rounded bg-white px-2 py-1.5 font-mono text-xs font-semibold text-[#20222B] sm:text-sm">
                        {bankDetails.ifsc}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bankDetails.ifsc, "ifsc")}
                        className="rounded border border-white/25 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
                      >
                        {copyFeedback.ifsc || "Copy"}
                      </button>
                    </dd>
                  </div>
                </dl>

                <p className="mt-5 text-xs leading-5 text-white/65">
                  Verify these bank details with the foundation before
                  transferring. Enter your transaction reference after payment.
                </p>
              </div>
            )}

            {(form.payment_method === "Online Payment" ||
              form.payment_method === "Other") && (
              <div className="mt-7 rounded-xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/65">
                {form.payment_method === "Online Payment"
                  ? "Online payment is not configured yet. Please select UPI or Bank Transfer, or contact the foundation."
                  : "Please contact Benevolent Souls Foundation directly to arrange another donation method."}
              </div>
            )}

            <div className="mt-7 border-t border-white/10 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFC928]">
                How it works
              </p>

              <ol className="mt-4 space-y-3 text-xs leading-5 text-white/70">
                <li>1. Choose UPI or Bank Transfer.</li>
                <li>2. Complete payment using your payment app or bank.</li>
                <li>3. Verify the recipient details before paying.</li>
                <li>4. Enter the amount and transaction reference.</li>
                <li>5. Submit the form to record your donation details.</li>
              </ol>

              <p className="mt-4 border-t border-white/10 pt-4 text-[11px] leading-5 text-white/50">
                This form records information submitted by you. It is not a
                payment gateway or proof that a transfer succeeded.
              </p>
            </div>
          </aside>

          <div className="rounded-2xl border border-[#36394F]/10 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <h2 className="text-2xl font-bold text-[#25283B]">
              Donation details
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#20222B]/60">
              Fill in your details below so the foundation can record your
              contribution.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
              noValidate
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="donor_name"
                    className="text-xs font-bold uppercase tracking-[0.12em] text-[#36394F]"
                  >
                    Full name <span className="text-red-600">*</span>
                  </label>

                  <input
                    id="donor_name"
                    name="donor_name"
                    type="text"
                    autoComplete="name"
                    value={form.donor_name}
                    onChange={handleChange}
                    className={fieldClass("donor_name")}
                    aria-invalid={Boolean(formErrors.donor_name)}
                  />

                  {formErrors.donor_name && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.donor_name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="text-xs font-bold uppercase tracking-[0.12em] text-[#36394F]"
                  >
                    Email address <span className="text-red-600">*</span>
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    className={fieldClass("email")}
                    aria-invalid={Boolean(formErrors.email)}
                  />

                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="text-xs font-bold uppercase tracking-[0.12em] text-[#36394F]"
                  >
                    Phone (optional)
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className={fieldClass("phone")}
                  />
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="text-xs font-bold uppercase tracking-[0.12em] text-[#36394F]"
                  >
                    Donation amount (₹) <span className="text-red-600">*</span>
                  </label>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {QUICK_AMOUNTS.map((amount) => {
                      const selected = form.amount === String(amount);

                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => selectAmount(amount)}
                          aria-pressed={selected}
                          className={`rounded-lg border px-3 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#C49A00]/40 ${
                            selected
                              ? "border-[#25283B] bg-[#25283B] text-white ring-2 ring-[#FFC928]"
                              : "border-[#36394F]/20 bg-[#FAF8F0] text-[#25283B] hover:border-[#C49A00] hover:bg-[#FFC928]/15"
                          }`}
                        >
                          ₹{amount.toLocaleString("en-IN")}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-xs text-[#20222B]/60">
                    Choose an amount above or enter a custom amount below.
                  </p>

                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Enter custom amount (₹)"
                    value={form.amount}
                    onChange={handleChange}
                    className={fieldClass("amount")}
                    aria-invalid={Boolean(formErrors.amount)}
                  />

                  {formErrors.amount && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.amount}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="transaction_id"
                    className="text-xs font-bold uppercase tracking-[0.12em] text-[#36394F]"
                  >
                    Transaction reference (optional)
                  </label>

                  <input
                    id="transaction_id"
                    name="transaction_id"
                    type="text"
                    value={form.transaction_id}
                    onChange={handleChange}
                    placeholder="Enter transaction ID after payment"
                    className={fieldClass("transaction_id")}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="message"
                    className="text-xs font-bold uppercase tracking-[0.12em] text-[#36394F]"
                  >
                    Message (optional)
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Add a note for the foundation"
                    className={`${fieldClass("message")} resize-y`}
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                >
                  Your donation details were recorded successfully. Thank you.
                  This message does not confirm payment.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#25283B] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#36394F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting…" : "Submit donation details"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>

              <p className="text-xs leading-5 text-[#20222B]/55">
                Fields marked with * are required. Your information will be
                submitted to the foundation&apos;s donation records.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* =================================================
          WHERE YOUR DONATION CAN HELP
      ================================================= */}
      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
        <div className="rounded-xl border border-[#36394F]/10 bg-white p-6 sm:p-8">
          <h3 className="mb-4 text-xl font-bold text-[#36394F]">
            Where Your Donation Can Help
          </h3>
          <ul className="space-y-3 text-sm text-[#596170]">
            <li>
              <span className="font-medium text-[#36394F]">
                Food and water
              </span>{" "}
              - Support daily nourishment for animals in our care.
            </li>
            <li>
              <span className="font-medium text-[#36394F]">
                Veterinary treatment and medicines
              </span>{" "}
              - Cover medical consultations, prescriptions, and wound care.
            </li>
            <li>
              <span className="font-medium text-[#36394F]">
                Emergency rescue expenses
              </span>{" "}
              - Fund rescues for animals in urgent, life-threatening
              situations.
            </li>
            <li>
              <span className="font-medium text-[#36394F]">
                Temporary shelter and essential supplies
              </span>{" "}
              - Provide safe, temporary housing and necessities.
            </li>
            <li>
              <span className="font-medium text-[#36394F]">
                Recovery and adoption support
              </span>{" "}
              - Help animals heal and prepare for adoption into responsible
              homes.
            </li>
          </ul>
          <div className="mt-5 border-t border-[#E5E7EB] pt-5 text-xs text-[#6B7280]">
            <p>
              Donations are intended to support animal welfare activities.
              Actual allocation depends on current needs, available resources,
              and the foundation&apos;s operating arrangements. Please contact
              us if you need information about a specific contribution.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          EVERY CONTRIBUTION COUNTS
      ================================================= */}
      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
        <div className="rounded-xl border border-[#36394F]/10 bg-white p-6 sm:p-8">
          <h3 className="mb-4 text-xl font-bold text-[#36394F]">
            Every Contribution Counts
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_AMOUNTS.map((amount) => (
              <div
                key={amount}
                className="rounded-lg bg-[#25283B] p-4 text-center"
              >
                <p className="text-xl font-bold text-[#FFC928]">
                  ₹{amount.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {AMOUNT_NOTES[amount]}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#20222B]/60">
            These amounts are illustrative suggestions only. Enter a custom
            amount in the form or contact us for specific allocation questions.
          </p>
        </div>
      </section>

      {/* =================================================
          HOW TO DONATE
      ================================================= */}
      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
        <div className="rounded-xl bg-white p-8 shadow-lg sm:p-10">
          <h3 className="mb-4 text-xl font-bold text-[#36394F]">
            How to Donate
          </h3>
          <ol className="list-outside list-decimal space-y-3 pl-5 text-sm text-[#596170]">
            <li>
              <span className="font-medium text-[#36394F]">
                Choose or enter a donation amount.
              </span>{" "}
              Use the quick amount buttons or enter a custom amount in the
              form field.
            </li>
            <li>
              <span className="font-medium text-[#36394F]">
                Scan the official donation QR code or use the UPI option.
              </span>{" "}
              The QR code can be scanned with any UPI-enabled payment app.
            </li>
            <li>
              <span className="font-medium text-[#36394F]">
                Complete the payment in your chosen payment application.
              </span>{" "}
              Verify the recipient name &quot;Benevolent Souls Foundation&quot;
              before confirming.
            </li>
            <li>
              <span className="font-medium text-[#36394F]">
                Enter the transaction details requested by the form.
              </span>{" "}
              Provide your name, email, phone, and optional transaction ID
              after payment.
            </li>
            <li>
              <span className="font-medium text-[#36394F]">
                Submit the donation information for review.
              </span>{" "}
              Your details will be recorded in the foundation&apos;s donation
              records. Note: submitting the form does not automatically verify
              or confirm payment.
            </li>
          </ol>
        </div>
      </section>

      {/* =================================================
          DONATION TRANSPARENCY AND TRUST
      ================================================= */}
      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
        <div className="rounded-xl border border-[#36394F]/10 bg-white p-6 sm:p-8">
          <h3 className="mb-4 text-xl font-bold text-[#36394F]">
            Donation Transparency &amp; Trust
          </h3>
          <ul className="space-y-2 text-sm text-[#596170]">
            <li>
              <span className="font-medium text-[#36394F]">
                Responsible use of contributions.
              </span>{" "}
              Every donation is tracked and allocated toward the
              foundation&apos;s animal welfare mission.
            </li>
            <li>
              <span className="font-medium text-[#36394F]">
                Accurate donation records.
              </span>{" "}
              Submitted information is stored in our donation records for
              future reference and reporting.
            </li>
            <li>
              <span className="font-medium text-[#36394F]">
                Appropriate review of submitted transaction information.
              </span>{" "}
              The foundation may verify transaction details and reach out if
              additional information is needed.
            </li>
            <li>
              <span className="font-medium text-[#36394F]">
                Clear communication when donors have questions.
              </span>{" "}
              Contact us if you have questions about your donation — we&apos;re
              here to help.
            </li>
          </ul>
          <p className="mt-4 text-xs text-[#20222B]/60">
            <strong>Note:</strong> Donations support animal welfare activities.
            We do not currently claim tax-deductibility or government
            registration unless verified from official documentation. Please
            contact us for any specific questions about contribution usage.
          </p>
        </div>
      </section>

      {/* =================================================
          FAQ
      ================================================= */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10">
        <div className="rounded-xl bg-white p-8 shadow-lg sm:p-10">
          <h3 className="mb-6 text-xl font-bold text-[#36394F]">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-base font-medium text-[#36394F]">
                Why should I donate?
              </p>
              <p className="mt-1 text-sm text-[#687080]">
                Your contribution can help support food, medical care, rescue
                assistance, shelter supplies, and other animal welfare needs.
              </p>
            </div>
            <div>
              <p className="text-base font-medium text-[#36394F]">
                Can I donate a small amount?
              </p>
              <p className="mt-1 text-sm text-[#687080]">
                Yes. Contributions of different sizes can help support the
                foundation&apos;s work.
              </p>
            </div>
            <div>
              <p className="text-base font-medium text-[#36394F]">
                How can I donate?
              </p>
              <p className="mt-1 text-sm text-[#687080]">
                Use the payment methods on this page — scan the QR code with
                your UPI app, use the UPI link, or choose bank transfer. Then
                fill in the donation form with your details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Full-size donation QR code"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#25283B] text-xl text-white transition hover:bg-[#36394F]"
              aria-label="Close QR code"
            >
              ✕
            </button>

            <h2 className="mb-4 pr-12 text-lg font-bold text-[#25283B]">
              Scan to Donate
            </h2>

            <img
              src="/ngo-upi-qr.jpeg"
              alt="UPI QR code for Benevolent Souls Foundation"
              width={360}
              height={360}
              className="mx-auto h-auto w-full max-w-sm rounded-lg"
            />

            <p className="mt-3 text-center text-sm text-gray-600">
              Verify the recipient name in your UPI app before paying.
            </p>

            <a
              href={UPI_LINK}
              className="mt-5 flex w-full items-center justify-center rounded-lg bg-[#FFC928] px-5 py-3 font-bold text-[#25283B] transition hover:bg-yellow-300"
            >
              Pay using UPI app
            </a>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="mt-3 w-full rounded-lg bg-[#25283B] px-5 py-3 font-semibold text-white transition hover:bg-[#36394F]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}