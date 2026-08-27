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
    await expect(page.getByRole("link", { name: "Body" })).toHaveAttribute("href", "/body");
    await expect(page.getByRole("tab", { name: /aug 26/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByText("August 26, 2026", { exact: true })).toBeVisible();
  });

  test("body timeline and trend controls update the visible data", async ({ page }) => {
    await page.goto("/body");

    const aprilTab = page.getByRole("tab", { name: /apr 07/i });
    await aprilTab.click();
    await expect(aprilTab).toHaveAttribute("aria-selected", "true");
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByRole("heading", { name: "April 7, 2026" })).toBeVisible();
    await expect(panel.getByText("178.3", { exact: true })).toBeVisible();

    const bodyFat = page.getByRole("button", { name: "Body fat" });
    await bodyFat.click();
    await expect(bodyFat).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("img", {
        name: "Percent body fat from November 18, 2025 to August 26, 2026",
      })
    ).toBeVisible();
    await expect(page.getByText(/-1\.5 %/)).toBeVisible();
  });

  test("body page works through mobile navigation without page overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await page.getByRole("link", { name: "Body" }).last().click();

    await expect(page).toHaveURL(/\/body$/);
    await expect(page.getByRole("heading", { name: /the build, in motion/i })).toBeVisible();
    const timeline = page.getByRole("tablist", { name: "Body scan dates" });
    const latestTab = page.getByRole("tab", { name: /aug 26/i });
    await expect.poll(async () => {
      const [timelineBox, latestTabBox] = await Promise.all([
        timeline.boundingBox(),
        latestTab.boundingBox(),
      ]);
      if (!timelineBox || !latestTabBox) return false;
      return (
        latestTabBox.x >= timelineBox.x &&
        latestTabBox.x + latestTabBox.width <= timelineBox.x + timelineBox.width
      );
    }).toBe(true);

    const fitsViewport = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    );
    expect(fitsViewport).toBe(true);

    const ledger = page.getByLabel("Scrollable body scan table");
    await ledger.scrollIntoViewIfNeeded();
    expect(await ledger.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await ledger.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => ledger.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  });

  test("body visualization respects reduced-motion preferences", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/body");

    const figure = page.getByRole("img", { name: "Body composition map" });
    await expect(figure).toBeVisible();
    await expect.poll(() => figure.evaluate((node) => getComputedStyle(node).animationName)).toBe(
      "none"
    );
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
