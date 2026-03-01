/**
 * Performance Benchmarks
 *
 * Measures critical paths:
 *   - Classification engine throughput
 *   - Wizard question flow computation
 *   - Template registry lookups
 *   - Document generator prompt assembly
 *   - Store state transitions
 *
 * Run: npx vitest bench
 */
import { bench, describe } from "vitest";
import { classifyAISystem, TEMPLATE_REGISTRY } from "@/lib/classification-engine";
import { getApplicableTemplates, buildPrompt } from "@/lib/doc-generator";
import {
  WIZARD_STEPS,
  getVisibleQuestions,
  getNextStep,
  getProgressPercent,
  getVisibleSteps,
} from "@/lib/wizard-questions";
import type { WizardAnswers } from "@/lib/wizard-questions";

// ── Fixture Data ────────────────────────────────────────────
const MINIMAL_ANSWERS: Partial<WizardAnswers> = {
  companyName: "Bench Corp",
  companySize: "MEDIUM",
  isEUBased: true,
  primaryRole: "PROVIDER",
  systemName: "BenchBot",
  systemDescription: "A chatbot for customer support",
  isAutonomous: false,
  hasHumanOversight: true,
  isGPAI: false,
  isExcluded: false,
  isMilitary: false,
  isNationalSecurity: false,
  prohibited_socialScoring: false,
  prohibited_emotionRecognition: false,
  prohibited_biometricCategorisation: false,
  prohibited_predictivePolicing: false,
  prohibited_facialRecognition: false,
  prohibited_manipulativeTechniques: false,
  prohibited_vulnerabilityExploitation: false,
};

const HIGH_RISK_ANSWERS: Partial<WizardAnswers> = {
  ...MINIMAL_ANSWERS,
  isSafetyComponent: true,
  safetyProductType: "MACHINERY",
  annexIII_biometricIdentification: true,
  hasAnnexIIIException: false,
  isTransparencyRelevant: true,
  deepfakeCapability: true,
};

const FULL_ANSWERS: Partial<WizardAnswers> = {
  ...HIGH_RISK_ANSWERS,
  isGPAI: true,
  gpaiIsOpenSource: false,
  gpaiTrainingComputeFlops: 1e26,
  isNonEUWithEUOutput: true,
  hasAuthorisedRep: true,
  isAlreadyOnMarket: true,
  marketPlacementDate: "2024-01-01",
  processesPersonalData: true,
  hasDPIA: true,
  sectorSpecificLegislation: ["MEDICAL_DEVICES"],
};

// ── Classification Engine ───────────────────────────────────
describe("Classification Engine", () => {
  bench("classify minimal-risk system", () => {
    classifyAISystem(MINIMAL_ANSWERS);
  });

  bench("classify high-risk system", () => {
    classifyAISystem(HIGH_RISK_ANSWERS);
  });

  bench("classify full-complexity system", () => {
    classifyAISystem(FULL_ANSWERS);
  });

  bench("100 sequential classifications", () => {
    for (let i = 0; i < 100; i++) {
      classifyAISystem(HIGH_RISK_ANSWERS);
    }
  });
});

// ── Template Registry ───────────────────────────────────────
describe("Template Registry", () => {
  bench("lookup all templates", () => {
    Object.values(TEMPLATE_REGISTRY);
  });

  bench("getApplicableTemplates for high-risk", () => {
    const result = classifyAISystem(HIGH_RISK_ANSWERS);
    getApplicableTemplates(result);
  });

  bench("getApplicableTemplates for full-complexity", () => {
    const result = classifyAISystem(FULL_ANSWERS);
    getApplicableTemplates(result);
  });
});

// ── Document Generator ──────────────────────────────────────
describe("Document Generator — Prompt Assembly", () => {
  const highRiskResult = classifyAISystem(HIGH_RISK_ANSWERS);
  const templates = getApplicableTemplates(highRiskResult);

  bench("buildPrompt for single template", () => {
    if (templates.length > 0) {
      buildPrompt(templates[0].id, highRiskResult, "Bench Corp", "A chatbot");
    }
  });

  bench("buildPrompt for all applicable templates", () => {
    for (const t of templates) {
      buildPrompt(t.id, highRiskResult, "Bench Corp", "A chatbot");
    }
  });
});

// ── Wizard Questions ────────────────────────────────────────
describe("Wizard Question Flow", () => {
  bench("getVisibleQuestions for first step", () => {
    getVisibleQuestions(WIZARD_STEPS[0].id, MINIMAL_ANSWERS);
  });

  bench("getVisibleQuestions all steps", () => {
    for (const step of WIZARD_STEPS) {
      getVisibleQuestions(step.id, HIGH_RISK_ANSWERS);
    }
  });

  bench("getNextStep traversal", () => {
    let stepId = WIZARD_STEPS[0].id;
    for (let i = 0; i < 17; i++) {
      const next = getNextStep(stepId, HIGH_RISK_ANSWERS);
      if (!next) break;
      stepId = next;
    }
  });

  bench("getProgressPercent", () => {
    getProgressPercent("summary", MINIMAL_ANSWERS);
  });

  bench("getVisibleSteps", () => {
    getVisibleSteps(HIGH_RISK_ANSWERS);
  });
});

// ── Store State Transitions ─────────────────────────────────
describe("Store Operations", () => {
  bench("create fresh store + set answers", async () => {
    // Dynamic import to avoid Zustand singleton issues
    const { useWizardStore } = await import("@/lib/store");
    const store = useWizardStore.getState();
    store.reset();
    store.setAnswer("companyName", "Bench Corp");
    store.setAnswer("primaryRole", "PROVIDER");
    store.setAnswer("systemName", "BenchBot");
  });
});
