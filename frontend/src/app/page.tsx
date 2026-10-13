"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Wordmark } from "@/components/brand/wordmark";
import { PolicyCard } from "@/features/feed/policy-card";
import {
  FeedToolbar,
  type SortOption,
  type TimeRangeOption,
} from "@/features/feed/feed-toolbar";
import { demoPosts } from "@/features/feed/demo-data";

const DEMO_REFERENCE_NOW = Date.parse("2026-10-13T18:00:00+05:30");

export default function HomePage() {
  const [sort, setSort] = useState<SortOption>("Latest");
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("All");
  const [category, setCategory] = useState("All topics");
  const [language, setLanguage] = useState("All languages");
  const [query, setQuery] = useState("");

  const isFiltered =
    sort !== "Latest" ||
    timeRange !== "All" ||
    category !== "All topics" ||
    language !== "All languages" ||
    query.trim() !== "";

  const handleReset = () => {
    setSort("Latest");
    setTimeRange("All");
    setCategory("All topics");
    setLanguage("All languages");
    setQuery("");
  };

  const visiblePosts = useMemo(() => {
    const filtered = demoPosts.filter((post) => {
      const postTime = new Date(post.publishedAt).getTime();
      const ageMs = DEMO_REFERENCE_NOW - postTime;

      // Time range filter
      if (timeRange === "24h" && ageMs > 86_400_000) return false;
      if (timeRange === "7d" && ageMs > 7 * 86_400_000) return false;
      if (timeRange === "30d" && ageMs > 30 * 86_400_000) return false;

      // Category filter
      if (category !== "All topics" && post.category !== category) return false;

      // Language filter
      if (language !== "All languages" && post.language !== language) return false;

      // Search query filter
      if (query.trim() !== "") {
        const q = query.toLowerCase();
        const haystack = `${post.title} ${post.excerpt} ${post.category} ${post.language} ${post.sourceName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    if (sort === "Trending") {
      return filtered.sort((a, b) => b.comments - a.comments);
    }
    return filtered.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [sort, timeRange, category, language, query]);

  return (
    <main className="min-h-screen pb-24 md:pb-12">
      {/* Sticky Portal Navigation Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{
          borderColor: "var(--line)",
          background: "color-mix(in srgb, var(--paper) 90%, transparent)",
        }}
      >
        <div className="content-width flex h-[66px] items-center justify-between gap-4">
          <Wordmark />

          {/* Compact Desktop Search */}
          <div
            className="hidden max-w-[340px] flex-1 items-center gap-2 rounded-xl border px-3 py-1.5 md:flex"
            style={{ background: "var(--surface)", borderColor: "var(--line)" }}
          >
            <Search size={14} className="text-[var(--muted)] shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search policy issues..."
              className="w-full bg-transparent text-[12px] text-[var(--ink)] placeholder-[var(--muted)] outline-none"
              aria-label="Search policy issues"
            />
            <kbd
              className="rounded border px-1 py-0.5 text-[9px] font-mono text-[var(--muted)]"
              style={{ borderColor: "var(--line)" }}
              aria-hidden="true"
            >
              ⌘K
            </kbd>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-colors sm:block"
              style={{
                background: "var(--saffron)",
                color: "#ffffff",
              }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="hidden rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[var(--surface-subtle)] lg:block"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              Join discussion
            </Link>
          </div>
        </div>

        {/* Subtle Indian Tricolour Accent Line at base of header */}
        <div
          className="h-[2px] w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--saffron) 0% 33.33%, #ffffff 33.33% 66.67%, var(--india-green) 66.67% 100%)",
          }}
          aria-hidden="true"
        />
      </header>

      {/* Main Content Area */}
      <div className="content-width portal-grid py-5 sm:py-7">
        {/* Left Column: Feed Content */}
        <section className="min-w-0" aria-labelledby="feed-heading">
          {/* Compact Page Header */}
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "var(--india-green)" }}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--india-green)]">
                  Public Consultation Forum
                </span>
              </div>
              <h1
                id="feed-heading"
                className="mt-1 font-display text-[26px] font-extrabold leading-tight text-[var(--ink)] sm:text-[32px]"
              >
                Public Policy Consultations
              </h1>
              <p className="mt-1 max-w-[620px] text-[13px] leading-relaxed text-[var(--body)]">
                Explore active discussions, verified citizen feedback, and collective insights across national policy areas.
              </p>
            </div>

            {/* Disclaimer pill */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] text-[var(--muted)]"
              style={{ background: "var(--surface)", borderColor: "var(--line)" }}
            >
              <ShieldCheck size={12} className="text-[var(--india-green)]" aria-hidden="true" />
              <span>Independent Public Portal</span>
            </span>
          </div>

          {/* Compact Feed Toolbar */}
          <FeedToolbar
            sort={sort}
            onSortChange={setSort}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            language={language}
            onLanguageChange={setLanguage}
            category={category}
            onCategoryChange={setCategory}
            query={query}
            onQueryChange={setQuery}
            onReset={handleReset}
            isFiltered={isFiltered}
          />

          {/* Feed Status Summary */}
          <div className="mb-3.5 flex items-center justify-between text-[11.5px] text-[var(--muted)]">
            <p>
              Showing <strong className="text-[var(--ink)]">{visiblePosts.length}</strong>{" "}
              {visiblePosts.length === 1 ? "discussion" : "discussions"}
              {category !== "All topics" && ` in ${category}`}
              {language !== "All languages" && ` (${language})`}
            </p>

            {isFiltered && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 font-medium text-[var(--saffron)] hover:underline"
              >
                <SlidersHorizontal size={12} aria-hidden="true" />
                <span>Reset filters</span>
              </button>
            )}
          </div>

          {/* Discussion Cards Feed (Photo-free, High-contrast, Accessible) */}
          <div className="space-y-4">
            {visiblePosts.map((post, index) => (
              <div
                key={post.id}
                className="fade-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <PolicyCard post={post} />
              </div>
            ))}

            {visiblePosts.length === 0 && (
              <div
                className="rounded-2xl border p-10 text-center"
                style={{ background: "var(--surface)", borderColor: "var(--line)" }}
              >
                <Search size={22} className="mx-auto text-[var(--muted)]" aria-hidden="true" />
                <h2 className="mt-3 font-display text-[17px] font-bold text-[var(--ink)]">
                  No discussions found
                </h2>
                <p className="mt-1.5 text-[12.5px] text-[var(--muted)]">
                  No policy issues match your current filter combination.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11.5px] font-semibold"
                  style={{ background: "var(--saffron)", color: "#ffffff" }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Demonstration Notice */}
          <p className="mt-6 text-center text-[10.5px] text-[var(--muted)] leading-relaxed">
            Demonstration consultation content for interface evaluation.
            Perspectives, responses, and vote metrics are illustrative and not official government statistics.
          </p>
        </section>

        {/* Right Column: Portal Information & Sidebar Context */}
        <aside className="desktop-only space-y-4.5" aria-label="Portal overview">
          {/* Evidence-First Principles Card */}
          <div
            className="rounded-2xl border p-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--line)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "var(--chakra-soft)", color: "var(--chakra)" }}
              >
                <FileText size={15} strokeWidth={2} aria-hidden="true" />
              </span>
              <h2 className="font-display text-[15px] font-bold text-[var(--ink)]">
                Evidence-First Public Discourse
              </h2>
            </div>
            <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--body)]">
              PolicyLens synthesizes citizen feedback while strictly separating stated concerns from proposed policy actions, keeping verified evidence linked to source comments.
            </p>
            <Link
              href="/about"
              className="mt-3.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--saffron)] hover:underline"
            >
              <span>How PolicyLens works</span>
              <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>

          {/* Active Policy Topics Card */}
          <div
            className="rounded-2xl border p-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--line)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h2 className="font-display text-[14px] font-bold text-[var(--ink)]">
              Policy Consultation Areas
            </h2>
            <div className="mt-3 space-y-2.5 text-[12px]">
              {[
                { name: "Digital government", count: 1, desc: "DPI, accessibility & privacy" },
                { name: "Environment", count: 1, desc: "Clean air & urban telemetry" },
                { name: "Health", count: 1, desc: "Telemedicine & rural healthcare" },
                { name: "Economy", count: 1, desc: "Renewable energy & solar rooftop" },
                { name: "Public services", count: 1, desc: "Public transport & urban mobility" },
                { name: "Education", count: 1, desc: "Vocational skills & NEP reforms" },
              ].map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setCategory(item.name)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--surface-subtle)]"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-[var(--ink)]">{item.name}</p>
                    <p className="text-[10.5px] text-[var(--muted)] truncate">{item.desc}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: "var(--surface-subtle)", color: "var(--muted)" }}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Integrity & Governance Standards Card */}
          <div
            className="rounded-2xl border p-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--line)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h2 className="font-display text-[14px] font-bold text-[var(--ink)]">
              Platform Integrity Standards
            </h2>
            <div className="mt-3 space-y-2.5 text-[11.5px] text-[var(--body)]">
              <p className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[var(--india-green)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>One authenticated account, one reaction per consultation</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[var(--india-green)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Source comment citations preserved verbatim without hallucination</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[var(--india-green)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Research models strictly decoupled from live community tallies</span>
              </p>
            </div>
          </div>

          {/* Portal Footer Notice */}
          <div className="px-2 pt-2 text-[10.5px] text-[var(--muted)] leading-relaxed">
            <p>PolicyLens — Indian Public Policy Information Portal</p>
            <p className="mt-1">
              Independent academic research platform. Not affiliated with or endorsed by any government agency.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
