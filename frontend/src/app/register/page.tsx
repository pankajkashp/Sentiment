import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { ParliamentIcon } from "@/components/brand/parliament-icon";

export default function RegisterPage() {
  return (
    <main className="content-width flex min-h-screen items-center justify-center py-12">
      <section
        className="w-full max-w-md rounded-2xl border p-7 sm:p-9"
        style={{
          background: "var(--surface)",
          borderColor: "var(--line)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--saffron)] transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Back to consultations
        </Link>

        <div className="mt-7 flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--line)",
              color: "var(--chakra)",
            }}
          >
            <ParliamentIcon size={22} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--saffron)]">
              Contributor Onboarding
            </p>
            <h1 className="font-display text-[22px] font-bold text-[var(--ink)]">
              Register Account
            </h1>
          </div>
        </div>

        <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--body)]">
          Join PolicyLens to contribute evidence-backed opinions on public policy consultations.
        </p>

        <form className="mt-6 space-y-4" action="#">
          <label className="block text-xs font-semibold text-[var(--ink)]">
            Full name / Display alias
            <input
              required
              maxLength={60}
              autoComplete="name"
              placeholder="e.g. Rahul Sharma"
              className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-[13px] text-[var(--ink)] placeholder-[var(--muted)] outline-none focus:ring-2"
              style={{
                background: "var(--paper)",
                borderColor: "var(--line)",
              }}
            />
          </label>

          <label className="block text-xs font-semibold text-[var(--ink)]">
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="you@domain.in"
              className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-[13px] text-[var(--ink)] placeholder-[var(--muted)] outline-none focus:ring-2"
              style={{
                background: "var(--paper)",
                borderColor: "var(--line)",
              }}
            />
          </label>

          <label className="block text-xs font-semibold text-[var(--ink)]">
            Stakeholder Category
            <select
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-[13px] text-[var(--ink)] outline-none cursor-pointer"
              style={{
                background: "var(--paper)",
                borderColor: "var(--line)",
              }}
            >
              <option value="" disabled>
                Select your stakeholder category
              </option>
              <option>Citizen / Resident</option>
              <option>Academic / Researcher</option>
              <option>Industry / Micro & Small Enterprise</option>
              <option>Civil Society Organization / NGO</option>
              <option>Legal / Public Administration Professional</option>
              <option>Student / Youth Representative</option>
              <option>Other</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-[var(--ink)]">
            Password (min 10 characters)
            <input
              required
              type="password"
              minLength={10}
              autoComplete="new-password"
              placeholder="Create a secure password"
              className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-[13px] text-[var(--ink)] placeholder-[var(--muted)] outline-none focus:ring-2"
              style={{
                background: "var(--paper)",
                borderColor: "var(--line)",
              }}
            />
          </label>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--saffron)" }}
          >
            <UserPlus size={14} aria-hidden="true" />
            <span>Create Account</span>
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[var(--muted)]">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-[var(--saffron)] hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-[10px] text-[var(--muted)] leading-relaxed border-t pt-3" style={{ borderColor: "var(--line-subtle)" }}>
          Prototype screen. One account per contributor policy will be enforced when backend authentication is connected.
        </p>
      </section>
    </main>
  );
}
