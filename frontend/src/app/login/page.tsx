"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LockKeyhole, Loader2, AlertCircle, Mail, Send } from "lucide-react";
import { StambhIcon } from "@/components/brand/stambh-icon";
import { useAuth } from "@/features/auth/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unverified account handling
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setUnverifiedEmail(null);
    setResendFeedback(null);

    // Basic client validation
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 403 || data?.error === "EMAIL_NOT_VERIFIED") {
          setErrorMessage(data?.message || "Please verify your email address before signing in.");
          setUnverifiedEmail(email.trim());
        } else if (res.status === 429) {
          setErrorMessage(
            data?.message || "Too many sign-in attempts from this network. Please wait 15 minutes before trying again."
          );
        } else {
          // Generic credential error to avoid user-enumeration
          setErrorMessage(data?.message || "Invalid email or password. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      // Success: update auth state and navigate
      await refreshUser();

      const rawRedirect = searchParams.get("redirect");
      const redirectPath = rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
        ? rawRedirect
        : "/profile";

      router.push(redirectPath);
      router.refresh();
    } catch {
      setErrorMessage("Unable to reach the authentication service. Please check your network connection.");
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail || isResending) return;

    setIsResending(true);
    setResendFeedback(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setResendFeedback(data?.message || "Failed to resend verification email. Please try again in a few minutes.");
      } else {
        setResendFeedback(data?.message || "Verification link sent! Check your email inbox.");
      }
    } catch {
      setResendFeedback("Network error. Could not request a new verification link.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 space-y-2"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>

          {unverifiedEmail && (
            <div className="pt-2 border-t border-red-200/60 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="inline-flex items-center gap-1.5 font-bold text-[#143454] hover:underline cursor-pointer disabled:opacity-60 text-left"
              >
                {isResending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Dispatching email...
                  </>
                ) : (
                  <>
                    <Send size={12} /> Click here to resend verification link
                  </>
                )}
              </button>
              {resendFeedback && (
                <p className="text-[11px] font-medium text-[#16834A]">{resendFeedback}</p>
              )}
            </div>
          )}
        </div>
      )}

      <label className="block text-xs font-semibold text-[#171717]">
        Email address
        <input
          type="email"
          autoComplete="email"
          required
          disabled={isSubmitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.in"
          className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518] disabled:bg-gray-50 disabled:text-gray-500"
        />
      </label>

      <label className="block text-xs font-semibold text-[#171717]">
        Password
        <input
          type="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518] disabled:bg-gray-50 disabled:text-gray-500"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#143454] py-2.5 text-xs font-semibold text-white hover:bg-[#0e2a47] transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-xs"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Signing in...
          </>
        ) : (
          <>
            <LockKeyhole size={14} /> Sign in
          </>
        )}
      </button>

      <div className="pt-1 text-center">
        <Link
          href="/verify-email"
          className="inline-flex items-center gap-1.5 text-[11px] text-[#666666] hover:text-[#E87518]"
        >
          <Mail size={12} /> Need to verify your email address?
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="content-width flex min-h-screen items-center justify-center py-12">
      <section
        className="w-full max-w-md rounded-2xl border p-7 sm:p-9 bg-white shadow-2xs"
        style={{ borderColor: "var(--line)" }}
      >
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#666666] hover:text-[#E87518]">
          <ArrowLeft size={14} /> Back to Portal Home
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <StambhIcon size={34} />
          <div className="leading-tight">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#143454]">
              सार्वजनिक नीति पोर्टल
            </span>
            <span className="block text-[15px] font-extrabold text-[#171717]">
              PUBLIC POLICY PORTAL
            </span>
          </div>
        </div>
        <h1 className="font-display mt-5 text-2xl font-extrabold text-[#171717]">
          Sign in to your account
        </h1>
        <p className="mt-2 text-xs leading-5 text-[#666666]">
          Access verified public policy documents, saved schemes, and citizen notifications.
        </p>

        <Suspense fallback={<div className="py-8 text-center text-xs text-[#666666]">Loading sign in...</div>}>
          <LoginForm />
        </Suspense>

        <p className="mt-5 text-center text-xs text-[#666666]">
          New user?{" "}
          <Link href="/register" className="font-semibold text-[#E87518] hover:underline">
            Register here
          </Link>
        </p>
        <p className="mt-4 text-[10px] leading-4 text-[#9ca3af] text-center">
          Mandatory email verification is enforced for account safety. Passwords are encrypted with Argon2id.
        </p>
      </section>
    </main>
  );
}
