import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { normalizeEmail, isValidEmail, isSyntheticAccount } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { issueVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  // 1. IP-based rate limiting (Max 5 attempts per 15 mins per IP)
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const ipRateLimit = await checkRateLimit(`resend-verify:ip:${clientIp}`, 5, 900);

  if (!ipRateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        error: "RATE_LIMITED",
        message: "Too many resend attempts from this network. Please wait 15 minutes before trying again."
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((ipRateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
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

    const { email } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_EMAIL",
          message: "A valid email address is required."
        },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);

    // 2. Account-level rate limiting (Max 3 resend attempts per 15 mins per email)
    const emailRateLimit = await checkRateLimit(`resend-verify:email:${normalizedEmail}`, 3, 900);
    if (!emailRateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: "RATE_LIMITED",
          message: "Too many resend attempts for this email address. Please wait 15 minutes before requesting again."
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((emailRateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Generic safe response to prevent user enumeration
    const genericResponse = {
      success: true,
      message: "If an unverified account exists for this email address, a new verification link has been sent."
    };

    if (isSyntheticAccount(normalizedEmail)) {
      return NextResponse.json(genericResponse);
    }

    // 3. User lookup
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || user.isEmailVerified) {
      // Return identical generic response
      return NextResponse.json(genericResponse);
    }

    // 4. Issue new single-use token (automatically invalidates prior unconsumed tokens)
    const { token } = await issueVerificationToken(user.id);

    // 5. Send verification email via Resend SDK
    const emailResult = await sendVerificationEmail({
      email: user.email,
      token,
      name: user.name,
      request
    });

    if (!emailResult.success) {
      return NextResponse.json({
        success: true,
        message: "A verification link was generated, but could not be dispatched due to an email delivery issue.",
        emailSent: false,
        deliveryError: emailResult.error
      });
    }

    return NextResponse.json({
      success: true,
      message: "A new verification link has been sent to your email address.",
      emailSent: true
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Failed to process resend verification request.",
        details: errorMsg
      },
      { status: 500 }
    );
  }
}
