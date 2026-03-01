import { test, expect } from "@playwright/test";

test.describe("Wizard Flow — E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/wizard");
  });

  // ── Initial Load ──────────────────────────────────────────
  test("WZ-E01: wizard page loads", async ({ page }) => {
    await expect(page).toHaveURL(/\/wizard/);
  });

  test("WZ-E02: first step heading is visible", async ({ page }) => {
    // First step is "About Your Company"
    await expect(
      page.getByRole("heading", { name: /About Your Company/ })
    ).toBeVisible();
  });

  test("WZ-E03: progress bar is visible", async ({ page }) => {
    // ProgressBar renders a progress indicator
    const progressArea = page.locator("[role='progressbar'], .bg-brand-600");
    await expect(progressArea.first()).toBeVisible();
  });

  test("WZ-E04: Continue button is visible", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Continue/ })
    ).toBeVisible();
  });

  test("WZ-E05: Back button is hidden on first step", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Back/ })
    ).toBeHidden();
  });

  // ── Form Interaction ──────────────────────────────────────
  test("WZ-E06: can fill company name text input", async ({ page }) => {
    const nameInput = page.locator("input[type='text']").first();
    await nameInput.fill("Acme Corp");
    await expect(nameInput).toHaveValue("Acme Corp");
  });

  test("WZ-E07: clicking Continue advances to next step", async ({ page }) => {
    // Fill company name first (required in step 1)
    const nameInput = page.locator("input[type='text']").first();
    await nameInput.fill("Test Company");

    await page.getByRole("button", { name: /Continue/ }).click();

    // Should advance — first step text should disappear or new step appears
    // Step 2 is "Your Role"
    await expect(page.getByRole("heading", { name: /Your Role/ })).toBeVisible({ timeout: 5000 });
  });

  test("WZ-E08: Back button appears on second step", async ({ page }) => {
    const nameInput = page.locator("input[type='text']").first();
    await nameInput.fill("Test Company");
    await page.getByRole("button", { name: /Continue/ }).click();

    await expect(
      page.getByRole("button", { name: /Back/ })
    ).toBeVisible({ timeout: 5000 });
  });

  test("WZ-E09: Back button returns to previous step", async ({ page }) => {
    const nameInput = page.locator("input[type='text']").first();
    await nameInput.fill("Test Company");
    await page.getByRole("button", { name: /Continue/ }).click();

    await page.getByRole("button", { name: /Back/ }).click();
    await expect(page.getByRole("heading", { name: /About Your Company/ })).toBeVisible({
      timeout: 5000,
    });
  });

  test("WZ-E10: can navigate through multiple steps", async ({ page }) => {
    // Step 1: Company
    const nameInput = page.locator("input[type='text']").first();
    await nameInput.fill("Test Company");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByRole("heading", { name: /Your Role/ })).toBeVisible({ timeout: 5000 });

    // Step 2: Role — select a radio/button option
    const roleOption = page.locator("button, label, [role='radio']").filter({
      hasText: /provider|deployer|developer/i,
    });
    if (await roleOption.first().isVisible()) {
      await roleOption.first().click();
    }
    await page.getByRole("button", { name: /Continue/ }).click();

    // Step 3: Your AI System
    await expect(page.getByRole("heading", { name: /Your AI System/ })).toBeVisible({
      timeout: 5000,
    });
  });
});
