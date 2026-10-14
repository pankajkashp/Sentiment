import Link from "next/link";
import { KeyRound, ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getCurrentUser();

  // 1. Unauthenticated Visitor Guard
  if (!user) {
    return (
      <main className="content-width min-h-[calc(100svh-80px)] py-8 pb-24 md:py-12">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] accent">Restricted workspace</p>
        <h1 className="font-display mt-2 text-3xl sm:text-4xl font-extrabold">Policy publishing studio.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 muted">
          A private workspace for publishing consultation notices, verifying primary sources, and moderating citizen feedback.
        </p>

        <section
          className="mt-8 max-w-2xl rounded-[24px] border p-6 sm:p-8 bg-white shadow-2xs"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <KeyRound size={21} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Authentication Required</h2>
              <p className="mt-1 text-xs muted">Only authenticated administrators may access this studio.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-xs leading-6 muted border-t pt-4" style={{ borderColor: "var(--line)" }}>
            <p className="flex gap-2">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#16834A]" />
              Role-based access control enforces that only accounts with the ADMIN role can publish policies.
            </p>
            <p className="flex gap-2">
              <ShieldAlert size={16} className="mt-0.5 shrink-0 text-[#E87518]" />
              No public registration grants administrative privileges automatically.
            </p>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-[#143454] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0e2a47] transition-colors"
            >
              Sign in to continue
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#666666] hover:text-[#E87518]"
            >
              <ArrowLeft size={14} /> Back to Portal
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // 2. Non-Admin (Citizen / Moderator) Guard
  if (user.role !== "ADMIN") {
    return (
      <main className="content-width min-h-[calc(100svh-80px)] py-8 pb-24 md:py-12">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-red-600">Access Denied (403)</p>
        <h1 className="font-display mt-2 text-3xl sm:text-4xl font-extrabold">Unauthorized Workspace</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 muted">
          Your account is verified as <strong className="font-semibold text-[#171717]">{user.role}</strong>, which does not have permission to access the publishing studio.
        </p>

        <section
          className="mt-8 max-w-2xl rounded-[24px] border p-6 sm:p-8 bg-white shadow-2xs border-red-200"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <ShieldAlert size={21} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-red-900">Administrative Privileges Required</h2>
              <p className="mt-1 text-xs text-red-700">
                Logged in as <span className="font-mono">{user.email}</span>.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-lg bg-[#143454] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0e2a47] transition-colors"
            >
              Return to Citizen Profile
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#666666] hover:text-[#E87518]"
            >
              <ArrowLeft size={14} /> Public Portal Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // 3. Authorized Administrator View
  return (
    <main className="content-width min-h-[calc(100svh-80px)] py-8 pb-24 md:py-12">
      <div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
        <ShieldCheck size={14} className="text-emerald-700" />
        <span>Verified Administrator Session</span>
      </div>
      <h1 className="font-display mt-3 text-3xl sm:text-4xl font-extrabold text-[#171717]">
        Policy Publishing &amp; Moderation Studio
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 muted">
        Signed in as <strong className="text-[#171717]">{user.email}</strong> with role <span className="font-semibold text-emerald-700">ADMIN</span>.
      </p>

      <section
        className="mt-8 max-w-2xl rounded-[24px] border p-6 sm:p-8 bg-white shadow-2xs"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <KeyRound size={21} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Administrative Controls</h2>
            <p className="mt-1 text-xs muted">Official consultation publishing and evidence audit tools.</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-xs leading-6 text-[#374151] border-t pt-4" style={{ borderColor: "var(--line)" }}>
          <p>
            • <strong>Consultation Management</strong>: Create and update verified MHA policy announcements.
          </p>
          <p>
            • <strong>Background Analysis Trigger</strong>: Authenticated administration of scheduled NLP analysis jobs.
          </p>
          <p>
            • <strong>Feedback Moderation</strong>: Review citizen contributions flagged for compliance.
          </p>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#666666] hover:text-[#E87518]"
          >
            <ArrowLeft size={14} /> Back to Portal Home
          </Link>
        </div>
      </section>
    </main>
  );
}
