import Link from "next/link";
import { ArrowLeft, Aperture } from "lucide-react";

export default function RegisterPage() {
  return <main className="content-width flex min-h-screen items-center justify-center py-12">
    <section className="w-full max-w-md rounded-[28px] border p-7 sm:p-9" style={{background:"var(--surface)",borderColor:"var(--line)"}}>
      <Link href="/" className="inline-flex items-center gap-2 text-xs muted"><ArrowLeft size={14}/> Back to PolicyLens</Link>
      <Aperture size={26} className="mt-9 accent"/>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] accent">Join the conversation</p>
      <h1 className="font-display mt-2 text-3xl font-extrabold">Your perspective belongs here.</h1>
      <p className="mt-3 text-sm leading-6 muted">Create an account to respond to policies and follow discussions. Everyone can participate; nobody needs to agree.</p>
      <form className="mt-7 space-y-4" action="#">
        <label className="block text-xs font-semibold">Display name<input required maxLength={60} autoComplete="nickname" placeholder="How you want to appear" className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{background:"var(--paper)",borderColor:"var(--line)"}}/></label>
        <label className="block text-xs font-semibold">Email address<input required type="email" autoComplete="email" placeholder="you@example.com" className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{background:"var(--paper)",borderColor:"var(--line)"}}/></label>
        <label className="block text-xs font-semibold">Stakeholder / occupation
          <select required defaultValue="" className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{background:"var(--paper)",borderColor:"var(--line)"}}>
            <option value="" disabled>Select the closest fit</option><option>Citizen / community member</option><option>Student / researcher</option><option>Business owner / entrepreneur</option><option>Employee / professional</option><option>Public sector worker</option><option>Non-profit / civil society</option><option>Industry / trade association</option><option>Academic / educator</option><option>Other</option><option>Prefer not to say</option>
          </select>
        </label>
        <label className="block text-xs font-semibold">Password<input required type="password" minLength={12} autoComplete="new-password" placeholder="At least 12 characters" className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{background:"var(--paper)",borderColor:"var(--line)"}}/></label>
        <button type="button" className="w-full rounded-full py-3 text-sm font-semibold" style={{background:"var(--accent)",color:"var(--surface)"}}>Create account</button>
      </form>
      <p className="mt-5 text-center text-xs muted">Already registered? <Link href="/login" className="font-semibold accent">Sign in</Link></p>
      <p className="mt-4 text-[10px] leading-5 muted">Prototype only. Email verification, secure password storage, consent and account creation require backend implementation.</p>
    </section>
  </main>;
}
