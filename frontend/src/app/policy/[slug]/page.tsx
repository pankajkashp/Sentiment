import Link from "next/link";
import { ArrowLeft, ExternalLink, CheckCircle2, Building, Calendar, Tag, ShieldCheck, FileText } from "lucide-react";
import { officialPolicies } from "@/features/feed/demo-data";

export function generateStaticParams() {
  return officialPolicies.map((post) => ({ slug: post.slug }));
}

export default async function PolicyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = officialPolicies.find((item) => item.slug === slug);

  if (!post) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold text-[#171717]">Programme Not Found</h1>
        <p className="mt-2 text-sm text-[#666666]">The requested government policy or scheme could not be located.</p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#143454] px-4 py-2 text-sm font-semibold text-white shadow-xs"
        >
          <ArrowLeft size={16} /> Return to Public Policy Portal
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Breadcrumb Navigation */}
      <div className="mb-5 flex items-center gap-2 text-xs text-[#666666]">
        <Link href="/" className="hover:text-[#E87518] flex items-center gap-1 font-medium">
          <ArrowLeft size={13} /> Public Policy Portal
        </Link>
        <span>/</span>
        <span className="text-[#143454] font-semibold">{post.category}</span>
        <span>/</span>
        <span className="truncate max-w-xs text-[#9ca3af]">{post.title}</span>
      </div>

      <article className="rounded-xl border border-[#e5e7eb] bg-white shadow-xs overflow-hidden">
        {/* Top Official Banner */}
        <div className="border-b border-[#e5e7eb] bg-[#f8fafc] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold text-[#143454] bg-[#e8eef5] uppercase tracking-wider">
              <Tag size={11} className="text-[#E87518]" />
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#16834A] text-xs">
              <CheckCircle2 size={13} />
              {post.statusLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#666666]">
            <Calendar size={13} className="text-[#9ca3af]" />
            <span>{post.publishedDate}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Ministry / Authority Header */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#143454]">
            <Building size={16} className="text-[#E87518]" />
            <span>{post.ministry}</span>
            {post.department && (
              <>
                <span className="text-[#d1d5db]">•</span>
                <span className="text-[#666666]">{post.department}</span>
              </>
            )}
          </div>

          {/* Policy Title */}
          <h1 className="font-display text-[24px] sm:text-[32px] font-extrabold text-[#171717] leading-tight">
            {post.title}
          </h1>

          {/* Factual Summary */}
          <div className="rounded-lg border-l-4 border-[#143454] bg-[#f8fafc] p-4 text-[14px] leading-relaxed text-[#334155]">
            <strong className="block text-[11px] uppercase tracking-wider text-[#143454] mb-1">
              Official Executive Summary
            </strong>
            {post.summary}
          </div>

          {/* Key Programme Highlights */}
          {post.keyHighlights && post.keyHighlights.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-[16px] font-bold text-[#171717] flex items-center gap-2">
                <FileText size={16} className="text-[#143454]" />
                Key Programme Provisions &amp; Implementation Details
              </h2>
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
                <ul className="space-y-2.5 text-[13px] text-[#444444]">
                  {post.keyHighlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2.5">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#e8eef5] text-[10px] font-bold text-[#143454]">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Verified Source Action Box */}
          <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1d4ed8] flex items-center gap-1.5">
                <ShieldCheck size={14} />
                Verified Primary Source Publication
              </span>
              <p className="text-xs text-[#3b82f6] leading-relaxed">
                Published by {post.sourceName}. View complete gazette notifications, press releases, and circulars.
              </p>
            </div>
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#143454] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0e2a47] transition-colors shrink-0"
            >
              <span>View Official Source</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Information Integrity Disclaimer */}
          <div className="pt-4 border-t border-[#f1f3f5] text-[11px] text-[#666666] leading-relaxed">
            <p>
              <strong>Notice:</strong> This entry is an official public information record curated from Government of India public releases. In compliance with public information standards, this page does not host informal polls, fabricated popularity metrics, or unofficial commentary.
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
