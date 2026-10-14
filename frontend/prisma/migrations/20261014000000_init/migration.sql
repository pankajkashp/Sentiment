-- PolicyLens Initial PostgreSQL Migration (Neon Compatible)
-- Generated: 2026-10-14
-- Architecture: Normalized Citizen Participation & Analysis Models

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('OPEN', 'CLOSED', 'UPCOMING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommentModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable: Users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "stakeholder_type" TEXT,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Policies
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "full_description" TEXT,
    "category" TEXT NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'OPEN',
    "ministry" TEXT,
    "department" TEXT,
    "scheme_type" TEXT,
    "source_name" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "opened_at" TIMESTAMP(3),
    "commenting_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Comments
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "user_id" TEXT,
    "comment_text" TEXT NOT NULL,
    "stakeholder" TEXT NOT NULL DEFAULT 'Citizen / Community Member',
    "source_language" TEXT NOT NULL DEFAULT 'en',
    "moderation_status" "CommentModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "is_verified_submitter" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Analysis Jobs
CREATE TABLE "analysis_jobs" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "job_type" TEXT NOT NULL DEFAULT 'SCHEDULED_NLP_PIPELINE',
    "trigger_source" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Analysis Results
CREATE TABLE "analysis_results" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "total_comments_analyzed" INTEGER NOT NULL,
    "support_count" INTEGER NOT NULL DEFAULT 0,
    "oppose_count" INTEGER NOT NULL DEFAULT 0,
    "neutral_count" INTEGER NOT NULL DEFAULT 0,
    "unclear_count" INTEGER NOT NULL DEFAULT 0,
    "support_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "oppose_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "neutral_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "unclear_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "summary_text" TEXT,
    "takeaways" JSONB,
    "metrics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Evidence
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "comment_id" TEXT,
    "theme" TEXT NOT NULL,
    "stance" TEXT,
    "demand_status" TEXT,
    "attribution_tier" TEXT,
    "excerpt_text" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION,
    "source_authority" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- Unique Indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "policies_slug_key" ON "policies"("slug");

-- Performance Indexes for Policy Feeds and Queries
CREATE INDEX "policies_status_published_at_idx" ON "policies"("status", "published_at" DESC);
CREATE INDEX "policies_category_idx" ON "policies"("category");

-- Efficient Cursor Pagination Indexes for Comments
CREATE INDEX "comments_policy_id_submitted_at_idx" ON "comments"("policy_id", "submitted_at" DESC);
CREATE INDEX "comments_policy_id_moderation_status_idx" ON "comments"("policy_id", "moderation_status");
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- Analysis Jobs Indexes
CREATE INDEX "analysis_jobs_policy_id_created_at_idx" ON "analysis_jobs"("policy_id", "created_at" DESC);
CREATE INDEX "analysis_jobs_status_idx" ON "analysis_jobs"("status");

-- Analysis Results Indexes
CREATE INDEX "analysis_results_policy_id_created_at_idx" ON "analysis_results"("policy_id", "created_at" DESC);
CREATE INDEX "analysis_results_job_id_idx" ON "analysis_results"("job_id");

-- Evidence Indexes
CREATE INDEX "evidence_result_id_idx" ON "evidence"("result_id");
CREATE INDEX "evidence_comment_id_idx" ON "evidence"("comment_id");
CREATE INDEX "evidence_theme_idx" ON "evidence"("theme");

-- Foreign Keys & Deletion Rules
ALTER TABLE "comments" ADD CONSTRAINT "comments_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "analysis_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evidence" ADD CONSTRAINT "evidence_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "analysis_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
