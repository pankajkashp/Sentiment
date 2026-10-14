import { NextResponse, type NextRequest } from "next/server";

/**
 * PolicyLens CSRF & Origin Validation Middleware
 *
 * Enforces strict Origin and Fetch Metadata (Sec-Fetch-Site) validation
 * on state-changing requests to /api/ endpoints to prevent Cross-Site Request Forgery.
 */
export function middleware(request: NextRequest) {
  const method = request.method.toUpperCase();
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (isStateChanging && request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const secFetchSite = request.headers.get("sec-fetch-site");

    // 1. Fetch Metadata check: reject explicit cross-site requests
    if (secFetchSite === "cross-site") {
      return NextResponse.json(
        {
          success: false,
          error: "CSRF_BLOCKED",
          message: "Cross-site request blocked by security policy.",
        },
        { status: 403 }
      );
    }

    // 2. Target host resolution (honoring reverse proxy x-forwarded-host)
    const hostHeader =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "";

    // 3. Origin verification when present
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== hostHeader) {
          return NextResponse.json(
            {
              success: false,
              error: "CSRF_ORIGIN_MISMATCH",
              message: "Cross-origin request blocked by security policy.",
            },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "MALFORMED_ORIGIN",
            message: "Request contains an invalid Origin header.",
          },
          { status: 400 }
        );
      }
    } else if (referer) {
      // 4. Fallback Referer verification if Origin was omitted
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host !== hostHeader) {
          return NextResponse.json(
            {
              success: false,
              error: "CSRF_REFERER_MISMATCH",
              message: "Cross-origin request blocked by security policy.",
            },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "MALFORMED_REFERER",
            message: "Request contains an invalid Referer header.",
          },
          { status: 400 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
