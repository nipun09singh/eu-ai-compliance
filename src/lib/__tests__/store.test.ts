/**
 * LAYER 4 — store.test.ts
 * Matrices ST1–ST10: Zustand wizard store (useWizardStore)
 *
 * Tests all 8 store actions + initial state + computed helpers.
 * Mocks classifyAISystem (tested in L1) but uses REAL wizard-questions
 * functions to validate proper integration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WIZARD_STEPS, getVisibleSteps, getProgressPercent } from "../wizard-questions";
import type { WizardAnswers, ClassificationResult } from "../classification-engine";

// Mock the classification engine — tested exhaustively in Layer 1
vi.mock("../classification-engine", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../classification-engine")>();
  return {
    ...actual,
    classifyAISystem: vi.fn(() => ({
      classification: "MINIMAL_RISK" as const,
      confidence: 0.95,
      summary: "Mock minimal risk result",
      obligations: [],
      warnings: [],
      nextSteps: [],
      detailedAnalysis: {
        prohibitedCheck: { isProhibited: false, triggeredArticles: [], details: [] },
        highRiskCheck: { isHighRisk: false, riskCategory: null, details: [] },
        gpaiCheck: { isGPAI: false, hasSystemicRisk: false, details: [] },
        transparencyCheck: { hasObligations: false, details: [] },
      },
      detectedRoles: ["PROVIDER" as const],
      applicableArticles: [],
      templates: [],
      regulatoryTimeline: [],
    })),
  };
});

// We need to import AFTER mocking
const { useWizardStore } = await import("../store");
const { classifyAISystem } = await import("../classification-engine");

// ── Helpers ───────────────────────────────────────────────────────────────────

const resetStore = () => useWizardStore.getState().reset();

const mockClassify = classifyAISystem as ReturnType<typeof vi.fn>;

/** Fill required answers for a step so nextStep() validation passes */
function fillStepAnswers(stepId: string) {
  const { setAnswer } = useWizardStore.getState();
  switch (stepId) {
    case "company":
      setAnswer("companyName", "Test Corp");
      setAnswer("companySize", "MEDIUM");
      setAnswer("isEUBased", true);
      break;
    case "role":
      setAnswer("role", "PROVIDER");
      break;
    case "system":
      setAnswer("systemDescription", "AI chatbot for customer service");
      break;
    case "exclusions":
      setAnswer("militaryDefenceOnly", false);
      setAnswer("personalNonProfessionalUse", false);
      break;
    case "prohibited":
      setAnswer("socialScoring", false);
      setAnswer("manipulativeTechniques", false);
      setAnswer("vulnerabilityExploitation", false);
      setAnswer("facialRecognitionDB", false);
      setAnswer("emotionRecognitionWorkEdu", false);
      setAnswer("biometricCategorisation", false);
      setAnswer("realTimeBiometricId", false);
      break;
    case "gpai":
      setAnswer("isGeneralPurposeModel", false);
      break;
    case "transparency":
      setAnswer("interactsWithHumansDirectly", false);
      break;
    case "summary":
      // No questions on summary step
      break;
    default:
      // Other steps — fill nothing, they have conditionally-visible questions
      break;
  }
}

// ============================================================================
// ST1: Initial State
// ============================================================================
describe("ST1: Initial State", () => {
  beforeEach(resetStore);

  it("currentStepId is the first step (company)", () => {
    expect(useWizardStore.getState().currentStepId).toBe("company");
  });

  it("currentStep matches WIZARD_STEPS[0]", () => {
    expect(useWizardStore.getState().currentStep).toBe(WIZARD_STEPS[0]);
  });

  it("answers is an empty object", () => {
    expect(useWizardStore.getState().answers).toEqual({});
  });

  it("result is null", () => {
    expect(useWizardStore.getState().result).toBeNull();
  });

  it("isComplete is false", () => {
    expect(useWizardStore.getState().isComplete).toBe(false);
  });

  it("progress is 0", () => {
    expect(useWizardStore.getState().progress).toBe(0);
  });

  it("all action methods are functions", () => {
    const state = useWizardStore.getState();
    expect(typeof state.setAnswer).toBe("function");
    expect(typeof state.nextStep).toBe("function");
    expect(typeof state.prevStep).toBe("function");
    expect(typeof state.goToStep).toBe("function");
    expect(typeof state.submitClassification).toBe("function");
    expect(typeof state.reset).toBe("function");
    expect(typeof state.getVisibleQuestions).toBe("function");
    expect(typeof state.getVisibleSteps).toBe("function");
  });
});

// ============================================================================
// ST2: setAnswer
// ============================================================================
describe("ST2: setAnswer()", () => {
  beforeEach(resetStore);

  it("sets a string answer", () => {
    useWizardStore.getState().setAnswer("companyName", "Acme Inc.");
    expect(useWizardStore.getState().answers.companyName).toBe("Acme Inc.");
  });

  it("sets a boolean answer", () => {
    useWizardStore.getState().setAnswer("isEUBased", true);
    expect(useWizardStore.getState().answers.isEUBased).toBe(true);
  });

  it("sets a SINGLE_SELECT answer", () => {
    useWizardStore.getState().setAnswer("companySize", "SMALL");
    expect(useWizardStore.getState().answers.companySize).toBe("SMALL");
  });

  it("sets a numeric answer", () => {
    useWizardStore.getState().setAnswer("gpaiTrainingCompute", 1e25);
    expect(useWizardStore.getState().answers.gpaiTrainingCompute).toBe(1e25);
  });

  it("overwrites an existing answer", () => {
    const { setAnswer } = useWizardStore.getState();
    setAnswer("companyName", "Old Name");
    setAnswer("companyName", "New Name");
    expect(useWizardStore.getState().answers.companyName).toBe("New Name");
  });

  it("preserves other answers", () => {
    const { setAnswer } = useWizardStore.getState();
    setAnswer("companyName", "Acme");
    setAnswer("isEUBased", true);
    expect(useWizardStore.getState().answers.companyName).toBe("Acme");
    expect(useWizardStore.getState().answers.isEUBased).toBe(true);
  });

  it("updates progress when answer is set", () => {
    useWizardStore.getState().setAnswer("companyName", "Test");
    const state = useWizardStore.getState();
    const expectedProgress = getProgressPercent(state.currentStepId, state.answers);
    expect(state.progress).toBe(expectedProgress);
  });

  it("can set answer to false", () => {
    useWizardStore.getState().setAnswer("isEUBased", false);
    expect(useWizardStore.getState().answers.isEUBased).toBe(false);
  });

  it("can set answer to empty string", () => {
    useWizardStore.getState().setAnswer("companyName", "");
    expect(useWizardStore.getState().answers.companyName).toBe("");
  });

  it("can set answer to null", () => {
    useWizardStore.getState().setAnswer("companyName", null);
    expect(useWizardStore.getState().answers.companyName).toBeNull();
  });

  it("can set answer to undefined", () => {
    useWizardStore.getState().setAnswer("companyName", undefined);
    expect(useWizardStore.getState().answers.companyName).toBeUndefined();
  });
});

// ============================================================================
// ST3: nextStep
// ============================================================================
describe("ST3: nextStep()", () => {
  beforeEach(() => {
    resetStore();
    mockClassify.mockClear();
  });

  it("navigates from company to role", () => {
    fillStepAnswers("company");
    useWizardStore.getState().nextStep();
    expect(useWizardStore.getState().currentStepId).toBe("role");
  });

  it("updates currentStep to match new step", () => {
    fillStepAnswers("company");
    useWizardStore.getState().nextStep();
    const state = useWizardStore.getState();
    expect(state.currentStep.id).toBe(state.currentStepId);
  });

  it("updates progress on navigation", () => {
    fillStepAnswers("company");
    useWizardStore.getState().nextStep();
    expect(useWizardStore.getState().progress).toBeGreaterThan(0);
  });

  it("navigates through multiple steps in sequence", () => {
    fillStepAnswers("company");
    useWizardStore.getState().nextStep(); // company → role
    expect(useWizardStore.getState().currentStepId).toBe("role");
    fillStepAnswers("role");
    useWizardStore.getState().nextStep(); // role → system
    expect(useWizardStore.getState().currentStepId).toBe("system");
    fillStepAnswers("system");
    useWizardStore.getState().nextStep(); // system → exclusions
    expect(useWizardStore.getState().currentStepId).toBe("exclusions");
  });

  it("does not navigate when required fields are empty", () => {
    // Don't fill anything — should stay at company
    useWizardStore.getState().nextStep();
    expect(useWizardStore.getState().currentStepId).toBe("company");
    expect(useWizardStore.getState().showValidation).toBe(true);
    expect(useWizardStore.getState().validationErrors.length).toBeGreaterThan(0);
  });

  it("clears validation errors after filling and navigating", () => {
    // Try without filling
    useWizardStore.getState().nextStep();
    expect(useWizardStore.getState().showValidation).toBe(true);
    // Now fill and try again
    fillStepAnswers("company");
    useWizardStore.getState().nextStep();
    expect(useWizardStore.getState().currentStepId).toBe("role");
    expect(useWizardStore.getState().showValidation).toBe(false);
    expect(useWizardStore.getState().validationErrors).toEqual([]);
  });

  it("skips hidden steps", () => {
    // Set prohibited flag then navigate from prohibited
    useWizardStore.getState().setAnswer("socialScoring", true);
    // Navigate to prohibited step first
    useWizardStore.getState().goToStep("prohibited");
    expect(useWizardStore.getState().currentStepId).toBe("prohibited");
    // Fill ALL visible prohibited questions so validation passes
    const visibleQs = useWizardStore.getState().getVisibleQuestions();
    for (const q of visibleQs) {
      const fieldKey = typeof q.mapToField === "string" ? q.mapToField : q.id;
      const currentVal = (useWizardStore.getState().answers as any)[fieldKey];
      if (currentVal === undefined || currentVal === null) {
        // Set boolean questions to false, text/number to a default
        if (q.type === "BOOLEAN") useWizardStore.getState().setAnswer(fieldKey, false);
        else if (q.type === "TEXT") useWizardStore.getState().setAnswer(fieldKey, "test");
        else if (q.type === "NUMBER") useWizardStore.getState().setAnswer(fieldKey, 0);
      }
    }
    // socialScoring is already true, re-set it
    useWizardStore.getState().setAnswer("socialScoring", true);
    // Next should skip safetyComponent, annexIII, exception
    useWizardStore.getState().nextStep();
    expect(useWizardStore.getState().currentStepId).toBe("transparency");
  });

  it("triggers submitClassification at the last step", () => {
    // Navigate to the summary step directly (no validation on goToStep)
    useWizardStore.getState().goToStep("summary");
    expect(useWizardStore.getState().currentStepId).toBe("summary");
    // nextStep from summary → no more steps → submitClassification called
    // Summary step has no questions → validation passes
    useWizardStore.getState().nextStep();
    expect(mockClassify).toHaveBeenCalledTimes(1);
    expect(useWizardStore.getState().isComplete).toBe(true);
    expect(useWizardStore.getState().progress).toBe(100);
  });
});

// ============================================================================
// ST4: prevStep
// ============================================================================
describe("ST4: prevStep()", () => {
  beforeEach(resetStore);

  it("does nothing at company (first step)", () => {
    useWizardStore.getState().prevStep();
    expect(useWizardStore.getState().currentStepId).toBe("company");
  });

  it("navigates backward from role to company", () => {
    fillStepAnswers("company");
    useWizardStore.getState().nextStep(); // → role
    useWizardStore.getState().prevStep(); // → company
    expect(useWizardStore.getState().currentStepId).toBe("company");
  });

  it("updates currentStep on backward navigation", () => {
    fillStepAnswers("company");
    useWizardStore.getState().nextStep(); // → role
    useWizardStore.getState().prevStep(); // → company
    expect(useWizardStore.getState().currentStep.id).toBe("company");
  });

  it("skips hidden steps when going backward", () => {
    useWizardStore.getState().setAnswer("socialScoring", true);
    useWizardStore.getState().goToStep("transparency");
    useWizardStore.getState().prevStep();
    // Should skip exception, annexIII, safetyComponent → prohibited
    expect(useWizardStore.getState().currentStepId).toBe("prohibited");
  });

  it("updates progress on backward navigation", () => {
    fillStepAnswers("company");
    useWizardStore.getState().nextStep(); // → role
    const progressBefore = useWizardStore.getState().progress;
    useWizardStore.getState().prevStep(); // → company
    expect(useWizardStore.getState().progress).toBeLessThan(progressBefore);
  });
});

// ============================================================================
// ST5: goToStep
// ============================================================================
describe("ST5: goToStep()", () => {
  beforeEach(resetStore);

  it("navigates to a visible step", () => {
    useWizardStore.getState().goToStep("prohibited");
    expect(useWizardStore.getState().currentStepId).toBe("prohibited");
  });

  it("updates currentStep to match the target step", () => {
    useWizardStore.getState().goToStep("gpai");
    expect(useWizardStore.getState().currentStep.id).toBe("gpai");
  });

  it("updates progress on goToStep", () => {
    useWizardStore.getState().goToStep("gpai");
    expect(useWizardStore.getState().progress).toBeGreaterThan(0);
  });

  it("does NOT navigate to a hidden step", () => {
    useWizardStore.getState().setAnswer("socialScoring", true);
    useWizardStore.getState().goToStep("safetyComponent");
    // safetyComponent is hidden → should stay at company
    expect(useWizardStore.getState().currentStepId).toBe("company");
  });

  it("does NOT navigate to a nonexistent step", () => {
    useWizardStore.getState().goToStep("nonexistent");
    expect(useWizardStore.getState().currentStepId).toBe("company");
  });

  it("can navigate to summary step", () => {
    useWizardStore.getState().goToStep("summary");
    expect(useWizardStore.getState().currentStepId).toBe("summary");
  });

  it("can navigate to first step", () => {
    useWizardStore.getState().goToStep("gpai");
    useWizardStore.getState().goToStep("company");
    expect(useWizardStore.getState().currentStepId).toBe("company");
  });

  it("navigating to hidden step after answers change blocks navigation", () => {
    // annexIII hidden when product safety high-risk
    useWizardStore.getState().setAnswer("isSafetyComponent", true);
    useWizardStore.getState().setAnswer("productUnderAnnexI", true);
    useWizardStore.getState().setAnswer("requiresThirdPartyConformity", true);
    useWizardStore.getState().goToStep("annexIII");
    // Should NOT navigate there
    expect(useWizardStore.getState().currentStepId).toBe("company");
  });
});

// ============================================================================
// ST6: submitClassification
// ============================================================================
describe("ST6: submitClassification()", () => {
  beforeEach(() => {
    resetStore();
    mockClassify.mockClear();
  });

  it("calls classifyAISystem with current answers", () => {
    useWizardStore.getState().setAnswer("companyName", "Test Corp");
    useWizardStore.getState().setAnswer("isEUBased", true);
    useWizardStore.getState().submitClassification();
    expect(mockClassify).toHaveBeenCalledTimes(1);
    const passedAnswers = mockClassify.mock.calls[0][0];
    expect(passedAnswers.companyName).toBe("Test Corp");
    expect(passedAnswers.isEUBased).toBe(true);
  });

  it("sets result on successful classification", () => {
    useWizardStore.getState().submitClassification();
    const state = useWizardStore.getState();
    expect(state.result).not.toBeNull();
    expect(state.result!.classification).toBe("MINIMAL_RISK");
  });

  it("sets isComplete to true", () => {
    useWizardStore.getState().submitClassification();
    expect(useWizardStore.getState().isComplete).toBe(true);
  });

  it("sets progress to 100", () => {
    useWizardStore.getState().submitClassification();
    expect(useWizardStore.getState().progress).toBe(100);
  });

  it("handles classification errors without crashing", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockClassify.mockImplementationOnce(() => {
      throw new Error("Classification failed");
    });

    expect(() => useWizardStore.getState().submitClassification()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Classification error:",
      expect.any(Error)
    );
    // result should remain null
    expect(useWizardStore.getState().result).toBeNull();
    consoleSpy.mockRestore();
  });

  it("preserves answers after classification", () => {
    useWizardStore.getState().setAnswer("companyName", "PersistedCorp");
    useWizardStore.getState().submitClassification();
    expect(useWizardStore.getState().answers.companyName).toBe("PersistedCorp");
  });

  it("uses different mock results when mock is changed", () => {
    mockClassify.mockReturnValueOnce({
      classification: "HIGH_RISK",
      confidence: 0.99,
      summary: "High risk!",
      obligations: [{ id: "TEST", description: "Test obligation", priority: "HIGH", article: "Art 1", deadline: null }],
      warnings: [],
      nextSteps: [],
      detailedAnalysis: {
        prohibitedCheck: { isProhibited: false, triggeredArticles: [], details: [] },
        highRiskCheck: { isHighRisk: true, riskCategory: "ANNEX_III", details: [] },
        gpaiCheck: { isGPAI: false, hasSystemicRisk: false, details: [] },
        transparencyCheck: { hasObligations: false, details: [] },
      },
      detectedRoles: ["PROVIDER"],
      applicableArticles: [],
      templates: [],
      regulatoryTimeline: [],
    });

    useWizardStore.getState().submitClassification();
    const state = useWizardStore.getState();
    expect(state.result!.classification).toBe("HIGH_RISK");
    expect(state.result!.obligations).toHaveLength(1);
  });
});

// ============================================================================
// ST7: reset
// ============================================================================
describe("ST7: reset()", () => {
  beforeEach(resetStore);

  it("restores currentStepId to company", () => {
    useWizardStore.getState().goToStep("gpai");
    useWizardStore.getState().reset();
    expect(useWizardStore.getState().currentStepId).toBe("company");
  });

  it("clears answers", () => {
    useWizardStore.getState().setAnswer("companyName", "Test");
    useWizardStore.getState().setAnswer("isEUBased", true);
    useWizardStore.getState().reset();
    expect(useWizardStore.getState().answers).toEqual({});
  });

  it("clears result", () => {
    useWizardStore.getState().submitClassification();
    expect(useWizardStore.getState().result).not.toBeNull();
    useWizardStore.getState().reset();
    expect(useWizardStore.getState().result).toBeNull();
  });

  it("resets isComplete to false", () => {
    useWizardStore.getState().submitClassification();
    expect(useWizardStore.getState().isComplete).toBe(true);
    useWizardStore.getState().reset();
    expect(useWizardStore.getState().isComplete).toBe(false);
  });

  it("resets progress to 0", () => {
    fillStepAnswers("company");
    useWizardStore.getState().nextStep();
    expect(useWizardStore.getState().progress).toBeGreaterThan(0);
    useWizardStore.getState().reset();
    expect(useWizardStore.getState().progress).toBe(0);
  });

  it("restores currentStep to WIZARD_STEPS[0]", () => {
    useWizardStore.getState().goToStep("gpai");
    useWizardStore.getState().reset();
    expect(useWizardStore.getState().currentStep).toBe(WIZARD_STEPS[0]);
  });

  it("can be called multiple times without issue", () => {
    useWizardStore.getState().reset();
    useWizardStore.getState().reset();
    useWizardStore.getState().reset();
    expect(useWizardStore.getState().currentStepId).toBe("company");
  });

  it("allows re-navigation after reset", () => {
    fillStepAnswers("company");
    useWizardStore.getState().nextStep();
    fillStepAnswers("role");
    useWizardStore.getState().nextStep();
    useWizardStore.getState().reset();
    fillStepAnswers("company");
    useWizardStore.getState().nextStep();
    expect(useWizardStore.getState().currentStepId).toBe("role");
  });
});

// ============================================================================
// ST8: getVisibleQuestions (computed)
// ============================================================================
describe("ST8: getVisibleQuestions() — store computed", () => {
  beforeEach(resetStore);

  it("returns questions for the current step", () => {
    const questions = useWizardStore.getState().getVisibleQuestions();
    // company step: 3 questions visible (isEUBased undefined → outputUsedInEU hidden)
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].id).toBe("companyName");
  });

  it("updates when step changes", () => {
    fillStepAnswers("company");
    useWizardStore.getState().nextStep(); // → role
    const questions = useWizardStore.getState().getVisibleQuestions();
    expect(questions[0].id).toBe("role");
  });

  it("reflects answer-dependent visibility", () => {
    // On company step, set isEUBased=false → outputUsedInEU appears
    useWizardStore.getState().setAnswer("isEUBased", false);
    const questions = useWizardStore.getState().getVisibleQuestions();
    expect(questions.some((q) => q.id === "outputUsedInEU")).toBe(true);
    expect(questions).toHaveLength(4);
  });

  it("returns empty array for summary step", () => {
    useWizardStore.getState().goToStep("summary");
    const questions = useWizardStore.getState().getVisibleQuestions();
    expect(questions).toHaveLength(0);
  });
});

// ============================================================================
// ST9: getVisibleSteps (computed)
// ============================================================================
describe("ST9: getVisibleSteps() — store computed", () => {
  beforeEach(resetStore);

  it("returns visible steps based on current answers", () => {
    const steps = useWizardStore.getState().getVisibleSteps();
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].id).toBe("company");
  });

  it("updates when answers change", () => {
    const stepsBefore = useWizardStore.getState().getVisibleSteps();
    useWizardStore.getState().setAnswer("socialScoring", true);
    const stepsAfter = useWizardStore.getState().getVisibleSteps();
    // socialScoring hides safetyComponent + annexIII
    expect(stepsAfter.length).toBeLessThan(stepsBefore.length);
  });

  it("includes exception when Annex III flag is set", () => {
    useWizardStore.getState().setAnswer("usesBiometrics", true);
    const steps = useWizardStore.getState().getVisibleSteps();
    expect(steps.some((s) => s.id === "exception")).toBe(true);
  });

  it("includes gpaiSupplyChain when GPAI provider", () => {
    useWizardStore.getState().setAnswer("isGeneralPurposeModel", true);
    const steps = useWizardStore.getState().getVisibleSteps();
    expect(steps.some((s) => s.id === "gpaiSupplyChain")).toBe(true);
  });
});

// ============================================================================
// ST10: Integration Flows
// ============================================================================
describe("ST10: Full wizard flow integration", () => {
  beforeEach(() => {
    resetStore();
    mockClassify.mockClear();
  });

  it("complete flow: navigate all steps → submit → reset → navigate again", () => {
    const state = useWizardStore.getState;

    // Set some answers
    state().setAnswer("companyName", "Integration Corp");
    state().setAnswer("companySize", "MEDIUM");
    state().setAnswer("isEUBased", true);
    state().setAnswer("role", "DEPLOYER");
    state().setAnswer("systemDescription", "AI chatbot for testing");
    state().setAnswer("militaryDefenceOnly", false);

    // Navigate forward
    state().nextStep(); // → role (company answers filled)
    state().nextStep(); // → system (role answer filled)
    state().nextStep(); // → exclusions (systemDescription filled)
    expect(state().currentStepId).toBe("exclusions");

    // Go back
    state().prevStep(); // → system
    expect(state().currentStepId).toBe("system");

    // Jump forward
    state().goToStep("gpai");
    expect(state().currentStepId).toBe("gpai");

    // Submit
    state().submitClassification();
    expect(state().isComplete).toBe(true);
    expect(state().result).not.toBeNull();

    // Reset
    state().reset();
    expect(state().currentStepId).toBe("company");
    expect(state().answers).toEqual({});
    expect(state().result).toBeNull();
    expect(state().isComplete).toBe(false);

    // Navigate again
    fillStepAnswers("company");
    state().nextStep();
    expect(state().currentStepId).toBe("role");
  });

  it("answer changes dynamically affect step visibility mid-flow", () => {
    const state = useWizardStore.getState;

    // Start with no prohibited flags
    state().goToStep("safetyComponent");
    expect(state().currentStepId).toBe("safetyComponent");

    // Set prohibited flag
    state().setAnswer("socialScoring", true);

    // safetyComponent should now be hidden — but we're ALREADY on it
    // goToStep should fail for it now
    state().goToStep("company"); // navigate away first
    state().goToStep("safetyComponent"); // should fail
    expect(state().currentStepId).toBe("company");
  });

  it("multiple rapid setAnswer calls accumulate correctly", () => {
    const state = useWizardStore.getState;
    state().setAnswer("companyName", "A");
    state().setAnswer("companySize", "MICRO");
    state().setAnswer("isEUBased", false);
    state().setAnswer("outputUsedInEU", true);
    state().setAnswer("role", "BOTH");
    state().setAnswer("systemDescription", "Test AI");

    const answers = state().answers;
    expect(answers.companyName).toBe("A");
    expect(answers.companySize).toBe("MICRO");
    expect(answers.isEUBased).toBe(false);
    expect(answers.outputUsedInEU).toBe(true);
    expect(answers.role).toBe("BOTH");
    expect(answers.systemDescription).toBe("Test AI");
  });

  it("classification error does not break subsequent navigation", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockClassify.mockImplementation(() => {
      throw new Error("Boom");
    });

    useWizardStore.getState().submitClassification();
    expect(useWizardStore.getState().result).toBeNull();
    expect(useWizardStore.getState().isComplete).toBe(false);

    // Can still navigate
    fillStepAnswers("company");
    useWizardStore.getState().nextStep(); // → role
    expect(useWizardStore.getState().currentStepId).toBe("role");

    consoleSpy.mockRestore();
  });

  it("progress at company = expected percentage", () => {
    const progress = useWizardStore.getState().progress;
    // After reset, progress is 0 (initial state)
    expect(progress).toBe(0);
    // After setting any answer, progress re-computes
    useWizardStore.getState().setAnswer("companyName", "Test");
    const newProgress = useWizardStore.getState().progress;
    const expected = getProgressPercent("company", { companyName: "Test" } as any);
    expect(newProgress).toBe(expected);
  });

  it("navigating to summary and back preserves answers", () => {
    const state = useWizardStore.getState;
    state().setAnswer("companyName", "Preserved Corp");
    state().goToStep("summary");
    state().goToStep("company");
    expect(state().answers.companyName).toBe("Preserved Corp");
  });

  it("state is shared across getState calls (Zustand singleton)", () => {
    useWizardStore.getState().setAnswer("companyName", "Singleton");
    const anotherRef = useWizardStore.getState();
    expect(anotherRef.answers.companyName).toBe("Singleton");
  });
});
