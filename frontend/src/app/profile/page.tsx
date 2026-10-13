import Link from "next/link";
import { UserRound, ShieldCheck } from "lucide-react";
export default function ProfilePage() {
  return <main className="content-width min-h-[calc(100svh-80px)] py-8 pb-24 md:py-12">
    <p className="text-[10px] font-bold uppercase tracking-[.2em] accent">Your account</p>
    <h1 className="font-display mt-2 text-4xl font-extrabold">Your profile, your voice.</h1>
    <p className="mt-3 max-w-xl text-sm leading-6 muted">Manage the public identity and stakeholder category associated with your participation.</p>
    <section className="mt-8 max-w-2xl rounded-[24px] border p-6 sm:p-8" style={{background:"var(--surface)",borderColor:"var(--line)"}}>
      <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full" style={{background:"var(--accent-soft)",color:"var(--accent)"}}><UserRound size={24}/></div><div><h2 className="font-display text-xl font-bold">You are not signed in</h2><p className="mt-1 text-xs muted">Sign in to view your profile details.</p></div></div>
      <div className="mt-6 rounded-xl p-4" style={{background:"var(--surface-subtle)"}}><div className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck size={15} className="accent"/> Privacy by default</div><p className="mt-2 text-xs leading-5 muted">Email address and account security settings will never be displayed as public profile fields. Only a display name and optional stakeholder category should appear publicly.</p></div>
      <div className="mt-6 flex gap-3"><Link href="/login" className="rounded-full px-5 py-3 text-xs font-semibold" style={{background:"var(--accent)",color:"var(--surface)"}}>Sign in</Link><Link href="/register" className="rounded-full border px-5 py-3 text-xs font-semibold" style={{borderColor:"var(--line)"}}>Create account</Link></div>
    </section>
  </main>;
}
