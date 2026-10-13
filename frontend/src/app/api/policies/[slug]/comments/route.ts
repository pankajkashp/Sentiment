import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await request.json();
    const { commentText, stance, stakeholder, policyId } = body;

    // Validate input length
    if (!commentText || typeof commentText !== "string" || commentText.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "Comment must be at least 10 characters long."
        },
        { status: 400 }
      );
    }

    // Check if live FastAPI backend is reachable
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
    let backendResponse: Response | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      backendResponse = await fetch(`${backendUrl}/api/v1/consultations/${slug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_id: policyId || slug,
          comment_text: commentText.trim(),
          stance: stance || "neutral",
          stakeholder_type: stakeholder || "citizen"
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch {
      backendResponse = null;
    }

    if (backendResponse && backendResponse.ok) {
      const data = await backendResponse.json();
      return NextResponse.json({
        success: true,
        persisted: true,
        data
      });
    }

    // Backend is not yet running / deployed on this environment
    return NextResponse.json(
      {
        success: false,
        persisted: false,
        backendDeployed: false,
        error: "BACKEND_SERVICE_NOT_DEPLOYED",
        message:
          "The FastAPI backend service (POST /api/v1/consultations/{slug}/feedback) is not currently running. In accordance with platform integrity rules, this comment has NOT been recorded to a database or sent to the ML analysis pipeline.",
        submissionDetails: {
          policyId: policyId || slug,
          stance: stance || "Unspecified",
          stakeholder: stakeholder || "Citizen",
          receivedCharacters: commentText.trim().length,
          timestamp: new Date().toISOString()
        }
      },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Failed to parse submission payload."
      },
      { status: 500 }
    );
  }
}
