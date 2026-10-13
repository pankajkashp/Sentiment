"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
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
  commentingDeadline?: string;
  initialConsultationStatus?: ConsultationStatus;
}

export function PublicOpinionSection({
  policySlug,
  policyTitle,
  policyId,
  commentingDeadline,
  initialConsultationStatus
}: PublicOpinionSectionProps) {
  // Check whether commenting deadline has passed
  const deadlineDate = commentingDeadline ? new Date(commentingDeadline) : null;
  const isDeadlinePassed = deadlineDate ? new Date() > deadlineDate : false;

  // Determine starting consultation & analysis status
  const determineInitialStatus = (): ConsultationStatus => {
    if (initialConsultationStatus) return initialConsultationStatus;
    if (policySlug === "digital-public-infrastructure-india-stack") return "closed_analysis_completed";
    if (policySlug === "test-consultation-lifecycle") return "closed_analysis_completed";
    if (!isDeadlinePassed) return "open";
    return "closed_analysis_pending";
  };

  const [status, setStatus] = useState<ConsultationStatus>(determineInitialStatus);
  const [allComments, setAllComments] = useState<CommentItem[]>(analyzedConsultationComments);
  const [topComments, setTopComments] = useState<CommentItem[]>(analyzedConsultationComments.slice(0, 10));
  const [isRetrying, setIsRetrying] = useState(false);

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

  // Safe retry handler for failed analysis
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/policies/${policySlug}/trigger-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRetry: true })
      });
      const data = await res.json();
      if (res.ok && data.status === "COMPLETED") {
        setStatus("closed_analysis_completed");
      }
    } catch {
      // Keep existing data intact
    } finally {
      setIsRetrying(false);
    }
  };

  const isAnalysisCompleted = status === "closed_analysis_completed";

  return (
    <section className="mt-8 space-y-6">
      {/* 1. Share Your Opinion Form */}
      <ShareOpinionForm
        policySlug={policySlug}
        policyTitle={policyTitle}
        policyId={policyId}
        commentingDeadline={commentingDeadline}
        onSubmissionSuccess={handleNewComment}
      />

      {/* Analysis Running Notice (compact status without premature incomplete results) */}
      {status === "closed_analysis_running" && (
        <div className="rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-xs text-[#1e40af] flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-[#2563eb]" />
            <span className="font-semibold">Commenting closed — analysis in progress</span>
          </div>
          <span className="text-[11px] text-[#3b82f6]">
            Normal comments remain accessible below
          </span>
        </div>
      )}

      {/* Analysis Failed Notice (with safe retry) */}
      {status === "closed_analysis_failed" && (
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4 text-xs text-[#991b1b] flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#dc2626]" />
            <span>Analysis could not be completed</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-1 font-semibold text-[#991b1b] hover:text-[#7f1d1d] underline cursor-pointer disabled:opacity-50"
          >
            {isRetrying ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Retrying...</span>
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                <span>Retry</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 2. Highlighted Analyzed Comments — ONLY after completed post-deadline analysis */}
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
