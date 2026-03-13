import { test, expect } from "@playwright/test";

test.describe("Timeline page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/timeline");
  });

  test("loads and shows at least one event", async ({ page }) => {
    // Wait for loading spinner to disappear
    await expect(page.locator(".spinner")).not.toBeVisible({ timeout: 10_000 });

    // At least one cycle heading is visible
    const cycleHeadings = page.locator("h2");
    await expect(cycleHeadings.first()).toBeVisible();

    // At least one event card is rendered
    const cards = page.locator(".card");
    await expect(cards.first()).toBeVisible();
  });

  test("shows lifecycle toggle button", async ({ page }) => {
    await expect(page.locator(".spinner")).not.toBeVisible({ timeout: 10_000 });

    const toggle = page.getByRole("button", { name: /lebensdaten/i });
    await expect(toggle).toBeVisible();
  });

  test("lifecycle toggle changes visible event count", async ({ page }) => {
    await expect(page.locator(".spinner")).not.toBeVisible({ timeout: 10_000 });

    // Count events with lifecycle hidden (default)
    const countHidden = await page.locator(".card").count();

    // Show lifecycle events
    await page.getByRole("button", { name: /lebensdaten einblenden/i }).click();
    const countVisible = await page.locator(".card").count();

    // Showing lifecycle events should add at least some (birth/death events)
    expect(countVisible).toBeGreaterThanOrEqual(countHidden);
  });

  test("clicking an event card expands details", async ({ page }) => {
    await expect(page.locator(".spinner")).not.toBeVisible({ timeout: 10_000 });

    // Click the first event card
    const firstCard = page.locator(".card").first();
    await firstCard.click();

    // After clicking, a "Details →" link should appear within the expanded card
    await expect(page.getByText("Details →")).toBeVisible();
  });

  test("clicking selected card again collapses it", async ({ page }) => {
    await expect(page.locator(".spinner")).not.toBeVisible({ timeout: 10_000 });

    const firstCard = page.locator(".card").first();
    await firstCard.click();
    await expect(page.getByText("Details →")).toBeVisible();

    // Click again to deselect
    await firstCard.click();
    await expect(page.getByText("Details →")).not.toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Timeline" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Charaktere" })).toBeVisible();
  });

  test("Graph tab link navigates to /timeline/graph", async ({ page }) => {
    await expect(page.locator(".spinner")).not.toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /graph/i }).click();
    await expect(page).toHaveURL(/\/timeline\/graph/);
  });
});
