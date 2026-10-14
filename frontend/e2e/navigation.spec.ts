import { test, expect } from "@playwright/test";

test.describe("Homepage & Policy Discovery Navigation", () => {
  test("loads homepage with government masthead, carousel, and policy cards", async ({ page }) => {
    await page.goto("/");

    // Verify title and institutional masthead
    await expect(page).toHaveTitle(/Public Policy Portal/);
    await expect(page.getByText("National Policy Updates & Welfare Schemes Repository")).toBeVisible();
    await expect(page.getByText("Official National Portals")).toBeVisible();
    await expect(page.getByText("National Citizen Helplines")).toBeVisible();

    // Verify presence of policy cards
    const policyCards = page.locator("article");
    await expect(policyCards.first()).toBeVisible();
    const count = await policyCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("filters policy updates via feed toolbar", async ({ page }) => {
    await page.goto("/");

    // Type in search box
    const searchInput = page.getByRole("textbox", { name: /search policy updates/i });
    await searchInput.fill("Cyber");

    // Filtered count should be reflected in the toolbar
    await expect(page.getByText(/verified government programme updates/i)).toBeVisible();
    await expect(page.getByText("AI-Enabled Cybercrime Prevention and Digital Identity Protection")).toBeVisible();

    // Clear search
    await page.getByRole("button", { name: /clear search/i }).click();
    await expect(searchInput).toHaveValue("");
  });

  test("navigates to policy detail page and verifies official source links", async ({ page }) => {
    await page.goto("/");

    // Click "View Policy" on the first policy card
    const firstPolicyLink = page.getByRole("link", { name: "View Policy" }).first();
    await firstPolicyLink.click();

    // Verify URL contains /policy/
    await expect(page).toHaveURL(/\/policy\/.+/);

    // Verify policy detail header elements
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Ministry of Home Affairs/i).first()).toBeVisible();

    // Verify presence of official source external link
    const officialSourceBtn = page.getByRole("link", { name: /view official source/i });
    await expect(officialSourceBtn).toBeVisible();
    await expect(officialSourceBtn).toHaveAttribute("target", "_blank");
    await expect(officialSourceBtn).toHaveAttribute("rel", /noopener/);
  });

  test("navigates through main top-bar links", async ({ page }) => {
    await page.goto("/");

    // Explore / Discover page
    await page.getByRole("link", { name: "Explore" }).first().click();
    await expect(page).toHaveURL("/discover");
    await expect(page.getByRole("heading", { name: /Browse Government Policies by Topic/i })).toBeVisible();

    // Saved page
    await page.getByRole("link", { name: "Saved" }).first().click();
    await expect(page).toHaveURL("/saved");
    await expect(page.getByRole("heading", { name: /Keep Key Welfare Programmes Close/i })).toBeVisible();

    // History page
    await page.getByRole("link", { name: "History" }).first().click();
    await expect(page).toHaveURL("/history");
    await expect(page.getByRole("heading", { name: /Track Policy Notices/i })).toBeVisible();
  });
});
