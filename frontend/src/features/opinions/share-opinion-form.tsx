"use client";

import React, { useState } from "react";
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Lock,
  MessageSquare
} from "lucide-react";

interface ShareOpinionFormProps {
  policySlug: string;
  policyTitle: string;
  policyId?: string;
  commentingDeadline?: string;
  onSubmissionSuccess?: (comment: { id: string; text: string; stakeholder: string }) => void;
}

export function ShareOpinionForm({
  policySlug,
  policyTitle,
  policyId,
  commentingDeadline,
  onSubmissionSuccess
}: ShareOpinionFormProps) {
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
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDeadlinePassed) {
      setSubmissionResult({
        status: "error",
        message: "Commenting deadline has closed.",
        details: formattedDeadline
          ? `Submissions closed on ${formattedDeadline}. Further comments cannot be accepted.`
          : "Submissions for this policy are no longer accepted."
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
          message: "Your opinion was successfully submitted."
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
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f1f3f5]">
        <div>
          <h2 className="font-display text-[18px] sm:text-[20px] font-bold text-[#171717] flex items-center gap-2">
            <MessageSquare size={18} className="text-[#143454]" />
            <span>Share Your Opinion</span>
          </h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Submit your feedback on &ldquo;{policyTitle}&rdquo;. Comments are evaluated by the PolicyLens analysis pipeline.
          </p>
        </div>

        {formattedDeadline && (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold ${
                isDeadlinePassed
                  ? "bg-[#fee2e2] text-[#991b1b]"
                  : "bg-[#e6f4ea] text-[#16834A]"
              }`}
            >
              {isDeadlinePassed ? (
                <>
                  <Lock size={12} /> Closed on {formattedDeadline}
                </>
              ) : (
                <>
                  <Calendar size={12} /> Deadline: {formattedDeadline}
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {isDeadlinePassed ? (
        <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-xs text-[#991b1b] space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <Lock size={15} />
            <span>Commenting Closed</span>
          </div>
          <p className="text-[12px] text-[#7f1d1d] leading-relaxed">
            The commenting window for this policy closed on <strong>{formattedDeadline}</strong>.
            New submissions cannot be accepted. The PolicyLens background analysis runs on submitted comments.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stakeholder Category */}
          <div className="space-y-1.5">
            <label htmlFor="stakeholder-select" className="block text-xs font-semibold text-[#171717]">
              Stakeholder / Community Perspective
            </label>
            <select
              id="stakeholder-select"
              value={stakeholder}
              onChange={(e) => setStakeholder(e.target.value)}
              disabled={isDeadlinePassed || isSubmitting}
              className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-2.5 text-xs text-[#171717] outline-none focus:border-[#143454] cursor-pointer disabled:opacity-50"
            >
              <option>Citizen / Community Member</option>
              <option>Small Business / MSME Representative</option>
              <option>Farmer / Agricultural Producer</option>
              <option>Academic / Policy Researcher</option>
              <option>Public Sector / Healthcare Worker</option>
              <option>Non-Profit / Civil Society Organization</option>
            </select>
          </div>

          {/* Comment Text Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="comment-text" className="font-semibold text-[#171717]">
                Your Comment
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
              placeholder="Write your opinion, concern, or suggested improvement regarding this policy..."
              className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-xs text-[#171717] outline-none focus:border-[#E87518] focus:bg-white transition-colors disabled:opacity-50"
              required
            />
          </div>

          {/* Validation & Error Alerts */}
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

          {/* Success Alert */}
          {submissionResult.status === "success" && (
            <div className="rounded-lg border border-[#86efac] bg-[#f0fdf4] p-3 text-xs text-[#166534] flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#16a34a] shrink-0" />
              <span>{submissionResult.message}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || commentText.trim().length < 10 || isDeadlinePassed}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#143454] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0e2a47] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <span>Submitting Comment...</span>
              ) : (
                <>
                  <Send size={13} />
                  <span>Submit Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
