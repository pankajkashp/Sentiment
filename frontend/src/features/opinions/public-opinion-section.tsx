"use client";

import React, { useState } from "react";
import { ShareOpinionForm } from "./share-opinion-form";
import { TopOpinionsSection } from "./top-opinions-section";
import { AllCommentsList } from "./all-comments-list";
import type { ConsultationStatus } from "../feed/types";
import type { CommentItem } from "./types";

interface PublicOpinionSectionProps {
  policySlug: string;
  policyTitle: string;
  policyId?: string;
  openedAt?: string;
  commentingDeadline?: string;
  initialConsultationStatus?: ConsultationStatus;
}

export function PublicOpinionSection({
  policySlug,
  policyTitle,
  policyId,
  openedAt,
  commentingDeadline
}: PublicOpinionSectionProps) {
  // No sample comments or analysis are displayed for policies until a real API response
  // explicitly supplies them. This keeps the existing research benchmark isolated.
  const [sessionComments, setSessionComments] = useState<CommentItem[]>([]);
  const [analysisComments, setAnalysisComments] = useState<CommentItem[]>([]);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const handleNewComment = (newSub: { id: string; text: string; stakeholder: string }) => {
    // Session-only items are clearly labelled as temporary and are never assigned an AI stance.
    const newCommentItem: CommentItem = {
      id: newSub.id,
      originalText: newSub.text,
      stance: "UNCLEAR",
      policyTopic: "PENDING_ANALYSIS",
      mainArgument: "",
      suggestedAction: "",
      evidenceReasoning: "",
      whyItMatters: "",
      demandStatus: "UNCLEAR_OR_INSUFFICIENT",
      attributionTier: "NONE_UNSTATED",
      stakeholder: newSub.stakeholder,
      sourceDocument: "Temporary browser session",
      sourceUrl: "",
      timestamp: "Just now",
      rankingScore: 0,
      rank: sessionComments.length + 1,
      isTopInformative: false
    };

    setSessionComments((prev) => [newCommentItem, ...prev]);
  };

  const handleLoadAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisReady(false);
    try {
      const res = await fetch(`/api/policies/${encodeURIComponent(policySlug)}/analysis`);
      if (!res.ok) throw new Error("Analysis endpoint unavailable");
      const json = await res.json();
      const data = json?.data;
      if (!data || !Array.isArray(data.all_comments) || !Array.isArray(data.top_comments)) {
        throw new Error("No analysis result returned");
      }
      setAnalysisComments(data.all_comments);
      setAnalysisReady(true);
    } catch {
      setAnalysisComments([]);
      setAnalysisReady(false);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const comments = [...sessionComments, ...analysisComments];

  return (
    <section className="mt-8 space-y-6">
      <ShareOpinionForm
        policySlug={policySlug}
        policyTitle={policyTitle}
        policyId={policyId}
        openedAt={openedAt}
        commentingDeadline={commentingDeadline}
        onSubmissionSuccess={handleNewComment}
      />

      {analysisReady && analysisComments.length > 0 && (
        <TopOpinionsSection comments={analysisComments} />
      )}

      <AllCommentsList comments={comments} isAnalysisReady={analysisReady} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-xs text-[#666666]">
        <p>AI-highlighted opinions appear here only when actual analysis results are available.</p>
        <button
          type="button"
          onClick={handleLoadAnalysis}
          disabled={analysisLoading}
          className="rounded-md border border-[#d1d5db] px-3 py-1.5 font-semibold text-[#143454] hover:bg-[#f8fafc] disabled:opacity-50"
        >
          {analysisLoading ? "Checking results…" : "Check analysis results"}
        </button>
      </div>
    </section>
  );
}
