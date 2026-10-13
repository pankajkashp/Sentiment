"""
PolicyLens — API Security and Path Traversal Regression Test Suite

Verifies security containment across /api/policies/[slug]/ routes:
1. Rejection of directory traversal attempts (../, ..%, dots, slashes).
2. Rejection of malformed, uppercase, special-character, or out-of-boundary slugs.
3. Proper handling of unknown policy identifiers (HTTP 404).
4. Safe disabling of external analysis triggers (HTTP 403, no subprocess execution).
5. Acceptance of legitimate verified policy identifiers (HTTP 200).
"""

import re
import urllib.request
import urllib.error
import json
import pytest

POLICY_SLUG_REGEX = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
BASE_URL = "http://localhost:3000"


def is_server_running() -> bool:
    """Checks if the Next.js frontend server is running locally."""
    try:
        req = urllib.request.Request(
            f"{BASE_URL}/api/policies/prahaar-counter-terrorism-policy/status",
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=2) as response:
            return response.status == 200
    except Exception:
        return False


def test_slug_format_validation_valid():
    """Verify that legitimate kebab-case policy slugs match the policy regex."""
    valid_slugs = [
        "prahaar-counter-terrorism-policy",
        "special-campaign-6-mha",
        "national-drug-control-vision-2026-2029",
        "ai-enabled-cyber-crime-prevention",
        "immigration-visa-foreigners-registration-tracking",
        "digital-public-infrastructure-india-stack",
        "test-policy-123",
    ]
    for slug in valid_slugs:
        assert POLICY_SLUG_REGEX.match(slug) is not None, f"Expected valid: {slug}"
        assert 3 <= len(slug) <= 100


def test_slug_format_validation_traversal_attempts():
    """Verify that directory traversal sequences fail slug validation."""
    traversal_attempts = [
        "../",
        "../../",
        "../../etc/passwd",
        "..%2f..%2f",
        "..%252f..%252f",
        ".",
        "..",
        "/root/policy",
        "c:\\windows\\system32",
        "submissions/../../secret",
        "policy/subfolder",
    ]
    for attempt in traversal_attempts:
        assert POLICY_SLUG_REGEX.match(attempt) is None, f"Expected rejected: {attempt}"


def test_slug_format_validation_malformed():
    """Verify that special characters, uppercase, and spaces fail slug validation."""
    malformed = [
        "",
        "-leading-hyphen",
        "trailing-hyphen-",
        "double--hyphen",
        "UPPERCASE-SLUG",
        "MixedCase-slug",
        "policy with spaces",
        "policy_with_underscores",
        "policy@name",
        "policy#1",
        "policy.json",
        "policy\x00nullbyte",
    ]
    for item in malformed:
        assert POLICY_SLUG_REGEX.match(item) is None, f"Expected rejected: {item}"


@pytest.mark.skipif(not is_server_running(), reason="Frontend server not running on port 3000")
class TestLiveEndpointSecurity:
    """Integration security tests executed against the live Next.js API server."""

    def test_path_traversal_rejection_comments_get(self):
        """GET /api/policies/[slug]/comments with traversal returns 400 Bad Request."""
        url = f"{BASE_URL}/api/policies/..%2F..%2Fpackage/comments"
        req = urllib.request.Request(url, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=3) as resp:
                pytest.fail(f"Expected 400, got status {resp.status}")
        except urllib.error.HTTPError as e:
            assert e.code == 400
            data = json.loads(e.read().decode())
            assert data.get("error") == "INVALID_SLUG"

    def test_path_traversal_rejection_status_get(self):
        """GET /api/policies/[slug]/status with traversal returns 400 Bad Request."""
        url = f"{BASE_URL}/api/policies/..%2F..%2Fdata/status"
        req = urllib.request.Request(url, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=3) as resp:
                pytest.fail(f"Expected 400, got status {resp.status}")
        except urllib.error.HTTPError as e:
            assert e.code == 400
            data = json.loads(e.read().decode())
            assert data.get("error") == "INVALID_SLUG"

    def test_path_traversal_rejection_analysis_get(self):
        """GET /api/policies/[slug]/analysis with traversal returns 400 Bad Request."""
        url = f"{BASE_URL}/api/policies/..%2F..%2Fdata/analysis"
        req = urllib.request.Request(url, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=3) as resp:
                pytest.fail(f"Expected 400, got status {resp.status}")
        except urllib.error.HTTPError as e:
            assert e.code == 400
            data = json.loads(e.read().decode())
            assert data.get("error") == "INVALID_SLUG"

    def test_unknown_policy_slug_returns_404(self):
        """GET /api/policies/[slug]/status with unknown formatted slug returns 404."""
        url = f"{BASE_URL}/api/policies/unknown-valid-format-policy/status"
        req = urllib.request.Request(url, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=3) as resp:
                pytest.fail(f"Expected 404, got status {resp.status}")
        except urllib.error.HTTPError as e:
            assert e.code == 404
            data = json.loads(e.read().decode())
            assert data.get("error") == "POLICY_NOT_FOUND"

    def test_external_trigger_analysis_is_disabled(self):
        """POST /api/policies/[slug]/trigger-analysis is safely rejected with 403."""
        url = f"{BASE_URL}/api/policies/prahaar-counter-terrorism-policy/trigger-analysis"
        req = urllib.request.Request(url, method="POST", data=b"{}")
        req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=3) as resp:
                pytest.fail(f"Expected 403, got status {resp.status}")
        except urllib.error.HTTPError as e:
            assert e.code == 403
            data = json.loads(e.read().decode())
            assert data.get("error") == "EXTERNAL_TRIGGER_DISABLED"
            assert "disabled" in data.get("message", "").lower()

    def test_legitimate_policy_status_returns_200(self):
        """GET /api/policies/[slug]/status for verified policy returns 200."""
        url = f"{BASE_URL}/api/policies/prahaar-counter-terrorism-policy/status"
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=3) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode())
            assert data.get("slug") == "prahaar-counter-terrorism-policy"
            assert "isCommentingOpen" in data

    def test_legitimate_policy_comments_returns_200(self):
        """GET /api/policies/[slug]/comments for verified policy returns 200."""
        url = f"{BASE_URL}/api/policies/prahaar-counter-terrorism-policy/comments"
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=3) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode())
            assert data.get("slug") == "prahaar-counter-terrorism-policy"
            assert isinstance(data.get("submissions"), list)
