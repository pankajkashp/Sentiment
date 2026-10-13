import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { officialPolicies } from "@/features/feed/demo-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const policy = officialPolicies.find((p) => p.slug === slug);

  if (!policy) {
    return NextResponse.json({ error: "POLICY_NOT_FOUND" }, { status: 404 });
  }

  const projectRoot = path.resolve(process.cwd(), "..");
  const baseDataDir = fs.existsSync(path.join(process.cwd(), "data"))
    ? path.join(process.cwd(), "data")
    : path.join(projectRoot, "data");

  const submissionsFile = path.join(baseDataDir, "submissions", `${slug}.json`);
  const jobFile = path.join(baseDataDir, "jobs", `${slug}.json`);
  const analysisFile = path.join(baseDataDir, "analysis", `${slug}.json`);

  let totalSubmissions = 0;
  if (fs.existsSync(submissionsFile)) {
    try {
      const subs = JSON.parse(fs.readFileSync(submissionsFile, "utf-8"));
      totalSubmissions = subs.length;
    } catch {
      totalSubmissions = 0;
    }
  }

  let jobStatus: { status: string; job_id?: string; completed_at?: string; error_message?: string } = {
    status: policy.consultationStatus || "open"
  };

  if (fs.existsSync(jobFile)) {
    try {
      jobStatus = JSON.parse(fs.readFileSync(jobFile, "utf-8"));
    } catch {
      // fallback
    }
  }

  const deadline = policy.commentingDeadline ? new Date(policy.commentingDeadline) : null;
  const isCommentingOpen = deadline ? Date.now() < deadline.getTime() : true;
  const hasAnalysis = fs.existsSync(analysisFile) || slug === "digital-public-infrastructure-india-stack";

  return NextResponse.json({
    slug,
    title: policy.title,
    commentingDeadline: policy.commentingDeadline,
    isCommentingOpen,
    totalSubmissions,
    jobStatus: jobStatus.status,
    jobId: jobStatus.job_id,
    hasAnalysis,
    lastCompletedAt: jobStatus.completed_at
  });
}
