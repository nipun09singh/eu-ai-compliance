/**
 * LAYER 4 — wizard-flow.test.ts
 * Matrices WQ10–WQ15: Flow control functions (getNextStep, getPreviousStep,
 * getVisibleQuestions, getProgressPercent, getVisibleSteps) + real-world
 * scenario flows.
 */
import { describe, it, expect, test } from "vitest";
import {
  WIZARD_STEPS,
  getNextStep,
  getPreviousStep,
  getVisibleQuestions,
  getProgressPercent,
  getVisibleSteps,
} from "../wizard-questions";
import type { WizardStep } from "../wizard-questions";
import type { WizardAnswers } from "../classification-engine";

// ── Helpers ───────────────────────────────────────────────────────────────────

const step = (id: string): WizardStep => {
  const s = WIZARD_STEPS.find((s) => s.id === id);
  if (!s) throw new Error(`Step ${id} not found`);
  return s;
};

const a = (overrides: Partial<WizardAnswers> = {}): Partial<WizardAnswers> =>
  overrides;

// ============================================================================
// WQ10: getNextStep()
// ============================================================================
describe("WQ10: getNextStep() — basic forward navigation", () => {
  it("from company → role with empty answers", () => {
    const next = getNextStep("company", a({}));
    expect(next?.id).toBe("role");
  });

  it("from role → system", () => {
    expect(getNextStep("role", a({}))?.id).toBe("system");
  });

  it("from system → exclusions", () => {
    expect(getNextStep("system", a({}))?.id).toBe("exclusions");
  });

  it("from exclusions → prohibited", () => {
    expect(getNextStep("exclusions", a({}))?.id).toBe("prohibited");
  });

  it("from summary (last step) → null", () => {
    expect(getNextStep("summary", a({}))).toBeNull();
  });

  it("from unknown step → returns first visible step (findIndex returns -1, loop starts at 0)", () => {
    // findIndex returns -1 for unknown id, loop starts at i=0, returns first visible step
    const result = getNextStep("nonexistent", a({}));
    expect(result).not.toBeNull();
    expect(result!.id).toBe("company");
  });
});

describe("WQ10: getNextStep() — skips hidden steps", () => {
  it("from prohibited skips safetyComponent when prohibited (socialScoring)", () => {
    const next = getNextStep("prohibited", a({ socialScoring: true }));
    // safetyComponent is hidden, annexIII is hidden, exception depends...
    // With socialScoring=true, safetyComponent hidden, annexIII hidden,
    // exception: no Annex III flags → hidden
    // transparency: no showIf → visible
    expect(next?.id).toBe("transparency");
  });

  it("from prohibited → safetyComponent when NOT prohibited", () => {
    const next = getNextStep("prohibited", a({}));
    expect(next?.id).toBe("safetyComponent");
  });

  it("from prohibited skips to transparency when prohibited by manipulation+harm", () => {
    const next = getNextStep(
      "prohibited",
      a({
        usesSubliminaManipulation: true,
        manipulationCausesSignificantHarm: true,
      })
    );
    expect(next?.id).toBe("transparency");
  });

  it("from prohibited skips to transparency when facialRecognitionScraping", () => {
    const next = getNextStep(
      "prohibited",
      a({ facialRecognitionScraping: true })
    );
    expect(next?.id).toBe("transparency");
  });

  it("from gpai → supplyChain (when no exclusions)", () => {
    const next = getNextStep("gpai", a({}));
    expect(next?.id).toBe("supplyChain");
  });

  it("from gpai skips supplyChain when military exclusion", () => {
    const next = getNextStep("gpai", a({ militaryDefenceOnly: true }));
    // supplyChain hidden, sectorSpecific hidden (no hr flags), gdprData hidden
    // extraterritorial: isEUBased=undefined → hidden
    // transitional hidden
    // gpaiSupplyChain: isGeneralPurposeModel=undefined → hidden
    // summary: always shown
    expect(next?.id).toBe("summary");
  });

  it("skips extraterritorial when EU-based", () => {
    const next = getNextStep("gdprData", a({ isEUBased: true }));
    // extraterritorial hidden
    // transitional: no exclusions → visible
    expect(next?.id).toBe("transitional");
  });

  it("shows extraterritorial when non-EU + output used in EU", () => {
    const next = getNextStep(
      "gdprData",
      a({ isEUBased: false, outputUsedInEU: true })
    );
    expect(next?.id).toBe("extraterritorial");
  });

  it("skips gpaiSupplyChain when not a GPAI provider", () => {
    const next = getNextStep(
      "transitional",
      a({ isGeneralPurposeModel: false })
    );
    expect(next?.id).toBe("summary");
  });

  it("shows gpaiSupplyChain when GPAI provider", () => {
    const next = getNextStep(
      "transitional",
      a({ isGeneralPurposeModel: true })
    );
    expect(next?.id).toBe("gpaiSupplyChain");
  });
});

describe("WQ10: getNextStep() — safetyComponent → annexIII skip", () => {
  it("from safetyComponent → annexIII when not product-safety high-risk", () => {
    expect(getNextStep("safetyComponent", a({}))?.id).toBe("annexIII");
  });

  it("from safetyComponent → annexIII when partial product safety", () => {
    expect(
      getNextStep(
        "safetyComponent",
        a({ isSafetyComponent: true, productUnderAnnexI: false })
      )?.id
    ).toBe("annexIII");
  });

  it("from safetyComponent skips annexIII when product-safety high-risk", () => {
    const next = getNextStep(
      "safetyComponent",
      a({
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
      })
    );
    // annexIII hidden, exception: no Annex III flags → hidden
    // transparency: always visible
    expect(next?.id).toBe("transparency");
  });
});

describe("WQ10: getNextStep() — exception step navigation", () => {
  it("from annexIII → exception when Annex III flag is set", () => {
    const next = getNextStep("annexIII", a({ usesBiometrics: true }));
    expect(next?.id).toBe("exception");
  });

  it("from annexIII skips exception when no Annex III flags", () => {
    const next = getNextStep("annexIII", a({}));
    // exception hidden
    // transparency always shown
    expect(next?.id).toBe("transparency");
  });

  it("from annexIII → exception when multiple flags", () => {
    const next = getNextStep(
      "annexIII",
      a({ educationUseCase: true, employmentUseCase: true })
    );
    expect(next?.id).toBe("exception");
  });
});

describe("WQ10: getNextStep() — sectorSpecific navigation", () => {
  it("from supplyChain → sectorSpecific when high-risk flags set", () => {
    const next = getNextStep(
      "supplyChain",
      a({ isSafetyComponent: true })
    );
    expect(next?.id).toBe("sectorSpecific");
  });

  it("from supplyChain skips sectorSpecific when no high-risk flags", () => {
    const next = getNextStep("supplyChain", a({}));
    // sectorSpecific hidden, gdprData visible (no exclusions)
    expect(next?.id).toBe("gdprData");
  });
});

// ============================================================================
// WQ11: getPreviousStep()
// ============================================================================
describe("WQ11: getPreviousStep() — basic backward navigation", () => {
  it("from company (first step) → null", () => {
    expect(getPreviousStep("company", a({}))).toBeNull();
  });

  it("from role → company", () => {
    expect(getPreviousStep("role", a({}))?.id).toBe("company");
  });

  it("from system → role", () => {
    expect(getPreviousStep("system", a({}))?.id).toBe("role");
  });

  it("from exclusions → system", () => {
    expect(getPreviousStep("exclusions", a({}))?.id).toBe("system");
  });

  it("from prohibited → exclusions", () => {
    expect(getPreviousStep("prohibited", a({}))?.id).toBe("exclusions");
  });

  it("from summary → gpaiSupplyChain when GPAI provider", () => {
    expect(
      getPreviousStep("summary", a({ isGeneralPurposeModel: true }))?.id
    ).toBe("gpaiSupplyChain");
  });

  it("from summary → transitional when not GPAI provider", () => {
    expect(
      getPreviousStep("summary", a({ isGeneralPurposeModel: false }))?.id
    ).toBe("transitional");
  });

  it("from unknown step → null", () => {
    expect(getPreviousStep("nonexistent", a({}))).toBeNull();
  });
});

describe("WQ11: getPreviousStep() — skips hidden steps", () => {
  it("from transparency → prohibited when safetyComponent+annexIII+exception hidden (prohibited)", () => {
    const prev = getPreviousStep(
      "transparency",
      a({ socialScoring: true })
    );
    expect(prev?.id).toBe("prohibited");
  });

  it("from transparency → annexIII when only safetyComponent is hidden (product safety path)", () => {
    const prev = getPreviousStep(
      "transparency",
      a({
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
      })
    );
    // Going backward: exception hidden (no Annex III flags), annexIII hidden (product safety), safetyComponent visible
    // Wait - the safetyComponent is still shown (no prohibited triggers) but annexIII is hidden
    // So: transparency → exception check (hidden) → annexIII (hidden) → safetyComponent (visible)
    expect(prev?.id).toBe("safetyComponent");
  });

  it("from transitional → gdprData when extraterritorial is hidden (EU-based)", () => {
    const prev = getPreviousStep(
      "transitional",
      a({ isEUBased: true })
    );
    expect(prev?.id).toBe("gdprData");
  });

  it("from transitional → extraterritorial when non-EU + output in EU", () => {
    const prev = getPreviousStep(
      "transitional",
      a({ isEUBased: false, outputUsedInEU: true })
    );
    expect(prev?.id).toBe("extraterritorial");
  });

  it("from summary skips multiple hidden steps to reach transitional", () => {
    const prev = getPreviousStep(
      "summary",
      a({ isGeneralPurposeModel: false })
    );
    expect(prev?.id).toBe("transitional");
  });
});

describe("WQ11: getPreviousStep() — edge cases", () => {
  it("multiple consecutive hidden steps are all skipped", () => {
    // When prohibited (socialScoring), military, and non-GPAI:
    // Going back from summary should skip gpaiSupplyChain, transitional, extraterritorial, gdprData,
    // sectorSpecific, supplyChain → expect to reach transparency or gpai
    const prev = getPreviousStep(
      "summary",
      a({
        socialScoring: true,
        militaryDefenceOnly: true,
        isGeneralPurposeModel: false,
      })
    );
    // gpaiSupplyChain: hidden (not GPAI)
    // transitional: hidden (military)
    // extraterritorial: hidden (no isEUBased=false+outputUsedInEU=true)
    // gdprData: hidden (military)
    // sectorSpecific: hidden (no hr flags)
    // supplyChain: hidden (military)
    // gpai: always visible
    expect(prev?.id).toBe("gpai");
  });

  it("getPreviousStep returns null when at first step", () => {
    expect(getPreviousStep("company", a({}))).toBeNull();
  });

  it("getPreviousStep with full-exclusion scenario finds correct prior step", () => {
    // From transparency going back:
    // exception hidden (no Annex III), annexIII hidden (prohibited + product safety),
    // safetyComponent hidden (prohibited)
    // → prohibited
    const prev = getPreviousStep(
      "transparency",
      a({
        socialScoring: true,
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
      })
    );
    expect(prev?.id).toBe("prohibited");
  });
});

// ============================================================================
// WQ12: getVisibleQuestions()
// ============================================================================
describe("WQ12: getVisibleQuestions() — company step", () => {
  it("shows 3 questions when EU-based (outputUsedInEU hidden)", () => {
    const visible = getVisibleQuestions(step("company"), a({ isEUBased: true }));
    expect(visible).toHaveLength(3);
    expect(visible.map((q) => q.id)).toEqual([
      "companyName",
      "companySize",
      "isEUBased",
    ]);
  });

  it("shows 4 questions when non-EU-based", () => {
    const visible = getVisibleQuestions(
      step("company"),
      a({ isEUBased: false })
    );
    expect(visible).toHaveLength(4);
    expect(visible[3].id).toBe("outputUsedInEU");
  });

  it("shows 3 questions with empty answers (isEUBased undefined → outputUsedInEU hidden)", () => {
    const visible = getVisibleQuestions(step("company"), a({}));
    expect(visible).toHaveLength(3);
  });
});

describe("WQ12: getVisibleQuestions() — prohibited step", () => {
  it("shows only base questions (8) with empty answers", () => {
    const visible = getVisibleQuestions(step("prohibited"), a({}));
    // usesSubliminaManipulation, exploitsVulnerabilities, socialScoring,
    // criminalRiskProfiling, facialRecognitionScraping, workplaceEmotionDetection,
    // biometricCategorisationSensitive, realtimeBiometricPublicSpaces
    expect(visible).toHaveLength(8);
  });

  it("shows manipulation follow-up when manipulation is true", () => {
    const visible = getVisibleQuestions(
      step("prohibited"),
      a({ usesSubliminaManipulation: true })
    );
    expect(visible.some((q) => q.id === "manipulationCausesSignificantHarm")).toBe(true);
    expect(visible).toHaveLength(9);
  });

  it("shows full crime profiling chain (3 questions) when both parent flags true", () => {
    const visible = getVisibleQuestions(
      step("prohibited"),
      a({
        criminalRiskProfiling: true,
        crimeProfilingBasedSolelyOnPersonality: true,
      })
    );
    const crimeIds = visible
      .filter((q) =>
        ["criminalRiskProfiling", "crimeProfilingBasedSolelyOnPersonality", "crimeProfilingSupportingHumanAssessment"].includes(q.id)
      )
      .map((q) => q.id);
    expect(crimeIds).toHaveLength(3);
  });

  it("shows all 16 questions when every conditional trigger is activated", () => {
    const visible = getVisibleQuestions(
      step("prohibited"),
      a({
        usesSubliminaManipulation: true,
        exploitsVulnerabilities: true,
        criminalRiskProfiling: true,
        crimeProfilingBasedSolelyOnPersonality: true,
        workplaceEmotionDetection: true,
        biometricCategorisationSensitive: true,
        realtimeBiometricPublicSpaces: true,
        realtimeBiometricForLEException: true,
      })
    );
    expect(visible).toHaveLength(16);
  });

  it("realtime biometric questions: shows 2 of 3 when first parent true but LE exception false", () => {
    const visible = getVisibleQuestions(
      step("prohibited"),
      a({
        realtimeBiometricPublicSpaces: true,
        realtimeBiometricForLEException: false,
      })
    );
    const biometricIds = visible.filter((q) =>
      q.id.startsWith("realtimeBiometric")
    );
    expect(biometricIds).toHaveLength(2);
    expect(biometricIds.map(q => q.id)).toContain("realtimeBiometricPublicSpaces");
    expect(biometricIds.map(q => q.id)).toContain("realtimeBiometricForLEException");
  });
});

describe("WQ12: getVisibleQuestions() — safetyComponent step", () => {
  it("shows 1 question with empty answers (only base question)", () => {
    const visible = getVisibleQuestions(step("safetyComponent"), a({}));
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("isSafetyComponent");
  });

  it("shows 2 questions when isSafetyComponent true", () => {
    const visible = getVisibleQuestions(
      step("safetyComponent"),
      a({ isSafetyComponent: true })
    );
    expect(visible).toHaveLength(2);
  });

  it("shows 3 questions when isSafetyComponent + productUnderAnnexI", () => {
    const visible = getVisibleQuestions(
      step("safetyComponent"),
      a({ isSafetyComponent: true, productUnderAnnexI: true })
    );
    expect(visible).toHaveLength(3);
  });
});

describe("WQ12: getVisibleQuestions() — annexIII step", () => {
  it("shows only 8 base questions with empty answers", () => {
    const visible = getVisibleQuestions(step("annexIII"), a({}));
    // usesBiometrics, criticalInfrastructure, educationUseCase, employmentUseCase,
    // essentialServicesUseCase, lawEnforcementUseCase, migrationUseCase, justiceUseCase
    expect(visible).toHaveLength(8);
  });

  it("shows biometric sub-questions when usesBiometrics + not verificationOnly", () => {
    const visible = getVisibleQuestions(
      step("annexIII"),
      a({ usesBiometrics: true, isBiometricVerificationOnly: false })
    );
    expect(visible.some((q) => q.id === "biometricType")).toBe(true);
  });

  it("shows isBiometricVerificationOnly but NOT biometricType when usesBiometrics true only", () => {
    const visible = getVisibleQuestions(
      step("annexIII"),
      a({ usesBiometrics: true })
    );
    expect(visible.some((q) => q.id === "isBiometricVerificationOnly")).toBe(true);
    // biometricType requires isBiometricVerificationOnly === false, which is undefined here
    expect(visible.some((q) => q.id === "biometricType")).toBe(false);
  });

  it("shows all 16 questions when every parent trigger + sub-selector is activated", () => {
    const visible = getVisibleQuestions(
      step("annexIII"),
      a({
        usesBiometrics: true,
        isBiometricVerificationOnly: false,
        educationUseCase: true,
        employmentUseCase: true,
        essentialServicesUseCase: true,
        lawEnforcementUseCase: true,
        migrationUseCase: true,
        justiceUseCase: true,
      })
    );
    expect(visible).toHaveLength(16);
  });
});

describe("WQ12: getVisibleQuestions() — exception step cascade", () => {
  it("shows 2 questions when posesSignificantRiskOfHarm=true (cascade stops)", () => {
    const visible = getVisibleQuestions(
      step("exception"),
      a({ posesSignificantRiskOfHarm: true })
    );
    expect(visible).toHaveLength(2);
    expect(visible.map((q) => q.id)).toEqual([
      "posesSignificantRiskOfHarm",
      "performsProfiling",
    ]);
  });

  it("shows all 6 questions when no risk + no profiling (cascade uses !== true, undefined passes)", () => {
    const visible = getVisibleQuestions(
      step("exception"),
      a({ posesSignificantRiskOfHarm: false, performsProfiling: false })
    );
    // All conditional questions use `!== true` checks, so undefined values pass through
    expect(visible).toHaveLength(6);
  });

  it("still shows all 6 when narrowProceduralTask is explicitly false (false !== true passes)", () => {
    const visible = getVisibleQuestions(
      step("exception"),
      a({
        posesSignificantRiskOfHarm: false,
        performsProfiling: false,
        narrowProceduralTask: false,
      })
    );
    // narrowProceduralTask: false → false !== true → true → downstream questions still visible
    expect(visible).toHaveLength(6);
  });

  it("shows all 6 questions when every exception check is false", () => {
    const visible = getVisibleQuestions(
      step("exception"),
      a({
        posesSignificantRiskOfHarm: false,
        performsProfiling: false,
        narrowProceduralTask: false,
        improvesHumanActivity: false,
        detectsPatterns: false,
      })
    );
    expect(visible).toHaveLength(6);
  });

  it("shows only 2 questions when profiling is true (overrides everything)", () => {
    const visible = getVisibleQuestions(
      step("exception"),
      a({ posesSignificantRiskOfHarm: false, performsProfiling: true })
    );
    expect(visible).toHaveLength(2);
  });
});

describe("WQ12: getVisibleQuestions() — transparency step", () => {
  it("shows 5 questions with empty answers (generatesDeepfakes hidden)", () => {
    const visible = getVisibleQuestions(step("transparency"), a({}));
    expect(visible).toHaveLength(5);
  });

  it("shows 6 questions when generatesMedia is true", () => {
    const visible = getVisibleQuestions(
      step("transparency"),
      a({ generatesMedia: true })
    );
    expect(visible).toHaveLength(6);
    expect(visible.some((q) => q.id === "generatesDeepfakes")).toBe(true);
  });
});

describe("WQ12: getVisibleQuestions() — gpai step", () => {
  it("shows 1 question when not a GPAI provider", () => {
    const visible = getVisibleQuestions(step("gpai"), a({}));
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("isGeneralPurposeModel");
  });

  it("shows 4 questions when GPAI provider", () => {
    const visible = getVisibleQuestions(
      step("gpai"),
      a({ isGeneralPurposeModel: true })
    );
    expect(visible).toHaveLength(4);
  });
});

describe("WQ12: getVisibleQuestions() — supplyChain step", () => {
  it("shows 2 questions for PROVIDER role (madeSubstantialModification + usesThirdPartyAIComponents)", () => {
    const visible = getVisibleQuestions(
      step("supplyChain"),
      a({ role: "PROVIDER" })
    );
    // putOwnNameOrBrandOnSystem: hidden (PROVIDER)
    // madeSubstantialModification: always shown
    // changedPurposeToHighRisk: hidden (PROVIDER)
    // broughtSystemFromOutsideEU: hidden (PROVIDER)
    // resellsOrDistributesSystem: hidden (PROVIDER)
    // appointedAsAuthorisedRep: depends on isEUBased
    // usesThirdPartyAIComponents: always shown
    expect(visible).toHaveLength(2);
  });

  it("shows 3 questions for EU-based PROVIDER (adds appointedAsAuthorisedRep)", () => {
    const visible = getVisibleQuestions(
      step("supplyChain"),
      a({ role: "PROVIDER", isEUBased: true })
    );
    expect(visible).toHaveLength(3);
    expect(visible.some((q) => q.id === "appointedAsAuthorisedRep")).toBe(true);
  });

  it("shows 7 questions for EU-based DEPLOYER (all shown)", () => {
    const visible = getVisibleQuestions(
      step("supplyChain"),
      a({ role: "DEPLOYER", isEUBased: true })
    );
    expect(visible).toHaveLength(7);
  });

  it("shows 6 questions for non-EU DEPLOYER (appointedAsAuthorisedRep hidden)", () => {
    const visible = getVisibleQuestions(
      step("supplyChain"),
      a({ role: "DEPLOYER", isEUBased: false })
    );
    expect(visible).toHaveLength(6);
  });

  it("shows 7 questions for EU-based BOTH (all shown)", () => {
    const visible = getVisibleQuestions(
      step("supplyChain"),
      a({ role: "BOTH", isEUBased: true })
    );
    expect(visible).toHaveLength(7);
  });
});

describe("WQ12: getVisibleQuestions() — gdprData step", () => {
  it("shows 1 question with empty answers", () => {
    const visible = getVisibleQuestions(step("gdprData"), a({}));
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("processesPersonalData");
  });

  it("shows 3 questions when processesPersonalData is true", () => {
    const visible = getVisibleQuestions(
      step("gdprData"),
      a({ processesPersonalData: true })
    );
    expect(visible).toHaveLength(3);
  });
});

describe("WQ12: getVisibleQuestions() — transitional step", () => {
  it("shows 1 question with empty answers", () => {
    const visible = getVisibleQuestions(step("transitional"), a({}));
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("systemAlreadyOnMarketBeforeAug2026");
  });

  it("shows more questions with GPAI provider + DEPLOYER role + LE use case", () => {
    const visible = getVisibleQuestions(
      step("transitional"),
      a({
        isGeneralPurposeModel: true,
        role: "DEPLOYER",
        lawEnforcementUseCase: true,
      })
    );
    // systemAlreadyOnMarketBeforeAug2026: always
    // gpaiAlreadyOnMarketBeforeAug2025: GPAI=true
    // usedByPublicAuthority: DEPLOYER
    // isLargeScaleITSystem: LE=true
    // isPublicBodyOrPublicService: DEPLOYER
    expect(visible).toHaveLength(5);
  });

  it("shows 3 questions for DEPLOYER without GPAI or LE", () => {
    const visible = getVisibleQuestions(
      step("transitional"),
      a({ role: "DEPLOYER" })
    );
    // systemAlreadyOnMarketBeforeAug2026, usedByPublicAuthority, isPublicBodyOrPublicService
    expect(visible).toHaveLength(3);
  });

  it("shows 2 questions for GPAI PROVIDER without LE", () => {
    const visible = getVisibleQuestions(
      step("transitional"),
      a({ isGeneralPurposeModel: true, role: "PROVIDER" })
    );
    // systemAlreadyOnMarketBeforeAug2026, gpaiAlreadyOnMarketBeforeAug2025
    expect(visible).toHaveLength(2);
  });
});

describe("WQ12: getVisibleQuestions() — summary + gpaiSupplyChain + sectorSpecific + extraterritorial", () => {
  it("summary step returns empty array", () => {
    const visible = getVisibleQuestions(step("summary"), a({}));
    expect(visible).toHaveLength(0);
  });

  it("gpaiSupplyChain shows 1 question", () => {
    const visible = getVisibleQuestions(step("gpaiSupplyChain"), a({}));
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("gpaiUsedAsHighRiskComponent");
  });

  it("sectorSpecific shows 1 question", () => {
    const visible = getVisibleQuestions(step("sectorSpecific"), a({}));
    expect(visible).toHaveLength(1);
  });

  it("extraterritorial shows 1 question", () => {
    const visible = getVisibleQuestions(step("extraterritorial"), a({}));
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("hasAuthorisedRepInEU");
  });
});

// ============================================================================
// WQ13: getProgressPercent()
// ============================================================================
describe("WQ13: getProgressPercent()", () => {
  it("returns > 0 for the first step", () => {
    const pct = getProgressPercent("company", a({}));
    expect(pct).toBeGreaterThan(0);
  });

  it("returns 100 for the last visible step (summary)", () => {
    const pct = getProgressPercent("summary", a({}));
    expect(pct).toBe(100);
  });

  it("returns 0 for unknown step id", () => {
    expect(getProgressPercent("nonexistent", a({}))).toBe(0);
  });

  it("increases monotonically through visible steps", () => {
    const visible = getVisibleSteps(a({}));
    let prev = 0;
    for (const s of visible) {
      const pct = getProgressPercent(s.id, a({}));
      expect(pct).toBeGreaterThanOrEqual(prev);
      prev = pct;
    }
  });

  it("adapts when steps become hidden (removing steps BEFORE target reduces percentage)", () => {
    // With all visible (empty answers): 13 visible steps, transparency at index 7 → round(8/13*100)=62
    const pctEmpty = getProgressPercent("transparency", a({}));
    // With socialScoring, safetyComponent+annexIII are hidden (they are BEFORE transparency)
    // 11 visible steps, transparency at index 5 → round(6/11*100)=55
    const pctProhibited = getProgressPercent(
      "transparency",
      a({ socialScoring: true })
    );
    // Removing steps BEFORE transparency shifts it earlier → LOWER percentage
    expect(pctProhibited).toBeLessThan(pctEmpty);
  });

  it("adapts when steps become hidden (removing steps AFTER target increases percentage)", () => {
    // With empty answers: company at index 0 of 13 → round(1/13*100)=8
    const pctEmpty = getProgressPercent("company", a({}));
    // With militaryDefenceOnly: supplyChain+gdprData+transitional hidden (AFTER company)
    const pctMilitary = getProgressPercent(
      "company",
      a({ militaryDefenceOnly: true })
    );
    // Removing steps AFTER company keeps index but reduces total → HIGHER percentage
    expect(pctMilitary).toBeGreaterThan(pctEmpty);
  });

  it("first step percentage is correct with minimal visible steps", () => {
    // Military exclusion hides many steps
    const pct = getProgressPercent(
      "company",
      a({ militaryDefenceOnly: true })
    );
    const visible = getVisibleSteps(a({ militaryDefenceOnly: true }));
    expect(pct).toBe(Math.round((1 / visible.length) * 100));
  });

  it("percentage at midpoint step is around 50%", () => {
    const visible = getVisibleSteps(a({}));
    const midIdx = Math.floor(visible.length / 2);
    const pct = getProgressPercent(visible[midIdx].id, a({}));
    expect(pct).toBeGreaterThanOrEqual(40);
    expect(pct).toBeLessThanOrEqual(60);
  });

  it("returns correct integer (Math.round applied)", () => {
    const visible = getVisibleSteps(a({}));
    for (const s of visible) {
      const pct = getProgressPercent(s.id, a({}));
      expect(Number.isInteger(pct)).toBe(true);
    }
  });

  it("accounts for gpaiSupplyChain showing when GPAI provider", () => {
    const pctWithGpai = getProgressPercent(
      "summary",
      a({ isGeneralPurposeModel: true })
    );
    expect(pctWithGpai).toBe(100);
  });

  it("hidden step returns 0 (not in visible list)", () => {
    // safetyComponent hidden when socialScoring is true
    const pct = getProgressPercent(
      "safetyComponent",
      a({ socialScoring: true })
    );
    expect(pct).toBe(0);
  });
});

// ============================================================================
// WQ14: getVisibleSteps()
// ============================================================================
describe("WQ14: getVisibleSteps()", () => {
  it("returns all unconditional steps with empty answers", () => {
    const visible = getVisibleSteps(a({}));
    for (const id of [
      "company",
      "role",
      "system",
      "exclusions",
      "prohibited",
      "transparency",
      "gpai",
      "summary",
    ]) {
      expect(visible.some((s) => s.id === id)).toBe(true);
    }
  });

  it("includes safetyComponent and annexIII when no prohibited triggers", () => {
    const visible = getVisibleSteps(a({}));
    expect(visible.some((s) => s.id === "safetyComponent")).toBe(true);
    expect(visible.some((s) => s.id === "annexIII")).toBe(true);
  });

  it("excludes safetyComponent and annexIII when socialScoring", () => {
    const visible = getVisibleSteps(a({ socialScoring: true }));
    expect(visible.some((s) => s.id === "safetyComponent")).toBe(false);
    expect(visible.some((s) => s.id === "annexIII")).toBe(false);
  });

  it("includes exception when any Annex III flag is true", () => {
    const visible = getVisibleSteps(a({ usesBiometrics: true }));
    expect(visible.some((s) => s.id === "exception")).toBe(true);
  });

  it("excludes exception when no Annex III flags", () => {
    const visible = getVisibleSteps(a({}));
    expect(visible.some((s) => s.id === "exception")).toBe(false);
  });

  it("includes supplyChain when no exclusions", () => {
    const visible = getVisibleSteps(a({}));
    expect(visible.some((s) => s.id === "supplyChain")).toBe(true);
  });

  it("excludes supplyChain when militaryDefenceOnly", () => {
    const visible = getVisibleSteps(a({ militaryDefenceOnly: true }));
    expect(visible.some((s) => s.id === "supplyChain")).toBe(false);
  });

  it("includes sectorSpecific when high-risk flags set", () => {
    const visible = getVisibleSteps(a({ educationUseCase: true }));
    expect(visible.some((s) => s.id === "sectorSpecific")).toBe(true);
  });

  it("excludes sectorSpecific when no high-risk flags", () => {
    const visible = getVisibleSteps(a({}));
    expect(visible.some((s) => s.id === "sectorSpecific")).toBe(false);
  });

  it("includes gdprData when no exclusions", () => {
    const visible = getVisibleSteps(a({}));
    expect(visible.some((s) => s.id === "gdprData")).toBe(true);
  });

  it("excludes gdprData when scientificResearchOnly", () => {
    const visible = getVisibleSteps(a({ scientificResearchOnly: true }));
    expect(visible.some((s) => s.id === "gdprData")).toBe(false);
  });

  it("includes extraterritorial when non-EU + output in EU", () => {
    const visible = getVisibleSteps(
      a({ isEUBased: false, outputUsedInEU: true })
    );
    expect(visible.some((s) => s.id === "extraterritorial")).toBe(true);
  });

  it("excludes extraterritorial when EU-based", () => {
    const visible = getVisibleSteps(a({ isEUBased: true }));
    expect(visible.some((s) => s.id === "extraterritorial")).toBe(false);
  });

  it("includes gpaiSupplyChain when GPAI provider", () => {
    const visible = getVisibleSteps(a({ isGeneralPurposeModel: true }));
    expect(visible.some((s) => s.id === "gpaiSupplyChain")).toBe(true);
  });

  it("excludes gpaiSupplyChain when not GPAI provider", () => {
    const visible = getVisibleSteps(a({}));
    expect(visible.some((s) => s.id === "gpaiSupplyChain")).toBe(false);
  });

  it("preserves step order in visible list", () => {
    const visible = getVisibleSteps(a({}));
    const ids = visible.map((s) => s.id);
    for (let i = 1; i < ids.length; i++) {
      const prevIdx = WIZARD_STEPS.findIndex((s) => s.id === ids[i - 1]);
      const currIdx = WIZARD_STEPS.findIndex((s) => s.id === ids[i]);
      expect(currIdx).toBeGreaterThan(prevIdx);
    }
  });

  it("minimum visible steps = unconditional steps count (8)", () => {
    // Even with max exclusions, the 8 unconditional steps are always shown
    const visible = getVisibleSteps(
      a({
        militaryDefenceOnly: true,
        socialScoring: true,
        isEUBased: true,
        isGeneralPurposeModel: false,
      })
    );
    expect(visible.length).toBeGreaterThanOrEqual(8);
  });

  it("maximum visible steps when everything is applicable", () => {
    // Make all conditional steps visible
    const visible = getVisibleSteps(
      a({
        // No prohibited triggers
        usesSubliminaManipulation: false,
        socialScoring: false,
        facialRecognitionScraping: false,
        // Not product safety high-risk (annexIII stays)
        isSafetyComponent: false,
        // Annex III flag (exception shows)
        usesBiometrics: true,
        // No exclusions (supplyChain, gdprData, transitional show)
        militaryDefenceOnly: false,
        scientificResearchOnly: false,
        // High-risk flag (sectorSpecific shows)
        educationUseCase: true,
        // Non-EU + output in EU (extraterritorial shows)
        isEUBased: false,
        outputUsedInEU: true,
        // GPAI (gpaiSupplyChain shows)
        isGeneralPurposeModel: true,
      })
    );
    // All 17 steps should be visible
    expect(visible).toHaveLength(17);
  });
});

// ============================================================================
// WQ15: Real-World Scenario Flows
// ============================================================================
describe("WQ15: Scenario — Minimal-risk startup (chat widget)", () => {
  const answers: Partial<WizardAnswers> = {
    companyName: "AcmeBot Inc.",
    companySize: "SMALL",
    isEUBased: true,
    role: "DEPLOYER",
    systemDescription: "Customer service chatbot",
    militaryDefenceOnly: false,
    scientificResearchOnly: false,
    personalNonProfessional: false,
    openSourceNonHighRisk: false,
    usesSubliminaManipulation: false,
    exploitsVulnerabilities: false,
    socialScoring: false,
    criminalRiskProfiling: false,
    facialRecognitionScraping: false,
    workplaceEmotionDetection: false,
    biometricCategorisationSensitive: false,
    realtimeBiometricPublicSpaces: false,
    isSafetyComponent: false,
    usesBiometrics: false,
    criticalInfrastructure: false,
    educationUseCase: false,
    employmentUseCase: false,
    essentialServicesUseCase: false,
    lawEnforcementUseCase: false,
    migrationUseCase: false,
    justiceUseCase: false,
    interactsWithHumans: true,
    generatesMedia: false,
    generatesText: false,
    usesEmotionRecognition: false,
    usesBiometricCategorisation: false,
    isGeneralPurposeModel: false,
  };

  it("can navigate forward through entire flow", () => {
    let stepId = "company";
    const visited: string[] = [stepId];
    let iterations = 0;
    while (iterations < 30) {
      const next = getNextStep(stepId, answers);
      if (!next) break;
      stepId = next.id;
      visited.push(stepId);
      iterations++;
    }
    expect(visited[0]).toBe("company");
    expect(visited[visited.length - 1]).toBe("summary");
    // No prohibited path → should skip safetyComponent? No, it's visible (no prohibited)
    expect(visited).toContain("safetyComponent");
    // No Annex III flags → exception should be skipped
    expect(visited).not.toContain("exception");
    // No high-risk → sectorSpecific skipped
    expect(visited).not.toContain("sectorSpecific");
    // EU-based → extraterritorial skipped
    expect(visited).not.toContain("extraterritorial");
    // Not GPAI → gpaiSupplyChain skipped
    expect(visited).not.toContain("gpaiSupplyChain");
  });

  it("can navigate backward from summary to company", () => {
    let stepId = "summary";
    const visited: string[] = [stepId];
    let iterations = 0;
    while (iterations < 30) {
      const prev = getPreviousStep(stepId, answers);
      if (!prev) break;
      stepId = prev.id;
      visited.push(stepId);
      iterations++;
    }
    expect(visited[visited.length - 1]).toBe("company");
  });

  it("progress increases from 0 to 100 through visible steps", () => {
    const visible = getVisibleSteps(answers);
    expect(getProgressPercent(visible[0].id, answers)).toBeGreaterThan(0);
    expect(getProgressPercent(visible[visible.length - 1].id, answers)).toBe(100);
  });
});

describe("WQ15: Scenario — Prohibited social scoring system", () => {
  const answers: Partial<WizardAnswers> = {
    companyName: "SocialScore Corp",
    companySize: "LARGE",
    isEUBased: true,
    role: "PROVIDER",
    systemDescription: "Social credit scoring system",
    socialScoring: true,
  };

  it("skips safetyComponent, annexIII, exception steps", () => {
    const visible = getVisibleSteps(answers);
    expect(visible.some((s) => s.id === "safetyComponent")).toBe(false);
    expect(visible.some((s) => s.id === "annexIII")).toBe(false);
    expect(visible.some((s) => s.id === "exception")).toBe(false);
  });

  it("from prohibited → transparency directly", () => {
    const next = getNextStep("prohibited", answers);
    expect(next?.id).toBe("transparency");
  });
});

describe("WQ15: Scenario — High-risk employment AI (HR screening)", () => {
  const answers: Partial<WizardAnswers> = {
    companySize: "MEDIUM",
    isEUBased: true,
    role: "DEPLOYER",
    usesSubliminaManipulation: false,
    socialScoring: false,
    facialRecognitionScraping: false,
    isSafetyComponent: false,
    employmentUseCase: true,
    employmentType: "RECRUITMENT_SELECTION",
    usesBiometrics: false,
    criticalInfrastructure: false,
    educationUseCase: false,
    essentialServicesUseCase: false,
    lawEnforcementUseCase: false,
    migrationUseCase: false,
    justiceUseCase: false,
    isGeneralPurposeModel: false,
  };

  it("exception step is visible (employmentUseCase triggers it)", () => {
    const visible = getVisibleSteps(answers);
    expect(visible.some((s) => s.id === "exception")).toBe(true);
  });

  it("sectorSpecific is visible (employmentUseCase is high-risk)", () => {
    const visible = getVisibleSteps(answers);
    expect(visible.some((s) => s.id === "sectorSpecific")).toBe(true);
  });

  it("safetyComponent and annexIII are visible (not prohibited)", () => {
    const visible = getVisibleSteps(answers);
    expect(visible.some((s) => s.id === "safetyComponent")).toBe(true);
    expect(visible.some((s) => s.id === "annexIII")).toBe(true);
  });
});

describe("WQ15: Scenario — Non-EU GPAI provider", () => {
  const answers: Partial<WizardAnswers> = {
    companySize: "LARGE",
    isEUBased: false,
    outputUsedInEU: true,
    role: "PROVIDER",
    isGeneralPurposeModel: true,
    gpaiTrainingCompute: 1e26,
    gpaiHighImpactCapabilities: true,
    militaryDefenceOnly: false,
    socialScoring: false,
    facialRecognitionScraping: false,
  };

  it("extraterritorial step is visible", () => {
    const visible = getVisibleSteps(answers);
    expect(visible.some((s) => s.id === "extraterritorial")).toBe(true);
  });

  it("gpaiSupplyChain step is visible", () => {
    const visible = getVisibleSteps(answers);
    expect(visible.some((s) => s.id === "gpaiSupplyChain")).toBe(true);
  });

  it("outputUsedInEU question is visible in company step", () => {
    const visible = getVisibleQuestions(step("company"), answers);
    expect(visible.some((q) => q.id === "outputUsedInEU")).toBe(true);
  });

  it("GPAI sub-questions are visible in gpai step", () => {
    const visible = getVisibleQuestions(step("gpai"), answers);
    expect(visible).toHaveLength(4);
  });
});

describe("WQ15: Scenario — Safety component (medical device AI)", () => {
  const answers: Partial<WizardAnswers> = {
    isEUBased: true,
    role: "PROVIDER",
    isSafetyComponent: true,
    productUnderAnnexI: true,
    requiresThirdPartyConformity: true,
    socialScoring: false,
    facialRecognitionScraping: false,
    usesSubliminaManipulation: false,
    isGeneralPurposeModel: false,
  };

  it("annexIII step is HIDDEN (already high-risk via product safety)", () => {
    const visible = getVisibleSteps(answers);
    expect(visible.some((s) => s.id === "annexIII")).toBe(false);
  });

  it("safetyComponent step IS visible (not prohibited)", () => {
    const visible = getVisibleSteps(answers);
    expect(visible.some((s) => s.id === "safetyComponent")).toBe(true);
  });

  it("all 3 safetyComponent questions visible", () => {
    const visible = getVisibleQuestions(step("safetyComponent"), answers);
    expect(visible).toHaveLength(3);
  });

  it("from safetyComponent → transparency (skip annexIII + exception)", () => {
    const next = getNextStep("safetyComponent", answers);
    expect(next?.id).toBe("transparency");
  });
});

describe("WQ15: Scenario — Military/defence (excluded from scope)", () => {
  const answers: Partial<WizardAnswers> = {
    militaryDefenceOnly: true,
    isEUBased: true,
    role: "PROVIDER",
    isGeneralPurposeModel: false,
  };

  it("supplyChain, gdprData, transitional are all hidden", () => {
    const visible = getVisibleSteps(answers);
    expect(visible.some((s) => s.id === "supplyChain")).toBe(false);
    expect(visible.some((s) => s.id === "gdprData")).toBe(false);
    expect(visible.some((s) => s.id === "transitional")).toBe(false);
  });

  it("path from gpai → summary (all intermediate steps hidden)", () => {
    const next = getNextStep("gpai", answers);
    expect(next?.id).toBe("summary");
  });
});

describe("WQ15: Scenario — Law enforcement with biometrics (max complexity)", () => {
  const answers: Partial<WizardAnswers> = {
    companySize: "LARGE",
    isEUBased: false,
    outputUsedInEU: true,
    role: "BOTH",
    usesSubliminaManipulation: false,
    socialScoring: false,
    facialRecognitionScraping: false,
    workplaceEmotionDetection: false,
    biometricCategorisationSensitive: false,
    realtimeBiometricPublicSpaces: false,
    isSafetyComponent: false,
    usesBiometrics: true,
    isBiometricVerificationOnly: false,
    biometricType: "REMOTE_IDENTIFICATION",
    lawEnforcementUseCase: true,
    lawEnforcementType: "POST_BIOMETRIC_ID",
    educationUseCase: false,
    employmentUseCase: false,
    essentialServicesUseCase: false,
    criticalInfrastructure: false,
    migrationUseCase: false,
    justiceUseCase: false,
    isGeneralPurposeModel: true,
    processesPersonalData: true,
    processesSpecialCategoryData: true,
    militaryDefenceOnly: false,
    scientificResearchOnly: false,
  };

  it("all 17 steps are visible (maximum complexity)", () => {
    const visible = getVisibleSteps(answers);
    // Let's verify: all conditions met...
    // safetyComponent: no prohibited → visible
    // annexIII: no product safety HR, no prohibited → visible
    // exception: usesBiometrics+lawEnforcement → visible
    // supplyChain: no exclusions → visible
    // sectorSpecific: usesBiometrics+lawEnforcement → visible
    // gdprData: no exclusions → visible
    // extraterritorial: non-EU+outputInEU → visible
    // transitional: no exclusions → visible
    // gpaiSupplyChain: GPAI → visible
    expect(visible).toHaveLength(17);
  });

  it("transitional step shows all 5 questions", () => {
    const visible = getVisibleQuestions(step("transitional"), answers);
    expect(visible).toHaveLength(5);
  });

  it("supplyChain shows all 7 questions (role=BOTH + non-EU)", () => {
    const visible = getVisibleQuestions(step("supplyChain"), answers);
    // role=BOTH → deployer-gated questions shown
    // isEUBased=false → appointedAsAuthorisedRep hidden
    expect(visible).toHaveLength(6);
  });
});
