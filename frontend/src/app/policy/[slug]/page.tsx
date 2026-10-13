import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  Landmark,
  MessageSquare,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { demoPosts } from "@/features/feed/demo-data";

export function generateStaticParams() {
  return demoPosts.map((post) => ({ slug: post.slug }));
}

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = demoPosts.find((item) => item.slug === slug);

  if (!post) {
    return (
      <main className="content-width py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
          Discussion not found
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          The requested policy consultation could not be located.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--saffron)" }}
        >
          <ArrowLeft size={14} /> Return to consultations
        </Link>
      </main>
    );
  }

  const isClosingSoon = post.status === "Closing soon";

  return (
    <main className="content-width min-h-screen py-6 pb-24 md:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--saffron)] transition-colors"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        <span>Back to all consultations</span>
      </Link>

      <article
        className="mx-auto mt-5 max-w-[840px] overflow-hidden rounded-2xl border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--line)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Header Banner with Subtle Tricolour Bar */}
        <div
          className="h-[3px] w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--saffron) 0% 33.33%, #ffffff 33.33% 66.67%, var(--india-green) 66.67% 100%)",
          }}
          aria-hidden="true"
        />

        <div className="p-6 sm:p-9">
          {/* Metadata Badges Row */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold uppercase tracking-[0.1em]"
              style={{
                background: "var(--surface-subtle)",
                color: "var(--ink)",
                border: "1px solid var(--line)",
              }}
            >
              {post.category}
            </span>

            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium"
              style={{
                background: isClosingSoon ? "var(--saffron-soft)" : "var(--india-green-soft)",
                color: isClosingSoon ? "var(--saffron)" : "var(--india-green)",
              }}
            >
              {post.status}
            </span>

            <span className="inline-flex items-center gap-1 text-[var(--muted)]">
              <Globe2 size={12} aria-hidden="true" />
              <span>{post.language}</span>
            </span>

            <span className="text-[var(--line)]" aria-hidden="true">·</span>

            <span className="inline-flex items-center gap-1 text-[var(--muted)]">
              <Landmark size={12} aria-hidden="true" />
              <span>{post.sourceName}</span>
            </span>
          </div>

          {/* Consultation Title */}
          <h1 className="mt-4 font-display text-[26px] font-extrabold leading-snug text-[var(--ink)] sm:text-[36px]">
            {post.title}
          </h1>

          {/* Consultation Summary */}
          <p className="mt-4 text-[14.5px] leading-relaxed text-[var(--body)]">
            {post.excerpt}
          </p>

          {/* Official Context & Disclaimers Box */}
          <div
            className="mt-6 rounded-xl border p-4.5 sm:p-5"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--line)",
            }}
          >
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--saffron)]">
              Consultation Framework & Source Citation
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--body)]">
              This discussion reflects an illustrative public-policy consultation prototype. Official submissions, verified evidence packages, and regulatory filings are tracked by PolicyLens to ensure transparent collective verdicts without inventing citizen demands.
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              <a
                href={post.sourceUrl}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--saffron)] hover:underline"
              >
                <span>View consultation document</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
              <span className="text-[var(--line)]" aria-hidden="true">·</span>
              <span className="text-[11px] text-[var(--muted)]">
                Closes: {new Date(post.closesAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Response Counter & Action Row */}
          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y py-3.5 text-[12px]"
            style={{ borderColor: "var(--line)" }}
          >
            <span className="inline-flex items-center gap-1.5 text-[var(--muted)] font-medium">
              <MessageSquare size={14} className="text-[var(--saffron)]" aria-hidden="true" />
              <strong className="text-[var(--ink)]">{post.comments}</strong> responses registered (demo)
            </span>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-[var(--surface-subtle)]"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              <Bookmark size={13} aria-hidden="true" />
              <span>Save discussion</span>
            </button>
          </div>

          {/* Citizen Stance Input Section */}
          <section className="mt-7" aria-labelledby="stance-heading">
            <h2 id="stance-heading" className="font-display text-[18px] font-bold text-[var(--ink)]">
              Where do you stand on this policy?
            </h2>
            <p className="mt-1 text-[12px] text-[var(--muted)]">
              Indicate your perspective before contributing written feedback. One vote per verified account.
            </p>

            <div className="mt-3.5 grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all hover:border-[var(--india-green)]"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--line)",
                }}
              >
                <ThumbsUp size={16} className="text-[var(--india-green)]" aria-hidden="true" />
                <span className="text-[12px] font-semibold text-[var(--ink)]">Support</span>
              </button>

              <button
                type="button"
                className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all hover:border-[var(--saffron)]"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--line)",
                }}
              >
                <ThumbsDown size={16} className="text-[var(--saffron)]" aria-hidden="true" />
                <span className="text-[12px] font-semibold text-[var(--ink)]">Oppose</span>
              </button>

              <button
                type="button"
                className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all hover:border-[var(--chakra)]"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--line)",
                }}
              >
                <ShieldCheck size={16} className="text-[var(--chakra)]" aria-hidden="true" />
                <span className="text-[12px] font-semibold text-[var(--ink)]">No opinion</span>
              </button>
            </div>

            {/* Comment Form Prototype */}
            <div
              className="mt-5 rounded-xl border p-4 sm:p-5"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              <label htmlFor="comment" className="block text-[12.5px] font-semibold text-[var(--ink)]">
                Submit constructive feedback or evidence
              </label>
              <textarea
                id="comment"
                rows={4}
                maxLength={3000}
                placeholder="Share your perspective, lived experience, or specific reform proposal for this consultation..."
                className="mt-2.5 w-full resize-y rounded-xl border p-3 text-[13px] text-[var(--ink)] placeholder-[var(--muted)] outline-none focus:ring-2"
                style={{
                  background: "var(--paper)",
                  borderColor: "var(--line)",
                }}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10.5px] text-[var(--muted)]">
                  Ground assertions in evidence. All submissions are audited for demand presence.
                </span>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-[11.5px] font-semibold transition-colors"
                  style={{ background: "var(--saffron)", color: "#ffffff" }}
                >
                  Sign in to contribute
                </Link>
              </div>
            </div>
          </section>

          {/* Community Responses Preview */}
          <section className="mt-8 border-t pt-6" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-bold text-[var(--ink)]">
                Verified Citizen Submissions
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                <Clock3 size={12} aria-hidden="true" />
                <span>Audited for demand presence</span>
              </span>
            </div>

            <div
              className="mt-3.5 rounded-xl border p-5"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--line)" }}
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[var(--india-green)] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-[13px] font-semibold text-[var(--ink)]">
                    Audited Collective Findings
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--body)]">
                    Live community responses are processed through PolicyLens Demand-Presence Safeguards to distinguish citizen demands from general grievances without hallucinating requested actions.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
