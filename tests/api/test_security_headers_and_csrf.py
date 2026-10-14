"""
PolicyLens — Security Headers and CSRF Protection Test Suite

Verifies:
1. HTTP Security Headers:
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy restricts sensitive device APIs
   - Content-Security-Policy specifies safe script, style, font, image, and frame policies
   - Absence of X-Powered-By header
2. Cross-Site Request Forgery (CSRF) Defense:
   - Rejection of cross-origin state-changing POST requests (HTTP 403)
   - Rejection of Sec-Fetch-Site: cross-site requests (HTTP 403)
   - Rejection of cross-origin Referer headers when Origin is omitted (HTTP 403)
   - Rejection of malformed Origin values (HTTP 400)
   - Acceptance of legitimate same-origin requests (HTTP 200)
   - Acceptance of non-browser internal requests without Origin (HTTP 200)
"""

import json
import urllib.request
import urllib.error
import pytest

BASE_URL = "http://localhost:3000"


def send_raw_request(path: str, method: str = "GET", headers: dict = None, data: dict = None):
    url = f"{BASE_URL}{path}"
    req_headers = {"User-Agent": "PolicyLens-Security-Audit-Runner"}
    if headers:
        req_headers.update(headers)

    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        if "Content-Type" not in req_headers:
            req_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            resp_body = response.read().decode("utf-8")
            resp_headers = {k.lower(): v for k, v in response.headers.items()}
            try:
                parsed_body = json.loads(resp_body)
            except json.JSONDecodeError:
                parsed_body = resp_body
            return response.status, parsed_body, resp_headers
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode("utf-8")
        resp_headers = {k.lower(): v for k, v in e.headers.items()}
        try:
            parsed_body = json.loads(resp_body)
        except json.JSONDecodeError:
            parsed_body = resp_body
        return e.code, parsed_body, resp_headers


class TestSecurityHeaders:
    """Verifies that all required HTTP security headers are returned."""

    def test_1_root_page_has_all_required_security_headers(self):
        status, _, headers = send_raw_request("/")
        assert status == 200

        # 1. X-Frame-Options
        assert headers.get("x-frame-options") == "DENY"

        # 2. X-Content-Type-Options
        assert headers.get("x-content-type-options") == "nosniff"

        # 3. Referrer-Policy
        assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"

        # 4. Permissions-Policy
        perm_policy = headers.get("permissions-policy", "")
        assert "camera=()" in perm_policy
        assert "microphone=()" in perm_policy
        assert "geolocation=()" in perm_policy

        # 5. Content-Security-Policy
        csp = headers.get("content-security-policy", "")
        assert "default-src 'self'" in csp
        assert "frame-ancestors 'none'" in csp
        assert "form-action 'self'" in csp
        assert "base-uri 'self'" in csp
        assert "object-src 'none'" in csp

        # 6. Absence of X-Powered-By
        assert "x-powered-by" not in headers

    def test_2_api_endpoints_return_security_headers(self):
        status, _, headers = send_raw_request("/api/auth/me")
        assert status in (200, 401)
        assert headers.get("x-frame-options") == "DENY"
        assert headers.get("x-content-type-options") == "nosniff"
        assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
        assert "content-security-policy" in headers


class TestCsrfProtection:
    """Verifies CSRF defenses on state-changing API endpoints."""

    def test_1_cross_origin_origin_header_is_blocked(self):
        """Cross-origin POST to /api/auth/logout is rejected with 403."""
        status, body, _ = send_raw_request(
            "/api/auth/logout",
            method="POST",
            headers={
                "Origin": "https://malicious-attacker.evil",
                "Host": "localhost:3000",
            },
            data={}
        )
        assert status == 403
        assert isinstance(body, dict)
        assert body.get("error") == "CSRF_ORIGIN_MISMATCH"

    def test_2_cross_origin_comments_submission_is_blocked(self):
        """Cross-origin POST to /api/policies/[slug]/comments is rejected with 403."""
        status, body, _ = send_raw_request(
            "/api/policies/prahaar-counter-terrorism-policy/comments",
            method="POST",
            headers={
                "Origin": "https://attacker.com",
                "Host": "localhost:3000",
            },
            data={"commentText": "Unauthorized cross-origin submission attempt"}
        )
        assert status == 403
        assert isinstance(body, dict)
        assert body.get("error") == "CSRF_ORIGIN_MISMATCH"

    def test_3_sec_fetch_site_cross_site_is_blocked(self):
        """Fetch metadata Sec-Fetch-Site: cross-site is immediately blocked with 403."""
        status, body, _ = send_raw_request(
            "/api/auth/logout",
            method="POST",
            headers={
                "Sec-Fetch-Site": "cross-site",
                "Host": "localhost:3000",
            },
            data={}
        )
        assert status == 403
        assert isinstance(body, dict)
        assert body.get("error") == "CSRF_BLOCKED"

    def test_4_cross_origin_referer_is_blocked_when_origin_missing(self):
        """Cross-origin Referer is rejected with 403 when Origin is omitted."""
        status, body, _ = send_raw_request(
            "/api/auth/logout",
            method="POST",
            headers={
                "Referer": "https://attacker.com/evil-page.html",
                "Host": "localhost:3000",
            },
            data={}
        )
        assert status == 403
        assert isinstance(body, dict)
        assert body.get("error") == "CSRF_REFERER_MISMATCH"

    def test_5_malformed_origin_header_is_rejected_cleanly(self):
        """Malformed or non-matching Origin header is blocked with 400 or 403."""
        status, body, _ = send_raw_request(
            "/api/auth/logout",
            method="POST",
            headers={
                "Origin": "not-a-valid-uri:::",
                "Host": "localhost:3000",
            },
            data={}
        )
        assert status in (400, 403)
        assert isinstance(body, dict)
        assert body.get("error") in ("MALFORMED_ORIGIN", "CSRF_ORIGIN_MISMATCH")

    def test_6_same_origin_post_request_succeeds(self):
        """Legitimate same-origin browser request passes cleanly."""
        status, body, _ = send_raw_request(
            "/api/auth/logout",
            method="POST",
            headers={
                "Origin": "http://localhost:3000",
                "Host": "localhost:3000",
            },
            data={}
        )
        assert status == 200
        assert isinstance(body, dict)
        assert body.get("success") is True

    def test_7_internal_request_without_browser_headers_succeeds(self):
        """Internal/non-browser requests without Origin or Referer pass cleanly."""
        status, body, _ = send_raw_request(
            "/api/auth/logout",
            method="POST",
            headers={"Host": "localhost:3000"},
            data={}
        )
        assert status == 200
        assert isinstance(body, dict)
        assert body.get("success") is True
