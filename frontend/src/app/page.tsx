"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownUp, ArrowUpRight, Check, Globe2, Search, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Wordmark } from "@/components/brand/wordmark";
import { PolicyCard } from "@/features/feed/policy-card";
import { demoPosts } from "@/features/feed/demo-data";

type Filter = "Latest" | "Trending" | "24 hours";
const categories = ["All topics", "Environment", "Public services", "Economy", "Health", "Digital government", "Education"];
// Fixed clock for this explicitly fictional demo dataset; production uses server timestamps.
const DEMO_REFERENCE_NOW = Date.parse("2026-10-13T18:00:00+05:30");

function FeedContent() {
  const [filter, setFilter] = useState<Filter>("Latest");
  const [category, setCategory] = useState("All topics");
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("All languages");

  const visiblePosts = useMemo(() => {
    const filtered = demoPosts.filter((post) => {
      const withinFourDays = DEMO_REFERENCE_NOW - new Date(post.publishedAt).getTime() <= 4 * 86_400_000;
      const withinDay = DEMO_REFERENCE_NOW - new Date(post.publishedAt).getTime() <= 86_400_000;
      const matchesCategory = category === "All topics" || post.category === category;
      const matchesLanguage = language === "All languages" || post.language === language;
      const terms = `${post.title} ${post.excerpt} ${post.category}`.toLocaleLowerCase();
      return withinFourDays && (filter !== "24 hours" || withinDay) && matchesCategory && matchesLanguage && terms.includes(query.toLocaleLowerCase());
    });
    if (filter === "Trending") return filtered.sort((a, b) => b.comments - a.comments);
    return filtered.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  }, [filter, category, query, language]);

  return (
    <main className="min-h-screen pb-24 md:pb-10">
      <header className="sticky top-0 z-30 border-b backdrop-blur-xl" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--paper) 88%, transparent)" }}>
        <div className="content-width flex h-[70px] items-center justify-between gap-3">
          <Wordmark/>
          <div className="hidden max-w-[360px] flex-1 items-center gap-2 rounded-full border px-4 py-2.5 md:flex" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
            <Search size={16} className="muted"/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a policy discussion..." className="w-full bg-transparent text-[12px] outline-none " aria-label="Search discussions"/>
            <kbd className="rounded border px-1.5 py-0.5 text-[9px] muted" style={{ borderColor: "var(--line)" }}>⌘ K</kbd>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle/>
            <Link href="/login" className="hidden rounded-full px-4 py-2.5 text-[12px] font-semibold sm:block" style={{ background: "var(--accent)", color: "var(--surface)" }}>Sign in</Link>
            <Link href="/register" className="hidden rounded-full border px-4 py-2.5 text-[12px] font-semibold lg:block" style={{ borderColor: "var(--line)" }}>Join the discussion</Link>
          </div>
        </div>
      </header>

      <div className="content-width editorial-grid py-6 md:py-9">
        <section className="min-w-0">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] accent">A better-informed public square</p>
              <h1 className="font-display text-[34px] font-extrabold leading-[1.02] sm:text-[44px]">Issues that matter.<br/><span className="muted">Voices that count.</span></h1>
              <p className="mt-3 max-w-[560px] text-[13px] leading-6 muted">Explore public discussions, understand where people stand, and follow the evidence behind every collective insight.</p>
            </div>
            <div className="hidden shrink-0 items-center gap-1.5 pb-1 text-[10px] muted sm:flex"><ShieldCheck size={14}/> Evidence-first by design</div>
          </div>

          <div className="mb-5 rounded-2xl border p-3 sm:p-4" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
            <div className="mb-3 flex items-center gap-2 md:hidden">
              <Search size={16} className="muted"/>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search public issues..." className="w-full bg-transparent text-[13px] outline-none" aria-label="Search discussions"/>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["Latest", "Trending", "24 hours"] as Filter[]).map((item) => (
                <button key={item} onClick={() => setFilter(item)} className="rounded-full px-4 py-2 text-[11px] font-semibold transition-colors"
                  style={{ background: filter === item ? "var(--accent)" : "var(--surface-subtle)", color: filter === item ? "var(--surface)" : "var(--muted)" }}>
                  {item === "24 hours" ? "Last 24 hours" : item}
                </button>
              ))}
              <span className="flex-1"/>
              <label className="flex items-center gap-2 rounded-full border px-3 py-2 text-[11px]" style={{ borderColor: "var(--line)" }}>
                <Globe2 size={13} className="muted"/>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="max-w-[130px] bg-transparent outline-none" aria-label="Filter by language">
                  <option>All languages</option><option>English</option><option>French</option><option>Hindi</option><option>Hinglish</option><option>Bengali</option><option>Tamil</option><option>Telugu</option><option>Marathi</option><option>Punjabi</option><option>Gujarati</option><option>Kannada</option><option>Malayalam</option><option>Urdu</option><option>Other</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className="shrink-0 rounded-full border px-3 py-2 text-[10px] font-medium"
                style={{ borderColor: category === item ? "var(--accent)" : "var(--line)", color: category === item ? "var(--accent)" : "var(--muted)", background: category === item ? "var(--accent-soft)" : "transparent" }}>{item}</button>)}
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] muted">{visiblePosts.length} discussions · Posts expire from feed after 4 days</p>
            <button className="inline-flex items-center gap-1.5 text-[11px] muted" onClick={() => {setFilter("Latest"); setCategory("All topics"); setQuery(""); setLanguage("All languages");}}><SlidersHorizontal size={13}/> Reset</button>
          </div>

          <div className="space-y-5">
            {visiblePosts.map((post, index) => <div key={post.id} className="fade-up" style={{ animationDelay: `${index * 60}ms` }}><PolicyCard post={post} featured={index === 0 && filter === "Latest" && category === "All topics" && !query}/></div>)}
            {visiblePosts.length === 0 && <div className="rounded-2xl border p-10 text-center" style={{ background: "var(--surface)", borderColor: "var(--line)" }}><Search size={22} className="mx-auto muted"/><h2 className="mt-3 font-display text-xl font-bold">No discussions found</h2><p className="mt-2 text-sm muted">Try another keyword, category or language.</p></div>}
          </div>
          <p className="mt-5 text-center text-[10px] leading-5 muted">Demo-only discussion content. Results and counts are illustrative and are not real public-opinion findings.</p>
        </section>

        <aside className="desktop-only space-y-5">
          <div className="rounded-[22px] p-5" style={{ background: "var(--accent)", color: "#F7F7F2" }}>
            <Sparkles size={17} strokeWidth={1.6}/>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.18em] opacity-70">The PolicyLens promise</p>
            <h2 className="font-display mt-2 text-[24px] font-bold leading-tight">A louder voice is not always the whole story.</h2>
            <p className="mt-3 text-[12px] leading-5 opacity-80">We keep source evidence close, distinguish concerns from requests, and make uncertainty visible.</p>
            <Link href="/about" className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold">How it works <ArrowUpRight size={14}/></Link>
          </div>
          <div className="rounded-[22px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
            <div className="flex items-center justify-between"><h2 className="font-display text-[17px] font-bold">Topics in focus</h2><ArrowDownUp size={15} className="muted"/></div>
            <div className="mt-4 space-y-4">
              {[["Environment","Climate, land and resources","01"],["Public services","Access, quality and fairness","02"],["Digital government","Access, privacy and trust","03"]].map(([name, detail, number]) => <button key={name} onClick={() => setCategory(name)} className="flex w-full items-start gap-3 text-left"><span className="pt-0.5 text-[10px] muted">{number}</span><span className="flex-1"><span className="block text-[12px] font-semibold">{name}</span><span className="mt-1 block text-[10px] muted">{detail}</span></span><ArrowUpRight size={13} className="muted"/></button>)}
            </div>
          </div>
          <div className="rounded-[22px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
            <h2 className="font-display text-[16px] font-bold">Built for trust</h2>
            <div className="mt-4 space-y-3 text-[11px] muted">
              <p className="flex gap-2"><Check size={14} className="accent shrink-0"/> One account, one reaction per issue</p>
              <p className="flex gap-2"><Check size={14} className="accent shrink-0"/> Evidence linked to source comments</p>
              <p className="flex gap-2"><Check size={14} className="accent shrink-0"/> Research findings separated from live votes</p>
            </div>
          </div>
          <p className="px-2 text-[10px] muted">About · Guidelines · Privacy · Accessibility<br/>© 2026 PolicyLens Research</p>
        </aside>
      </div>
      <footer className="content-width mt-10 hidden border-t py-5 text-[10px] muted md:block" style={{ borderColor: "var(--line)" }}>PolicyLens · Public policy deserves more than a like count.</footer>
    </main>
  );
}

export default function HomePage() {
  return <FeedContent/>;
}
