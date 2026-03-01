import { test, expect, type Page } from "@playwright/test";

// ── Helpers ─────────────────────────────────────────────────
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
    {
      id: "data-governance",
      title: "Data Governance",
      description: "Implement data governance and management practices",
      article: "Article 10",
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
  companyName: "Visual Test Corp",
  systemDescription: "An AI-powered recruitment screening tool",
});

async function seedAndGo(page: Page, path: string) {
  if (path === "/result") {
    await page.addInitScript(
      ({ r, a }: { r: string; a: string }) => {
        window.sessionStorage.setItem("classificationResult", r);
        window.sessionStorage.setItem("wizardAnswers", a);
      },
      { r: MOCK_RESULT, a: MOCK_ANSWERS }
    );
  }
  await page.goto(path);
}

// ── Visual Regression Tests ─────────────────────────────────
test.describe("Visual Regression — Landing Page", () => {
  test("VR-LP01: full landing page screenshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("landing-full.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test("VR-LP02: hero section", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("section").first();
    await expect(hero).toHaveScreenshot("landing-hero.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("VR-LP03: navigation bar", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toHaveScreenshot("landing-nav.png", {
      maxDiffPixelRatio: 0.01,
    });
  });
});

test.describe("Visual Regression — Wizard", () => {
  test("VR-WZ01: wizard first step", async ({ page }) => {
    await page.goto("/wizard");
    await page.waitForLoadState("networkidle");
    const main = page.locator("main");
    await expect(main).toHaveScreenshot("wizard-step1.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("VR-WZ02: wizard with filled input", async ({ page }) => {
    await page.goto("/wizard");
    const input = page.locator("input[type='text']").first();
    await input.fill("Acme Corp");
    await expect(page.locator("main")).toHaveScreenshot(
      "wizard-step1-filled.png",
      { maxDiffPixelRatio: 0.02 }
    );
  });

  test("VR-WZ03: wizard step 2", async ({ page }) => {
    await page.goto("/wizard");
    const input = page.locator("input[type='text']").first();
    await input.fill("Test Company");
    await page.getByRole("button", { name: /Continue/ }).click();
    await page.getByRole("heading", { name: /Your Role/ }).waitFor();
    await expect(page.locator("main")).toHaveScreenshot("wizard-step2.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Visual Regression — Result Page", () => {
  test("VR-RES01: full result page", async ({ page }) => {
    await seedAndGo(page, "/result");
    await page.getByRole("heading", { name: /Your Classification Result/ }).waitFor({ timeout: 10000 });
    await expect(page).toHaveScreenshot("result-full.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("VR-RES02: classification badge", async ({ page }) => {
    await seedAndGo(page, "/result");
    await page.getByText(/HIGH RISK/i).first().waitFor({ timeout: 10000 });
    // Badge is inside a rounded-2xl div
    const badge = page.locator(".rounded-2xl.border-2").first();
    await expect(badge).toHaveScreenshot("result-badge.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("VR-RES03: fine exposure section", async ({ page }) => {
    await seedAndGo(page, "/result");
    await page.getByText(/Fine Exposure/).waitFor({ timeout: 10000 });
    const fineSection = page.getByText(/Fine Exposure/).locator("..");
    await expect(fineSection).toHaveScreenshot("result-fine.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("VR-RES04: obligations list", async ({ page }) => {
    await seedAndGo(page, "/result");
    await page.getByText(/Your Obligations/).waitFor({ timeout: 10000 });
    const obligations = page.getByText(/Your Obligations/).locator("../..");
    await expect(obligations).toHaveScreenshot("result-obligations.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Visual Regression — Responsive", () => {
  test("VR-RESP01: landing page mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("landing-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("VR-RESP02: wizard mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/wizard");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toHaveScreenshot("wizard-mobile.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("VR-RESP03: result page tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await seedAndGo(page, "/result");
    await page.getByRole("heading", { name: /Your Classification Result/ }).waitFor({ timeout: 10000 });
    await expect(page).toHaveScreenshot("result-tablet.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
