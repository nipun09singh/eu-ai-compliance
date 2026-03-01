import { test, expect, type Page } from "@playwright/test";

const MOCK_RESULT = JSON.stringify({
  classification: "HIGH_RISK",
  confidence: "DEFINITIVE",
  role: "PROVIDER",
  detectedRoles: ["PROVIDER"],
  legalBasis: ["Article 6(2)", "Annex III, Area 4"],
  obligations: [
    {
      id: "risk-mgmt",
      title: "Risk Management System",
      description: "Establish and maintain a risk management system",
      article: "Article 9",
      appliesToRole: "PROVIDER",
      priority: "HIGH",
      deadline: "August 2026",
    },
  ],
  fineRisk: {
    maxAmountGeneral: "€15 000 000",
    maxAmountSME: "€7 500 000",
    maxPercentTurnover: 3,
    article: "Article 99(3)",
  },
  enforcementDeadline: "2026-08-02",
  nextSteps: [
    "Conduct a full risk assessment",
    "Implement a quality management system",
  ],
  warnings: [],
  smeSimplifications: [],
  prohibitedPractices: [],
  transparencyObligations: [],
});

const MOCK_ANSWERS = JSON.stringify({
  companyName: "E2E Test Corp",
  systemDescription: "An AI-powered recruitment tool",
});

/**
 * Seed sessionStorage via addInitScript so data is available
 * BEFORE React hydration runs. This avoids the race condition
 * where useEffect reads sessionStorage before evaluate() sets it.
 */
async function seedAndGo(page: Page) {
  await page.addInitScript(
    ({ result, answers }: { result: string; answers: string }) => {
      window.sessionStorage.setItem("classificationResult", result);
      window.sessionStorage.setItem("wizardAnswers", answers);
    },
    { result: MOCK_RESULT, answers: MOCK_ANSWERS }
  );
  await page.goto("/result");
}

test.describe("Result Page — E2E", () => {
  // ── No Data Redirect ─────────────────────────────────────
  test("RES-E01: redirects to wizard when no sessionStorage data", async ({
    page,
  }) => {
    await page.goto("/result");
    await expect(page).toHaveURL(/\/wizard/, { timeout: 10000 });
  });

  // ── With Seeded Data ──────────────────────────────────────
  test("RES-E02: displays classification result heading", async ({ page }) => {
    await seedAndGo(page);
    await expect(
      page.getByRole("heading", { name: /Your Classification Result/ })
    ).toBeVisible({ timeout: 10000 });
  });

  test("RES-E03: shows HIGH_RISK badge", async ({ page }) => {
    await seedAndGo(page);
    await expect(page.getByText(/high.risk/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("RES-E04: shows retake assessment link", async ({ page }) => {
    await seedAndGo(page);
    const retake = page.getByRole("link", { name: /Retake assessment/ });
    await expect(retake).toBeVisible({ timeout: 10000 });
    await expect(retake).toHaveAttribute("href", "/wizard");
  });

  test("RES-E05: shows obligations section", async ({ page }) => {
    await seedAndGo(page);
    await expect(page.getByText(/Obligation|Risk Management/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("RES-E06: shows fine exposure information", async ({ page }) => {
    await seedAndGo(page);
    // Fine info should mention amounts or percentage
    await expect(page.getByText(/fine|€|penalty|turnover/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("RES-E07: shows timeline section", async ({ page }) => {
    await seedAndGo(page);
    await expect(
      page.getByText(/Timeline|Deadline|Enforcement/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("RES-E08: retake link navigates back to wizard", async ({ page }) => {
    await seedAndGo(page);
    await page.getByRole("link", { name: /Retake assessment/ }).click();
    await expect(page).toHaveURL(/\/wizard/);
  });
});

test.describe("Navigation E2E", () => {
  test("NAV-E01: logo navigates to home from wizard", async ({ page }) => {
    await page.goto("/wizard");
    await page.locator("nav").getByRole("link").first().click();
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?$/);
  });

  test("NAV-E02: 404 page shows for unknown route", async ({ page }) => {
    const response = await page.goto("/this-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
