"""
End-to-End Frontend Authentication & Session Integration Tests
Verifies that the registration, login, profile, and logout flows
match the user-facing UI contract and backend API behavior.
"""

import json
import subprocess
import time
import urllib.error
import urllib.request
import pytest

BASE_URL = "http://localhost:3000"


def send_http_request(
    path: str,
    data: dict = None,
    method: str = "GET",
    cookie: str = None,
    client_ip: str = None
) -> tuple[int, dict | str, dict]:
    """Helper to send HTTP requests and return (status, parsed_body_or_text, headers)."""
    url = f"{BASE_URL}{path}"
    body_bytes = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body_bytes, method=method)
    
    if data is not None:
        req.add_header("Content-Type", "application/json")
    if cookie:
        req.add_header("Cookie", cookie)
    if client_ip:
        req.add_header("X-Forwarded-For", client_ip)

    headers_out = {}
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status = response.status
            raw_text = response.read().decode("utf-8")
            for k, v in response.headers.items():
                headers_out[k.lower()] = v
            try:
                parsed = json.loads(raw_text) if raw_text else {}
            except json.JSONDecodeError:
                parsed = raw_text
            return status, parsed, headers_out
    except urllib.error.HTTPError as err:
        status = err.code
        raw_text = err.read().decode("utf-8")
        for k, v in err.headers.items():
            headers_out[k.lower()] = v
        try:
            parsed = json.loads(raw_text) if raw_text else {}
        except json.JSONDecodeError:
            parsed = raw_text
        return status, parsed, headers_out


def extract_cookie(headers: dict, cookie_name: str = "policylens_session") -> str:
    """Extracts cookie string from response headers."""
    set_cookie = headers.get("set-cookie", "")
    if cookie_name in set_cookie:
        for part in set_cookie.split(";"):
            if cookie_name in part:
                return part.strip()
    return ""


class TestFrontendAuthFlow:
    """Test suite for Phase 3 UI and API integration."""

    test_timestamp = int(time.time() * 1000)
    test_user_name = "Dev Citizen Integration"
    test_email = f"citizen-ui-{test_timestamp}@example.com"
    test_password = "SecurePassword123!@#"
    test_category = "Citizen / Beneficiary"

    @classmethod
    def ip(cls, sub: int) -> str:
        return f"10.{(cls.test_timestamp % 200) + 1}.{sub}.1"

    def test_1_login_page_renders_accessible_form(self):
        """GET /login renders the redesigned/connected login form with expected controls."""
        status, body, _ = send_http_request("/login")
        assert status == 200
        assert isinstance(body, str)
        assert "Sign in to your account" in body
        assert "Email address" in body
        assert "Password" in body
        assert "Register here" in body

    def test_2_register_page_renders_accessible_form(self):
        """GET /register renders the connected registration form."""
        status, body, _ = send_http_request("/register")
        assert status == 200
        assert isinstance(body, str)
        assert "Create a Citizen Account" in body
        assert "Full name" in body
        assert "Citizen Category" in body
        assert "Sign in" in body

    def test_3_profile_page_unauthenticated_renders_sign_in_call_to_action(self):
        """GET /profile without a cookie shows the 'You are not signed in' prompt."""
        status, body, _ = send_http_request("/profile")
        assert status == 200
        assert isinstance(body, str)
        assert "Your profile, your voice" in body
        assert "You are not signed in" in body
        assert "Sign in" in body
        assert "Create account" in body

    def test_4_registration_connects_successfully_and_sets_cookie(self):
        """POST /api/auth/register creates user, returns sanitized data, and sets HttpOnly cookie."""
        payload = {
            "name": self.test_user_name,
            "email": self.test_email,
            "stakeholderType": self.test_category,
            "password": self.test_password
        }
        status, body, headers = send_http_request(
            "/api/auth/register",
            data=payload,
            method="POST",
            client_ip=self.ip(1)
        )
        assert status == 201
        assert isinstance(body, dict)
        assert body.get("success") is True
        user = body.get("user", {})
        assert user.get("email") == self.test_email
        assert user.get("role") == "CITIZEN"
        assert "password" not in user
        assert "passwordHash" not in user

        # Mandatory verification: registration must NOT set a session cookie
        cookie = extract_cookie(headers)
        assert cookie == ""
        assert body.get("requiresVerification") is True

    def test_5_duplicate_registration_returns_clean_error(self):
        """POST /api/auth/register rejects duplicate registration with 409 ACCOUNT_EXISTS."""
        payload = {
            "name": "Duplicate Attempt",
            "email": self.test_email,
            "password": self.test_password
        }
        status, body, _ = send_http_request(
            "/api/auth/register",
            data=payload,
            method="POST",
            client_ip=self.ip(2)
        )
        assert status == 409
        assert isinstance(body, dict)
        assert body.get("error") == "ACCOUNT_EXISTS"

    def test_6_session_verification_via_auth_me(self):
        """GET /api/auth/me returns authenticated citizen profile matching registered user."""
        # 1. Verify account in DB to enable login
        subprocess.run(
            ["node", "-e", f"const {{ PrismaClient }} = require('@prisma/client'); const p = new PrismaClient(); p.user.update({{ where: {{ email: '{self.test_email}' }}, data: {{ isEmailVerified: true }} }}).then(() => p.$disconnect());"],
            cwd="/Users/pankaj/Desktop/Project/major project/Code/frontend",
            check=True
        )

        # 2. Log in to get fresh session
        _, _, login_headers = send_http_request(
            "/api/auth/login",
            data={"email": self.test_email, "password": self.test_password},
            method="POST",
            client_ip=self.ip(3)
        )
        cookie = extract_cookie(login_headers)
        assert cookie != ""

        status, body, _ = send_http_request(
            "/api/auth/me",
            method="GET",
            cookie=cookie
        )
        assert status == 200
        assert isinstance(body, dict)
        assert body.get("authenticated") is True
        user = body.get("user", {})
        assert user.get("email") == self.test_email
        assert user.get("role") == "CITIZEN"

    def test_7_invalid_credentials_returns_generic_error(self):
        """POST /api/auth/login returns generic error on wrong password."""
        status, body, _ = send_http_request(
            "/api/auth/login",
            data={"email": self.test_email, "password": "WrongPassword999!"},
            method="POST",
            client_ip=self.ip(4)
        )
        assert status == 401
        assert isinstance(body, dict)
        assert body.get("error") == "INVALID_CREDENTIALS"
        assert body.get("message") == "Invalid email or password."

    def test_8_logout_revokes_session_and_clears_cookie(self):
        """POST /api/auth/logout invalidates session in DB and instructs browser to delete cookie."""
        # 1. Login
        _, _, login_headers = send_http_request(
            "/api/auth/login",
            data={"email": self.test_email, "password": self.test_password},
            method="POST",
            client_ip=self.ip(5)
        )
        cookie = extract_cookie(login_headers)
        assert cookie != ""

        # 2. Logout
        status, body, logout_headers = send_http_request(
            "/api/auth/logout",
            data={},
            method="POST",
            cookie=cookie
        )
        assert status == 200
        assert isinstance(body, dict)
        assert body.get("success") is True
        set_cookie = logout_headers.get("set-cookie", "").lower()
        assert "max-age=0" in set_cookie or "expires=" in set_cookie

        # 3. Old cookie is revoked
        status_after, body_after, _ = send_http_request(
            "/api/auth/me",
            method="GET",
            cookie=cookie
        )
        assert status_after == 200
        assert body_after.get("authenticated") is False
        assert body_after.get("user") is None
