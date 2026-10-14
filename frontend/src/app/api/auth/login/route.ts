import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  verifyPassword,
  createSession,
  getSessionCookieOptions,
  normalizeEmail,
  isValidEmail,
  sanitizeUser
} from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/ratelimit";

// Constant-time dummy hash used to prevent user-enumeration timing attacks
const DUMMY_HASH = "$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXlzYWx0MTIzNDU2Nw$dummyhashpreventintimingattack12345";

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  // 1. IP-level rate limit (Max 5 attempts per 15 minutes)
  const ipRateLimit = await checkRateLimit(`login:ip:${clientIp}`, 5, 900);
  if (!ipRateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        error: "RATE_LIMITED",
        message: "Too many login attempts from this network. Please wait 15 minutes before trying again."
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
        { success: false, error: "INVALID_BODY", message: "Request body must be a valid JSON object." },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password || typeof password !== "string" || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password."
        },
        { status: 401 }
      );
    }

    const normalizedEmail = normalizeEmail(email);

    // 2. Account-level rate limit (Max 5 attempts per 15 minutes per email)
    const emailRateLimit = await checkRateLimit(`login:email:${normalizedEmail}`, 5, 900);
    if (!emailRateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: "RATE_LIMITED",
          message: "Too many failed login attempts for this account. Please wait 15 minutes before trying again."
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((emailRateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // 3. Lookup user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      // Execute dummy verification to prevent timing-based user enumeration
      await verifyPassword(password, DUMMY_HASH);
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password."
        },
        { status: 401 }
      );
    }

    // 4. Verify password with Argon2id
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password."
        },
        { status: 401 }
      );
    }

    // 5. Mandatory Email Verification Guard
    if (!user.isEmailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "EMAIL_NOT_VERIFIED",
          message: "Please verify your email address before signing in. Check your email for the verification link.",
          email: user.email
        },
        { status: 403 }
      );
    }

    // 6. Successful login: reset email-specific rate limit
    await resetRateLimit(`login:email:${normalizedEmail}`);

    // 7. Create session
    const userAgent = request.headers.get("user-agent");
    const { token, session } = await createSession(user.id, {
      ipAddress: clientIp,
      userAgent
    });

    // 7. Set HttpOnly session cookie
    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully.",
      user: sanitizeUser(user)
    });

    const cookieOpts = getSessionCookieOptions(session.expiresAt);
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Failed to process login request.",
        details: errorMsg
      },
      { status: 500 }
    );
  }
}
