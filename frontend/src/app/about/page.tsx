import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, Fingerprint, Scale } from "lucide-react";

const principles = [
  { icon: BookOpen, title: "Evidence over assertion", text: "Collective insights should link back to the source comments that support them. Findings are not presented without traceable evidence." },
  { icon: Scale, title: "A concern is not automatically a demand", text: "PolicyLens distinguishes a person's stated request from a model's inference or an analyst's proposed action." },
  { icon: Fingerprint, title: "One account, one reaction", text: "Reactions are constrained per account and policy. Abuse prevention uses layered signals rather than invasive hardware-address tracking." },
  { icon: CheckCircle2, title: "Uncertainty stays visible", text: "Live community activity and validated research conclusions are different things. The interface should label provisional findings clearly." }
];

export default function AboutPage() {
  return <main className="content-width min-h-screen py-8 pb-24 md:py-12">
    <Link href="/" className="inline-flex items-center gap-2 text-xs muted"><ArrowLeft size={14}/> Back to the feed</Link>
    <p className="mt-10 text-[10px] font-bold uppercase tracking-[.2em] accent">Why PolicyLens</p>
    <h1 className="font-display mt-2 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">Make collective opinion easier to understand — and harder to misrepresent.</h1>
    <p className="mt-5 max-w-2xl text-sm leading-7 muted">PolicyLens is a research project for analysing public-policy feedback: the concerns people raise, the positions they express, the actions they request, and the evidence behind collective insights.</p>
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      {principles.map(({icon: Icon, title, text}) => <section key={title} className="rounded-2xl border p-6" style={{background:"var(--surface)",borderColor:"var(--line)"}}><Icon size={20} className="accent"/><h2 className="font-display mt-5 text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 muted">{text}</p></section>)}
    </div>
    <div className="mt-8 rounded-2xl p-6" style={{background:"var(--accent-soft)"}}><h2 className="font-display text-xl font-bold">A note on research integrity</h2><p className="mt-2 max-w-2xl text-sm leading-6 muted">This interface currently uses fictional sample posts and illustrative counts. It is not connected to a live database or analysis API yet. Research claims will only be shown when supported by documented experiments and source evidence.</p></div>
  </main>;
}
