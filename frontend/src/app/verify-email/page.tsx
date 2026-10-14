"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MailCheck,
  Send,
  ShieldCheck,
  LockKeyhole
} from "lucide-react";
import { StambhIcon } from "@/components/brand/stambh-icon";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const prefillEmail = searchParams.get("email") || "";

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState(prefillEmail);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleConfirmVerification = async () => {
    if (!token || isVerifying) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(
          data?.message || "Verification failed. The link may be expired or already used."
        );
        setIsVerifying(false);
        return;
      }

      setVerificationSuccess(true);
    } catch {
      setErrorMessage("Unable to connect to the authentication server. Please check your connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isResending || !resendEmail.trim()) return;

    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setResendError(data?.message || "Failed to resend verification link. Please wait a few minutes.");
        setIsResending(false);
        return;
      }

      setResendMessage(
        data?.message || "If an unverified account exists, a new verification link has been sent."
      );
    } catch {
      setResendError("Network error. Could not request a new verification link.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Success State */}
      {verificationSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-[#16834A]">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-emerald-950">
              Email Verified Successfully!
            </h2>
            <p className="mt-1.5 text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
              Your citizen account is now verified and active. You can now sign in to participate in policy consultations.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#143454] py-2.5 text-xs font-semibold text-white hover:bg-[#0e2a47] transition-colors shadow-xs"
            >
              <LockKeyhole size={14} /> Proceed to Sign In
            </Link>
          </div>
        </div>
      ) : token ? (
        /* 2. Token Provided - Confirmation State */
        <div className="space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-5 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8eef5] text-[#143454]">
              <MailCheck size={26} />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#171717]">
                Confirm Account Activation
              </h2>
              <p className="mt-1 text-xs text-[#666666] leading-relaxed">
                Click below to complete verification and activate your citizen account.
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirmVerification}
              disabled={isVerifying}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#143454] py-2.5 text-xs font-semibold text-white hover:bg-[#0e2a47] transition-colors disabled:opacity-60 cursor-pointer shadow-xs"
            >
              {isVerifying ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Verifying account...
                </>
              ) : (
                <>
                  <ShieldCheck size={14} /> Confirm &amp; Verify Email
                </>
              )}
            </button>
            <p className="text-[11px] text-[#9ca3af]">
              This step prevents automated security scanners from prematurely consuming your link.
            </p>
          </div>

          {/* Fallback Resend Section if the token had expired or was already used */}
          {errorMessage && (
            <div className="pt-4 border-t border-[#f1f3f5] space-y-3">
              <h3 className="text-xs font-bold text-[#171717]">
                Need a new verification link?
              </h3>
              <form onSubmit={handleResend} className="space-y-2">
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2 text-xs outline-none focus:border-[#E87518]"
                />
                <button
                  type="submit"
                  disabled={isResending}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#143454] bg-white py-2 text-xs font-semibold text-[#143454] hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isResending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Request New Verification Link
                    </>
                  )}
                </button>
              </form>
              {resendMessage && (
                <p className="text-xs text-[#16834A] leading-relaxed">{resendMessage}</p>
              )}
              {resendError && (
                <p className="text-xs text-red-600 leading-relaxed">{resendError}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 3. No Token in Query - Request Link State */
        <div className="space-y-4">
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4 text-xs text-[#666666] leading-relaxed">
            Enter your registered email address to receive a new single-use verification link.
          </div>

          <form onSubmit={handleResend} className="space-y-3">
            <label className="block text-xs font-semibold text-[#171717]">
              Registered Email Address
              <input
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="name@example.in"
                className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518]"
              />
            </label>
            <button
              type="submit"
              disabled={isResending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#143454] py-2.5 text-xs font-semibold text-white hover:bg-[#0e2a47] transition-colors disabled:opacity-60 cursor-pointer shadow-xs"
            >
              {isResending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Dispatching email...
                </>
              ) : (
                <>
                  <Send size={14} /> Send Verification Link
                </>
              )}
            </button>
          </form>

          {resendMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-[#16834A] leading-relaxed">
              {resendMessage}
            </div>
          )}

          {resendError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 leading-relaxed">
              {resendError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
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
          Email Verification
        </h1>
        <p className="mt-2 text-xs leading-5 text-[#666666]">
          Citizen verification ensures authentic public feedback and safeguards against automated submissions.
        </p>

        <div className="mt-6">
          <Suspense fallback={<div className="py-8 text-center text-xs text-[#666666]">Loading verification...</div>}>
            <VerifyEmailContent />
          </Suspense>
        </div>

        <div className="mt-6 pt-4 border-t border-[#f1f3f5] flex items-center justify-between text-xs text-[#666666]">
          <Link href="/login" className="hover:text-[#E87518]">
            Sign in to existing account
          </Link>
          <Link href="/register" className="font-semibold text-[#E87518] hover:underline">
            Register new account
          </Link>
        </div>
      </section>
    </main>
  );
}
