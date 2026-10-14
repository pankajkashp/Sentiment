import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton for Next.js App Router
 *
 * Prevents multiple PrismaClient instances during hot module reloading in development,
 * which would otherwise exhaust database connections on PostgreSQL/Neon.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  (globalForPrisma.prisma && "verificationToken" in (globalForPrisma.prisma as unknown as Record<string, unknown>))
    ? globalForPrisma.prisma
    : new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
