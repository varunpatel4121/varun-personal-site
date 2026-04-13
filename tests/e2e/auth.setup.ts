import { test as setup, expect } from "@playwright/test";
import path from "path";

/**
 * Creates an authenticated storage state using a dedicated test user
 * via Supabase magic link / password auth. This avoids automating
 * the Google OAuth flow which is brittle in headless CI.
 *
 * Required env vars:
 *   E2E_USER_EMAIL    — test user email (created in Supabase dashboard)
 *   E2E_USER_PASSWORD — test user password
 *   E2E_BASE_URL      — base URL (default http://localhost:3000)
 *
 * The resulting session is stored in tests/e2e/.auth/user.json and
 * reused by all test specs via the storageState fixture.
 */

const STORAGE_STATE = path.join(__dirname, ".auth/user.json");

setup("authenticate via Supabase", async ({ page }) => {
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    console.warn(
      "E2E_USER_EMAIL and E2E_USER_PASSWORD not set — skipping auth setup. " +
      "E2E tests requiring auth will fail.",
    );
    // Save empty state so Playwright doesn't crash
    await page.goto(baseUrl);
    await page.context().storageState({ path: STORAGE_STATE });
    return;
  }

  // Navigate to sign-in page and authenticate
  await page.goto(`${baseUrl}/sign-in`);
  await expect(page).toHaveURL(/sign-in/);

  // Fill in email and password if the form supports it
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  await emailInput.fill(email);

  const passwordInput = page.locator('input[type="password"], input[name="password"]');
  if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await passwordInput.fill(password);
  }

  await page.locator('button[type="submit"]').click();

  // Wait for redirect to an authenticated page
  await page.waitForURL(/apps/, { timeout: 15000 });

  await page.context().storageState({ path: STORAGE_STATE });
});

export { STORAGE_STATE };
