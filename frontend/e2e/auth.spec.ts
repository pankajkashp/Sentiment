import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

test.describe("Authentication & Registration Scenarios", () => {
  test.describe.configure({ mode: "serial" });

  const timestamp = Date.now();
  const testIp = `10.88.${Math.floor(timestamp / 1000) % 250}.1`;
  const testUser = {
    name: `Test Citizen ${timestamp}`,
    email: `e2e-citizen-${timestamp}@example.com`,
    password: "CorrectSecurePassword123!",
  };

  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": testIp });
  });

  test("validates registration form constraints", async ({ page }) => {
    await page.goto("/register");

    const nameInput = page.getByLabel(/Full name/i);
    const emailInput = page.getByLabel(/Email address/i);
    const categorySelect = page.getByLabel(/Citizen Category/i);
    const passwordInput = page.getByLabel(/^Password/i);

    // 1. Verify HTML5 required attributes
    await expect(nameInput).toHaveAttribute("required", "");
    await expect(emailInput).toHaveAttribute("required", "");
    await expect(categorySelect).toHaveAttribute("required", "");
    await expect(passwordInput).toHaveAttribute("required", "");

    // 2. Validate password minlength attribute
    await expect(passwordInput).toHaveAttribute("minlength", "12");

    // 3. Test client constraint validation
    await nameInput.fill("Jane Citizen");
    await emailInput.fill("valid@example.com");
    await categorySelect.selectOption("Citizen / Beneficiary");
    await passwordInput.fill("short");

    const isTooShort = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validity.tooShort
    );
    expect(isTooShort).toBe(true);
  });

  test("registers account with mandatory email verification without auto-login", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel(/Full name/i).fill(testUser.name);
    await page.getByLabel(/Email address/i).fill(testUser.email);
    await page.getByLabel(/Citizen Category/i).selectOption("Citizen / Beneficiary");
    await page.getByLabel(/^Password/i).fill(testUser.password);

    await page.getByRole("button", { name: /create citizen account/i }).click();

    // Verify success card is displayed with email-verification notice
    await expect(page.getByRole("heading", { name: /Verify Your Email Address/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(testUser.email)).toBeVisible();
    await expect(page.getByRole("button", { name: /resend verification email/i })).toBeVisible();

    // Verify no session cookie was set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === "policylens_session");
    expect(sessionCookie).toBeUndefined();

    // Verify top bar on home page still displays Sign in / Register
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Register" }).first()).toBeVisible();
  });

  test("rejects unverified user login attempt with clear notification", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/Email address/i).fill(testUser.email);
    await page.getByLabel(/Password/i).fill(testUser.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Verify rejection notification for unverified account
    await expect(page.getByText(/verify your email address before signing in/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /resend verification link/i })).toBeVisible();
  });

  test("rejects invalid login credentials with generic error", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/Email address/i).fill(`nonexistent-${Date.now()}@example.com`);
    await page.getByLabel(/Password/i).fill("WrongPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });

  test("persists session after login and page reload, then revokes on logout", async ({ page }) => {
    // 1. Mark account verified in database to test verified session flow
    const script = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      prisma.user.update({
        where: { email: '${testUser.email}' },
        data: { isEmailVerified: true }
      })
      .then(() => prisma.$disconnect())
      .catch((err) => { console.error(err); process.exit(1); });
    `;
    execSync("node", { input: script, cwd: process.cwd() });

    // 2. Log in with verified credentials
    await page.goto("/login");
    await page.getByLabel(/Email address/i).fill(testUser.email);
    await page.getByLabel(/Password/i).fill(testUser.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // 3. User is redirected to /profile with profile details displayed
    await expect(page).toHaveURL("/profile", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: testUser.name })).toBeVisible();
    await expect(page.getByText(testUser.email)).toBeVisible();

    // 4. Session persistence: reload page and verify user stays authenticated
    await page.reload();
    await expect(page.getByRole("heading", { name: testUser.name })).toBeVisible();

    // 5. Sign out
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page.getByRole("heading", { name: /You are not signed in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();

    // Verify session cookie was revoked
    const cookiesAfterLogout = await page.context().cookies();
    const sessionCookieAfter = cookiesAfterLogout.find((c) => c.name === "policylens_session");
    expect(sessionCookieAfter).toBeUndefined();
  });

  test("restricts /admin page access for unauthenticated users", async ({ page }) => {
    await page.goto("/admin");

    // Renders Authentication Required access restriction
    await expect(page.getByRole("heading", { name: /Authentication Required/i })).toBeVisible();
    await expect(page.getByText(/Only authenticated administrators may access this studio/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in to continue/i })).toBeVisible();
  });
});
