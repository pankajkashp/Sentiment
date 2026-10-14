import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  hashPassword,
  normalizeEmail,
  isValidEmail,
  validatePassword,
  sanitizeUser,
  isSyntheticAccount
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { issueVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  // 1. IP-based rate limiting (Max 5 registrations per hour per IP)
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimitKey = `register:ip:${clientIp}`;
  const rateLimit = await checkRateLimit(rateLimitKey, 5, 3600);

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        error: "RATE_LIMITED",
        message: "Too many registration attempts. Please try again later."
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
        { success: false, error: "INVALID_BODY", message: "Request body must be a valid JSON object." },
        { status: 400 }
      );
    }

    const { email, password, name, stakeholderType } = body;

    // 2. Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "INVALID_EMAIL", message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);

    // Synthetic development account safeguard
    if (isSyntheticAccount(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "RESERVED_DOMAIN", message: "Registration with this domain is reserved." },
        { status: 400 }
      );
    }

    // 3. Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { success: false, error: "WEAK_PASSWORD", message: passwordCheck.error },
        { status: 400 }
      );
    }

    // 4. Validate metadata bounds
    const safeName = typeof name === "string" ? name.trim().slice(0, 60) : null;
    const safeStakeholder = typeof stakeholderType === "string"
      ? stakeholderType.trim().slice(0, 60)
      : "Citizen / Community Member";

    // 5. Check duplicate registration safely
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "ACCOUNT_EXISTS",
          message: "An account is already registered with this email address."
        },
        { status: 409 }
      );
    }

    // 6. Hash password with Argon2id
    const passwordHash = await hashPassword(password);

    // 7. Create user with CITIZEN role and isEmailVerified = false (never trusting client role)
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: safeName,
        role: "CITIZEN",
        stakeholderType: safeStakeholder,
        isEmailVerified: false
      }
    });

    // 8. Generate single-use verification token (store only tokenHash in DB)
    const { token } = await issueVerificationToken(newUser.id);

    // 9. Send verification email via Resend SDK
    const emailResult = await sendVerificationEmail({
      email: newUser.email,
      token,
      name: newUser.name,
      request
    });

    // 10. Return response without creating a session or issuing a cookie
    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: true,
          message: emailResult.configMissing
            ? "Account created, but verification email could not be sent because email service configuration is missing or inactive. Please contact support or request a new verification link."
            : "Account created, but the verification email failed to deliver. Please request a new verification email from the sign-in page.",
          emailSent: false,
          deliveryError: emailResult.error,
          requiresVerification: true,
          user: sanitizeUser(newUser)
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created. Check your email to verify your account before signing in.",
        emailSent: true,
        requiresVerification: true,
        user: sanitizeUser(newUser)
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Failed to process registration.",
        details: errorMsg
      },
      { status: 500 }
    );
  }
}
