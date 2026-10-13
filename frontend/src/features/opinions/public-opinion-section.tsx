"use client";

import React, { useState, useEffect } from "react";
import { ShareOpinionForm } from "./share-opinion-form";
import { TopOpinionsSection } from "./top-opinions-section";
import { AllCommentsList } from "./all-comments-list";
import { analyzedConsultationComments } from "./comments-data";
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
  commentingDeadline,
  initialConsultationStatus
}: PublicOpinionSectionProps) {
  // Determine starting consultation & analysis status
  const determineInitialStatus = (): ConsultationStatus => {
    if (initialConsultationStatus) return initialConsultationStatus;
    if (policySlug === "digital-public-infrastructure-india-stack") return "closed_analysis_completed";
    if (policySlug === "test-consultation-lifecycle") return "closed_analysis_completed";
    return "open";
  };

  const [status] = useState<ConsultationStatus>(determineInitialStatus);
  const [allComments, setAllComments] = useState<CommentItem[]>(() => {
    const s = determineInitialStatus();
    return s === "closed_analysis_completed" ? analyzedConsultationComments : [];
  });
  const [topComments, setTopComments] = useState<CommentItem[]>(() => {
    const s = determineInitialStatus();
    return s === "closed_analysis_completed" ? analyzedConsultationComments.slice(0, 10) : [];
  });

  // Load real analysis outputs from persistent storage/API
  useEffect(() => {
    async function loadAnalysis() {
      try {
        const res = await fetch(`/api/policies/${policySlug}/analysis`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const d = json.data;
            if (d.all_comments && d.all_comments.length > 0) {
              setAllComments(d.all_comments);
              setTopComments(d.top_comments || d.all_comments.slice(0, 10));
            }
          }
        }
      } catch {
        // Fallback to static comments data
      }
    }

    if (status === "closed_analysis_completed") {
      loadAnalysis();
    }
  }, [policySlug, status]);

  // Handle newly submitted comment
  const handleNewComment = (newSub: { id: string; text: string; stakeholder: string }) => {
    const newCommentItem: CommentItem = {
      id: newSub.id,
      originalText: newSub.text,
      stance: "NEUTRAL",
      policyTopic: "CITIZEN_SUBMISSION",
      mainArgument: newSub.text.slice(0, 120),
      suggestedAction: "Pending post-deadline NLP extraction",
      evidenceReasoning: "Raw citizen submission recorded before consultation deadline.",
      whyItMatters: "Direct public input",
      demandStatus: "UNCLEAR_OR_INSUFFICIENT",
      attributionTier: "NONE_UNSTATED",
      stakeholder: newSub.stakeholder,
      sourceDocument: "Public Consultation Record",
      sourceUrl: "https://example.gov.in",
      timestamp: "Just now",
      rankingScore: 0.5,
      rank: allComments.length + 1,
      isTopInformative: false
    };

    setAllComments((prev) => [newCommentItem, ...prev]);
  };

  const isAnalysisCompleted = status === "closed_analysis_completed";

  return (
    <section className="mt-8 space-y-6">
      {/* 1. Share Your Opinion Form (Disabled after 4-day deadline) */}
      <ShareOpinionForm
        policySlug={policySlug}
        policyTitle={policyTitle}
        policyId={policyId}
        openedAt={openedAt}
        commentingDeadline={commentingDeadline}
        onSubmissionSuccess={handleNewComment}
      />

      {/* 2. Analyzed Public Opinions (Displayed ONLY after post-deadline analysis completes) */}
      {isAnalysisCompleted && (
        <TopOpinionsSection comments={topComments} />
      )}

      {/* 3. Collapsible All Comments List */}
      <AllCommentsList
        comments={allComments}
        isAnalysisReady={isAnalysisCompleted}
      />
    </section>
  );
}
