import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  consultationOpinionSummary,
  policyImprovementSuggestions,
  analyzedConsultationComments
} from "@/features/opinions/comments-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const projectRoot = path.resolve(process.cwd(), "..");
  const baseDataDir = fs.existsSync(path.join(process.cwd(), "data"))
    ? path.join(process.cwd(), "data")
    : path.join(projectRoot, "data");

  const analysisFile = path.join(baseDataDir, "analysis", `${slug}.json`);

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
      // ignore
    }
  }

  // Fallback for Digital Public Infrastructure (authentic 50 pilot benchmark records)
  if (slug === "digital-public-infrastructure-india-stack") {
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
