"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserRound, ShieldCheck, LogOut, Loader2, ArrowRight, Shield } from "lucide-react";
import { useAuth, type AuthUser } from "@/features/auth/auth-context";

interface ProfileClientViewProps {
  initialUser: AuthUser | null;
}

export function ProfileClientView({ initialUser }: ProfileClientViewProps) {
  const { user: contextUser, loading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Use context user if updated, else fallback to server-rendered initialUser
  const currentUser = contextUser !== undefined && !loading ? contextUser : (contextUser ?? initialUser);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };

  return (
    <main className="content-width min-h-[calc(100svh-80px)] py-8 pb-24 md:py-12">
      <p className="text-[10px] font-bold uppercase tracking-[.2em] accent">Your account</p>
      <h1 className="font-display mt-2 text-4xl font-extrabold">Your profile, your voice.</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 muted">
        Manage the public identity and stakeholder category associated with your participation.
      </p>

      {currentUser ? (
        /* Authenticated Citizen / Admin Profile View */
        <section
          className="mt-8 max-w-2xl rounded-[24px] border p-6 sm:p-8"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                <UserRound size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold">{currentUser.name || "Verified Citizen"}</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                      currentUser.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
                <p className="mt-0.5 text-xs muted font-mono">{currentUser.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer self-start sm:self-auto"
              style={{ borderColor: "var(--line)" }}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Signing out...
                </>
              ) : (
                <>
                  <LogOut size={14} /> Sign out
                </>
              )}
            </button>
          </div>

          {/* Account Details Card */}
          <div
            className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl p-4 text-xs"
            style={{ background: "var(--surface-subtle)" }}
          >
            <div>
              <span className="block text-[11px] uppercase tracking-wider font-semibold muted">
                Stakeholder Category
              </span>
              <span className="mt-1 block font-medium">
                {currentUser.stakeholderType || "Citizen / Beneficiary"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider font-semibold muted">
                Authentication Status
              </span>
              <span className="mt-1 flex items-center gap-1.5 font-medium text-[#16834A]">
                <ShieldCheck size={14} /> Verified Cryptographic Session
              </span>
            </div>
          </div>

          {/* Administrator Workspace Navigation */}
          {currentUser.role === "ADMIN" && (
            <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Shield size={14} className="text-purple-700" />
                    Policy Publishing Studio
                  </h3>
                  <p className="mt-0.5 text-[11px] text-purple-800">
                    Your account has administrative permissions to publish and manage policy consultation notices.
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-800 transition-colors"
                >
                  Open Studio <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}

          <div
            className="mt-6 rounded-xl p-4"
            style={{ background: "var(--surface-subtle)" }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <ShieldCheck size={15} className="accent" /> Privacy by default
            </div>
            <p className="mt-2 text-xs leading-5 muted">
              Email address and account security settings are private to your session. Only your chosen display name
              and stakeholder category are referenced in public policy consultations.
            </p>
          </div>
        </section>
      ) : (
        /* Unauthenticated View (Original Design) */
        <section
          className="mt-8 max-w-2xl rounded-[24px] border p-6 sm:p-8"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <UserRound size={24} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">You are not signed in</h2>
              <p className="mt-1 text-xs muted">Sign in to view your profile details and participate in consultations.</p>
            </div>
          </div>
          <div
            className="mt-6 rounded-xl p-4"
            style={{ background: "var(--surface-subtle)" }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <ShieldCheck size={15} className="accent" /> Privacy by default
            </div>
            <p className="mt-2 text-xs leading-5 muted">
              Email address and account security settings will never be displayed as public profile fields. Only a display
              name and optional stakeholder category should appear publicly.
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded-full px-5 py-3 text-xs font-semibold"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full border px-5 py-3 text-xs font-semibold"
              style={{ borderColor: "var(--line)" }}
            >
              Create account
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
