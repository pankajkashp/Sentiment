import { Resend } from "resend";

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  configMissing?: boolean;
}

/**
 * Validates and retrieves the Resend client.
 * Returns null if the API key is missing or set to a placeholder.
 */
export function getResendClient(): { client: Resend | null; error?: string; configMissing?: boolean } {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === "re_your_actual_api_key" || apiKey === "re_your_api_key_here" || !apiKey.startsWith("re_")) {
    return {
      client: null,
      error: "RESEND_API_KEY is not configured or contains a placeholder value.",
      configMissing: true
    };
  }

  try {
    const client = new Resend(apiKey);
    return { client };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to initialize Resend client";
    return { client: null, error: msg };
  }
}

/**
 * Retrieves the configured sender address, validating Resend's required format.
 */
export function getSenderEmail(): { sender: string; error?: string } {
  const sender = process.env.RESEND_FROM_EMAIL?.trim();

  if (!sender) {
    return {
      sender: "PolicyLens <onboarding@resend.dev>",
      error: "RESEND_FROM_EMAIL is not configured."
    };
  }

  // Basic check for email / display name format
  if (!sender.includes("@")) {
    return {
      sender,
      error: "RESEND_FROM_EMAIL is not a valid email address."
    };
  }

  return { sender };
}

/**
 * Resolves the application trusted base URL for email links.
 */
export function getAppBaseUrl(request?: Request): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/+$/, "");
  }

  if (request) {
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (host) {
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
  }

  return "http://localhost:3000";
}

/**
 * Sends an official verification email using the Resend SDK.
 */
export async function sendVerificationEmail({
  email,
  token,
  name,
  request
}: {
  email: string;
  token: string;
  name?: string | null;
  request?: Request;
}): Promise<EmailSendResult> {
  const { client, error: clientError, configMissing } = getResendClient();

  if (!client) {
    return {
      success: false,
      error: clientError || "Email service client is unavailable.",
      configMissing: Boolean(configMissing)
    };
  }

  const { sender, error: senderError } = getSenderEmail();
  if (senderError && !sender) {
    return {
      success: false,
      error: senderError,
      configMissing: true
    };
  }

  const baseUrl = getAppBaseUrl(request);
  const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const displayName = name ? name.trim() : "Citizen";

  const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Verify your PolicyLens Account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="height: 4px; background: linear-gradient(90deg, #E87518 0%, #ffffff 50%, #16834A 100%);"></div>
    <div style="background-color: #143454; padding: 20px 28px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">PolicyLens — Public Policy Portal</h1>
      <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Citizen Verification Notice</p>
    </div>
    <div style="padding: 28px;">
      <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">Namaste <strong>${displayName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Thank you for creating an account on the <strong>PolicyLens Public Policy Portal</strong>. To complete your registration and protect against automated submissions, please verify your email address.
      </p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: #143454; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; border: 1px solid #0e2a47;">
          Verify Email Address
        </a>
      </div>
      <p style="font-size: 13px; line-height: 1.5; color: #64748b;">
        This verification link is single-use and will expire in <strong>24 hours</strong>.
      </p>
      <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
        If the button does not work, copy and paste this URL into your browser:<br>
        <a href="${verificationUrl}" style="color: #E87518; word-break: break-all;">${verificationUrl}</a>
      </p>
      <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin-top: 16px;">
        If you did not request this account, please ignore this email. No account will be activated without verification.
      </p>
    </div>
    <div style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
      PolicyLens Public Consultation Portal • Verified National Policy Repository
    </div>
  </div>
</body>
</html>`;

  const emailText = `PolicyLens — Public Policy Portal
Citizen Verification Notice

Namaste ${displayName},

Thank you for creating an account on the PolicyLens Public Policy Portal. Please verify your email address by visiting this link:

${verificationUrl}

This link is single-use and will expire in 24 hours.

If you did not register for PolicyLens, please disregard this email.`;

  try {
    const response = await client.emails.send({
      from: sender,
      to: email,
      subject: "Verify your email address — PolicyLens Public Policy Portal",
      html: emailHtml,
      text: emailText
    });

    if (response.error) {
      return {
        success: false,
        error: response.error.message || "Resend rejected the email delivery request."
      };
    }

    return {
      success: true,
      messageId: response.data?.id
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error sending verification email";
    return {
      success: false,
      error: errorMsg
    };
  }
}
