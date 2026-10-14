import { NextRequest, NextResponse } from "next/server";
import { consumeVerificationToken } from "@/lib/verification";
import { checkRateLimit } from "@/lib/ratelimit";

/**
 * GET requests must never perform state changes.
 * Email security scanners routinely pre-fetch links; consuming on GET would break single-use tokens.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Email verification requires explicit POST confirmation to prevent automated scanner consumption."
    },
    {
      status: 405,
      headers: { Allow: "POST" }
    }
  );
}

/**
 * POST /api/auth/verify-email
 * Atomically validates and consumes the single-use verification token.
 */
export async function POST(request: NextRequest) {
  // 1. IP-based rate limiting (Max 10 verification attempts per 15 mins)
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimit = await checkRateLimit(`verify:ip:${clientIp}`, 10, 900);

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        error: "RATE_LIMITED",
        message: "Too many verification attempts from this network. Please wait 15 minutes before trying again."
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
        }
      }
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

    const { token } = body;

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_TOKEN",
          message: "A verification token is required."
        },
        { status: 400 }
      );
    }

    // 2. Atomically consume token and update isEmailVerified
    const result = await consumeVerificationToken(token);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.code,
          message: result.message
        },
        { status: 400 }
      );
    }

    // 3. Return sanitized user and success message (never logging or returning raw token)
    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Failed to process verification request.",
        details: errorMsg
      },
      { status: 500 }
    );
  }
}
