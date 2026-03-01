import { test, expect } from "@playwright/test";

test.describe("Landing Page — E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ── Hero Section ──────────────────────────────────────────
  test("LP-E01: page loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/EU AI Act Compliance/);
  });

  test("LP-E02: hero heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("EU AI Act");
  });

  test("LP-E03: enforcement banner is visible", async ({ page }) => {
    await expect(
      page.getByText(/EU AI Act enforcement/)
    ).toBeVisible();
  });

  test("LP-E04: CTA button links to wizard", async ({ page }) => {
    const cta = page.getByRole("link", { name: /Start Free Assessment/ }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/wizard");
  });

  test("LP-E05: clicking CTA navigates to wizard", async ({ page }) => {
    await page.getByRole("link", { name: /Start Free Assessment/ }).first().click();
    await expect(page).toHaveURL(/\/wizard/);
  });

  // ── Social Proof ──────────────────────────────────────────
  test("LP-E06: social proof section shows key stats", async ({ page }) => {
    await expect(page.getByText("€35M").first()).toBeVisible();
    await expect(page.getByText("16", { exact: true }).first()).toBeVisible();
  });

  // ── How It Works ──────────────────────────────────────────
  test("LP-E07: how-it-works section visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /How It Works/ })
    ).toBeVisible();
  });

  test("LP-E08: three steps displayed", async ({ page }) => {
    await expect(page.getByText("Answer Simple Questions")).toBeVisible();
    await expect(page.getByText("Get Your Classification")).toBeVisible();
    await expect(page.getByText("Compliance Roadmap")).toBeVisible();
  });

  // ── Navigation ────────────────────────────────────────────
  test("LP-E09: nav bar contains logo and links", async ({ page }) => {
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav.getByText("EU AI Act")).toBeVisible();
    await expect(
      nav.getByRole("link", { name: /Free Assessment/ })
    ).toBeVisible();
  });

  test("LP-E10: nav Free Assessment link goes to wizard", async ({ page }) => {
    await page
      .locator("nav")
      .getByRole("link", { name: /Free Assessment/ })
      .click();
    await expect(page).toHaveURL(/\/wizard/);
  });
});
