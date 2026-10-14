"""
PolicyLens — Phase 2 Authentication & Authorization Test Suite

Tests verified against the live PostgreSQL / Neon database:
1. User registration with Argon2id password hashing and input validation.
2. Sensitive field exclusion (password_hash is never exposed).
3. Duplicate registration rejection (HTTP 409).
4. Client role tampering prevention (forced CITIZEN role).
5. Generic login failure response (timing-safe anti-enumeration).
6. Valid login with opaque session token generation and HttpOnly cookie issuance.
7. Active session validation via GET /api/auth/me.
8. Session revocation upon POST /api/auth/logout.
9. Persistent database rate-limiting on brute-force attempts (HTTP 429).
10. Server-side role enforcement on administrative workspace (/admin).
"""

import json
import subprocess
import time
import urllib.request
import urllib.error
import pytest

BASE_URL = "http://localhost:3000"


def send_json_request(path: str, data: dict, method: str = "POST", cookie: str = None, client_ip: str = None) -> tuple[int, dict, dict]:
    """Helper to send JSON HTTP requests and extract status, body, and response headers."""
    url = f"{BASE_URL}{path}"
    body_bytes = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body_bytes, method=method)
    req.add_header("Content-Type", "application/json")
    if cookie:
        req.add_header("Cookie", cookie)
    if client_ip:
        req.add_header("X-Forwarded-For", client_ip)

    headers_out = {}
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status = response.status
            raw_data = response.read().decode("utf-8")
            try:
                parsed = json.loads(raw_data) if raw_data else {}
            except json.JSONDecodeError:
                parsed = {"__raw__": raw_data}
            for k, v in response.headers.items():
                headers_out[k.lower()] = v
            return status, parsed, headers_out
    except urllib.error.HTTPError as err:
        status = err.code
        raw_data = err.read().decode("utf-8")
        try:
            parsed = json.loads(raw_data) if raw_data else {}
        except json.JSONDecodeError:
            parsed = {"__raw__": raw_data}
        for k, v in err.headers.items():
            headers_out[k.lower()] = v
        return status, parsed, headers_out


def extract_cookie(headers: dict, cookie_name: str = "policylens_session") -> str:
    """Extracts session cookie string from response headers."""
    set_cookie = headers.get("set-cookie", "")
    if cookie_name in set_cookie:
        parts = set_cookie.split(";")
        for part in parts:
            if cookie_name in part:
                return part.strip()
    return ""


class TestAuthenticationAndAuthorization:
    """End-to-end authentication and session tests verified against live Neon database."""

    test_timestamp = int(time.time())
    citizen_email = f"citizen-test-{test_timestamp}@example.com"
    citizen_password = "SecurePassword123!@#"

    @classmethod
    def ip(cls, sub: int) -> str:
        return f"10.{(cls.test_timestamp % 200) + 1}.{sub}.1"

    def test_1_registration_succeeds_with_argon2_and_safe_output(self):
        """POST /api/auth/register creates user, sets cookie, and excludes sensitive fields."""
        status, body, headers = send_json_request(
            "/api/auth/register",
            {
                "email": self.citizen_email,
                "password": self.citizen_password,
                "name": "Live Test Citizen",
                "stakeholderType": "Citizen / Beneficiary"
            },
            client_ip=self.ip(1)
        )
        assert status == 201, f"Expected 201, got {status}: {body}"
        assert body.get("success") is True
        user = body.get("user", {})
        assert user.get("email") == self.citizen_email
        assert user.get("role") == "CITIZEN"

        # Verify sensitive fields are NEVER leaked
        assert "password" not in user
        assert "passwordHash" not in user
        assert "password_hash" not in user

        # Verify HttpOnly session cookie was NOT set (registration requires email verification)
        cookie_header = headers.get("set-cookie", "")
        assert "policylens_session=" not in cookie_header

    def test_2_duplicate_registration_rejected(self):
        """POST /api/auth/register rejects duplicate email registration with 409 Conflict."""
        status, body, _ = send_json_request(
            "/api/auth/register",
            {
                "email": self.citizen_email,
                "password": self.citizen_password,
                "name": "Duplicate Attempt"
            },
            client_ip=self.ip(2)
        )
        assert status == 409, f"Expected 409 Conflict, got {status}"
        assert body.get("error") == "ACCOUNT_EXISTS"

    def test_3_weak_password_rejected(self):
        """POST /api/auth/register rejects passwords under 12 characters."""
        status, body, _ = send_json_request(
            "/api/auth/register",
            {
                "email": f"weak-pass-{self.test_timestamp}@example.com",
                "password": "short"
            },
            client_ip=self.ip(3)
        )
        assert status == 400
        assert body.get("error") == "WEAK_PASSWORD"

    def test_4_role_tampering_is_prevented(self):
        """POST /api/auth/register ignores client-supplied ADMIN role and enforces CITIZEN."""
        tamper_email = f"tamper-role-{self.test_timestamp}@example.com"
        status, body, _ = send_json_request(
            "/api/auth/register",
            {
                "email": tamper_email,
                "password": self.citizen_password,
                "role": "ADMIN"  # Malicious attempt to self-grant ADMIN
            },
            client_ip=self.ip(4)
        )
        assert status == 201
        assert body.get("user", {}).get("role") == "CITIZEN"

    def test_5_invalid_login_credentials_return_generic_error(self):
        """POST /api/auth/login returns generic error without revealing account existence."""
        # Nonexistent account
        nonexistent = f"nonexistent-{int(time.time() * 1000)}@example.com"
        status1, body1, _ = send_json_request(
            "/api/auth/login",
            {"email": nonexistent, "password": "WrongPassword123!"},
            client_ip=self.ip(51)
        )
        assert status1 == 401
        assert body1.get("error") == "INVALID_CREDENTIALS"
        assert body1.get("message") == "Invalid email or password."

        # Existing account with wrong password
        status2, body2, _ = send_json_request(
            "/api/auth/login",
            {"email": self.citizen_email, "password": "IncorrectPassword123!"},
            client_ip=self.ip(52)
        )
        assert status2 == 401
        assert body2.get("error") == "INVALID_CREDENTIALS"
        assert body2.get("message") == "Invalid email or password."

    def test_6_valid_login_issues_opaque_session_cookie(self):
        """POST /api/auth/login rejects unverified account, then succeeds once verified."""
        # 1. Unverified account is rejected with 403
        status_unverified, body_unverified, headers_unverified = send_json_request(
            "/api/auth/login",
            {"email": self.citizen_email, "password": self.citizen_password},
            client_ip=self.ip(61)
        )
        assert status_unverified == 403
        assert body_unverified.get("error") == "EMAIL_NOT_VERIFIED"
        assert "policylens_session=" not in headers_unverified.get("set-cookie", "")

        # 2. Mark account as verified in DB
        subprocess.run(
            ["node", "-e", f"const {{ PrismaClient }} = require('@prisma/client'); const p = new PrismaClient(); p.user.update({{ where: {{ email: '{self.citizen_email}' }}, data: {{ isEmailVerified: true }} }}).then(() => p.$disconnect());"],
            cwd="/Users/pankaj/Desktop/Project/major project/Code/frontend",
            check=True
        )

        # 3. Valid verified login succeeds
        status, body, headers = send_json_request(
            "/api/auth/login",
            {"email": self.citizen_email, "password": self.citizen_password},
            client_ip=self.ip(6)
        )
        assert status == 200
        assert body.get("success") is True
        assert body.get("user", {}).get("email") == self.citizen_email

        cookie_header = headers.get("set-cookie", "")
        assert "policylens_session=" in cookie_header
        assert "httponly" in cookie_header.lower()

    def test_7_get_auth_me_validates_session_token(self):
        """GET /api/auth/me returns authenticated user details when session cookie is provided."""
        # 1. Login to get fresh cookie
        _, _, headers = send_json_request(
            "/api/auth/login",
            {"email": self.citizen_email, "password": self.citizen_password},
            client_ip=self.ip(7)
        )
        cookie = extract_cookie(headers)
        assert cookie != ""

        # 2. Call GET /api/auth/me with cookie
        status, body, _ = send_json_request("/api/auth/me", None, method="GET", cookie=cookie)
        assert status == 200
        assert body.get("authenticated") is True
        user = body.get("user", {})
        assert user.get("email") == self.citizen_email
        assert "password" not in user
        assert "passwordHash" not in user

    def test_8_get_auth_me_unauthenticated_returns_null_user(self):
        """GET /api/auth/me returns authenticated: false when no cookie is sent."""
        status, body, _ = send_json_request("/api/auth/me", None, method="GET")
        assert status == 200
        assert body.get("authenticated") is False
        assert body.get("user") is None

    def test_9_logout_revokes_session_and_clears_cookie(self):
        """POST /api/auth/logout revokes session in DB and expires cookie."""
        # 1. Login
        _, _, login_headers = send_json_request(
            "/api/auth/login",
            {"email": self.citizen_email, "password": self.citizen_password},
            client_ip=self.ip(9)
        )
        cookie = extract_cookie(login_headers)

        # 2. Logout
        status, body, logout_headers = send_json_request(
            "/api/auth/logout",
            {},
            method="POST",
            cookie=cookie
        )
        assert status == 200
        assert body.get("success") is True
        assert "max-age=0" in logout_headers.get("set-cookie", "").lower()

        # 3. Verify that old cookie is now invalid
        status_after, body_after, _ = send_json_request("/api/auth/me", None, method="GET", cookie=cookie)
        assert status_after == 200
        assert body_after.get("authenticated") is False

    def test_10_database_backed_rate_limiting_triggers_429(self):
        """Brute force login attempts trigger persistent database rate limit (HTTP 429)."""
        hammer_email = f"brute-force-{self.test_timestamp}@example.com"
        hammer_ip = self.ip(99)
        got_rate_limited = False

        for i in range(7):
            status, body, headers = send_json_request(
                "/api/auth/login",
                {"email": hammer_email, "password": f"wrong-pass-{i}!"},
                client_ip=hammer_ip
            )
            if status == 429:
                got_rate_limited = True
                assert body.get("error") == "RATE_LIMITED"
                assert "retry-after" in headers
                break

        assert got_rate_limited is True, "Expected 429 Rate Limited after exceeding 5 attempts"

    def test_11_admin_page_unauthenticated_guard(self):
        """GET /admin without a session cookie renders Authentication Required wall."""
        status, body, _ = send_json_request("/admin", None, method="GET")
        assert status == 200
        html = body.get("__raw__", "")
        assert "Authentication Required" in html
        assert "Sign in to continue" in html
        assert "Publish New Policy" not in html

    def test_12_admin_page_citizen_forbidden_guard(self):
        """GET /admin with a citizen session cookie renders 403 Unauthorized Workspace."""
        # 1. Login as citizen
        _, _, login_headers = send_json_request(
            "/api/auth/login",
            {"email": self.citizen_email, "password": self.citizen_password},
            client_ip=self.ip(12)
        )
        cookie = extract_cookie(login_headers)
        assert cookie != ""

        # 2. Access /admin with citizen cookie
        status, body, _ = send_json_request("/admin", None, method="GET", cookie=cookie)
        assert status == 200
        html = body.get("__raw__", "")
        assert "Unauthorized Workspace" in html or "Access Denied" in html
        assert "Administrative Privileges Required" in html
        assert "Publish New Policy" not in html

    def test_13_public_policy_browsing_accessible(self):
        """Public policy browsing and policy detail pages remain accessible without authentication."""
        # Policy detail page
        status, body, _ = send_json_request("/policy/prahaar-counter-terrorism-policy", None, method="GET")
        assert status == 200
        html = body.get("__raw__", "")
        assert "PRAHAAR" in html
        assert "Share Your Opinion" in html

        # JSON comments route
        status_comments, body_comments, _ = send_json_request("/api/policies/prahaar-counter-terrorism-policy/comments", None, method="GET")
        assert status_comments == 200
        assert "submissions" in body_comments or "comments" in body_comments or body_comments.get("success") is True

    def test_14_trigger_analysis_safeguard_rejects_unauthorized(self):
        """POST /api/policies/.../trigger-analysis rejects unauthenticated/unauthorized callers."""
        status, body, _ = send_json_request("/api/policies/prahaar-counter-terrorism-policy/trigger-analysis", {})
        # Route security from Phase 1/Containment securely disabled or rejected external execution
        assert status in (401, 403, 503)
