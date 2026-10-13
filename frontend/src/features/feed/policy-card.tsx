"use client";

import Link from "next/link";
import { ArrowUpRight, Clock3, MessageCircle, MoveUpRight } from "lucide-react";
import type { PolicyPost } from "./types";

function timeAgo(value: string) {
  const difference = Math.max(0, Date.now() - new Date(value).getTime());
  const hours = Math.floor(difference / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function PolicyCard({ post, featured = false }: { post: PolicyPost; featured?: boolean }) {
  return (
    <article className="group overflow-hidden rounded-[22px] surface transition-shadow hover:shadow-[var(--shadow-soft)]">
      {featured ? (
        <Link href={`/policy/${post.slug}`} className="photo-wash relative block h-[210px] sm:h-[260px]">
          <img src={post.image} alt={post.imageAlt} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101913]/80 via-[#101913]/12 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
            <div className="max-w-[600px]">
              <span className="mb-3 inline-flex rounded-full border border-white/30 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.15em] text-white backdrop-blur-sm">{post.category}</span>
              <h2 className="font-display max-w-2xl text-[25px] font-bold leading-[1.12] text-white sm:text-[32px]">{post.title}</h2>
            </div>
            <span className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"><ArrowUpRight size={19}/></span>
          </div>
        </Link>
      ) : (
        <div className="flex min-w-0">
          <Link href={`/policy/${post.slug}`} aria-label={`Read ${post.title}`} className="relative block w-[108px] shrink-0 overflow-hidden sm:w-[158px]">
            <img src={post.image} alt={post.imageAlt} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </Link>
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[.14em] accent">{post.category}</span>
              <span className="shrink-0 text-[10px] muted">{timeAgo(post.publishedAt)}</span>
            </div>
            <Link href={`/policy/${post.slug}`}><h2 className="font-display text-[17px] font-bold leading-[1.2] sm:text-[20px]">{post.title}</h2></Link>
            <p className="mt-2 line-clamp-2 text-[12px] leading-5 muted">{post.excerpt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] muted">
              <span className="inline-flex items-center gap-1.5"><MessageCircle size={13}/>{post.comments} responses</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 size={13}/>{post.status === "Closing soon" ? "Closing soon" : "Open"}</span>
              <Link className="ml-auto inline-flex items-center gap-1 font-semibold" style={{color:"var(--accent)"}} href={`/policy/${post.slug}`}>Read <MoveUpRight size={13}/></Link>
            </div>
          </div>
        </div>
      )}
      {featured && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-5 text-[11px] muted sm:px-6">
          <span className="inline-flex items-center gap-1.5"><MessageCircle size={14}/>{post.comments} responses <span className="text-[10px]">(demo)</span></span>
          <span className="inline-flex items-center gap-1.5"><Clock3 size={14}/>{post.status === "Closing soon" ? "Closing soon" : "Recently opened"}</span>
          <span className="ml-auto text-[10px]">Source: {post.sourceName}</span>
        </div>
      )}
    </article>
  );
}
