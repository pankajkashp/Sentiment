import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";

const topics = [
  ["Environment", "Land, climate, conservation and resilience", "01"],
  ["Public services", "Access, reliability and service standards", "02"],
  ["Economy", "Work, taxes, business and cost of living", "03"],
  ["Health", "Care, prevention and public health", "04"],
  ["Digital government", "Access, privacy and digital rights", "05"],
  ["Education", "Schools, skills and lifelong learning", "06"]
];

export default function DiscoverPage() {
  return <main className="content-width min-h-screen py-8 pb-24 md:py-12">
    <Link href="/" className="text-xs muted">← Back to the feed</Link>
    <p className="mt-8 text-[10px] font-bold uppercase tracking-[.2em] accent">Explore</p>
    <h1 className="font-display mt-2 text-4xl font-extrabold">Find your point of view.</h1>
    <p className="mt-3 max-w-xl text-sm leading-6 muted">Explore themes across open consultations. Topics are navigation categories, not claims about what the public thinks.</p>
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map(([name, description, index]) => <Link key={name} href={`/?category=${encodeURIComponent(name)}`} className="group rounded-2xl border p-5 transition-all hover:-translate-y-0.5" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <div className="flex items-center justify-between"><span className="text-[10px] muted">{index} / 06</span><Compass size={18} className="accent"/></div>
        <h2 className="font-display mt-8 text-xl font-bold">{name}</h2>
        <p className="mt-2 text-xs leading-5 muted">{description}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold accent">Explore topic <ArrowUpRight size={14}/></span>
      </Link>)}
    </div>
  </main>;
}
