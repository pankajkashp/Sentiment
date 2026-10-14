import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import {
  consultationOpinionSummary,
  policyImprovementSuggestions,
  analyzedConsultationComments
} from "@/features/opinions/comments-data";
import {
  isValidSlugFormat,
  isKnownPolicySlug,
  resolveSafeDataFilePath,
  SecurityError,
  BENCHMARK_PILOT_SLUG
} from "@/lib/security";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1. Validate slug format (reject path traversal, special characters)
  if (!isValidSlugFormat(slug)) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_SLUG",
        message: "Policy identifier contains invalid characters or format."
      },
      { status: 400 }
    );
  }

  // 2. Validate known policy existence
  if (!isKnownPolicySlug(slug)) {
    return NextResponse.json(
      {
        success: false,
        error: "POLICY_NOT_FOUND",
        message: "Policy not found."
      },
      { status: 404 }
    );
  }

  // 3. Resolve safe path inside analysis storage directory
  let analysisFile: string;
  try {
    analysisFile = resolveSafeDataFilePath("analysis", slug);
  } catch (secErr) {
    const msg = secErr instanceof SecurityError ? secErr.message : "Access denied";
    return NextResponse.json(
      { success: false, error: "SECURITY_VIOLATION", message: msg },
      { status: 400 }
    );
  }

  if (fs.existsSync(analysisFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(analysisFile, "utf-8"));
      return NextResponse.json({
        success: true,
        persisted: true,
        source: "PERSISTENT_ANALYSIS_STORAGE",
        data
      });
    } catch {
      // ignore JSON parse errors and continue to fallbacks
    }
  }

  // 4. Pilot benchmark record for Digital Public Infrastructure
  if (slug === BENCHMARK_PILOT_SLUG) {
    return NextResponse.json({
      success: true,
      persisted: true,
      source: "PILOT_BENCHMARK_RECORD",
      data: {
        policy_slug: slug,
        analysis_version: "policylens-v1.0-pilot50",
        total_comments_analyzed: consultationOpinionSummary.totalAnalyzed,
        counts: {
          support: consultationOpinionSummary.supportCount,
          oppose: consultationOpinionSummary.opposeCount,
          neutral: consultationOpinionSummary.neutralCount,
          unclear: consultationOpinionSummary.unclearCount
        },
        percentages: {
          support: consultationOpinionSummary.supportPercent,
          oppose: consultationOpinionSummary.opposePercent,
          neutral: consultationOpinionSummary.neutralPercent,
          unclear: consultationOpinionSummary.unclearPercent
        },
        top_comments: analyzedConsultationComments.slice(0, 10),
        recurring_concerns: consultationOpinionSummary.disclaimer,
        improvement_suggestions: policyImprovementSuggestions,
        all_comments: analyzedConsultationComments
      }
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: "ANALYSIS_NOT_FOUND",
      message: "No completed analysis records exist for this policy."
    },
    { status: 404 }
  );
}
