import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { officialPolicies } from "@/features/feed/demo-data";

const execFileAsync = promisify(execFile);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const policy = officialPolicies.find((p) => p.slug === slug);

  if (!policy) {
    return NextResponse.json({ error: "POLICY_NOT_FOUND" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const forceRetry = Boolean(body.forceRetry);

  // 1. Check commenting deadline
  if (policy.commentingDeadline && !forceRetry) {
    const deadline = new Date(policy.commentingDeadline);
    if (Date.now() < deadline.getTime()) {
      return NextResponse.json(
        {
          success: false,
          error: "COMMENTING_STILL_OPEN",
          message: `Commenting period is currently active until ${deadline.toISOString()}. Scheduled analysis can only run after the deadline closes.`
        },
        { status: 400 }
      );
    }
  }

  const projectRoot = path.resolve(process.cwd(), "..");
  const baseDataDir = fs.existsSync(path.join(process.cwd(), "data"))
    ? path.join(process.cwd(), "data")
    : path.join(projectRoot, "data");

  const jobFile = path.join(baseDataDir, "jobs", `${slug}.json`);

  // 2. Idempotency Check
  if (fs.existsSync(jobFile) && !forceRetry) {
    try {
      const job = JSON.parse(fs.readFileSync(jobFile, "utf-8"));
      if (job.status === "COMPLETED") {
        return NextResponse.json({
          success: true,
          idempotent: true,
          status: "COMPLETED",
          message: `Analysis already completed for '${slug}'. Returning persisted results.`,
          completedAt: job.completed_at
        });
      }
      if (job.status === "RUNNING") {
        return NextResponse.json({
          success: true,
          idempotent: true,
          status: "RUNNING",
          message: `Analysis job for '${slug}' is currently running. Duplicate trigger skipped.`
        });
      }
    } catch {
      // ignore
    }
  }

  // 3. Execute Python Analysis Pipeline
  const scriptPath = fs.existsSync(path.join(process.cwd(), "scripts", "run_policy_analysis.py"))
    ? path.join(process.cwd(), "scripts", "run_policy_analysis.py")
    : path.join(projectRoot, "scripts", "run_policy_analysis.py");

  const args = ["--policy-slug", slug];
  if (forceRetry) {
    args.push("--force-retry");
  }

  try {
    const { stdout, stderr } = await execFileAsync("python3", [scriptPath, ...args], {
      cwd: fs.existsSync(path.join(process.cwd(), "scripts")) ? process.cwd() : projectRoot,
      timeout: 30000
    });

    const analysisFile = path.join(baseDataDir, "analysis", `${slug}.json`);
    let analysisResult = null;
    if (fs.existsSync(analysisFile)) {
      analysisResult = JSON.parse(fs.readFileSync(analysisFile, "utf-8"));
    }

    return NextResponse.json({
      success: true,
      status: "COMPLETED",
      output: stdout.trim(),
      error: stderr ? stderr.trim() : null,
      analysis: analysisResult
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Execution failed";
    return NextResponse.json(
      {
        success: false,
        status: "FAILED",
        error: "PIPELINE_EXECUTION_ERROR",
        message: errorMsg
      },
      { status: 500 }
    );
  }
}
