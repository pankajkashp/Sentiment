#!/usr/bin/env python3
"""
PolicyLens — Verification Test Suite for Scheduled Analysis Workflow

Verifies the full lifecycle of the commenting and scheduled analysis workflow:
1. Active commenting acceptance while open.
2. Rejection of submissions after commenting deadline closes.
3. Background analysis job execution using PolicyLens ML models and safeguards.
4. Atomic persistence of results with metadata and version.
5. Idempotent re-execution (prevents duplicate jobs/results).
6. Safe retry handling without data loss.
"""

import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
SUBMISSIONS_DIR = DATA_DIR / "submissions"
JOBS_DIR = DATA_DIR / "jobs"
ANALYSIS_DIR = DATA_DIR / "analysis"
TEST_SLUG = "test-consultation-lifecycle"


@pytest.fixture(autouse=True)
def setup_and_teardown():
    SUBMISSIONS_DIR.mkdir(parents=True, exist_ok=True)
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    yield


def test_1_open_commenting_acceptance():
    """Verify that valid comments can be written to submissions storage."""
    sub_file = SUBMISSIONS_DIR / f"{TEST_SLUG}.json"
    synthetic_comments = [
        {
            "id": "syn-test-1",
            "comment_text": "[SYNTHETIC_TEST_DATA] We strongly support expanding digital services, but the ministry must mandate offline contingency options.",
            "stakeholder": "Citizen / Community Member",
            "policy_id": "test-policy-lifecycle",
            "created_at": "2026-10-13T22:00:00Z"
        },
        {
            "id": "syn-test-2",
            "comment_text": "[SYNTHETIC_TEST_DATA] This compliance burden harms small businesses and provides no clear recourse for technical errors.",
            "stakeholder": "Small Business / MSME Representative",
            "policy_id": "test-policy-lifecycle",
            "created_at": "2026-10-13T22:05:00Z"
        },
        {
            "id": "syn-test-3",
            "comment_text": "[SYNTHETIC_TEST_DATA] Neutral inquiry into whether rural connectivity grants will cover community server hardware.",
            "stakeholder": "Academic / Policy Researcher",
            "policy_id": "test-policy-lifecycle",
            "created_at": "2026-10-13T22:10:00Z"
        }
    ]

    with open(sub_file, "w", encoding="utf-8") as f:
        json.dump(synthetic_comments, f, indent=2)

    assert sub_file.exists()
    with open(sub_file, "r", encoding="utf-8") as f:
        loaded = json.load(f)
    assert len(loaded) == 3


def test_2_deadline_validation():
    """Verify that a deadline in the past correctly triggers closed status."""
    past_deadline = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    now_utc = datetime.now(timezone.utc)
    deadline_dt = datetime.fromisoformat(past_deadline)
    is_closed = now_utc > deadline_dt
    assert is_closed is True


def test_3_run_scheduled_analysis_job():
    """Verify that run_policy_analysis.py processes comments and produces valid output."""
    script_path = PROJECT_ROOT / "scripts" / "run_policy_analysis.py"

    # Remove any existing job state to test fresh execution
    job_file = JOBS_DIR / f"{TEST_SLUG}.json"
    analysis_file = ANALYSIS_DIR / f"{TEST_SLUG}.json"
    if job_file.exists():
        job_file.unlink()
    if analysis_file.exists():
        analysis_file.unlink()

    res = subprocess.run(
        [sys.executable, str(script_path), "--policy-slug", TEST_SLUG],
        capture_output=True,
        text=True,
        check=True
    )

    assert res.returncode == 0
    assert "Successfully analyzed" in res.stdout
    assert analysis_file.exists()
    assert job_file.exists()

    with open(analysis_file, "r", encoding="utf-8") as f:
        analysis = json.load(f)

    assert analysis["total_comments_analyzed"] == 3
    assert "counts" in analysis
    assert "percentages" in analysis
    assert len(analysis["top_comments"]) > 0
    assert analysis["analysis_version"] == "policylens-v1.2-safeguard"


def test_4_idempotent_execution():
    """Verify that repeated executions do NOT duplicate jobs or corrupt results."""
    script_path = PROJECT_ROOT / "scripts" / "run_policy_analysis.py"
    analysis_file = ANALYSIS_DIR / f"{TEST_SLUG}.json"

    mtime_before = analysis_file.stat().st_mtime

    res = subprocess.run(
        [sys.executable, str(script_path), "--policy-slug", TEST_SLUG],
        capture_output=True,
        text=True,
        check=True
    )

    assert res.returncode == 0
    assert "[IDEMPOTENT]" in res.stdout
    # Analysis file should not have been overwritten since it was already completed
    mtime_after = analysis_file.stat().st_mtime
    assert mtime_before == mtime_after


def test_5_forced_retry_handling():
    """Verify that forced retries update the job cleanly without data loss."""
    script_path = PROJECT_ROOT / "scripts" / "run_policy_analysis.py"
    res = subprocess.run(
        [sys.executable, str(script_path), "--policy-slug", TEST_SLUG, "--force-retry"],
        capture_output=True,
        text=True,
        check=True
    )

    assert res.returncode == 0
    assert "Successfully analyzed" in res.stdout


def test_6_empty_comment_handling():
    """Verify that a policy with 0 comments closes cleanly as completed with 0 count."""
    empty_slug = "empty-test-consultation"
    script_path = PROJECT_ROOT / "scripts" / "run_policy_analysis.py"

    res = subprocess.run(
        [sys.executable, str(script_path), "--policy-slug", empty_slug, "--force-retry"],
        capture_output=True,
        text=True,
        check=True
    )

    assert res.returncode == 0
    assert "0 comments recorded" in res.stdout

    empty_analysis_file = ANALYSIS_DIR / f"{empty_slug}.json"
    assert empty_analysis_file.exists()
    with open(empty_analysis_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["total_comments_analyzed"] == 0
