"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      if (!data.session) {
        setError("Login session was not created. Please try again.");
        return;
      }

      localStorage.setItem("adminLoggedIn", "true");

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to log in. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your admin email address first.");
      return;
    }

    setResetLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${window.location.origin}/admin/reset-password`,
        });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage(
        "If this email is registered, a password-reset link will be sent. Please check your inbox and spam folder."
      );
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Unable to send the reset email. Please try again.");
    } finally {
      setResetLoading(false);
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
            Admin Login
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Benevolent Souls Foundation
          </p>
        </div>

        <div className="bg-white p-8 shadow-2xl sm:p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#25283B]"
              >
                Email Address
              </label>

              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required
                disabled={loading || resetLoading}
                className="w-full border border-gray-200 px-4 py-3 text-sm text-[#25283B] outline-none transition focus:border-[#FFC928] disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#25283B]"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={loading || resetLoading}
                  className="w-full border border-gray-200 px-4 py-3 pr-12 text-sm text-[#25283B] outline-none transition focus:border-[#FFC928] disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-[#25283B] transition hover:text-[#B88600] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FFC928]"
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.3 4.5 9 7-.3 1.1-1.1 2.3-2.2 3.4" />
                      <path d="M6.2 6.2C3.8 7.7 2.4 10 2 12c.7 2.5 4 7 10 7 1 0 2-.2 2.9-.5" />
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading || resetLoading}
                  className="text-xs font-semibold text-[#25283B] underline decoration-[#FFC928] decoration-2 underline-offset-4 transition hover:text-[#B88600] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resetLoading ? "Sending reset link..." : "Forgot Password?"}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || resetLoading}
              className="w-full bg-[#FFC928] px-6 py-4 text-sm font-bold uppercase tracking-[0.15em] text-[#25283B] transition hover:bg-[#25283B] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login to Dashboard"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs font-bold uppercase tracking-[0.15em] text-white/50 transition hover:text-[#FFC928]"
          >
            ← Back to Website
          </a>
        </div>
      </div>
    </main>
  );
}