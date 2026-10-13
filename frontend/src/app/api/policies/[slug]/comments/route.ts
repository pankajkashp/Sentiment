import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { officialPolicies } from "@/features/feed/demo-data";
import {
  isValidSlugFormat,
  isKnownPolicySlug,
  resolveSafeDataFilePath,
  SecurityError
} from "@/lib/security";

export async function POST(
  request: NextRequest,
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
  const policy = officialPolicies.find((p) => p.slug === slug);
  if (!policy) {
    return NextResponse.json(
      {
        success: false,
        error: "POLICY_NOT_FOUND",
        message: "Policy not found."
      },
      { status: 404 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_BODY",
          message: "Request body must be a valid JSON object."
        },
        { status: 400 }
      );
    }

    const { commentText, stakeholder, policyId } = body;

    // 3. Validate comment text boundaries
    if (
      !commentText ||
      typeof commentText !== "string" ||
      commentText.trim().length < 10 ||
      commentText.trim().length > 4000
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "Comment must be between 10 and 4,000 characters."
        },
        { status: 400 }
      );
    }

    // 4. Verify PolicyLens 4-day preview commenting window
    let deadlineDate: Date | null = null;
    if (policy.openedAt) {
      const opened = new Date(policy.openedAt);
      if (!Number.isNaN(opened.getTime())) {
        deadlineDate = new Date(opened.getTime() + 4 * 24 * 60 * 60 * 1000);
      }
    } else if (policy.commentingDeadline) {
      const parsed = new Date(policy.commentingDeadline);
      if (!Number.isNaN(parsed.getTime())) {
        deadlineDate = parsed;
      }
    }

    if (!deadlineDate) {
      return NextResponse.json(
        {
          success: false,
          error: "COMMENTING_NOT_CONFIGURED",
          message: "Commenting opening timestamp is not configured for this policy."
        },
        { status: 403 }
      );
    }

    if (Date.now() > deadlineDate.getTime()) {
      return NextResponse.json(
        {
          success: false,
          error: "DEADLINE_PASSED",
          message: "Commenting is closed for this policy."
        },
        { status: 403 }
      );
    }

    // 5. Secure file path resolution with strict directory containment
    let filePath: string;
    try {
      filePath = resolveSafeDataFilePath("submissions", slug);
    } catch (secErr) {
      const msg = secErr instanceof SecurityError ? secErr.message : "Access denied";
      return NextResponse.json(
        { success: false, error: "SECURITY_VIOLATION", message: msg },
        { status: 400 }
      );
    }

    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

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
        if (!Array.isArray(existingComments)) {
          existingComments = [];
        }
      } catch {
        existingComments = [];
      }
    }

    const safePolicyId = typeof policyId === "string" && isValidSlugFormat(policyId)
      ? policyId
      : slug;
    const safeStakeholder = typeof stakeholder === "string" && stakeholder.trim().length <= 100
      ? stakeholder.trim()
      : "Citizen / Community Member";

    const newCommentId = `sub-${slug}-${Date.now().toString(36)}`;
    const newRecord = {
      id: newCommentId,
      comment_text: commentText.trim(),
      stakeholder: safeStakeholder,
      policy_id: safePolicyId,
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

  // 3. Secure file path resolution with strict directory containment
  let filePath: string;
  try {
    filePath = resolveSafeDataFilePath("submissions", slug);
  } catch (secErr) {
    const msg = secErr instanceof SecurityError ? secErr.message : "Access denied";
    return NextResponse.json(
      { success: false, error: "SECURITY_VIOLATION", message: msg },
      { status: 400 }
    );
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ slug, submissions: [] });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const submissions = Array.isArray(data) ? data : [];
    return NextResponse.json({ slug, submissions });
  } catch {
    return NextResponse.json({ slug, submissions: [] });
  }
}
