"use client";

import React, { useState, useSyncExternalStore } from "react";
import { Send, AlertTriangle, CheckCircle2, Lock, MessageSquare, HelpCircle } from "lucide-react";

function subscribeToClock(callback: () => void) {
  const timer = setInterval(callback, 30000);
  return () => clearInterval(timer);
}

function getClientNow() {
  return Date.now();
}

function getServerNow() {
  return 0;
}

interface ShareOpinionFormProps {
  policySlug: string;
  policyTitle: string;
  policyId?: string;
  openedAt?: string;
  commentingDeadline?: string;
  onSubmissionSuccess?: (comment: { id: string; text: string; stakeholder: string }) => void;
}

export function ShareOpinionForm({
  policySlug,
  policyTitle,
  policyId,
  openedAt,
  commentingDeadline,
  onSubmissionSuccess
}: ShareOpinionFormProps) {
  const [stakeholder, setStakeholder] = useState("Citizen / Community Member");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    status: "idle" | "success" | "error" | "local";
    message: string;
  }>({ status: "idle", message: "" });

  const currentClock = useSyncExternalStore(subscribeToClock, getClientNow, getServerNow);

  let deadlineDate: Date | null = null;
  let isTimestampMissing = false;
  if (openedAt) {
    const opened = new Date(openedAt);
    if (!Number.isNaN(opened.getTime())) {
      deadlineDate = new Date(opened.getTime() + 4 * 24 * 60 * 60 * 1000);
    } else {
      isTimestampMissing = true;
    }
  } else if (commentingDeadline) {
    const parsed = new Date(commentingDeadline);
    if (!Number.isNaN(parsed.getTime())) deadlineDate = parsed;
    else isTimestampMissing = true;
  } else {
    isTimestampMissing = true;
  }

  const isDeadlinePassed = Boolean(deadlineDate && currentClock > 0 && currentClock >= deadlineDate.getTime());
  const isFormDisabled = isDeadlinePassed || isTimestampMissing;
  const formattedDeadline = deadlineDate
    ? deadlineDate.toLocaleString("en-IN", {
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
    const trimmed = commentText.trim();

    if (isTimestampMissing) {
      setSubmissionResult({ status: "error", message: "Commenting is unavailable because this policy has no configured opening timestamp." });
      return;
    }
    if (isDeadlinePassed) {
      setSubmissionResult({ status: "error", message: "This PolicyLens four-day commenting window has closed." });
      return;
    }
    if (trimmed.length < 10) {
      setSubmissionResult({ status: "error", message: "Please write at least 10 characters." });
      return;
    }

    // Frontend-only phase: never imply that the API or database accepted data.
    setIsSubmitting(true);
    setSubmissionResult({ status: "idle", message: "" });
    try {
      const res = await fetch(`/api/policies/${encodeURIComponent(policySlug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId: policyId || policySlug,
          commentText: trimmed,
          stakeholder
        })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        const submitted = trimmed;
        setSubmissionResult({ status: "success", message: "The server confirmed receipt of your comment." });
        setCommentText("");
        onSubmissionSuccess?.({ id: String(data.commentId || `server-${Date.now()}`), text: submitted, stakeholder });
      } else {
        setSubmissionResult({
          status: "error",
          message: "The comment was not confirmed by the server. It has not been shown as submitted; please try again when submissions are available."
        });
      }
    } catch {
      // Browser-only demo mode: keep entered text in the form, with no fabricated success state.
      setSubmissionResult({
        status: "local",
        message: "Frontend preview only — no backend is connected, so this comment has not been submitted or saved."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#f1f3f5]">
        <div>
          <h2 className="font-display text-[18px] sm:text-[20px] font-bold text-[#171717] flex items-center gap-2">
            <MessageSquare size={18} className="text-[#143454]" />
            <span>Share Your Opinion</span>
          </h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Comment on &ldquo;{policyTitle}&rdquo;. The four-day PolicyLens window is calculated from its configured opening timestamp and is not a government deadline.
          </p>
        </div>
        {formattedDeadline && (
          <div className="flex flex-col sm:items-end gap-0.5 shrink-0">
            <span className="text-[11px] text-[#143454] bg-[#f0f4f8] px-2.5 py-1 rounded-md border border-[#d6e0ea] font-semibold">
              Comments close {formattedDeadline}
            </span>
            <span className="text-[10px] text-[#718096]">PolicyLens portal window</span>
          </div>
        )}
        {isTimestampMissing && (
          <span className="text-[11px] text-[#888888] bg-[#f8fafc] px-2.5 py-1 rounded-md border border-[#e5e7eb] font-medium shrink-0 flex items-center gap-1">
            <HelpCircle size={12} /> Opening time not configured
          </span>
        )}
      </div>

      {isDeadlinePassed && (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-xs text-[#555555] flex items-center gap-2">
          <Lock size={14} className="text-[#666666]" />
          <span className="font-medium">The PolicyLens four-day commenting window has closed.</span>
        </div>
      )}

      {isTimestampMissing && (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-xs text-[#555555] flex items-center gap-2">
          <HelpCircle size={14} />
          <span>Commenting is disabled until an opening timestamp is configured for this policy.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="stakeholder-select" className="block text-xs font-semibold text-[#171717]">
            Stakeholder / Community Perspective (optional context)
          </label>
          <select
            id="stakeholder-select"
            value={stakeholder}
            onChange={(e) => setStakeholder(e.target.value)}
            disabled={isFormDisabled || isSubmitting}
            className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-2.5 text-xs text-[#171717] outline-none focus:border-[#143454] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option>Citizen / Community Member</option>
            <option>Small Business / MSME Representative</option>
            <option>Farmer / Agricultural Producer</option>
            <option>Academic / Policy Researcher</option>
            <option>Public Sector / Healthcare Worker</option>
            <option>Non-Profit / Civil Society Organization</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="comment-text" className="font-semibold text-[#171717]">Your Comment</label>
            <span className="text-[11px] text-[#666666]">{commentText.length} / 2,000 characters (min. 10)</span>
          </div>
          <textarea
            id="comment-text"
            rows={4}
            maxLength={2000}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isFormDisabled || isSubmitting}
            placeholder={isFormDisabled ? "Commenting is closed for this policy." : "Write your opinion, concern, or suggested improvement…"}
            className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-xs text-[#171717] outline-none focus:border-[#E87518] focus:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            required={!isFormDisabled}
          />
        </div>

        {submissionResult.status !== "idle" && (
          <div className={`rounded-lg border p-3 text-xs flex items-start gap-2 ${
            submissionResult.status === "success"
              ? "border-[#86efac] bg-[#f0fdf4] text-[#166534]"
              : submissionResult.status === "local"
                ? "border-[#e5e7eb] bg-[#f8fafc] text-[#475569]"
                : "border-[#fca5a5] bg-[#fef2f2] text-[#991b1b]"
          }`}>
            {submissionResult.status === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            <span>{submissionResult.message}</span>
          </div>
        )}

        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            disabled={isFormDisabled || isSubmitting || commentText.trim().length < 10}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#143454] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0e2a47] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isSubmitting ? "Submitting Comment…" : <><Send size={13} /><span>Submit Comment</span></>}
          </button>
        </div>
      </form>
    </section>
  );
}
