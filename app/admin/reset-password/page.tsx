"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        setError(
          "Your reset link may have expired or already been used. Please request a new one."
        );
        return;
      }

      const { error: updateError } =
        await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage("Password updated successfully. Redirecting to login...");

      await supabase.auth.signOut();
      localStorage.removeItem("adminLoggedIn");

      setTimeout(() => {
        router.replace("/admin/login");
      }, 2000);
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Unable to reset your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#25283B] px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFC928]">
            <span className="text-2xl">🐾</span>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Reset Password
          </h1>

          <p className="mt-2 text-sm text-white/60">
            Benevolent Souls Foundation
          </p>
        </div>

        <div className="bg-white p-8 shadow-2xl sm:p-10">
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#25283B]"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={loading}
                  className="w-full border border-gray-200 px-4 py-3 pr-12 text-sm text-[#25283B] outline-none transition focus:border-[#FFC928] disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-[#25283B]"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="21"
                      height="21"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.3 4.5 9 7-.3 1.1-1.1 2.3-2.2 3.4M6.2 6.2C3.8 7.7 2.4 10 2 12c.7 2.5 4 7 10 7 1 0 2-.2 2.9-.5" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="21"
                      height="21"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Use at least 8 characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#25283B]"
              >
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={loading}
                className="w-full border border-gray-200 px-4 py-3 text-sm text-[#25283B] outline-none transition focus:border-[#FFC928] disabled:opacity-60"
              />
            </div>

            {error && (
              <div role="alert" className="bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {message && (
              <div role="status" className="bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFC928] px-6 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:bg-[#25283B] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating Password..." : "Update Password"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <a
              href="/admin/login"
              className="text-xs font-bold uppercase tracking-[0.12em] text-[#25283B] transition hover:text-[#B88600]"
            >
              Back to Admin Login
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}