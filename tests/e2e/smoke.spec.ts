import { test, expect } from "@playwright/test";

test.describe("Goals vision board", () => {
  async function unlockGoals(page: import("@playwright/test").Page) {
    await page.goto("/goals");
    for (const digit of "8000") {
      await page.getByRole("button", { name: digit, exact: true }).click();
    }
    await expect(page.getByRole("tab", { name: "Oct–Dec 2026" })).toHaveAttribute("aria-selected", "true");
  }

  test("PIN gate opens the current board and remembers access", async ({ page }) => {
    await page.goto("/goals");
    await expect(page.getByRole("tablist", { name: "Goal collections" })).toHaveCount(0);
    for (const digit of "1111") {
      await page.getByRole("button", { name: digit, exact: true }).click();
    }
    await expect(page.getByText("incorrect", { exact: true })).toBeVisible();
    await expect(page.locator('[data-filled="true"]')).toHaveCount(0);
    for (const digit of "8000") {
      await page.getByRole("button", { name: digit, exact: true }).click();
    }
    await expect(page.getByRole("heading", { name: "The rest of this year." })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "The rest of this year." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 })).toHaveText([
      "Fitness & food", "Mental health & habits", "Mentorship", "Creative work", "Career exploration",
    ]);
    await expect(page.getByRole("table", { name: "Meditation practice each week" })).toContainText("Daily");
    await expect(page.getByRole("table", { name: "Published podcast and reel totals by December 31" })).toContainText("Podcast episodes");
    await expect(page.getByText("Jes + me", { exact: true })).toBeVisible();
    await expect(page.getByText(/Jace|Minimum is a result|Ideal leaves room/)).toHaveCount(0);
  });

  test("keyboard navigation reaches five-year goals and the summer archive", async ({ page }) => {
    await unlockGoals(page);
    await page.getByRole("tab", { name: "Oct–Dec 2026" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Five Years" })).toBeFocused();
    await expect(page.getByRole("heading", { name: "Mental Health Startup Founder" })).toBeVisible();
    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: "Past Goals" })).toBeFocused();
    await expect(page.getByRole("heading", { name: "Earlier chapters." })).toBeVisible();
    await expect(page.getByText("Meditate 5x per week", { exact: true })).toBeVisible();
    await page.locator("summary").click();
    await expect(page.getByText("Meditate 5x per week", { exact: true })).not.toBeVisible();
    await page.getByRole("tab", { name: "Oct–Dec 2026" }).click();
    await expect(page.getByRole("heading", { name: "The rest of this year." })).toBeVisible();
  });

  test("photos, targets, and pillar links work on a narrow screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await unlockGoals(page);
    const picker = page.getByRole("combobox", { name: "Jump to a goal" });
    await expect(page.getByRole("button", { name: "Previous section" })).toBeDisabled();
    await picker.selectOption("mentorship");
    await expect(page).toHaveURL(/#mentorship$/);
    await expect(page.getByRole("heading", { name: "Work together every week." })).toBeInViewport();
    await expect(picker).toHaveValue("mentorship");
    await expect(picker).toBeInViewport();
    await page.getByRole("button", { name: "Next section" }).click();
    await expect(page).toHaveURL(/#creative$/);
    await expect(picker).toHaveValue("creative");
    await page.getByRole("button", { name: "Previous section" }).click();
    await expect(page).toHaveURL(/#mentorship$/);
    await picker.selectOption("career");
    await expect(page.getByRole("button", { name: "Next section" })).toBeDisabled();
    for (const image of await page.locator("main img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    for (const width of [320, 375, 768, 1100, 1200, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const table of await page.getByRole("table").all()) {
        const bounds = await table.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      }
    }
  });

  test("the left index stays available and tracks jumps, scrolling, and history", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await unlockGoals(page);
    const index = page.getByRole("navigation", { name: "Goal sections", exact: true });
    const career = index.getByRole("link", { name: "05 Career exploration" });
    const fitness = index.getByRole("link", { name: "01 Fitness & food" });
    await career.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#career$/);
    await expect(career).toHaveAttribute("aria-current", "location");
    await expect(index).toBeInViewport({ ratio: 1 });
    await expect(page.locator("#career")).toBeFocused();
    await fitness.click();
    await expect(fitness).toHaveAttribute("aria-current", "location");
    await page.goBack();
    await expect(career).toHaveAttribute("aria-current", "location");
    await page.reload();
    await expect(career).toHaveAttribute("aria-current", "location");
    await expect(page.getByRole("heading", { name: "Career exploration", exact: true })).toBeInViewport();
    await page.locator("#habits").evaluate((node) => node.scrollIntoView());
    await expect(index.getByRole("link", { name: "02 Mental health & habits" })).toHaveAttribute("aria-current", "location");
    await expect(index).toBeInViewport({ ratio: 1 });
  });

  test("the journal palette does not leak to other pages", async ({ page }) => {
    await unlockGoals(page);
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(239, 238, 230)");
    await page.getByRole("link", { name: "Varun Patel", exact: true }).click();
    await expect(page).toHaveURL("/");
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(9, 9, 15)");
  });
});

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
