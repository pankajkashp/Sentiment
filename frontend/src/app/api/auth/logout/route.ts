import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  extractSessionToken,
  revokeSession
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = await extractSessionToken(request);
    if (token) {
      await revokeSession(token);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully."
    });

    // Clear session cookie
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0)
    });

    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Failed to process logout request.",
        details: errorMsg
      },
      { status: 500 }
    );
  }
}
