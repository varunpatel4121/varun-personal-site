import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/varun/i);
  });

  test("sign-in page loads and has auth options", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("text=Sign")).toBeVisible();
  });

  test("sign-in page has Google OAuth entry point", async ({ page }) => {
    await page.goto("/sign-in");
    const googleButton = page.locator("text=/google/i");
    await expect(googleButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Protected routes (unauthenticated)", () => {
  test("persona app redirects to sign-in", async ({ page }) => {
    await page.goto("/apps/persona");
    await page.waitForURL(/sign-in/, { timeout: 10000 });
    expect(page.url()).toContain("sign-in");
  });
});
