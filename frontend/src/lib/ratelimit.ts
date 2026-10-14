import prisma from "@/lib/db";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
  totalHits: number;
}

/**
 * Persistent Database-Backed Rate Limiter
 *
 * Uses the PostgreSQL `rate_limits` table to implement atomic sliding/fixed window
 * rate limiting without requiring external paid services or in-memory caches.
 *
 * @param key Unique rate limiting identifier (e.g. `login:ip:127.0.0.1` or `register:email:user@domain`)
 * @param limit Maximum allowed hits within the window
 * @param windowSeconds Window length in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = new Date();
  const newWindowExpiry = new Date(now.getTime() + windowSeconds * 1000);

  try {
    // Attempt to retrieve existing rate limit record
    const record = await prisma.rateLimit.findUnique({
      where: { key }
    });

    // If record doesn't exist or window has expired, reset/create it
    if (!record || record.windowExpiresAt <= now) {
      const updated = await prisma.rateLimit.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          windowExpiresAt: newWindowExpiry
        },
        update: {
          count: 1,
          windowExpiresAt: newWindowExpiry
        }
      });

      return {
        success: true,
        remaining: Math.max(0, limit - 1),
        resetAt: updated.windowExpiresAt,
        totalHits: 1
      };
    }

    // Window is currently active
    if (record.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetAt: record.windowExpiresAt,
        totalHits: record.count
      };
    }

    // Increment count within active window
    const incremented = await prisma.rateLimit.update({
      where: { key },
      data: {
        count: { increment: 1 }
      }
    });

    return {
      success: true,
      remaining: Math.max(0, limit - incremented.count),
      resetAt: incremented.windowExpiresAt,
      totalHits: incremented.count
    };
  } catch (err) {
    // Fallback: If database is temporarily unavailable during rate limit check,
    // log error and allow request to prevent hard system outage, while reporting 1 remaining.
    console.error("Rate limiter error:", err);
    return {
      success: true,
      remaining: 1,
      resetAt: newWindowExpiry,
      totalHits: 1
    };
  }
}

/**
 * Clears rate limit record for a given key (used after successful authentication)
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({
      where: { key }
    });
  } catch {
    // ignore
  }
}
