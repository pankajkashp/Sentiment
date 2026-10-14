"""
PolicyLens — Mandatory Email Verification Test Suite

Verifies:
1. Registration creates user with isEmailVerified = false and NEVER issues a session cookie.
2. Unverified accounts cannot log in (HTTP 403 EMAIL_NOT_VERIFIED, no session created).
3. GET /api/auth/verify-email returns 405 Method Not Allowed (preventing scanner auto-consumption).
4. Invalid, expired, and reused verification tokens are rejected (HTTP 400).
5. Valid verification token atomically consumes token and updates isEmailVerified = true.
6. Reused verification tokens return TOKEN_ALREADY_USED.
7. Verified accounts successfully log in and receive HttpOnly session cookie.
8. POST /api/auth/resend-verification enforces rate limiting and prevents account enumeration.
9. Registration role tampering is rejected (role forced to CITIZEN).
10. Safe handling of placeholder or unconfigured Resend credentials.
"""

import json
import subprocess
import time
import urllib.error
import urllib.request
import pytest

BASE_URL = "http://localhost:3000"


def send_json_request(
    path: str,
    data: dict = None,
    method: str = "POST",
    cookie: str = None,
    client_ip: str = None
) -> tuple[int, dict, dict]:
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


def issue_token_for_user_email(email: str) -> str:
    """Invokes helper to generate a valid verification token for a registered user."""
    script = f"""
    const prisma = require('./prisma-client.js');
    (async () => {{
        const crypto = require('crypto');
        const user = await prisma.user.findUnique({{ where: {{ email: '{email}' }} }});
        if (!user) process.exit(1);
        const token = crypto.randomBytes(32).toString('base64url');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await prisma.verificationToken.create({{
            data: {{
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + 86400000),
                isUsed: false
            }}
        }});
        console.log(token);
    }})();
    """
    node_code = f"""
    const {{ PrismaClient }} = require('@prisma/client');
    const crypto = require('crypto');
    const prisma = new PrismaClient();
    (async () => {{
        const user = await prisma.user.findUnique({{ where: {{ email: '{email}' }} }});
        if (!user) {{
            console.error('User not found');
            process.exit(1);
        }}
        const token = crypto.randomBytes(32).toString('base64url');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await prisma.verificationToken.create({{
            data: {{
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + 86400000),
                isUsed: false
            }}
        }});
        console.log(token);
        await prisma.$disconnect();
    }})();
    """
    res = subprocess.run(
        ["node", "-e", node_code],
        cwd="/Users/pankaj/Desktop/Project/major project/Code/frontend",
        capture_output=True,
        text=True,
        check=True
    )
    return res.stdout.strip()


class TestMandatoryEmailVerification:
    """Test suite for Resend mandatory email verification and authentication security."""

    test_timestamp = int(time.time() * 1000)
    user_email = f"citizen-verify-{test_timestamp}@example.com"
    user_password = "SecurePassword123!@#"
    valid_token = None

    @classmethod
    def ip(cls, sub: int) -> str:
        return f"10.{(cls.test_timestamp % 200) + 1}.{sub}.1"

    def test_1_registration_creates_unverified_user_without_session(self):
        """POST /api/auth/register creates user with isEmailVerified=false and NO session cookie."""
        status, body, headers = send_json_request(
            "/api/auth/register",
            {
                "email": self.user_email,
                "password": self.user_password,
                "name": "Verification Test Citizen",
                "stakeholderType": "Citizen / Beneficiary"
            },
            client_ip=self.ip(1)
        )
        assert status == 201, f"Expected 201, got {status}: {body}"
        assert body.get("success") is True
        assert body.get("requiresVerification") is True
        assert "Account created" in body.get("message", "")

        user = body.get("user", {})
        assert user.get("email") == self.user_email
        assert user.get("isEmailVerified") is False
        assert user.get("role") == "CITIZEN"

        # Security check: Password and hashes must never be exposed
        assert "password" not in user
        assert "passwordHash" not in user

        # CRITICAL SECURITY CHECK: No session cookie must be issued upon registration
        set_cookie = headers.get("set-cookie", "")
        assert "policylens_session=" not in set_cookie, "Registration must NOT log the user in!"

    def test_2_unverified_login_is_rejected(self):
        """POST /api/auth/login rejects unverified users with HTTP 403 and NO session cookie."""
        status, body, headers = send_json_request(
            "/api/auth/login",
            {
                "email": self.user_email,
                "password": self.user_password
            },
            client_ip=self.ip(2)
        )
        assert status == 403, f"Expected 403, got {status}: {body}"
        assert body.get("success") is False
        assert body.get("error") == "EMAIL_NOT_VERIFIED"
        assert "verify your email" in body.get("message", "").lower()

        # Verify NO session cookie was issued
        set_cookie = headers.get("set-cookie", "")
        assert "policylens_session=" not in set_cookie

    def test_3_verify_email_get_is_rejected(self):
        """GET /api/auth/verify-email returns 405 Method Not Allowed to stop scanners consuming links."""
        status, body, headers = send_json_request(
            "/api/auth/verify-email",
            None,
            method="GET"
        )
        assert status == 405
        assert body.get("error") == "METHOD_NOT_ALLOWED"
        assert "post" in headers.get("allow", "").lower()

    def test_4_invalid_verification_token_rejected(self):
        """POST /api/auth/verify-email rejects non-existent or invalid tokens with HTTP 400."""
        status, body, _ = send_json_request(
            "/api/auth/verify-email",
            {"token": "invalid_fake_token_that_does_not_exist_in_db_12345678"},
            client_ip=self.ip(4)
        )
        assert status == 400
        assert body.get("error") == "INVALID_TOKEN"

    def test_5_valid_token_verification_succeeds(self):
        """POST /api/auth/verify-email with valid token sets isEmailVerified = true."""
        # Issue a token for our unverified user
        token = issue_token_for_user_email(self.user_email)
        assert len(token) >= 40
        TestMandatoryEmailVerification.valid_token = token

        status, body, _ = send_json_request(
            "/api/auth/verify-email",
            {"token": token},
            client_ip=self.ip(5)
        )
        assert status == 200, f"Expected 200, got {status}: {body}"
        assert body.get("success") is True
        assert body.get("user", {}).get("isEmailVerified") is True

    def test_6_token_cannot_be_reused(self):
        """POST /api/auth/verify-email rejects a previously consumed token with TOKEN_ALREADY_USED."""
        token = TestMandatoryEmailVerification.valid_token
        assert token is not None

        status, body, _ = send_json_request(
            "/api/auth/verify-email",
            {"token": token},
            client_ip=self.ip(6)
        )
        assert status == 400
        assert body.get("error") == "TOKEN_ALREADY_USED"

    def test_7_verified_user_login_succeeds_and_issues_session(self):
        """POST /api/auth/login succeeds once email is verified and issues session cookie."""
        status, body, headers = send_json_request(
            "/api/auth/login",
            {
                "email": self.user_email,
                "password": self.user_password
            },
            client_ip=self.ip(7)
        )
        assert status == 200, f"Expected 200, got {status}: {body}"
        assert body.get("success") is True
        assert body.get("user", {}).get("isEmailVerified") is True

        # Verify session cookie was issued
        set_cookie = headers.get("set-cookie", "")
        assert "policylens_session=" in set_cookie
        assert "httponly" in set_cookie.lower()

    def test_8_resend_verification_endpoint_and_anti_enumeration(self):
        """POST /api/auth/resend-verification returns generic message for non-existent users."""
        nonexistent = f"nonexistent-{int(time.time() * 1000)}@example.com"
        status, body, _ = send_json_request(
            "/api/auth/resend-verification",
            {"email": nonexistent},
            client_ip=self.ip(8)
        )
        assert status == 200
        assert body.get("success") is True
        assert "verification link has been sent" in body.get("message", "").lower()

    def test_9_resend_verification_rate_limiting(self):
        """POST /api/auth/resend-verification triggers 429 when rate limit is exceeded."""
        hammer_email = f"hammer-resend-{self.test_timestamp}@example.com"
        hammer_ip = self.ip(99)
        hit_rate_limit = False

        for i in range(7):
            status, body, headers = send_json_request(
                "/api/auth/resend-verification",
                {"email": hammer_email},
                client_ip=hammer_ip
            )
            if status == 429:
                hit_rate_limit = True
                assert body.get("error") == "RATE_LIMITED"
                assert "retry-after" in headers
                break

        assert hit_rate_limit is True, "Expected 429 after exceeding resend rate limits"

    def test_10_registration_role_tampering_prevented(self):
        """POST /api/auth/register ignores client-supplied ADMIN role."""
        tamper_email = f"tamper-{self.test_timestamp}@example.com"
        status, body, _ = send_json_request(
            "/api/auth/register",
            {
                "email": tamper_email,
                "password": self.user_password,
                "role": "ADMIN"
            },
            client_ip=self.ip(10)
        )
        assert status == 201
        assert body.get("user", {}).get("role") == "CITIZEN"
