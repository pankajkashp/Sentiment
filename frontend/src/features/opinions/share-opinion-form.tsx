"use client";

import React, { useState } from "react";
import {
  MessageSquarePlus,
  X,
  Send,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calendar,
  Lock
} from "lucide-react";

interface ShareOpinionFormProps {
  policySlug: string;
  policyTitle: string;
  policyId?: string;
  commentingDeadline?: string;
  isOpenDefault?: boolean;
  onSubmissionSuccess?: (comment: { id: string; text: string; stakeholder: string }) => void;
}

export function ShareOpinionForm({
  policySlug,
  policyTitle,
  policyId,
  commentingDeadline,
  isOpenDefault = false,
  onSubmissionSuccess
}: ShareOpinionFormProps) {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [stakeholder, setStakeholder] = useState("Citizen / Community Member");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    details?: string;
  }>({ status: "idle", message: "" });

  const deadlineDate = commentingDeadline ? new Date(commentingDeadline) : null;
  const isDeadlinePassed = deadlineDate ? new Date() > deadlineDate : false;
  const formattedDeadline = deadlineDate
    ? deadlineDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short"
      })
    : "Not specified";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDeadlinePassed) {
      setSubmissionResult({
        status: "error",
        message: "Commenting deadline has closed.",
        details: `Submissions closed on ${formattedDeadline}. Further comments cannot be recorded.`
      });
      return;
    }

    if (commentText.trim().length < 10) {
      setSubmissionResult({
        status: "error",
        message: "Please write at least 10 characters to express a clear perspective."
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult({ status: "idle", message: "" });

    try {
      const res = await fetch(`/api/policies/${policySlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId: policyId || policySlug,
          commentText: commentText.trim(),
          stakeholder
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmissionResult({
          status: "success",
          message: "Your comment was recorded successfully in persistent consultation storage."
        });
        const submittedText = commentText.trim();
        setCommentText("");
        if (onSubmissionSuccess) {
          onSubmissionSuccess({
            id: data.commentId || `c-${Date.now()}`,
            text: submittedText,
            stakeholder
          });
        }
      } else {
        setSubmissionResult({
          status: "error",
          message: data.message || "Failed to submit comment.",
          details: data.details || "The server could not record the submission."
        });
      }
    } catch {
      setSubmissionResult({
        status: "error",
        message: "Network request could not connect to the consultation feedback API.",
        details: "Ensure the backend application server is running and accessible."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {!isOpen ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#e5e7eb] bg-white shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#143454] uppercase tracking-wider block">
                Public Consultation Submission
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                  isDeadlinePassed
                    ? "bg-[#fee2e2] text-[#991b1b]"
                    : "bg-[#e6f4ea] text-[#16834A]"
                }`}
              >
                {isDeadlinePassed ? (
                  <>
                    <Lock size={10} /> Commenting Closed
                  </>
                ) : (
                  <>
                    <Calendar size={10} /> Open for Submissions
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-[#555555]">
              {isDeadlinePassed
                ? `The public consultation closed on ${formattedDeadline}. Scheduled NLP analysis runs automatically.`
                : `Submit your normal text perspective before ${formattedDeadline}. Stance and demand detection are analyzed automatically after the deadline.`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0 ${
              isDeadlinePassed
                ? "bg-[#475569] text-white hover:bg-[#334155]"
                : "bg-[#E87518] text-white hover:bg-[#c25e0e]"
            }`}
          >
            {isDeadlinePassed ? <Lock size={14} /> : <MessageSquarePlus size={14} />}
            <span>{isDeadlinePassed ? "View Consultation Status" : "Share Your Opinion"}</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#143454]/30 bg-white p-5 shadow-xs space-y-4 animate-fadeIn">
          {/* Form Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#f1f3f5]">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <div className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#143454] bg-[#e8eef5]">
                  <Sparkles size={11} className="text-[#E87518]" />
                  Public Consultation Input
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                    isDeadlinePassed
                      ? "bg-[#fee2e2] text-[#991b1b]"
                      : "bg-[#e6f4ea] text-[#16834A]"
                  }`}
                >
                  {isDeadlinePassed ? (
                    <>
                      <Lock size={10} /> Closed on {formattedDeadline}
                    </>
                  ) : (
                    <>
                      <Calendar size={10} /> Deadline: {formattedDeadline}
                    </>
                  )}
                </span>
              </div>
              <h3 className="font-display text-[17px] font-bold text-[#171717]">
                Submit Feedback on &ldquo;{policyTitle}&rdquo;
              </h3>
              <span className="text-[11px] text-[#666666] block">
                Target Policy ID: <code className="font-mono text-[#143454] bg-[#f8fafc] px-1 py-0.5 rounded">{policyId || policySlug}</code>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-[#9ca3af] hover:text-[#171717] rounded-md hover:bg-[#f3f4f6]"
              aria-label="Close form"
            >
              <X size={16} />
            </button>
          </div>

          {/* If deadline passed: banner */}
          {isDeadlinePassed ? (
            <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-xs text-[#991b1b] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <Lock size={16} />
                <span>Commenting Window Closed</span>
              </div>
              <p className="text-[12px] text-[#7f1d1d] leading-relaxed">
                The official public commenting period for this policy closed on <strong>{formattedDeadline}</strong>.
                New submissions are no longer accepted. All verified comments recorded prior to the deadline
                are processed through the PolicyLens NLP pipeline once the scheduled analysis job runs.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Stakeholder Category */}
              <div className="space-y-1.5">
                <label htmlFor="stakeholder-select" className="block text-xs font-semibold text-[#171717]">
                  Your Stakeholder / Community Perspective
                </label>
                <div className="relative">
                  <select
                    id="stakeholder-select"
                    value={stakeholder}
                    onChange={(e) => setStakeholder(e.target.value)}
                    disabled={isDeadlinePassed || isSubmitting}
                    className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-2 text-xs text-[#171717] outline-none focus:border-[#143454] cursor-pointer disabled:opacity-50"
                  >
                    <option>Citizen / Community Member</option>
                    <option>Small Business / MSME Representative</option>
                    <option>Farmer / Agricultural Producer</option>
                    <option>Academic / Policy Researcher</option>
                    <option>Public Sector / Healthcare Worker</option>
                    <option>Non-Profit / Civil Society Organization</option>
                  </select>
                </div>
              </div>

              {/* Comment Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="comment-text" className="font-semibold text-[#171717]">
                    Your Comment / Proposed Improvement
                  </label>
                  <span className="text-[11px] text-[#666666]">
                    {commentText.length} / 2,000 characters (min. 10)
                  </span>
                </div>
                <textarea
                  id="comment-text"
                  rows={4}
                  maxLength={2000}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isDeadlinePassed || isSubmitting}
                  placeholder="Describe your specific perspective, operational concern, or recommended improvement for this policy. Note: AI stance classification (Support, Oppose, Neutral) is executed automatically during the scheduled analysis after the deadline closes."
                  className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-xs text-[#171717] outline-none focus:border-[#E87518] focus:bg-white transition-colors disabled:opacity-50"
                  required
                />
              </div>

              {/* Status / Alert Messages */}
              {submissionResult.status === "error" && (
                <div className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] p-3 text-xs text-[#991b1b] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle size={14} className="shrink-0 text-[#dc2626]" />
                    <span>{submissionResult.message}</span>
                  </div>
                  {submissionResult.details && (
                    <p className="text-[11px] text-[#7f1d1d] pl-5 leading-relaxed">
                      {submissionResult.details}
                    </p>
                  )}
                </div>
              )}

              {submissionResult.status === "success" && (
                <div className="rounded-lg border border-[#86efac] bg-[#f0fdf4] p-3 text-xs text-[#166534] flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#16a34a] shrink-0" />
                  <span>{submissionResult.message}</span>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#f1f3f5]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#666666] hover:bg-[#f3f4f6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || commentText.trim().length < 10 || isDeadlinePassed}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#143454] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0e2a47] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Submit Opinion</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
