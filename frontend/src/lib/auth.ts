import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { hash, verify } from "@node-rs/argon2";
import prisma from "@/lib/db";
import type { User, Session, UserRole } from "@prisma/client";

export const SESSION_COOKIE_NAME = "policylens_session";
export const SESSION_DURATION_DAYS = 7;
export const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  stakeholderType: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

// -----------------------------------------------------------------------------
// 1. ARGON2ID PASSWORD HASHING
// -----------------------------------------------------------------------------

/**
 * Hashes a plaintext password using Argon2id with OWASP-recommended parameters.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    outputLen: 32,
    parallelism: 1
  });
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
  try {
    return await verify(hashStr, password);
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// 2. TOKEN GENERATION & HASHING
// -----------------------------------------------------------------------------

/**
 * Generates a cryptographically secure, 256-bit opaque session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Computes the SHA-256 hash of a session token.
 * Only the hash is stored in PostgreSQL.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// -----------------------------------------------------------------------------
// 3. SESSION LIFECYCLE MANAGEMENT
// -----------------------------------------------------------------------------

/**
 * Creates a new session for a user and stores only its SHA-256 hash in PostgreSQL.
 */
export async function createSession(
  userId: string,
  meta?: { ipAddress?: string | null; userAgent?: string | null }
): Promise<{ token: string; session: Session }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null
    }
  });

  return { token, session };
}

/**
 * Validates an opaque session token by checking its SHA-256 hash against PostgreSQL.
 */
export async function validateSessionToken(
  token: string
): Promise<{ user: SafeUser; session: Session } | null> {
  if (!token || typeof token !== "string" || token.length < 20) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!session || session.isRevoked) {
    return null;
  }

  // Check if session has expired
  if (session.expiresAt <= new Date()) {
    // Revoke expired session lazily
    await prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true }
    }).catch(() => {});
    return null;
  }

  return {
    user: sanitizeUser(session.user),
    session
  };
}

/**
 * Revokes a session token by setting isRevoked = true in PostgreSQL.
 */
export async function revokeSession(token: string): Promise<void> {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  await prisma.session.updateMany({
    where: { tokenHash },
    data: { isRevoked: true }
  }).catch(() => {});
}

/**
 * Revokes all sessions belonging to a specific user.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId },
    data: { isRevoked: true }
  }).catch(() => {});
}

// -----------------------------------------------------------------------------
// 4. COOKIE OPTIONS & HELPERS
// -----------------------------------------------------------------------------

export function getSessionCookieOptions(expiresAt: Date) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt
  };
}

// -----------------------------------------------------------------------------
// 5. SERVER-SIDE AUTHENTICATION HELPERS
// -----------------------------------------------------------------------------

/**
 * Extracts session token from either a NextRequest or the Next.js cookies store.
 */
export async function extractSessionToken(request?: NextRequest | Request): Promise<string | null> {
  if (request) {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
    if (match) return decodeURIComponent(match[1]);
  }

  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    return cookie?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current authenticated user without throwing.
 */
export async function getCurrentUser(request?: NextRequest | Request): Promise<SafeUser | null> {
  const token = await extractSessionToken(request);
  if (!token) return null;
  const result = await validateSessionToken(token);
  return result ? result.user : null;
}

/**
 * Enforces that the caller is authenticated. Throws AuthError if not.
 */
export async function requireAuth(
  request?: NextRequest | Request
): Promise<{ user: SafeUser; session: Session }> {
  const token = await extractSessionToken(request);
  if (!token) {
    throw new AuthError(401, "UNAUTHORIZED", "Authentication required to access this resource.");
  }

  const result = await validateSessionToken(token);
  if (!result) {
    throw new AuthError(401, "INVALID_SESSION", "Session is invalid or has expired.");
  }

  return result;
}

/**
 * Enforces that the caller has the ADMIN role. Throws AuthError if not.
 */
export async function requireAdmin(
  request?: NextRequest | Request
): Promise<{ user: SafeUser; session: Session }> {
  const { user, session } = await requireAuth(request);
  if (user.role !== "ADMIN") {
    throw new AuthError(403, "FORBIDDEN", "Administrative privileges required.");
  }
  return { user, session };
}

// -----------------------------------------------------------------------------
// 6. INPUT SANITIZATION & SAFEGUARDS
// -----------------------------------------------------------------------------

/**
 * Normalizes email address to lower case and removes surrounding whitespace.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates email format according to RFC 5322 regex.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string" || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Validates password length and complexity (min 12, max 128 chars).
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (typeof password !== "string") {
    return { valid: false, error: "Password must be a string." };
  }
  if (password.length < 12) {
    return { valid: false, error: "Password must be at least 12 characters long." };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password exceeds maximum allowed length (128 characters)." };
  }
  return { valid: true };
}

/**
 * Strips passwordHash and internal credentials before returning user data.
 */
export function sanitizeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    stakeholderType: user.stakeholderType,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

/**
 * Synthetic admin safeguard:
 * Prevents seed development accounts from being logged into with trivial passwords.
 */
export function isSyntheticAccount(email: string): boolean {
  return email.endsWith("@policylens.local");
}
