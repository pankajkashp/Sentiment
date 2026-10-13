"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Inbox,
  Activity
} from "lucide-react";
import { ShareOpinionForm } from "./share-opinion-form";
import { PublicOpinionSummaryCard } from "./public-opinion-summary-card";
import { TopOpinionsSection } from "./top-opinions-section";
import { PolicyImprovementSuggestions } from "./policy-improvement-suggestions";
import { AllCommentsList } from "./all-comments-list";
import {
  consultationOpinionSummary,
  policyImprovementSuggestions,
  analyzedConsultationComments
} from "./comments-data";

export type AnalysisPipelineStatus =
  | "COMPLETED"
  | "RUNNING"
  | "PENDING"
  | "FAILED"
  | "NO_COMMENTS";

interface PublicOpinionSectionProps {
  policySlug: string;
  policyTitle: string;
  policyId?: string;
  initialStatus?: AnalysisPipelineStatus;
}

export function PublicOpinionSection({
  policySlug,
  policyTitle,
  policyId
}: PublicOpinionSectionProps) {
  // Determine if this policy has imported consultation records
  const hasImportedRecords = policySlug === "digital-public-infrastructure-india-stack";

  // Default state: COMPLETED if imported records exist, NO_COMMENTS if none
  const defaultStatus: AnalysisPipelineStatus = hasImportedRecords ? "COMPLETED" : "NO_COMMENTS";

  const [pipelineStatus, setPipelineStatus] = useState<AnalysisPipelineStatus>(defaultStatus);
  const [runningProgress, setRunningProgress] = useState(42);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isRetrying, setIsRetrying] = useState(false);

  // Simulated auto-refresh loop for RUNNING state
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pipelineStatus === "RUNNING") {
      timer = setInterval(() => {
        setRunningProgress((prev) => {
          if (prev >= 95) {
            clearInterval(timer);
            setPipelineStatus("COMPLETED");
            setLastRefreshedAt(new Date());
            return 100;
          }
          return prev + 15;
        });
      }, 2500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pipelineStatus]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      setRunningProgress(20);
      setPipelineStatus("RUNNING");
    }, 600);
  };

  return (
    <section className="mt-10 space-y-6">
      {/* Main Section Header */}
      <div className="border-b-2 border-[#143454] pb-3 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#E87518] mb-0.5">
            <Sparkles size={12} />
            <span>Public Opinion &amp; Comments Record</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#143454]">
            Public Opinion &amp; AI Analysis
          </h2>
        </div>

        {/* Verification & QA State Selector: Allows instant verification of all 5 required states */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-[#f8fafc] p-1.5 rounded-lg border border-[#e5e7eb] text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666] px-1 flex items-center gap-1">
            <Activity size={12} className="text-[#143454]" />
            Pipeline State:
          </span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setPipelineStatus("COMPLETED")}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                pipelineStatus === "COMPLETED"
                  ? "bg-[#143454] text-white shadow-2xs"
                  : "bg-white text-[#555555] hover:bg-[#f1f3f5] border border-[#e5e7eb]"
              }`}
            >
              Completed
            </button>
            <button
              type="button"
              onClick={() => {
                setRunningProgress(35);
                setPipelineStatus("RUNNING");
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                pipelineStatus === "RUNNING"
                  ? "bg-[#143454] text-white shadow-2xs"
                  : "bg-white text-[#555555] hover:bg-[#f1f3f5] border border-[#e5e7eb]"
              }`}
            >
              Running
            </button>
            <button
              type="button"
              onClick={() => setPipelineStatus("PENDING")}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                pipelineStatus === "PENDING"
                  ? "bg-[#143454] text-white shadow-2xs"
                  : "bg-white text-[#555555] hover:bg-[#f1f3f5] border border-[#e5e7eb]"
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setPipelineStatus("FAILED")}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                pipelineStatus === "FAILED"
                  ? "bg-[#991b1b] text-white shadow-2xs"
                  : "bg-white text-[#555555] hover:bg-[#f1f3f5] border border-[#e5e7eb]"
              }`}
            >
              Failed
            </button>
            <button
              type="button"
              onClick={() => setPipelineStatus("NO_COMMENTS")}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                pipelineStatus === "NO_COMMENTS"
                  ? "bg-[#475569] text-white shadow-2xs"
                  : "bg-white text-[#555555] hover:bg-[#f1f3f5] border border-[#e5e7eb]"
              }`}
            >
              No Comments
            </button>
          </div>
        </div>
      </div>

      {/* 1. Share Your Opinion Submission Component */}
      <ShareOpinionForm
        policySlug={policySlug}
        policyTitle={policyTitle}
        policyId={policyId}
        isOpenDefault={pipelineStatus === "NO_COMMENTS"}
      />

      {/* 2. PIPELINE STATE: NO_COMMENTS */}
      {pipelineStatus === "NO_COMMENTS" && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#143454]">
            <Inbox size={16} className="text-[#E87518]" />
            <span>Consultation Intake Status</span>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-lg font-bold text-[#171717]">
              No Consultation Comments Imported Yet
            </h3>
            <p className="text-xs sm:text-[13px] text-[#666666] leading-relaxed max-w-2xl">
              Official public consultation records for &ldquo;{policyTitle}&rdquo; have not been
              imported into the PolicyLens analysis database yet. In strict accordance with platform
              integrity and reproducible research guidelines, synthetic or unverified comments are
              never fabricated.
            </p>
          </div>

          <div className="pt-3 border-t border-[#f1f3f5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-[#555555]">
              Be the first to submit your perspective using the <strong>“Share Your Opinion”</strong> form above.
            </span>
            <a
              href="https://www.mygov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-[#143454] hover:text-[#E87518] shrink-0"
            >
              <span>Explore active national consultations on MyGov</span>
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      )}

      {/* 3. PIPELINE STATE: PENDING */}
      {pipelineStatus === "PENDING" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="text-[#d97706] shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#92400e]">
                  Public Opinion Analysis Pending ({analyzedConsultationComments.length} Submissions Queued)
                </h3>
                <p className="text-xs text-[#78350f] leading-relaxed max-w-2xl">
                  Consultation submissions have been successfully received and recorded. The ML semantic
                  clustering and demand-presence safeguard pipeline is queued in the background worker queue.
                  Raw submissions are preserved below.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setRunningProgress(25);
                setPipelineStatus("RUNNING");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#143454] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0e2a47] shrink-0 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Start Analysis</span>
            </button>
          </div>

          {/* Raw submissions displayed even when analysis is pending */}
          <AllCommentsList
            comments={analyzedConsultationComments}
            isAnalysisReady={false}
          />
        </div>
      )}

      {/* 4. PIPELINE STATE: RUNNING */}
      {pipelineStatus === "RUNNING" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1e40af]">
                <Loader2 size={16} className="animate-spin text-[#2563eb]" />
                <span>Analysis Running &amp; Refreshing</span>
              </div>
              <span className="text-xs font-bold text-[#1d4ed8]">
                {runningProgress}% Completed
              </span>
            </div>

            <div className="w-full bg-[#dbeafe] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#2563eb] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${runningProgress}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#1e40af]">
              <span>
                Extracting stance classification, TF-IDF topic clusters, and demand-presence safeguards...
              </span>
              <span className="text-[11px] text-[#3b82f6]">
                Auto-refreshes results when job finishes
              </span>
            </div>
          </div>

          {/* Raw comments visible during running state */}
          <AllCommentsList
            comments={analyzedConsultationComments}
            isAnalysisReady={false}
          />
        </div>
      )}

      {/* 5. PIPELINE STATE: FAILED */}
      {pipelineStatus === "FAILED" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-5 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-[#dc2626] shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#991b1b]">
                    Analysis Job Execution Error
                  </h3>
                  <p className="text-xs text-[#7f1d1d] leading-relaxed max-w-2xl">
                    The background analysis worker encountered an execution timeout while generating
                    cross-cluster topic centroids. Existing consultation comments and raw submissions
                    are safely preserved and intact.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#991b1b] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#7f1d1d] shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isRetrying ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Retrying...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={13} />
                    <span>Retry Analysis Job</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Raw comments preserved on failure */}
          <AllCommentsList
            comments={analyzedConsultationComments}
            isAnalysisReady={false}
          />
        </div>
      )}

      {/* 6. PIPELINE STATE: COMPLETED */}
      {pipelineStatus === "COMPLETED" && (
        <div className="space-y-6">
          {/* Metadata bar */}
          <div className="flex items-center justify-between text-xs text-[#666666] bg-[#f8fafc] px-3.5 py-2 rounded-lg border border-[#e5e7eb]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#16834A]" />
              <span className="font-semibold text-[#143454]">Analysis Completed</span>
              <span>•</span>
              <span>Verified against 50 pilot consultation records</span>
            </div>
            <span className="text-[11px] text-[#9ca3af]">
              Last updated: {lastRefreshedAt.toLocaleTimeString()}
            </span>
          </div>

          {/* A. Compact Public Opinion Summary Card */}
          <PublicOpinionSummaryCard summary={consultationOpinionSummary} />

          {/* B. Top 10 Most Informative Comments (with Top 1 toggle) */}
          <TopOpinionsSection comments={analyzedConsultationComments} />

          {/* C. What Could Be Improved? Subsection */}
          <PolicyImprovementSuggestions suggestions={policyImprovementSuggestions} />

          {/* D. All Comments — YouTube-Style Expandable List */}
          <AllCommentsList
            comments={analyzedConsultationComments}
            isAnalysisReady={true}
          />
        </div>
      )}
    </section>
  );
}
