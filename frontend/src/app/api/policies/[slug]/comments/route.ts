import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { officialPolicies } from "@/features/feed/demo-data";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await request.json();
    const { commentText, stakeholder, policyId } = body;

    // Validate comment text
    if (!commentText || typeof commentText !== "string" || commentText.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "Comment must contain at least 10 characters."
        },
        { status: 400 }
      );
    }

    // Lookup policy & verify deadline
    const policy = officialPolicies.find((p) => p.slug === slug);
    if (policy && policy.commentingDeadline) {
      const deadline = new Date(policy.commentingDeadline);
      if (Date.now() > deadline.getTime()) {
        return NextResponse.json(
          {
            success: false,
            error: "DEADLINE_PASSED",
            message: `The consultation period for this policy closed on ${deadline.toISOString()}. New submissions cannot be accepted.`
          },
          { status: 403 }
        );
      }
    }

    // Persist comment to data/submissions/<slug>.json
    const projectRoot = path.resolve(process.cwd(), "..");
    // Also support current dir if cwd is project root
    const dataDir = fs.existsSync(path.join(process.cwd(), "data"))
      ? path.join(process.cwd(), "data", "submissions")
      : path.join(projectRoot, "data", "submissions");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, `${slug}.json`);
    let existingComments: Array<{
      id: string;
      comment_text: string;
      stakeholder: string;
      policy_id: string;
      created_at: string;
    }> = [];

    if (fs.existsSync(filePath)) {
      try {
        existingComments = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        existingComments = [];
      }
    }

    const newCommentId = `sub-${slug}-${Date.now()}`;
    const newRecord = {
      id: newCommentId,
      comment_text: commentText.trim(),
      stakeholder: stakeholder || "Citizen / Community Member",
      policy_id: policyId || slug,
      created_at: new Date().toISOString()
    };

    existingComments.push(newRecord);
    fs.writeFileSync(filePath, JSON.stringify(existingComments, null, 2), "utf-8");

    return NextResponse.json(
      {
        success: true,
        commentId: newCommentId,
        createdAt: newRecord.created_at,
        totalRecorded: existingComments.length,
        message: "Your opinion was successfully recorded in consultation persistent storage."
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Failed to persist consultation comment.",
        details: errorMsg
      },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const projectRoot = path.resolve(process.cwd(), "..");
  const dataDir = fs.existsSync(path.join(process.cwd(), "data"))
    ? path.join(process.cwd(), "data", "submissions")
    : path.join(projectRoot, "data", "submissions");

  const filePath = path.join(dataDir, `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ slug, submissions: [] });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return NextResponse.json({ slug, submissions: data });
  } catch {
    return NextResponse.json({ slug, submissions: [] });
  }
}
