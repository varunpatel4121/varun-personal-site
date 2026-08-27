import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/varun/i);
  });

  test("body timeline loads with the latest scan", async ({ page }) => {
    await page.goto("/body");
    await expect(page).toHaveTitle(/body/i);
    await expect(
      page.getByRole("heading", { name: /the build, in motion/i })
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /aug 26/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByText("August 26, 2026", { exact: true })).toBeVisible();
  });

  test("sign-in page loads and has auth options", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("text=Sign")).toBeVisible();
  });

  test("sign-in page has Google OAuth entry point", async ({ page }) => {
    await page.goto("/sign-in");
    const googleButton = page.getByRole("button", { name: /google/i });
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
