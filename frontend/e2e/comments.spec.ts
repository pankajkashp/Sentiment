import { test, expect } from "@playwright/test";

test.describe("Comment Form & Consultation Deadline Scenarios", () => {
  test("validates minimum character constraint on comment submission", async ({ page }) => {
    // Navigate to a policy page
    await page.goto("/policy/prahaar-counter-terrorism-policy");

    // Scroll to opinion section
    const opinionHeading = page.getByRole("heading", { name: /share your opinion/i });
    await expect(opinionHeading).toBeVisible();

    const textarea = page.getByLabel(/Your Comment/i);
    const submitButton = page.getByRole("button", { name: /add preview comment/i });

    // Submit button should be disabled when empty or fewer than 10 characters
    await expect(submitButton).toBeDisabled();
    await textarea.fill("Too short");
    await expect(submitButton).toBeDisabled();
    await expect(page.getByText(/min\. 10/i)).toBeVisible();
  });

  test("submits comment successfully and displays session preview", async ({ page }) => {
    await page.goto("/policy/prahaar-counter-terrorism-policy");

    const textarea = page.getByLabel(/Your Comment/i);
    const submitButton = page.getByRole("button", { name: /add preview comment/i });

    const testComment = "This is a comprehensive citizen opinion regarding transparent public review.";
    await textarea.fill(testComment);
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Verify submission feedback
    await expect(page.getByText(/Preview only: this comment is shown for this page session/i)).toBeVisible();

    // Verify textarea is cleared
    await expect(textarea).toHaveValue("");

    // Verify comment appears in the session list below
    await expect(page.getByText(testComment)).toBeVisible();
  });

  test("displays consultation window guidelines and deadline information", async ({ page }) => {
    await page.goto("/policy/prahaar-counter-terrorism-policy");

    // Consultation window metadata should be displayed
    await expect(page.getByText(/Comments close/i)).toBeVisible();
    await expect(page.getByText(/PolicyLens portal window/i)).toBeVisible();
  });
});
