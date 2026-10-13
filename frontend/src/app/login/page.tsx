import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { StambhIcon } from "@/components/brand/stambh-icon";

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
        <form className="mt-6 space-y-4" action="#">
          <label className="block text-xs font-semibold text-[#171717]">
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.in"
              className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518]"
            />
          </label>
          <label className="block text-xs font-semibold text-[#171717]">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              placeholder="Enter your password"
              className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518]"
            />
          </label>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#143454] py-2.5 text-xs font-semibold text-white hover:bg-[#0e2a47] transition-colors"
            type="button"
          >
            <LockKeyhole size={14} /> Sign in
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-[#666666]">
          New user?{" "}
          <Link href="/register" className="font-semibold text-[#E87518] hover:underline">
            Register here
          </Link>
        </p>
        <p className="mt-4 text-[10px] leading-4 text-[#9ca3af] text-center">
          Demonstration screen only. Live authentication is pending backend integration.
        </p>
      </section>
    </main>
  );
}
