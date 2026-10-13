"use client";

import Link from "next/link";
import { ArrowUpRight, Clock3, Globe2, Landmark, MessageSquareText, ShieldAlert } from "lucide-react";
import type { PolicyPost } from "./types";

const DEMO_REFERENCE_NOW = Date.parse("2026-10-13T18:00:00+05:30");

function formatRelativeTime(dateString: string): string {
  const difference = Math.max(0, DEMO_REFERENCE_NOW - new Date(dateString).getTime());
  const hours = Math.floor(difference / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PolicyCard({ post }: { post: PolicyPost; featured?: boolean }) {
  const isClosingSoon = post.status === "Closing soon";

  return (
    <article
      className="group relative rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 sm:p-6"
      style={{
        background: "var(--surface)",
        borderColor: "var(--line)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Top Metadata Row: Topic, Status, Language, Relative Time */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Topic Badge */}
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{
              background: "var(--surface-subtle)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: isClosingSoon ? "var(--saffron)" : "var(--india-green)" }}
              aria-hidden="true"
            />
            {post.category}
          </span>

          {/* Consultation Status Badge */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
            style={{
              background: isClosingSoon ? "var(--saffron-soft)" : "var(--india-green-soft)",
              color: isClosingSoon ? "var(--saffron)" : "var(--india-green)",
            }}
          >
            {isClosingSoon ? (
              <>
                <ShieldAlert size={12} strokeWidth={2} aria-hidden="true" />
                <span>Closing soon</span>
              </>
            ) : (
              <span>Open consultation</span>
            )}
          </span>
        </div>

        {/* Right side: Language and Relative Time */}
        <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <Globe2 size={12} strokeWidth={1.75} aria-hidden="true" />
            <span>{post.language}</span>
          </span>
          <span aria-hidden="true" className="text-[var(--line)]">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 size={12} strokeWidth={1.75} aria-hidden="true" />
            <time dateTime={post.publishedAt}>{formatRelativeTime(post.publishedAt)}</time>
          </span>
        </div>
      </div>

      {/* Main Discussion Title */}
      <h2 className="mt-3.5 font-display text-[17px] font-bold leading-snug sm:text-[19px]">
        <Link
          href={`/policy/${post.slug}`}
          className="text-[var(--ink)] transition-colors hover:text-[var(--saffron)] focus:outline-none focus:underline"
        >
          {post.title}
        </Link>
      </h2>

      {/* Excerpt / Summary */}
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--body)]">
        {post.excerpt}
      </p>

      {/* Bottom Engagement & Source Row */}
      <div
        className="mt-4.5 flex flex-wrap items-center justify-between gap-3 border-t pt-3.5 text-[11.5px]"
        style={{ borderColor: "var(--line-subtle)" }}
      >
        <div className="flex flex-wrap items-center gap-4 text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <MessageSquareText size={13.5} strokeWidth={1.75} className="text-[var(--saffron)]" aria-hidden="true" />
            <strong className="font-semibold text-[var(--ink)]">{post.comments}</strong> responses
          </span>

          <span className="hidden items-center gap-1.5 sm:inline-flex text-[11px]">
            <Landmark size={13} strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate max-w-[240px]">{post.sourceName}</span>
          </span>
        </div>

        <Link
          href={`/policy/${post.slug}`}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-colors hover:bg-[var(--surface-subtle)]"
          style={{ color: "var(--saffron)" }}
          aria-label={`Read discussion and view evidence on ${post.title}`}
        >
          <span>View discussion</span>
          <ArrowUpRight size={13.5} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
