import { defineConfig, devices } from "@playwright/test";

/**
 * PolicyLens Playwright End-to-End Test Configuration
 *
 * Configured for local development and CI execution.
 * Respects application rate limits by running tests deterministically.
 */
const baseURL =
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
  process.env.APP_BASE_URL ||
  "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  },
  projects: [
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        channel: "chrome",
        viewport: { width: 393, height: 851 },
      },
    },
  ],
});
