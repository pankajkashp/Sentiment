"use client";

import React from "react";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { PublicOpinionSummaryCard } from "./public-opinion-summary-card";
import { TopOpinionsSection } from "./top-opinions-section";
import { PolicyImprovementSuggestions } from "./policy-improvement-suggestions";
import { AllCommentsList } from "./all-comments-list";
import {
  consultationOpinionSummary,
  policyImprovementSuggestions,
  analyzedConsultationComments
} from "./comments-data";

interface PublicOpinionSectionProps {
  policySlug: string;
  policyTitle: string;
}

export function PublicOpinionSection({ policySlug, policyTitle }: PublicOpinionSectionProps) {
  // Real consultation dataset corresponds to the Digital Governance & Public Infrastructure consultation
  const hasComments = policySlug === "digital-public-infrastructure-india-stack";

  if (!hasComments) {
    return (
      <section className="mt-8 rounded-xl border border-[#e5e7eb] bg-white p-6 sm:p-8 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#143454]">
          <ShieldCheck size={16} className="text-[#16834A]" />
          <span>Public Opinion &amp; Comments Record</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-[#171717]">
              No Consultation Comments on Record for This Policy
            </h3>
            <p className="text-xs text-[#666666] leading-relaxed max-w-xl">
              Public submissions for &quot;{policyTitle}&quot; have not been ingested into the
              analysis repository. In accordance with platform integrity rules, synthetic or
              fabricated public comments are strictly excluded.
            </p>
          </div>
          <a
            href="https://www.mygov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#143454] hover:text-[#E87518] shrink-0"
          >
            <span>Explore Active Consultations on MyGov</span>
            <ArrowRight size={13} />
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 space-y-6">
      {/* Main Section Header */}
      <div className="border-b-2 border-[#143454] pb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E87518]">
            Evidence-Backed Civic Analysis
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#143454]">
            Public Opinion &amp; Comments Analysis
          </h2>
        </div>
        <span className="text-xs text-[#666666]">
          Based on 50 verified human-annotated consultation submissions
        </span>
      </div>

      {/* A. Compact Public Opinion Summary Card */}
      <PublicOpinionSummaryCard summary={consultationOpinionSummary} />

      {/* B. Top 10 Most Informative Comments (with Top 1 toggle) */}
      <TopOpinionsSection comments={analyzedConsultationComments} />

      {/* C. What Could Be Improved? Subsection */}
      <PolicyImprovementSuggestions suggestions={policyImprovementSuggestions} />

      {/* D. All Comments — YouTube-Style Expandable List */}
      <AllCommentsList comments={analyzedConsultationComments} />
    </section>
  );
}
