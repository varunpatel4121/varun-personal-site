import { test, expect } from "@playwright/test";
import path from "path";

const STORAGE_STATE = path.join(__dirname, ".auth/user.json");

/**
 * These tests require a valid authenticated session.
 * They are skipped if E2E_USER_EMAIL is not set.
 */
const authedTest = test.extend({
  storageState: STORAGE_STATE,
});

authedTest.describe("Persona Chat (authenticated)", () => {
  authedTest.skip(
    () => !process.env.E2E_USER_EMAIL,
    "Skipped: E2E_USER_EMAIL not set",
  );

  authedTest("loads persona workspace", async ({ page }) => {
    await page.goto("/apps/persona");
    await expect(page).toHaveURL(/persona/);
    // The page should render without a 500 or redirect loop
    await expect(page.locator("body")).toBeVisible();
  });

  authedTest("can send a message and receive a response", async ({ page }) => {
    await page.goto("/apps/persona");

    const composer = page.locator("textarea");
    await expect(composer).toBeVisible({ timeout: 10000 });

    await composer.fill("Hello, this is a test message.");
    await composer.press("Enter");

    // Wait for assistant response to appear (streaming may take time with live OpenAI)
    const assistantMessage = page.locator('[data-role="assistant"]').first();
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });
    await expect(assistantMessage).not.toBeEmpty();
  });

  authedTest("chat persists in sidebar after creation", async ({ page }) => {
    await page.goto("/apps/persona");

    const composer = page.locator("textarea");
    await expect(composer).toBeVisible({ timeout: 10000 });

    await composer.fill("Sidebar persistence test");
    await composer.press("Enter");

    // Wait for the stream to complete
    await page.locator('[data-role="assistant"]').first().waitFor({ timeout: 30000 });

    // The sidebar should contain the new chat
    const sidebar = page.locator("[data-testid='chat-sidebar']");
    if (await sidebar.isVisible().catch(() => false)) {
      await expect(sidebar).toContainText(/sidebar persistence/i, { timeout: 5000 });
    }
  });

  authedTest("refresh preserves chat history", async ({ page }) => {
    await page.goto("/apps/persona");

    const composer = page.locator("textarea");
    await expect(composer).toBeVisible({ timeout: 10000 });

    await composer.fill("Persistence check");
    await composer.press("Enter");
    await page.locator('[data-role="assistant"]').first().waitFor({ timeout: 30000 });

    // Reload and check that the message is still there
    await page.reload();
    await expect(page.locator("text=Persistence check")).toBeVisible({ timeout: 10000 });
  });
});
