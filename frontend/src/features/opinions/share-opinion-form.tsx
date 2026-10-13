"use client";

import React, { useState, useSyncExternalStore } from "react";
import { Send, AlertTriangle, Lock, MessageSquare, HelpCircle } from "lucide-react";

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
  const [submissionResult, setSubmissionResult] = useState<{
    status: "idle" | "local" | "error";
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

  const handleSubmit = (e: React.FormEvent) => {
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

    // Frontend-only preview: no API, database, or Government endpoint is called.
    const id = `session-${(policyId || policySlug).replace(/[^a-zA-Z0-9-]/g, "-")}-${Date.now().toString(36)}`;
    onSubmissionSuccess?.({ id, text: trimmed, stakeholder });
    setSubmissionResult({
      status: "local",
      message: "Preview only: this comment is shown for this page session. It was not sent to the Ministry or saved to a database."
    });
    setCommentText("");
  };

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#f1f3f5]">
        <div>
          <h2 className="font-display text-[19px] sm:text-[21px] font-bold text-[#171717] flex items-center gap-2">
            <MessageSquare size={19} className="text-[#143454]" />
            <span>Share Your Opinion</span>
          </h2>
          <p className="text-[13px] sm:text-[14px] text-[#4b5563] mt-0.5">
            Comment on &ldquo;{policyTitle}&rdquo;. The four-day PolicyLens window is calculated from its configured opening timestamp and is not a government deadline.
          </p>
        </div>
        {formattedDeadline && (
          <div className="flex flex-col sm:items-end gap-0.5 shrink-0">
            <span className="text-[12px] text-[#143454] bg-[#f0f4f8] px-2.5 py-1 rounded-md border border-[#d6e0ea] font-semibold">
              Comments close {formattedDeadline}
            </span>
            <span className="text-[11px] text-[#64748b]">PolicyLens portal window</span>
          </div>
        )}
        {isTimestampMissing && (
          <span className="text-[12px] text-[#6b7280] bg-[#f8fafc] px-2.5 py-1 rounded-md border border-[#e5e7eb] font-medium shrink-0 flex items-center gap-1">
            <HelpCircle size={13} /> Opening time not configured
          </span>
        )}
      </div>

      <p className="text-[12px] leading-relaxed text-[#666666]">
        PolicyLens is an independent frontend preview. Comments are not official Government feedback, are not sent to MHA, and are not saved.
      </p>

      {isDeadlinePassed && (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3.5 text-[13px] text-[#4b5563] flex items-center gap-2">
          <Lock size={15} className="text-[#6b7280]" />
          <span className="font-medium">The PolicyLens four-day commenting window has closed.</span>
        </div>
      )}

      {isTimestampMissing && (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3.5 text-[13px] text-[#4b5563] flex items-center gap-2">
          <HelpCircle size={15} className="text-[#6b7280]" />
          <span>Commenting is disabled until an opening timestamp is configured for this policy.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="stakeholder-select" className="block text-[13px] sm:text-[14px] font-semibold text-[#171717]">
            Stakeholder / Community Perspective (optional context)
          </label>
          <select
            id="stakeholder-select"
            value={stakeholder}
            onChange={(e) => setStakeholder(e.target.value)}
            disabled={isFormDisabled}
            className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-2.5 text-[13px] text-[#171717] outline-none focus:border-[#143454] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex items-center justify-between text-[13px]">
            <label htmlFor="comment-text" className="font-semibold text-[#171717]">Your Comment</label>
            <span className="text-[12px] text-[#6b7280]">{commentText.length} / 2,000 characters (min. 10)</span>
          </div>
          <textarea
            id="comment-text"
            rows={4}
            maxLength={2000}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isFormDisabled}
            placeholder={isFormDisabled ? "Commenting is closed for this policy." : "Write your opinion, concern, or suggested improvement…"}
            className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-[13px] sm:text-[14px] text-[#171717] outline-none focus:border-[#E87518] focus:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
            required={!isFormDisabled}
          />
        </div>

        {submissionResult.status !== "idle" && (
          <div className={`rounded-lg border p-3.5 text-[13px] flex items-start gap-2 ${
            submissionResult.status === "local"
              ? "border-[#e5e7eb] bg-[#f8fafc] text-[#475569]"
              : "border-[#fca5a5] bg-[#fef2f2] text-[#991b1b]"
          }`}>
            {submissionResult.status === "local" ? <MessageSquare size={15} /> : <AlertTriangle size={15} />}
            <span>{submissionResult.message}</span>
          </div>
        )}

        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            disabled={isFormDisabled || commentText.trim().length < 10}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#143454] px-4 py-2.5 text-[13px] font-bold text-white shadow-xs hover:bg-[#0e2a47] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Send size={14} /><span>Add Preview Comment</span>
          </button>
        </div>
      </form>
    </section>
  );
}
