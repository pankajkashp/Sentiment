import Link from "next/link";
import { Aperture, ArrowLeft, LockKeyhole } from "lucide-react";

export default function LoginPage() {
  return <main className="content-width flex min-h-screen items-center justify-center py-12">
    <section className="w-full max-w-md rounded-[28px] border p-7 sm:p-9" style={{background:"var(--surface)",borderColor:"var(--line)"}}>
      <Link href="/" className="inline-flex items-center gap-2 text-xs muted"><ArrowLeft size={14}/> Back to PolicyLens</Link>
      <Aperture size={26} className="mt-9 accent"/>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] accent">Welcome back</p>
      <h1 className="font-display mt-2 text-3xl font-extrabold">Pick up where you left off.</h1>
      <p className="mt-3 text-sm leading-6 muted">Sign in to take part in policy discussions, save topics and view your activity.</p>
      <form className="mt-7 space-y-4" action="#" onSubmit={(event) => event.preventDefault()}>
        <label className="block text-xs font-semibold">Email address<input type="email" autoComplete="email" required placeholder="you@example.com" className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2" style={{background:"var(--paper)",borderColor:"var(--line)"}}/></label>
        <label className="block text-xs font-semibold">Password<input type="password" autoComplete="current-password" required minLength={8} placeholder="Your password" className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2" style={{background:"var(--paper)",borderColor:"var(--line)"}}/></label>
        <button className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold" style={{background:"var(--accent)",color:"var(--surface)"}} type="submit"><LockKeyhole size={15}/> Sign in</button>
      </form>
      <p className="mt-5 text-center text-xs muted">New to PolicyLens? <Link href="/register" className="font-semibold accent">Create an account</Link></p>
      <p className="mt-5 text-[10px] leading-5 muted">Demo screen only. Authentication is not implemented yet; no credentials are transmitted or stored.</p>
    </section>
  </main>;
}
