"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, ShieldCheck, MailCheck, Send, LockKeyhole } from "lucide-react";
import { StambhIcon } from "@/components/brand/stambh-icon";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [stakeholderType, setStakeholderType] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verification prompt state
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [successInfoMessage, setSuccessInfoMessage] = useState("");
  const [emailSentStatus, setEmailSentStatus] = useState<boolean>(true);

  // Resend state inside verification card
  const [isResending, setIsResending] = useState(false);
  const [resendStatusMsg, setResendStatusMsg] = useState<string | null>(null);
  const [resendErrorMsg, setResendErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    // Client-side validations
    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (password.length < 12) {
      setErrorMessage("Password must be at least 12 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          stakeholderType: stakeholderType || undefined,
          password
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 409) {
          setErrorMessage(
            data?.message || "An account with this email address already exists. Please sign in instead."
          );
        } else if (res.status === 429) {
          setErrorMessage(
            data?.message || "Too many registration attempts. Please try again later."
          );
        } else {
          setErrorMessage(
            data?.message || "Registration failed. Please verify your details and try again."
          );
        }
        setIsSubmitting(false);
        return;
      }

      // Mandatory Email Verification: NEVER create a session or redirect to an authenticated route.
      // Display verification required screen.
      setIsRegistered(true);
      setRegisteredEmail(email.trim());
      setSuccessInfoMessage(data?.message || "Account created. Check your email to verify your account before signing in.");
      setEmailSentStatus(data?.emailSent !== false);
    } catch {
      setErrorMessage("Unable to connect to the registration service. Please check your network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (isResending || !registeredEmail) return;

    setIsResending(true);
    setResendStatusMsg(null);
    setResendErrorMsg(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setResendErrorMsg(data?.message || "Failed to resend verification email. Please wait a few minutes.");
        return;
      }

      setResendStatusMsg(data?.message || "Verification link sent! Please check your inbox.");
    } catch {
      setResendErrorMsg("Network error. Could not request a new verification email.");
    } finally {
      setIsResending(false);
    }
  };

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

        {isRegistered ? (
          /* Registration Success — Email Verification Required View */
          <div className="mt-6 space-y-5 animate-fade-in">
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-[#143454]">
                <MailCheck size={30} />
              </div>
              <h2 className="font-display text-xl font-bold text-[#143454]">
                Verify Your Email Address
              </h2>
              <p className="text-xs text-[#334155] leading-relaxed">
                {successInfoMessage}
              </p>
              <div className="rounded-lg bg-white/80 p-2 text-xs font-mono font-medium text-[#143454] border border-blue-100">
                {registeredEmail}
              </div>
            </div>

            {!emailSentStatus && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-semibold">Notice:</p>
                <p className="mt-0.5">
                  The automated email could not be delivered immediately. You can click below to trigger a new verification dispatch.
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#143454] bg-white py-2.5 text-xs font-semibold text-[#143454] hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isResending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Dispatching email...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Resend verification email
                  </>
                )}
              </button>

              {resendStatusMsg && (
                <p className="text-xs text-[#16834A] text-center font-medium">{resendStatusMsg}</p>
              )}
              {resendErrorMsg && (
                <p className="text-xs text-red-600 text-center font-medium">{resendErrorMsg}</p>
              )}

              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#143454] py-2.5 text-xs font-semibold text-white hover:bg-[#0e2a47] transition-colors shadow-xs"
              >
                <LockKeyhole size={14} /> Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* Standard Registration Form */
          <>
            <h1 className="font-display mt-5 text-2xl font-extrabold text-[#171717]">
              Create a Citizen Account
            </h1>
            <p className="mt-2 text-xs leading-5 text-[#666666]">
              Register to receive scheme updates, bookmark policy notices, and participate in public consultations.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              <label className="block text-xs font-semibold text-[#171717]">
                Full name
                <input
                  required
                  maxLength={60}
                  autoComplete="name"
                  disabled={isSubmitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>

              <label className="block text-xs font-semibold text-[#171717]">
                Email address
                <input
                  required
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.in"
                  className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>

              <label className="block text-xs font-semibold text-[#171717]">
                Citizen Category
                <select
                  required
                  disabled={isSubmitting}
                  value={stakeholderType}
                  onChange={(e) => setStakeholderType(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518] bg-white disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="" disabled>Select category</option>
                  <option value="Citizen / Beneficiary">Citizen / Beneficiary</option>
                  <option value="Farmer / Agriculture">Farmer / Agriculture</option>
                  <option value="Student / Youth">Student / Youth</option>
                  <option value="Small Business / MSME">Small Business / MSME</option>
                  <option value="Public Sector Employee">Public Sector Employee</option>
                  <option value="Civil Society / Non-profit">Civil Society / Non-profit</option>
                  <option value="Academic / Researcher">Academic / Researcher</option>
                </select>
              </label>

              <label className="block text-xs font-semibold text-[#171717]">
                Password
                <input
                  required
                  type="password"
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#143454] py-2.5 text-xs font-semibold text-white hover:bg-[#0e2a47] transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Creating Account...
                  </>
                ) : (
                  "Create Citizen Account"
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-[#666666]">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-[#E87518] hover:underline">
                Sign in
              </Link>
            </p>

            <p className="mt-4 text-[10px] leading-4 text-[#9ca3af] text-center flex items-center justify-center gap-1.5">
              <ShieldCheck size={12} className="text-[#16834A]" />
              Mandatory email verification required before login. Passwords encrypted with Argon2id.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
