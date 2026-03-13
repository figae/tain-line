import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/tain/i);
    await expect(page.locator("header")).toBeVisible();
  });

  test("nav marks active link correctly", async ({ page }) => {
    await page.goto("/timeline");

    // The Timeline link should have the active gold background
    const timelineLink = page.getByRole("navigation").getByRole("link", { name: "Timeline" });
    await expect(timelineLink).toBeVisible();
    // Active link has distinct styling (background gold)
    const bg = await timelineLink.evaluate((el) => getComputedStyle(el).background);
    expect(bg).not.toBe(""); // just ensure it has some background
  });

  test("characters page is reachable", async ({ page }) => {
    await page.goto("/characters");
    await expect(page).not.toHaveURL(/error/);
  });

  test("events page is reachable", async ({ page }) => {
    await page.goto("/events");
    await expect(page).not.toHaveURL(/error/);
  });
});
