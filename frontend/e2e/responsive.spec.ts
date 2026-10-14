import { test, expect } from "@playwright/test";

test.describe("Responsive Viewport Scenarios", () => {
  test("renders full desktop navigation on wide viewports", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Desktop nav items should be visible
    const navList = page.locator("nav");
    await expect(navList.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(navList.getByRole("link", { name: "Explore" })).toBeVisible();
    await expect(navList.getByRole("link", { name: "Saved" })).toBeVisible();
    await expect(navList.getByRole("link", { name: "History" })).toBeVisible();

    // Mobile menu toggle button should be hidden
    const mobileMenuButton = page.getByRole("button", { name: /open navigation menu/i });
    await expect(mobileMenuButton).toBeHidden();
  });

  test("renders mobile hamburger drawer and collapsible menu on mobile viewports", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto("/");

    // Mobile menu toggle button should be visible
    const mobileMenuButton = page.getByRole("button", { name: /open navigation menu/i });
    await expect(mobileMenuButton).toBeVisible();

    // Open mobile navigation
    await mobileMenuButton.click();

    // Navigation links should be visible in dropdown
    const primaryNav = page.getByRole("navigation", { name: "Primary Portal Navigation" });
    await expect(primaryNav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(primaryNav.getByRole("link", { name: "Explore" })).toBeVisible();
    await expect(primaryNav.getByRole("link", { name: "Saved" })).toBeVisible();

    // Close mobile navigation
    const closeButton = page.getByRole("button", { name: /close navigation menu/i });
    await closeButton.click();
    await expect(page.getByRole("button", { name: /open navigation menu/i })).toBeVisible();
  });
});
