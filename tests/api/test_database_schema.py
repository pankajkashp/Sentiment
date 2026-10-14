"""
PolicyLens — Database Schema and Migration Regression Tests

Verifies the PostgreSQL database foundation and Prisma schema:
1. Presence of all 6 required normalized models (User, Policy, Comment, AnalysisJob, AnalysisResult, Evidence).
2. Proper password hashing field (password_hash) and no plaintext password field.
3. Efficient composite indexes for cursor pagination and querying.
4. Correct relational foreign keys and cascade / set-null deletion rules.
5. Completeness of initial migration SQL statements.
6. Deterministic seed script presence and synthetic data restrictions.
"""

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
PRISMA_SCHEMA_PATH = FRONTEND_DIR / "prisma" / "schema.prisma"
MIGRATION_SQL_PATH = (
    FRONTEND_DIR / "prisma" / "migrations" / "20261014000000_init" / "migration.sql"
)
SEED_SCRIPT_PATH = FRONTEND_DIR / "prisma" / "seed.ts"
ENV_EXAMPLE_PATH = FRONTEND_DIR / ".env.example"


def test_prisma_schema_file_and_models_exist():
    assert PRISMA_SCHEMA_PATH.exists(), "schema.prisma must exist"
    content = PRISMA_SCHEMA_PATH.read_text(encoding="utf-8")

    required_models = [
        "model User",
        "model Policy",
        "model Comment",
        "model AnalysisJob",
        "model AnalysisResult",
        "model Evidence",
        "model VerificationToken",
    ]
    for model in required_models:
        assert model in content, f"schema.prisma must define {model}"


def test_user_password_hashing_security():
    content = PRISMA_SCHEMA_PATH.read_text(encoding="utf-8")
    assert "passwordHash" in content, "User model must define passwordHash for salted hashing"
    assert "password String" not in content, "User model must never store plaintext password"


def test_schema_indexes_for_pagination():
    content = PRISMA_SCHEMA_PATH.read_text(encoding="utf-8")
    # Cursor pagination on comments
    assert "@@index([policyId, submittedAt(sort: Desc)])" in content
    # Policy slug unique constraint
    assert "slug               String       @unique" in content
    # Analysis results index
    assert "@@index([policyId, createdAt(sort: Desc)])" in content


def test_relational_deletion_rules():
    content = PRISMA_SCHEMA_PATH.read_text(encoding="utf-8")
    # Cascade comments on policy deletion
    assert "onDelete: Cascade" in content
    # Set null on user deletion for comments
    assert "onDelete: SetNull" in content


def test_initial_migration_sql():
    assert MIGRATION_SQL_PATH.exists(), "Initial migration.sql must exist"
    sql = MIGRATION_SQL_PATH.read_text(encoding="utf-8")

    required_tables = [
        'CREATE TABLE "users"',
        'CREATE TABLE "policies"',
        'CREATE TABLE "comments"',
        'CREATE TABLE "analysis_jobs"',
        'CREATE TABLE "analysis_results"',
        'CREATE TABLE "evidence"',
    ]
    for table in required_tables:
        assert table in sql, f"migration.sql must create {table}"

    assert 'ALTER TABLE "comments" ADD CONSTRAINT "comments_policy_id_fkey"' in sql


def test_seed_script_is_deterministic_and_synthetic():
    assert SEED_SCRIPT_PATH.exists(), "seed.ts must exist"
    seed = SEED_SCRIPT_PATH.read_text(encoding="utf-8")

    assert "dev-synthetic-citizen@policylens.local" in seed
    assert "dev-synthetic-sample-policy" in seed
    assert "[SYNTHETIC_DEV_DATA]" in seed


def test_env_example_has_neon_placeholders():
    assert ENV_EXAMPLE_PATH.exists(), ".env.example must exist"
    env_content = ENV_EXAMPLE_PATH.read_text(encoding="utf-8")

    assert "DATABASE_URL=" in env_content
    assert "DIRECT_URL=" in env_content
    assert "sslmode=require" in env_content
    assert "RESEND_API_KEY=" in env_content
    assert "RESEND_FROM_EMAIL=" in env_content
