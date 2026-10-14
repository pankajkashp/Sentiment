import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const PRISMA_SCHEMA_PATH = path.resolve(process.cwd(), "prisma", "schema.prisma");
const MIGRATION_SQL_PATH = path.resolve(
  process.cwd(),
  "prisma",
  "migrations",
  "20261014000000_init",
  "migration.sql"
);
const SEED_SCRIPT_PATH = path.resolve(process.cwd(), "prisma", "seed.ts");

test("Prisma Schema: File exists and contains all required models", () => {
  assert.ok(fs.existsSync(PRISMA_SCHEMA_PATH), "schema.prisma must exist");
  const schema = fs.readFileSync(PRISMA_SCHEMA_PATH, "utf-8");

  const requiredModels = [
    "model User",
    "model Policy",
    "model Comment",
    "model AnalysisJob",
    "model AnalysisResult",
    "model Evidence"
  ];

  for (const model of requiredModels) {
    assert.ok(schema.includes(model), `schema.prisma must define ${model}`);
  }
});

test("Prisma Schema: Security - User model stores passwordHash, never plaintext password", () => {
  const schema = fs.readFileSync(PRISMA_SCHEMA_PATH, "utf-8");
  assert.ok(
    schema.includes("passwordHash"),
    "User model must define passwordHash for secure salted hashing"
  );
  assert.ok(
    !schema.includes("password String"),
    "User model must never store plaintext password"
  );
});

test("Prisma Schema: Performance & Cursor Pagination Indexes", () => {
  const schema = fs.readFileSync(PRISMA_SCHEMA_PATH, "utf-8");

  // Comments feed index on policyId and submittedAt DESC
  assert.ok(
    schema.includes("@@index([policyId, submittedAt(sort: Desc)])"),
    "Comments table must have composite index for efficient cursor pagination"
  );

  // Policy slug unique constraint
  assert.ok(
    schema.includes("slug               String       @unique"),
    "Policy slug must be unique"
  );

  // Analysis result index on policyId and createdAt DESC
  assert.ok(
    schema.includes("@@index([policyId, createdAt(sort: Desc)])"),
    "Analysis results must have index on policyId and createdAt"
  );
});

test("Prisma Schema: Deletion Rules & Relational Integrity", () => {
  const schema = fs.readFileSync(PRISMA_SCHEMA_PATH, "utf-8");

  // Comment -> Policy cascade deletion
  assert.ok(
    schema.includes("@relation(fields: [policyId], references: [id], onDelete: Cascade)"),
    "Comments must cascade-delete when policy is deleted"
  );

  // Comment -> User set null deletion rule
  assert.ok(
    schema.includes("@relation(fields: [userId], references: [id], onDelete: SetNull)"),
    "Comments must retain record with userId set null if user account is deleted"
  );
});

test("PostgreSQL Initial Migration: DDL statements are valid and complete", () => {
  assert.ok(fs.existsSync(MIGRATION_SQL_PATH), "Initial migration.sql must exist");
  const sql = fs.readFileSync(MIGRATION_SQL_PATH, "utf-8");

  const requiredTables = [
    'CREATE TABLE "users"',
    'CREATE TABLE "policies"',
    'CREATE TABLE "comments"',
    'CREATE TABLE "analysis_jobs"',
    'CREATE TABLE "analysis_results"',
    'CREATE TABLE "evidence"'
  ];

  for (const table of requiredTables) {
    assert.ok(sql.includes(table), `migration.sql must create table ${table}`);
  }

  // Foreign keys
  assert.ok(sql.includes('ALTER TABLE "comments" ADD CONSTRAINT "comments_policy_id_fkey"'));
  assert.ok(sql.includes('ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_policy_id_fkey"'));
});

test("Seed Script: Deterministic and restricted to synthetic development records", () => {
  assert.ok(fs.existsSync(SEED_SCRIPT_PATH), "seed.ts must exist");
  const seed = fs.readFileSync(SEED_SCRIPT_PATH, "utf-8");

  assert.ok(
    seed.includes("dev-synthetic-citizen@policylens.local"),
    "Seed must use clearly identified synthetic citizen email"
  );
  assert.ok(
    seed.includes("dev-synthetic-sample-policy"),
    "Seed must use synthetic policy slug"
  );
  assert.ok(
    seed.includes("[SYNTHETIC_DEV_DATA]"),
    "Seed records must be explicitly tagged as synthetic development data"
  );
});
