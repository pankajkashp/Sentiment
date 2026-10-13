"use client";

import React, { useState } from "react";
import { MessageSquarePlus, X, Send, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import type { StanceType } from "./types";

interface ShareOpinionFormProps {
  policySlug: string;
  policyTitle: string;
  policyId?: string;
  isOpenDefault?: boolean;
}

export function ShareOpinionForm({
  policySlug,
  policyTitle,
  policyId,
  isOpenDefault = false
}: ShareOpinionFormProps) {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [stance, setStance] = useState<StanceType | "">("");
  const [stakeholder, setStakeholder] = useState("Citizen / Community Member");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    details?: string;
  }>({ status: "idle", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
          stance: stance || "NEUTRAL",
          stakeholder
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmissionResult({
          status: "success",
          message: "Your opinion was successfully received by the backend service."
        });
        setCommentText("");
        setStance("");
      } else {
        // Backend service is pending deployment or returned error
        setSubmissionResult({
          status: "error",
          message:
            data.message ||
            "Backend API service is not reachable on this server.",
          details:
            "Missing Integration: FastAPI endpoint (POST /api/v1/consultations/{slug}/feedback) and PostgreSQL persistence are in the proposed architecture phase (see docs/architecture/BACKEND_API_CONTRACTS.md). This comment has NOT been recorded to a live database or sent to the ML pipeline."
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
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#143454] uppercase tracking-wider block">
              Citizen Feedback &amp; Public Consultation
            </span>
            <p className="text-xs text-[#555555]">
              Share your perspective, operational concern, or suggested reform for policymakers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E87518] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#c25e0e] transition-colors cursor-pointer shrink-0"
          >
            <MessageSquarePlus size={15} />
            <span>Share Your Opinion</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#143454]/30 bg-white p-5 shadow-xs space-y-4 animate-fadeIn">
          {/* Form Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#f1f3f5]">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#143454] bg-[#e8eef5] mb-1">
                <Sparkles size={11} className="text-[#E87518]" />
                Public Consultation Submission
              </div>
              <h3 className="font-display text-[17px] font-bold text-[#171717]">
                Share Your Opinion on &ldquo;{policyTitle}&rdquo;
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Optional Stance Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#171717]">
                Your Stance (Optional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStance(stance === "SUPPORT" ? "" : "SUPPORT")}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    stance === "SUPPORT"
                      ? "border-[#16834A] bg-[#e6f4ea] text-[#16834A] ring-1 ring-[#16834A]"
                      : "border-[#e5e7eb] bg-[#f9fafb] text-[#555555] hover:bg-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#16834A]" />
                  Support
                </button>
                <button
                  type="button"
                  onClick={() => setStance(stance === "OPPOSE" ? "" : "OPPOSE")}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    stance === "OPPOSE"
                      ? "border-[#991b1b] bg-[#fee2e2] text-[#991b1b] ring-1 ring-[#991b1b]"
                      : "border-[#e5e7eb] bg-[#f9fafb] text-[#555555] hover:bg-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#991b1b]" />
                  Oppose
                </button>
                <button
                  type="button"
                  onClick={() => setStance(stance === "NEUTRAL" ? "" : "NEUTRAL")}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    stance === "NEUTRAL"
                      ? "border-[#475569] bg-[#f1f5f9] text-[#475569] ring-1 ring-[#475569]"
                      : "border-[#e5e7eb] bg-[#f9fafb] text-[#555555] hover:bg-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#475569]" />
                  Neutral
                </button>
              </div>
            </div>

            {/* Stakeholder Category */}
            <div className="space-y-1.5">
              <label htmlFor="stakeholder-select" className="block text-xs font-semibold text-[#171717]">
                Stakeholder / Community Perspective
              </label>
              <div className="relative">
                <select
                  id="stakeholder-select"
                  value={stakeholder}
                  onChange={(e) => setStakeholder(e.target.value)}
                  className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-2 text-xs text-[#171717] outline-none focus:border-[#143454] cursor-pointer"
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
                placeholder="Describe your specific concern, lived experience, or concrete recommendation for this policy..."
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-xs text-[#171717] outline-none focus:border-[#E87518] focus:bg-white transition-colors"
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
                disabled={isSubmitting || commentText.trim().length < 10}
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
        </div>
      )}
    </div>
  );
}
