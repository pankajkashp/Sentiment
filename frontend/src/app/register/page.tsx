import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StambhIcon } from "@/components/brand/stambh-icon";

export default function RegisterPage() {
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
          Create a Citizen Account
        </h1>
        <p className="mt-2 text-xs leading-5 text-[#666666]">
          Register to receive scheme updates, bookmark policy notices, and participate in public consultations.
        </p>
        <form className="mt-6 space-y-4" action="#">
          <label className="block text-xs font-semibold text-[#171717]">
            Full name
            <input
              required
              maxLength={60}
              autoComplete="name"
              placeholder="Your name"
              className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518]"
            />
          </label>
          <label className="block text-xs font-semibold text-[#171717]">
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="name@example.in"
              className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518]"
            />
          </label>
          <label className="block text-xs font-semibold text-[#171717]">
            Citizen Category
            <select
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518] bg-white"
            >
              <option value="" disabled>Select category</option>
              <option>Citizen / Beneficiary</option>
              <option>Farmer / Agriculture</option>
              <option>Student / Youth</option>
              <option>Small Business / MSME</option>
              <option>Public Sector Employee</option>
              <option>Civil Society / Non-profit</option>
              <option>Academic / Researcher</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#171717]">
            Password
            <input
              required
              type="password"
              minLength={12}
              autoComplete="new-password"
              placeholder="At least 12 characters"
              className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-xs outline-none focus:border-[#E87518]"
            />
          </label>
          <button
            type="button"
            className="w-full rounded-lg bg-[#143454] py-2.5 text-xs font-semibold text-white hover:bg-[#0e2a47] transition-colors"
          >
            Create Citizen Account
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-[#666666]">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-[#E87518] hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-[10px] leading-4 text-[#9ca3af] text-center">
          Demonstration interface. Account verification and secure credentials storage will be connected via backend services.
        </p>
      </section>
    </main>
  );
}
