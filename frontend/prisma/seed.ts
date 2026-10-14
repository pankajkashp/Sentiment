import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * PolicyLens Deterministic Seed Script
 *
 * Uses strictly synthetic, clearly identified development records to validate
 * database schema relational constraints, foreign keys, and indexes.
 *
 * NOTE: Real citizen comments and real policy records are never inserted here.
 */
async function main() {
  console.log("Starting PolicyLens deterministic database seed...");

  // 1. Seed Synthetic Citizen User
  const citizen = await prisma.user.upsert({
    where: { email: "dev-synthetic-citizen@policylens.local" },
    update: {},
    create: {
      email: "dev-synthetic-citizen@policylens.local",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$syntheticdevhashonlynotrealpassword",
      name: "[SYNTHETIC_DEV] Citizen Test User",
      role: "CITIZEN",
      stakeholderType: "Citizen / Community Member",
      isEmailVerified: true
    }
  });

  // 2. Seed Synthetic Admin User
  const admin = await prisma.user.upsert({
    where: { email: "dev-synthetic-admin@policylens.local" },
    update: {},
    create: {
      email: "dev-synthetic-admin@policylens.local",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$syntheticdevadminhashonly",
      name: "[SYNTHETIC_DEV] System Administrator",
      role: "ADMIN",
      stakeholderType: "Policy Administrator",
      isEmailVerified: true
    }
  });

  // 3. Seed Synthetic Policy Record
  const policy = await prisma.policy.upsert({
    where: { slug: "dev-synthetic-sample-policy" },
    update: {},
    create: {
      slug: "dev-synthetic-sample-policy",
      title: "[SYNTHETIC_DEV] Sample Policy for Relational Validation",
      summary: "[SYNTHETIC_DEV_DATA] Deterministic sample policy record for testing database relations, pagination, and constraints.",
      fullDescription: "[SYNTHETIC_DEV_DATA] Full description of the synthetic policy item for testing schema text fields.",
      category: "Public services",
      status: "OPEN",
      ministry: "Ministry of Home Affairs",
      sourceName: "PolicyLens Synthetic Test Authority",
      sourceUrl: "https://example.gov.in/synthetic-test",
      publishedAt: new Date("2026-10-01T00:00:00Z"),
      openedAt: new Date("2026-10-10T00:00:00Z"),
      commentingDeadline: new Date("2026-10-14T00:00:00Z")
    }
  });

  // 4. Seed Synthetic Comment Record (Idempotent: check if already seeded)
  let comment = await prisma.comment.findFirst({
    where: { policyId: policy.id, commentText: { startsWith: "[SYNTHETIC_DEV_DATA]" } }
  });

  if (!comment) {
    comment = await prisma.comment.create({
      data: {
        policyId: policy.id,
        userId: citizen.id,
        commentText: "[SYNTHETIC_DEV_DATA] Sample citizen comment for verifying foreign key linkage and cursor pagination.",
        stakeholder: "Academic / Policy Researcher",
        sourceLanguage: "en",
        moderationStatus: "APPROVED",
        isVerifiedSubmitter: true
      }
    });

    // 5. Seed Synthetic Analysis Job
    const job = await prisma.analysisJob.create({
      data: {
        policyId: policy.id,
        status: "COMPLETED",
        jobType: "SCHEDULED_NLP_PIPELINE",
        triggerSource: "SYNTHETIC_SEED",
        startedAt: new Date("2026-10-14T00:00:00Z"),
        completedAt: new Date("2026-10-14T00:05:00Z")
      }
    });

    // 6. Seed Synthetic Analysis Result
    const result = await prisma.analysisResult.create({
      data: {
        policyId: policy.id,
        jobId: job.id,
        modelName: "policylens-synthetic-baseline",
        modelVersion: "v1.0-dev",
        totalCommentsAnalyzed: 1,
        supportCount: 1,
        opposeCount: 0,
        neutralCount: 0,
        unclearCount: 0,
        supportPercent: 100.0,
        summaryText: "[SYNTHETIC_DEV_DATA] Synthetic summary for testing JSONB takeaways and foreign keys.",
        takeaways: {
          recurring_concerns: ["[SYNTHETIC_DEV] Synthetic concern item"],
          improvement_suggestions: ["[SYNTHETIC_DEV] Synthetic suggestion item"]
        },
        metrics: {
          confidence_mean: 0.94
        }
      }
    });

    // 7. Seed Synthetic Evidence Record
    await prisma.evidence.create({
      data: {
        resultId: result.id,
        commentId: comment.id,
        theme: "Implementation Timeline",
        stance: "SUPPORT",
        demandStatus: "EXPLICIT_DEMAND",
        attributionTier: "RESPONDENT_EXPLICIT_DEMAND",
        excerptText: "[SYNTHETIC_DEV_DATA] Excerpt text linking analysis finding to comment record.",
        confidenceScore: 0.95,
        sourceAuthority: "Primary Consultation Record"
      }
    });

    console.log("Synthetic relational records created successfully.");
  } else {
    console.log("Synthetic comment and analysis records already exist. Duplicate creation skipped.");
  }

  console.log("Deterministic seed completed successfully:", {
    citizenId: citizen.id,
    adminId: admin.id,
    policyId: policy.id,
    commentId: comment.id
  });
}

main()
  .catch((e) => {
    console.error("Seed execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
