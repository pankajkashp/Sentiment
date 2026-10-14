import { test, expect } from "@playwright/test";

test.describe("Email Verification UI Scenarios", () => {
  test("displays request link state when visiting /verify-email without token", async ({ page }) => {
    await page.goto("/verify-email");

    await expect(page.getByRole("heading", { name: /email verification/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /send verification link/i })).toBeVisible();
  });

  test("handles invalid or expired token on submission with clear error state", async ({ page }) => {
    // Visit with an invalid token
    await page.goto("/verify-email?token=invalid-e2e-token-xyz987");

    // 1. Initial pending confirmation view
    await expect(page.getByRole("heading", { name: /confirm account activation/i })).toBeVisible();
    const confirmButton = page.getByRole("button", { name: /confirm & verify email/i });
    await expect(confirmButton).toBeVisible();

    // 2. Click confirm action
    await confirmButton.click();

    // 3. Error state should render for invalid/expired token
    await expect(page.getByText(/invalid or has already been used/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /request new verification link/i })).toBeVisible();
  });
});
