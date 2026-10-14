import crypto from "crypto";
import prisma from "@/lib/db";
import { sanitizeUser, type SafeUser } from "@/lib/auth";

export const VERIFICATION_TOKEN_LIFETIME_HOURS = 24;
export const VERIFICATION_TOKEN_LIFETIME_MS = VERIFICATION_TOKEN_LIFETIME_HOURS * 60 * 60 * 1000;

/**
 * Generates an opaque, cryptographically secure 256-bit token.
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Computes the SHA-256 hash of a verification token for secure database storage.
 */
export function hashVerificationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates and stores a new verification token for the specified user,
 * automatically invalidating any prior unconsumed tokens.
 */
export async function issueVerificationToken(userId: string): Promise<{
  token: string;
  tokenHash: string;
  expiresAt: Date;
}> {
  const token = generateVerificationToken();
  const tokenHash = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_LIFETIME_MS);

  // Invalidate any existing unconsumed tokens for this user
  await prisma.verificationToken.updateMany({
    where: {
      userId,
      isUsed: false
    },
    data: {
      isUsed: true
    }
  }).catch(() => {});

  // Store the new token hash
  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      isUsed: false
    }
  });

  return { token, tokenHash, expiresAt };
}

export type VerificationResult =
  | { success: true; user: SafeUser; message: string }
  | { success: false; code: "INVALID_TOKEN" | "TOKEN_ALREADY_USED" | "TOKEN_EXPIRED"; message: string };

/**
 * Atomically validates and consumes a single-use verification token,
 * setting the user's isEmailVerified flag to true.
 */
export async function consumeVerificationToken(rawToken: string): Promise<VerificationResult> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length < 20) {
    return {
      success: false,
      code: "INVALID_TOKEN",
      message: "This verification link is invalid or has already been used."
    };
  }

  const tokenHash = hashVerificationToken(rawToken.trim());

  const tokenRecord = await prisma.verificationToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!tokenRecord) {
    return {
      success: false,
      code: "INVALID_TOKEN",
      message: "This verification link is invalid or has already been used."
    };
  }

  if (tokenRecord.isUsed) {
    return {
      success: false,
      code: "TOKEN_ALREADY_USED",
      message: "This verification link has already been used. Please sign in."
    };
  }

  if (tokenRecord.expiresAt <= new Date()) {
    // Lazily mark expired token as used
    await prisma.verificationToken.update({
      where: { id: tokenRecord.id },
      data: { isUsed: true }
    }).catch(() => {});

    return {
      success: false,
      code: "TOKEN_EXPIRED",
      message: "This verification link has expired. Please request a new verification link."
    };
  }

  // Atomically mark token as used and verify user
  const [, updatedUser] = await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: tokenRecord.id },
      data: { isUsed: true }
    }),
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { isEmailVerified: true }
    })
  ]);

  return {
    success: true,
    user: sanitizeUser(updatedUser),
    message: "Email address verified successfully. You can now sign in."
  };
}
