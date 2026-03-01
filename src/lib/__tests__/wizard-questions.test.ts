/**
 * LAYER 4 — wizard-questions.test.ts
 * Matrices WQ1–WQ9, WQ16: Structure integrity, showIf logic, mapToField validation
 *
 * Covers the static WIZARD_STEPS array, all 79 questions, every showIf
 * condition at both step and question level, and mapToField mapping.
 */
import { describe, it, expect, test } from "vitest";
import {
  WIZARD_STEPS,
  getVisibleQuestions,
  getVisibleSteps,
} from "../wizard-questions";
import type { WizardStep, WizardQuestion } from "../wizard-questions";
import type { WizardAnswers } from "../classification-engine";

// ── Helpers ───────────────────────────────────────────────────────────────────

const step = (id: string): WizardStep => {
  const s = WIZARD_STEPS.find((s) => s.id === id);
  if (!s) throw new Error(`Step ${id} not found`);
  return s;
};

const question = (qId: string): WizardQuestion => {
  for (const s of WIZARD_STEPS) {
    const q = s.questions.find((q) => q.id === qId);
    if (q) return q;
  }
  throw new Error(`Question ${qId} not found`);
};

const questionInStep = (stepId: string, qId: string): WizardQuestion => {
  const s = step(stepId);
  const q = s.questions.find((q) => q.id === qId);
  if (!q) throw new Error(`Question ${qId} not found in step ${stepId}`);
  return q;
};

const allQuestions = (): WizardQuestion[] =>
  WIZARD_STEPS.flatMap((s) => s.questions);

const a = (overrides: Partial<WizardAnswers> = {}): Partial<WizardAnswers> =>
  overrides;

// Step order as designed
const EXPECTED_STEP_IDS = [
  "company",
  "role",
  "system",
  "exclusions",
  "prohibited",
  "safetyComponent",
  "annexIII",
  "exception",
  "transparency",
  "gpai",
  "supplyChain",
  "sectorSpecific",
  "gdprData",
  "extraterritorial",
  "transitional",
  "gpaiSupplyChain",
  "summary",
] as const;

// Steps that are ALWAYS visible (no showIf)
const UNCONDITIONAL_STEPS = [
  "company",
  "role",
  "system",
  "exclusions",
  "prohibited",
  "transparency",
  "gpai",
  "summary",
];

// Steps with showIf
const CONDITIONAL_STEPS = [
  "safetyComponent",
  "annexIII",
  "exception",
  "supplyChain",
  "sectorSpecific",
  "gdprData",
  "extraterritorial",
  "transitional",
  "gpaiSupplyChain",
];

// 7 prohibited trigger combos that gate safetyComponent + annexIII
const PROHIBITED_TRIGGERS: [string, Partial<WizardAnswers>][] = [
  [
    "manipulation + harm",
    {
      usesSubliminaManipulation: true,
      manipulationCausesSignificantHarm: true,
    },
  ],
  [
    "exploitation + harm",
    {
      exploitsVulnerabilities: true,
      exploitationCausesSignificantHarm: true,
    },
  ],
  ["socialScoring", { socialScoring: true }],
  ["facialRecognitionScraping", { facialRecognitionScraping: true }],
  [
    "workplaceEmotion (no medical exception)",
    {
      workplaceEmotionDetection: true,
      workplaceEmotionForMedicalSafety: false,
    },
  ],
  [
    "biometricCategorisation (no LE exception)",
    {
      biometricCategorisationSensitive: true,
      biometricCatForLawEnforcementLabelling: false,
    },
  ],
  [
    "realtimeBiometric (no LE exception)",
    {
      realtimeBiometricPublicSpaces: true,
      realtimeBiometricForLEException: false,
    },
  ],
];

// ============================================================================
// WQ1: Step Structure Integrity
// ============================================================================
describe("WQ1: Step Structure Integrity", () => {
  it("has exactly 17 wizard steps", () => {
    expect(WIZARD_STEPS).toHaveLength(17);
  });

  it("step IDs are in the correct order", () => {
    expect(WIZARD_STEPS.map((s) => s.id)).toEqual([...EXPECTED_STEP_IDS]);
  });

  it("all step IDs are unique", () => {
    const ids = WIZARD_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test.each(WIZARD_STEPS.map((s) => [s.id]))("step '%s' has a non-empty title", (id) => {
    expect(step(id as string).title.length).toBeGreaterThan(0);
  });

  test.each(WIZARD_STEPS.map((s) => [s.id]))("step '%s' has a non-empty subtitle", (id) => {
    expect(step(id as string).subtitle.length).toBeGreaterThan(0);
  });

  test.each(WIZARD_STEPS.map((s) => [s.id]))("step '%s' has a non-empty icon", (id) => {
    expect(step(id as string).icon.length).toBeGreaterThan(0);
  });

  test.each(WIZARD_STEPS.map((s) => [s.id]))("step '%s' has a questions array", (id) => {
    expect(Array.isArray(step(id as string).questions)).toBe(true);
  });

  it("summary step has zero questions", () => {
    expect(step("summary").questions).toHaveLength(0);
  });

  it("first step is company", () => {
    expect(WIZARD_STEPS[0].id).toBe("company");
  });

  it("last step is summary", () => {
    expect(WIZARD_STEPS[WIZARD_STEPS.length - 1].id).toBe("summary");
  });

  test.each(UNCONDITIONAL_STEPS.map((id) => [id]))(
    "step '%s' has NO showIf (always visible)",
    (id) => {
      expect(step(id as string).showIf).toBeUndefined();
    }
  );

  test.each(CONDITIONAL_STEPS.map((id) => [id]))(
    "step '%s' HAS a showIf function",
    (id) => {
      expect(typeof step(id as string).showIf).toBe("function");
    }
  );

  it("question counts per step match expected", () => {
    const expected: Record<string, number> = {
      company: 4,
      role: 1,
      system: 1,
      exclusions: 4,
      prohibited: 16,
      safetyComponent: 3,
      annexIII: 16,
      exception: 6,
      transparency: 6,
      gpai: 4,
      supplyChain: 7,
      sectorSpecific: 1,
      gdprData: 3,
      extraterritorial: 1,
      transitional: 5,
      gpaiSupplyChain: 1,
      summary: 0,
    };
    for (const s of WIZARD_STEPS) {
      expect(s.questions.length).toBe(expected[s.id]);
    }
  });

  it("total questions across all steps equals 79", () => {
    expect(allQuestions().length).toBe(79);
  });
});

// ============================================================================
// WQ2: Question Schema Validation
// ============================================================================
describe("WQ2: Question Schema Validation", () => {
  const questions = allQuestions();

  it("all question IDs are unique", () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test.each(questions.map((q) => [q.id]))("question '%s' has non-empty text", (id) => {
    expect(question(id as string).text.length).toBeGreaterThan(0);
  });

  test.each(questions.map((q) => [q.id]))("question '%s' has valid type", (id) => {
    expect(["BOOLEAN", "SINGLE_SELECT", "TEXT", "NUMBER"]).toContain(
      question(id as string).type
    );
  });

  test.each(questions.map((q) => [q.id]))("question '%s' has a mapToField", (id) => {
    const q = question(id as string);
    expect(q.mapToField).toBeDefined();
    expect(
      typeof q.mapToField === "string" || typeof q.mapToField === "function"
    ).toBe(true);
  });

  // SINGLE_SELECT questions must have options
  const singleSelectQs = questions.filter((q) => q.type === "SINGLE_SELECT");
  test.each(singleSelectQs.map((q) => [q.id]))(
    "SINGLE_SELECT question '%s' has options array with items",
    (id) => {
      const q = question(id as string);
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options!.length).toBeGreaterThan(0);
    }
  );

  // All option entries have value and label
  test.each(singleSelectQs.map((q) => [q.id]))(
    "SINGLE_SELECT question '%s' options all have value and label",
    (id) => {
      const q = question(id as string);
      for (const opt of q.options!) {
        expect(opt.value.length).toBeGreaterThan(0);
        expect(opt.label.length).toBeGreaterThan(0);
      }
    }
  );

  // BOOLEAN questions should NOT have options
  const booleanQs = questions.filter((q) => q.type === "BOOLEAN");
  test.each(booleanQs.map((q) => [q.id]))(
    "BOOLEAN question '%s' does NOT have options",
    (id) => {
      expect(question(id as string).options).toBeUndefined();
    }
  );

  // TEXT questions should NOT have options
  const textQs = questions.filter((q) => q.type === "TEXT");
  test.each(textQs.map((q) => [q.id]))(
    "TEXT question '%s' does NOT have options",
    (id) => {
      expect(question(id as string).options).toBeUndefined();
    }
  );

  // NUMBER questions should NOT have options
  const numberQs = questions.filter((q) => q.type === "NUMBER");
  test.each(numberQs.map((q) => [q.id]))(
    "NUMBER question '%s' does NOT have options",
    (id) => {
      expect(question(id as string).options).toBeUndefined();
    }
  );

  it("exactly 1 NUMBER question exists (gpaiTrainingCompute)", () => {
    expect(numberQs).toHaveLength(1);
    expect(numberQs[0].id).toBe("gpaiTrainingCompute");
  });

  it("exactly 2 TEXT questions exist", () => {
    const txtIds = textQs.map((q) => q.id).sort();
    expect(txtIds).toEqual(["companyName", "systemDescription"]);
  });

  it("companySize has exactly 4 options (MICRO/SMALL/MEDIUM/LARGE)", () => {
    const q = question("companySize");
    expect(q.options!.map((o) => o.value)).toEqual([
      "MICRO",
      "SMALL",
      "MEDIUM",
      "LARGE",
    ]);
  });

  it("role question has exactly 3 options (PROVIDER/DEPLOYER/BOTH)", () => {
    const q = question("role");
    expect(q.options!.map((o) => o.value)).toEqual([
      "PROVIDER",
      "DEPLOYER",
      "BOTH",
    ]);
  });

  it("sectorSpecificLegislation has 11 options including NONE", () => {
    const q = question("sectorSpecificLegislation");
    expect(q.options).toHaveLength(11);
    expect(q.options!.some((o) => o.value === "NONE")).toBe(true);
  });

  it("biometricType has 3 options", () => {
    expect(question("biometricType").options).toHaveLength(3);
  });

  it("educationType has 4 options", () => {
    expect(question("educationType").options).toHaveLength(4);
  });

  it("employmentType has 4 options", () => {
    expect(question("employmentType").options).toHaveLength(4);
  });

  it("essentialServiceType has 5 options", () => {
    expect(question("essentialServiceType").options).toHaveLength(5);
  });

  it("lawEnforcementType has 5 options", () => {
    expect(question("lawEnforcementType").options).toHaveLength(5);
  });

  it("migrationType has 4 options", () => {
    expect(question("migrationType").options).toHaveLength(4);
  });

  it("justiceType has 3 options", () => {
    expect(question("justiceType").options).toHaveLength(3);
  });

  // Questions with showIf should have a function
  const conditionalQs = questions.filter((q) => q.showIf);
  it("conditional questions have function-type showIf", () => {
    for (const q of conditionalQs) {
      expect(typeof q.showIf).toBe("function");
    }
  });

  // Questions without showIf have no showIf
  const unconditionalQs = questions.filter((q) => !q.showIf);
  it("unconditional questions have undefined showIf", () => {
    for (const q of unconditionalQs) {
      expect(q.showIf).toBeUndefined();
    }
  });

  // helpText coverage
  it("at least 90% of questions have helpText for regulatory guidance", () => {
    const withHelp = questions.filter((q) => q.helpText);
    expect(withHelp.length).toBeGreaterThanOrEqual(Math.floor(questions.length * 0.9));
  });

  it("exactly 71 of 79 questions have helpText", () => {
    const withHelp = questions.filter((q) => q.helpText);
    expect(withHelp.length).toBe(71);
  });
});

// ============================================================================
// WQ3: Step showIf — safetyComponent (Prohibited Bypass)
// ============================================================================
describe("WQ3: Step showIf — safetyComponent (Prohibited Bypass)", () => {
  const safetyStep = step("safetyComponent");

  it("has a showIf function", () => {
    expect(typeof safetyStep.showIf).toBe("function");
  });

  it("visible when no prohibited triggers are set", () => {
    expect(safetyStep.showIf!(a({}))).toBe(true);
  });

  it("visible when prohibited flags are explicitly false", () => {
    expect(
      safetyStep.showIf!(
        a({
          usesSubliminaManipulation: false,
          exploitsVulnerabilities: false,
          socialScoring: false,
        })
      )
    ).toBe(true);
  });

  test.each(PROHIBITED_TRIGGERS)(
    "HIDDEN when prohibited trigger: %s",
    (_label, answers) => {
      expect(safetyStep.showIf!(a(answers))).toBe(false);
    }
  );

  it("visible when manipulation exists but harm does NOT", () => {
    expect(
      safetyStep.showIf!(
        a({
          usesSubliminaManipulation: true,
          manipulationCausesSignificantHarm: false,
        })
      )
    ).toBe(true);
  });

  it("visible when exploitation exists but harm does NOT", () => {
    expect(
      safetyStep.showIf!(
        a({
          exploitsVulnerabilities: true,
          exploitationCausesSignificantHarm: false,
        })
      )
    ).toBe(true);
  });

  it("visible when workplaceEmotion has medical exception", () => {
    expect(
      safetyStep.showIf!(
        a({
          workplaceEmotionDetection: true,
          workplaceEmotionForMedicalSafety: true,
        })
      )
    ).toBe(true);
  });

  it("visible when biometricCategorisation has LE exception", () => {
    expect(
      safetyStep.showIf!(
        a({
          biometricCategorisationSensitive: true,
          biometricCatForLawEnforcementLabelling: true,
        })
      )
    ).toBe(true);
  });

  it("visible when realtimeBiometric has LE exception", () => {
    expect(
      safetyStep.showIf!(
        a({
          realtimeBiometricPublicSpaces: true,
          realtimeBiometricForLEException: true,
        })
      )
    ).toBe(true);
  });

  it("HIDDEN when multiple prohibited triggers are set simultaneously", () => {
    expect(
      safetyStep.showIf!(
        a({
          socialScoring: true,
          facialRecognitionScraping: true,
          usesSubliminaManipulation: true,
          manipulationCausesSignificantHarm: true,
        })
      )
    ).toBe(false);
  });

  it("HIDDEN when workplaceEmotion is true and medical safety is undefined", () => {
    // !undefined === true, so (true && !undefined) trips the prohibited check
    expect(
      safetyStep.showIf!(
        a({ workplaceEmotionDetection: true })
      )
    ).toBe(false);
  });
});

describe("WQ3: Edge — undefined vs false exception fields", () => {
  const safetyStep = step("safetyComponent");

  it("HIDDEN when biometricCatSensitive=true, LE labelling=undefined", () => {
    expect(
      safetyStep.showIf!(a({ biometricCategorisationSensitive: true }))
    ).toBe(false);
  });

  it("HIDDEN when realtimeBiometric=true, LE exception=undefined", () => {
    expect(
      safetyStep.showIf!(a({ realtimeBiometricPublicSpaces: true }))
    ).toBe(false);
  });
});

// ============================================================================
// WQ4: Step showIf — annexIII
// ============================================================================
describe("WQ4: Step showIf — annexIII Skip Logic", () => {
  const annexStep = step("annexIII");

  it("has a showIf function", () => {
    expect(typeof annexStep.showIf).toBe("function");
  });

  it("visible when no special conditions", () => {
    expect(annexStep.showIf!(a({}))).toBe(true);
  });

  it("HIDDEN when product safety high-risk path (all 3 conditions true)", () => {
    expect(
      annexStep.showIf!(
        a({
          isSafetyComponent: true,
          productUnderAnnexI: true,
          requiresThirdPartyConformity: true,
        })
      )
    ).toBe(false);
  });

  it("visible when isSafetyComponent only (partial product safety)", () => {
    expect(annexStep.showIf!(a({ isSafetyComponent: true }))).toBe(true);
  });

  it("visible when isSafetyComponent + productUnderAnnexI but NOT requiresThirdParty", () => {
    expect(
      annexStep.showIf!(
        a({
          isSafetyComponent: true,
          productUnderAnnexI: true,
          requiresThirdPartyConformity: false,
        })
      )
    ).toBe(true);
  });

  it("visible when isSafetyComponent but productUnderAnnexI=false", () => {
    expect(
      annexStep.showIf!(
        a({ isSafetyComponent: true, productUnderAnnexI: false })
      )
    ).toBe(true);
  });

  test.each(PROHIBITED_TRIGGERS)(
    "HIDDEN when prohibited trigger: %s",
    (_label, answers) => {
      expect(annexStep.showIf!(a(answers))).toBe(false);
    }
  );

  it("HIDDEN when BOTH product safety high-risk AND prohibited", () => {
    expect(
      annexStep.showIf!(
        a({
          isSafetyComponent: true,
          productUnderAnnexI: true,
          requiresThirdPartyConformity: true,
          socialScoring: true,
        })
      )
    ).toBe(false);
  });

  it("visible with exceptions applied (manipulation without harm)", () => {
    expect(
      annexStep.showIf!(
        a({
          usesSubliminaManipulation: true,
          manipulationCausesSignificantHarm: false,
        })
      )
    ).toBe(true);
  });

  it("visible with medical safety exception for workplace emotion", () => {
    expect(
      annexStep.showIf!(
        a({
          workplaceEmotionDetection: true,
          workplaceEmotionForMedicalSafety: true,
        })
      )
    ).toBe(true);
  });
});

// ============================================================================
// WQ5: Step showIf — All Other Conditional Steps
// ============================================================================
describe("WQ5: Step showIf — exception step", () => {
  const excStep = step("exception");

  it("HIDDEN when no Annex III flags are set", () => {
    expect(excStep.showIf!(a({}))).toBe(false);
  });

  const annexIIIFlags: [string, Partial<WizardAnswers>][] = [
    ["usesBiometrics", { usesBiometrics: true }],
    ["criticalInfrastructure", { criticalInfrastructure: true }],
    ["educationUseCase", { educationUseCase: true }],
    ["employmentUseCase", { employmentUseCase: true }],
    ["essentialServicesUseCase", { essentialServicesUseCase: true }],
    ["lawEnforcementUseCase", { lawEnforcementUseCase: true }],
    ["migrationUseCase", { migrationUseCase: true }],
    ["justiceUseCase", { justiceUseCase: true }],
  ];

  test.each(annexIIIFlags)(
    "VISIBLE when %s is true",
    (_label, answers) => {
      expect(excStep.showIf!(a(answers))).toBe(true);
    }
  );

  it("visible when multiple Annex III flags are set", () => {
    expect(
      excStep.showIf!(
        a({
          usesBiometrics: true,
          educationUseCase: true,
          employmentUseCase: true,
        })
      )
    ).toBe(true);
  });

  it("HIDDEN when all Annex III flags are false", () => {
    expect(
      excStep.showIf!(
        a({
          usesBiometrics: false,
          criticalInfrastructure: false,
          educationUseCase: false,
          employmentUseCase: false,
          essentialServicesUseCase: false,
          lawEnforcementUseCase: false,
          migrationUseCase: false,
          justiceUseCase: false,
        })
      )
    ).toBe(false);
  });
});

describe("WQ5: Step showIf — supplyChain step", () => {
  const scStep = step("supplyChain");

  it("visible when no exclusions", () => {
    expect(scStep.showIf!(a({}))).toBe(true);
  });

  it("HIDDEN when militaryDefenceOnly", () => {
    expect(scStep.showIf!(a({ militaryDefenceOnly: true }))).toBe(false);
  });

  it("HIDDEN when scientificResearchOnly", () => {
    expect(scStep.showIf!(a({ scientificResearchOnly: true }))).toBe(false);
  });

  it("HIDDEN when personalNonProfessional", () => {
    expect(scStep.showIf!(a({ personalNonProfessional: true }))).toBe(false);
  });

  it("HIDDEN when openSourceNonHighRisk", () => {
    expect(scStep.showIf!(a({ openSourceNonHighRisk: true }))).toBe(false);
  });

  it("HIDDEN when multiple exclusions", () => {
    expect(
      scStep.showIf!(
        a({ militaryDefenceOnly: true, scientificResearchOnly: true })
      )
    ).toBe(false);
  });

  it("visible when exclusions are explicitly false", () => {
    expect(
      scStep.showIf!(
        a({
          militaryDefenceOnly: false,
          scientificResearchOnly: false,
          personalNonProfessional: false,
          openSourceNonHighRisk: false,
        })
      )
    ).toBe(true);
  });
});

describe("WQ5: Step showIf — sectorSpecific step", () => {
  const ssStep = step("sectorSpecific");

  it("HIDDEN when no high-risk flags", () => {
    expect(ssStep.showIf!(a({}))).toBe(false);
  });

  it("visible when isSafetyComponent", () => {
    expect(ssStep.showIf!(a({ isSafetyComponent: true }))).toBe(true);
  });

  const highRiskFlags: [string, Partial<WizardAnswers>][] = [
    ["isSafetyComponent", { isSafetyComponent: true }],
    ["usesBiometrics", { usesBiometrics: true }],
    ["criticalInfrastructure", { criticalInfrastructure: true }],
    ["educationUseCase", { educationUseCase: true }],
    ["employmentUseCase", { employmentUseCase: true }],
    ["essentialServicesUseCase", { essentialServicesUseCase: true }],
    ["lawEnforcementUseCase", { lawEnforcementUseCase: true }],
    ["migrationUseCase", { migrationUseCase: true }],
    ["justiceUseCase", { justiceUseCase: true }],
  ];

  test.each(highRiskFlags)("visible when %s is true", (_label, answers) => {
    expect(ssStep.showIf!(a(answers))).toBe(true);
  });

  it("visible when multiple high-risk flags are set", () => {
    expect(
      ssStep.showIf!(
        a({ usesBiometrics: true, lawEnforcementUseCase: true })
      )
    ).toBe(true);
  });
});

describe("WQ5: Step showIf — gdprData step", () => {
  const gdprStep = step("gdprData");

  it("visible when no exclusions", () => {
    expect(gdprStep.showIf!(a({}))).toBe(true);
  });

  it("HIDDEN when militaryDefenceOnly", () => {
    expect(gdprStep.showIf!(a({ militaryDefenceOnly: true }))).toBe(false);
  });

  it("HIDDEN when scientificResearchOnly", () => {
    expect(gdprStep.showIf!(a({ scientificResearchOnly: true }))).toBe(false);
  });

  it("HIDDEN when personalNonProfessional", () => {
    expect(gdprStep.showIf!(a({ personalNonProfessional: true }))).toBe(false);
  });

  it("HIDDEN when openSourceNonHighRisk", () => {
    expect(gdprStep.showIf!(a({ openSourceNonHighRisk: true }))).toBe(false);
  });
});

describe("WQ5: Step showIf — extraterritorial step", () => {
  const extraStep = step("extraterritorial");

  it("HIDDEN when no answers (isEUBased=undefined)", () => {
    expect(extraStep.showIf!(a({}))).toBe(false);
  });

  it("HIDDEN when EU-based", () => {
    expect(extraStep.showIf!(a({ isEUBased: true }))).toBe(false);
  });

  it("HIDDEN when non-EU but output NOT used in EU", () => {
    expect(
      extraStep.showIf!(a({ isEUBased: false, outputUsedInEU: false }))
    ).toBe(false);
  });

  it("VISIBLE when non-EU AND output used in EU", () => {
    expect(
      extraStep.showIf!(a({ isEUBased: false, outputUsedInEU: true }))
    ).toBe(true);
  });

  it("HIDDEN when non-EU but outputUsedInEU undefined", () => {
    expect(extraStep.showIf!(a({ isEUBased: false }))).toBe(false);
  });
});

describe("WQ5: Step showIf — transitional step", () => {
  const transStep = step("transitional");

  it("visible when no exclusions", () => {
    expect(transStep.showIf!(a({}))).toBe(true);
  });

  it("HIDDEN for each scope exclusion", () => {
    expect(transStep.showIf!(a({ militaryDefenceOnly: true }))).toBe(false);
    expect(transStep.showIf!(a({ scientificResearchOnly: true }))).toBe(false);
    expect(transStep.showIf!(a({ personalNonProfessional: true }))).toBe(false);
    expect(transStep.showIf!(a({ openSourceNonHighRisk: true }))).toBe(false);
  });
});

describe("WQ5: Step showIf — gpaiSupplyChain step", () => {
  const gpaiSCStep = step("gpaiSupplyChain");

  it("HIDDEN when isGeneralPurposeModel is undefined", () => {
    expect(gpaiSCStep.showIf!(a({}))).toBe(false);
  });

  it("HIDDEN when isGeneralPurposeModel is false", () => {
    expect(gpaiSCStep.showIf!(a({ isGeneralPurposeModel: false }))).toBe(false);
  });

  it("VISIBLE when isGeneralPurposeModel is true", () => {
    expect(gpaiSCStep.showIf!(a({ isGeneralPurposeModel: true }))).toBe(true);
  });
});

// ============================================================================
// WQ6: Question showIf — Art 5 Prohibited Chains
// ============================================================================
describe("WQ6: Question showIf — Art 5 manipulation chain", () => {
  it("manipulationCausesSignificantHarm hidden when usesSubliminaManipulation is false", () => {
    const q = question("manipulationCausesSignificantHarm");
    expect(q.showIf!(a({ usesSubliminaManipulation: false }))).toBe(false);
  });

  it("manipulationCausesSignificantHarm hidden when usesSubliminaManipulation is undefined", () => {
    const q = question("manipulationCausesSignificantHarm");
    expect(q.showIf!(a({}))).toBe(false);
  });

  it("manipulationCausesSignificantHarm visible when usesSubliminaManipulation is true", () => {
    const q = question("manipulationCausesSignificantHarm");
    expect(q.showIf!(a({ usesSubliminaManipulation: true }))).toBe(true);
  });
});

describe("WQ6: Question showIf — Art 5 exploitation chain", () => {
  it("exploitationCausesSignificantHarm hidden when exploitsVulnerabilities is false", () => {
    const q = question("exploitationCausesSignificantHarm");
    expect(q.showIf!(a({ exploitsVulnerabilities: false }))).toBe(false);
  });

  it("exploitationCausesSignificantHarm visible when exploitsVulnerabilities is true", () => {
    const q = question("exploitationCausesSignificantHarm");
    expect(q.showIf!(a({ exploitsVulnerabilities: true }))).toBe(true);
  });
});

describe("WQ6: Question showIf — Art 5 criminal profiling 3-deep chain", () => {
  const q1 = () => question("crimeProfilingBasedSolelyOnPersonality");
  const q2 = () => question("crimeProfilingSupportingHumanAssessment");

  it("crimeProfilingBasedSolelyOnPersonality hidden when criminalRiskProfiling is false", () => {
    expect(q1().showIf!(a({ criminalRiskProfiling: false }))).toBe(false);
  });

  it("crimeProfilingBasedSolelyOnPersonality visible when criminalRiskProfiling is true", () => {
    expect(q1().showIf!(a({ criminalRiskProfiling: true }))).toBe(true);
  });

  it("crimeProfilingSupportingHumanAssessment hidden when criminalRiskProfiling is false", () => {
    expect(
      q2().showIf!(a({ criminalRiskProfiling: false }))
    ).toBe(false);
  });

  it("crimeProfilingSupportingHumanAssessment hidden when only criminalRiskProfiling true", () => {
    expect(
      q2().showIf!(
        a({
          criminalRiskProfiling: true,
          crimeProfilingBasedSolelyOnPersonality: false,
        })
      )
    ).toBe(false);
  });

  it("crimeProfilingSupportingHumanAssessment visible when both parent conditions true", () => {
    expect(
      q2().showIf!(
        a({
          criminalRiskProfiling: true,
          crimeProfilingBasedSolelyOnPersonality: true,
        })
      )
    ).toBe(true);
  });
});

describe("WQ6: Question showIf — Art 5 workplace emotion chain", () => {
  it("workplaceEmotionForMedicalSafety hidden when workplaceEmotionDetection is false", () => {
    expect(
      question("workplaceEmotionForMedicalSafety").showIf!(
        a({ workplaceEmotionDetection: false })
      )
    ).toBe(false);
  });

  it("workplaceEmotionForMedicalSafety visible when workplaceEmotionDetection is true", () => {
    expect(
      question("workplaceEmotionForMedicalSafety").showIf!(
        a({ workplaceEmotionDetection: true })
      )
    ).toBe(true);
  });
});

describe("WQ6: Question showIf — Art 5 biometric categorisation chain", () => {
  it("biometricCatForLELabelling hidden when biometricCatSensitive is false", () => {
    expect(
      question("biometricCatForLawEnforcementLabelling").showIf!(
        a({ biometricCategorisationSensitive: false })
      )
    ).toBe(false);
  });

  it("biometricCatForLELabelling visible when biometricCatSensitive is true", () => {
    expect(
      question("biometricCatForLawEnforcementLabelling").showIf!(
        a({ biometricCategorisationSensitive: true })
      )
    ).toBe(true);
  });
});

describe("WQ6: Question showIf — Art 5 realtime biometric 3-deep chain", () => {
  const q1 = () => question("realtimeBiometricForLEException");
  const q2 = () => question("realtimeBiometricHasJudicialAuth");

  it("realtimeBiometricForLEException hidden when realtimeBiometricPublicSpaces false", () => {
    expect(q1().showIf!(a({ realtimeBiometricPublicSpaces: false }))).toBe(false);
  });

  it("realtimeBiometricForLEException visible when realtimeBiometricPublicSpaces true", () => {
    expect(q1().showIf!(a({ realtimeBiometricPublicSpaces: true }))).toBe(true);
  });

  it("realtimeBiometricHasJudicialAuth hidden when both parents false", () => {
    expect(
      q2().showIf!(
        a({
          realtimeBiometricPublicSpaces: false,
          realtimeBiometricForLEException: false,
        })
      )
    ).toBe(false);
  });

  it("realtimeBiometricHasJudicialAuth hidden when only first parent true", () => {
    expect(
      q2().showIf!(
        a({
          realtimeBiometricPublicSpaces: true,
          realtimeBiometricForLEException: false,
        })
      )
    ).toBe(false);
  });

  it("realtimeBiometricHasJudicialAuth visible when both parents true", () => {
    expect(
      q2().showIf!(
        a({
          realtimeBiometricPublicSpaces: true,
          realtimeBiometricForLEException: true,
        })
      )
    ).toBe(true);
  });
});

// ============================================================================
// WQ7: Question showIf — Annex III Sub-type Selectors
// ============================================================================
describe("WQ7: Question showIf — Annex III sub-type selectors", () => {
  // Each sub-type selector is gated by its parent boolean
  const subtypeGates: [string, string, Partial<WizardAnswers>, Partial<WizardAnswers>][] = [
    [
      "isBiometricVerificationOnly",
      "usesBiometrics",
      { usesBiometrics: true },
      { usesBiometrics: false },
    ],
    [
      "biometricType",
      "usesBiometrics+isBiometricVerificationOnly",
      { usesBiometrics: true, isBiometricVerificationOnly: false },
      { usesBiometrics: true, isBiometricVerificationOnly: true },
    ],
    [
      "educationType",
      "educationUseCase",
      { educationUseCase: true },
      { educationUseCase: false },
    ],
    [
      "employmentType",
      "employmentUseCase",
      { employmentUseCase: true },
      { employmentUseCase: false },
    ],
    [
      "essentialServiceType",
      "essentialServicesUseCase",
      { essentialServicesUseCase: true },
      { essentialServicesUseCase: false },
    ],
    [
      "lawEnforcementType",
      "lawEnforcementUseCase",
      { lawEnforcementUseCase: true },
      { lawEnforcementUseCase: false },
    ],
    [
      "migrationType",
      "migrationUseCase",
      { migrationUseCase: true },
      { migrationUseCase: false },
    ],
    [
      "justiceType",
      "justiceUseCase",
      { justiceUseCase: true },
      { justiceUseCase: false },
    ],
  ];

  test.each(subtypeGates)(
    "%s visible when %s triggers it",
    (questionId, _gate, showAnswers) => {
      expect(question(questionId).showIf!(a(showAnswers))).toBe(true);
    }
  );

  test.each(subtypeGates)(
    "%s HIDDEN when %s gate is not met",
    (questionId, _gate, _showAnswers, hideAnswers) => {
      expect(question(questionId).showIf!(a(hideAnswers))).toBe(false);
    }
  );

  it("biometricType hidden when usesBiometrics false regardless of verification", () => {
    expect(
      question("biometricType").showIf!(
        a({ usesBiometrics: false, isBiometricVerificationOnly: false })
      )
    ).toBe(false);
  });

  it("biometricType hidden when usesBiometrics undefined", () => {
    expect(question("biometricType").showIf!(a({}))).toBe(false);
  });

  it("all sub-type selectors hidden with empty answers", () => {
    const subtypeIds = subtypeGates.map((g) => g[0]);
    for (const qId of subtypeIds) {
      const q = question(qId);
      if (q.showIf) {
        expect(q.showIf(a({}))).toBe(false);
      }
    }
  });
});

// ============================================================================
// WQ8: Question showIf — Exception Cascade (Art 6(3))
// ============================================================================
describe("WQ8: Question showIf — Exception 5-deep cascade", () => {
  it("posesSignificantRiskOfHarm has no showIf (always shown in exception step)", () => {
    expect(question("posesSignificantRiskOfHarm").showIf).toBeUndefined();
  });

  it("performsProfiling has no showIf (always shown in exception step)", () => {
    expect(question("performsProfiling").showIf).toBeUndefined();
  });

  describe("narrowProceduralTask", () => {
    const q = () => question("narrowProceduralTask");

    it("visible when no significant risk AND no profiling", () => {
      expect(
        q().showIf!(
          a({ posesSignificantRiskOfHarm: false, performsProfiling: false })
        )
      ).toBe(true);
    });

    it("hidden when significant risk", () => {
      expect(
        q().showIf!(a({ posesSignificantRiskOfHarm: true }))
      ).toBe(false);
    });

    it("hidden when performs profiling", () => {
      expect(
        q().showIf!(
          a({ posesSignificantRiskOfHarm: false, performsProfiling: true })
        )
      ).toBe(false);
    });

    it("visible when performsProfiling is undefined (not yet answered)", () => {
      expect(
        q().showIf!(a({ posesSignificantRiskOfHarm: false }))
      ).toBe(true);
    });
  });

  describe("improvesHumanActivity", () => {
    const q = () => question("improvesHumanActivity");

    it("visible when no risk + no profiling + no narrow task", () => {
      expect(
        q().showIf!(
          a({
            posesSignificantRiskOfHarm: false,
            performsProfiling: false,
            narrowProceduralTask: false,
          })
        )
      ).toBe(true);
    });

    it("hidden when narrowProceduralTask is true", () => {
      expect(
        q().showIf!(
          a({
            posesSignificantRiskOfHarm: false,
            performsProfiling: false,
            narrowProceduralTask: true,
          })
        )
      ).toBe(false);
    });

    it("hidden when significant risk", () => {
      expect(
        q().showIf!(a({ posesSignificantRiskOfHarm: true }))
      ).toBe(false);
    });

    it("visible when narrowProceduralTask undefined", () => {
      expect(
        q().showIf!(
          a({ posesSignificantRiskOfHarm: false, performsProfiling: false })
        )
      ).toBe(true);
    });
  });

  describe("detectsPatterns", () => {
    const q = () => question("detectsPatterns");

    it("visible when all prior exceptions are false/undefined", () => {
      expect(
        q().showIf!(
          a({
            posesSignificantRiskOfHarm: false,
            performsProfiling: false,
            narrowProceduralTask: false,
            improvesHumanActivity: false,
          })
        )
      ).toBe(true);
    });

    it("hidden when improvesHumanActivity is true", () => {
      expect(
        q().showIf!(
          a({
            posesSignificantRiskOfHarm: false,
            performsProfiling: false,
            narrowProceduralTask: false,
            improvesHumanActivity: true,
          })
        )
      ).toBe(false);
    });

    it("hidden when narrowProceduralTask is true", () => {
      expect(
        q().showIf!(
          a({
            posesSignificantRiskOfHarm: false,
            performsProfiling: false,
            narrowProceduralTask: true,
          })
        )
      ).toBe(false);
    });
  });

  describe("preparatoryTask", () => {
    const q = () => question("preparatoryTask");

    it("visible only when all 4 earlier exception checks are false/undefined", () => {
      expect(
        q().showIf!(
          a({
            posesSignificantRiskOfHarm: false,
            performsProfiling: false,
            narrowProceduralTask: false,
            improvesHumanActivity: false,
            detectsPatterns: false,
          })
        )
      ).toBe(true);
    });

    it("hidden when detectsPatterns is true", () => {
      expect(
        q().showIf!(
          a({
            posesSignificantRiskOfHarm: false,
            performsProfiling: false,
            narrowProceduralTask: false,
            improvesHumanActivity: false,
            detectsPatterns: true,
          })
        )
      ).toBe(false);
    });

    it("hidden when any earlier exception is true", () => {
      // narrowProceduralTask true
      expect(
        q().showIf!(
          a({
            posesSignificantRiskOfHarm: false,
            performsProfiling: false,
            narrowProceduralTask: true,
          })
        )
      ).toBe(false);
    });

    it("hidden when significant risk", () => {
      expect(
        q().showIf!(a({ posesSignificantRiskOfHarm: true }))
      ).toBe(false);
    });

    it("hidden when performs profiling (overrides everything)", () => {
      expect(
        q().showIf!(
          a({ posesSignificantRiskOfHarm: false, performsProfiling: true })
        )
      ).toBe(false);
    });
  });
});

// ============================================================================
// WQ9: Question showIf — Remaining Conditionals
// ============================================================================
describe("WQ9: Question showIf — Company step (outputUsedInEU)", () => {
  const q = () => question("outputUsedInEU");

  it("hidden when isEUBased is true", () => {
    expect(q().showIf!(a({ isEUBased: true }))).toBe(false);
  });

  it("hidden when isEUBased is undefined", () => {
    expect(q().showIf!(a({}))).toBe(false);
  });

  it("visible when isEUBased is false", () => {
    expect(q().showIf!(a({ isEUBased: false }))).toBe(true);
  });
});

describe("WQ9: Question showIf — safetyComponent sub-questions", () => {
  it("productUnderAnnexI hidden when isSafetyComponent false", () => {
    expect(
      question("productUnderAnnexI").showIf!(a({ isSafetyComponent: false }))
    ).toBe(false);
  });

  it("productUnderAnnexI visible when isSafetyComponent true", () => {
    expect(
      question("productUnderAnnexI").showIf!(a({ isSafetyComponent: true }))
    ).toBe(true);
  });

  it("requiresThirdPartyConformity hidden when isSafetyComponent false", () => {
    expect(
      question("requiresThirdPartyConformity").showIf!(
        a({ isSafetyComponent: false })
      )
    ).toBe(false);
  });

  it("requiresThirdPartyConformity hidden when productUnderAnnexI false", () => {
    expect(
      question("requiresThirdPartyConformity").showIf!(
        a({ isSafetyComponent: true, productUnderAnnexI: false })
      )
    ).toBe(false);
  });

  it("requiresThirdPartyConformity visible when both parents true", () => {
    expect(
      question("requiresThirdPartyConformity").showIf!(
        a({ isSafetyComponent: true, productUnderAnnexI: true })
      )
    ).toBe(true);
  });
});

describe("WQ9: Question showIf — Transparency sub-questions", () => {
  it("generatesDeepfakes hidden when generatesMedia false", () => {
    expect(
      question("generatesDeepfakes").showIf!(a({ generatesMedia: false }))
    ).toBe(false);
  });

  it("generatesDeepfakes visible when generatesMedia true", () => {
    expect(
      question("generatesDeepfakes").showIf!(a({ generatesMedia: true }))
    ).toBe(true);
  });

  it("generatesDeepfakes hidden when generatesMedia undefined", () => {
    expect(question("generatesDeepfakes").showIf!(a({}))).toBe(false);
  });
});

describe("WQ9: Question showIf — GPAI sub-questions", () => {
  const gpaiGatedQs = ["gpaiOpenSource", "gpaiTrainingCompute", "gpaiHighImpactCapabilities"];

  test.each(gpaiGatedQs.map((id) => [id]))(
    "%s hidden when isGeneralPurposeModel false",
    (id) => {
      expect(
        question(id as string).showIf!(a({ isGeneralPurposeModel: false }))
      ).toBe(false);
    }
  );

  test.each(gpaiGatedQs.map((id) => [id]))(
    "%s visible when isGeneralPurposeModel true",
    (id) => {
      expect(
        question(id as string).showIf!(a({ isGeneralPurposeModel: true }))
      ).toBe(true);
    }
  );

  test.each(gpaiGatedQs.map((id) => [id]))(
    "%s hidden when isGeneralPurposeModel undefined",
    (id) => {
      expect(question(id as string).showIf!(a({}))).toBe(false);
    }
  );
});

describe("WQ9: Question showIf — Supply chain role-gated questions", () => {
  const deployerGatedQs = [
    "putOwnNameOrBrandOnSystem",
    "changedPurposeToHighRisk",
    "broughtSystemFromOutsideEU",
    "resellsOrDistributesSystem",
  ];

  test.each(deployerGatedQs.map((id) => [id]))(
    "%s visible when role=DEPLOYER",
    (id) => {
      expect(question(id as string).showIf!(a({ role: "DEPLOYER" }))).toBe(true);
    }
  );

  test.each(deployerGatedQs.map((id) => [id]))(
    "%s visible when role=BOTH",
    (id) => {
      expect(question(id as string).showIf!(a({ role: "BOTH" }))).toBe(true);
    }
  );

  test.each(deployerGatedQs.map((id) => [id]))(
    "%s HIDDEN when role=PROVIDER",
    (id) => {
      expect(question(id as string).showIf!(a({ role: "PROVIDER" }))).toBe(false);
    }
  );

  test.each(deployerGatedQs.map((id) => [id]))(
    "%s HIDDEN when role=undefined",
    (id) => {
      expect(question(id as string).showIf!(a({}))).toBe(false);
    }
  );

  it("appointedAsAuthorisedRep visible when isEUBased", () => {
    expect(
      question("appointedAsAuthorisedRep").showIf!(a({ isEUBased: true }))
    ).toBe(true);
  });

  it("appointedAsAuthorisedRep hidden when not EU-based", () => {
    expect(
      question("appointedAsAuthorisedRep").showIf!(a({ isEUBased: false }))
    ).toBe(false);
  });

  it("appointedAsAuthorisedRep hidden when isEUBased undefined", () => {
    expect(question("appointedAsAuthorisedRep").showIf!(a({}))).toBe(false);
  });

  it("madeSubstantialModification has NO showIf (always shown in supplyChain step)", () => {
    expect(question("madeSubstantialModification").showIf).toBeUndefined();
  });

  it("usesThirdPartyAIComponents has NO showIf (always shown in supplyChain step)", () => {
    expect(question("usesThirdPartyAIComponents").showIf).toBeUndefined();
  });
});

describe("WQ9: Question showIf — GDPR sub-questions", () => {
  it("processesSpecialCategoryData hidden when processesPersonalData false", () => {
    expect(
      question("processesSpecialCategoryData").showIf!(
        a({ processesPersonalData: false })
      )
    ).toBe(false);
  });

  it("processesSpecialCategoryData visible when processesPersonalData true", () => {
    expect(
      question("processesSpecialCategoryData").showIf!(
        a({ processesPersonalData: true })
      )
    ).toBe(true);
  });

  it("processesChildrenData hidden when processesPersonalData false", () => {
    expect(
      question("processesChildrenData").showIf!(
        a({ processesPersonalData: false })
      )
    ).toBe(false);
  });

  it("processesChildrenData visible when processesPersonalData true", () => {
    expect(
      question("processesChildrenData").showIf!(
        a({ processesPersonalData: true })
      )
    ).toBe(true);
  });
});

describe("WQ9: Question showIf — Transitional sub-questions", () => {
  it("gpaiAlreadyOnMarketBeforeAug2025 hidden when not GPAI provider", () => {
    expect(
      question("gpaiAlreadyOnMarketBeforeAug2025").showIf!(
        a({ isGeneralPurposeModel: false })
      )
    ).toBe(false);
  });

  it("gpaiAlreadyOnMarketBeforeAug2025 visible when GPAI provider", () => {
    expect(
      question("gpaiAlreadyOnMarketBeforeAug2025").showIf!(
        a({ isGeneralPurposeModel: true })
      )
    ).toBe(true);
  });

  it("usedByPublicAuthority hidden when role=PROVIDER", () => {
    expect(
      question("usedByPublicAuthority").showIf!(a({ role: "PROVIDER" }))
    ).toBe(false);
  });

  it("usedByPublicAuthority visible when role=DEPLOYER", () => {
    expect(
      question("usedByPublicAuthority").showIf!(a({ role: "DEPLOYER" }))
    ).toBe(true);
  });

  it("usedByPublicAuthority visible when role=BOTH", () => {
    expect(
      question("usedByPublicAuthority").showIf!(a({ role: "BOTH" }))
    ).toBe(true);
  });

  it("isLargeScaleITSystem hidden when no LE/migration use case", () => {
    expect(
      question("isLargeScaleITSystem").showIf!(a({}))
    ).toBe(false);
  });

  it("isLargeScaleITSystem visible when lawEnforcementUseCase", () => {
    expect(
      question("isLargeScaleITSystem").showIf!(
        a({ lawEnforcementUseCase: true })
      )
    ).toBe(true);
  });

  it("isLargeScaleITSystem visible when migrationUseCase", () => {
    expect(
      question("isLargeScaleITSystem").showIf!(a({ migrationUseCase: true }))
    ).toBe(true);
  });

  it("isPublicBodyOrPublicService hidden when role=PROVIDER", () => {
    expect(
      question("isPublicBodyOrPublicService").showIf!(a({ role: "PROVIDER" }))
    ).toBe(false);
  });

  it("isPublicBodyOrPublicService visible when role=DEPLOYER", () => {
    expect(
      question("isPublicBodyOrPublicService").showIf!(a({ role: "DEPLOYER" }))
    ).toBe(true);
  });

  it("isPublicBodyOrPublicService visible when role=BOTH", () => {
    expect(
      question("isPublicBodyOrPublicService").showIf!(a({ role: "BOTH" }))
    ).toBe(true);
  });

  it("systemAlreadyOnMarketBeforeAug2026 has NO showIf", () => {
    expect(question("systemAlreadyOnMarketBeforeAug2026").showIf).toBeUndefined();
  });
});

// ============================================================================
// WQ16: mapToField Validation
// ============================================================================
describe("WQ16: mapToField Validation", () => {
  const questions = allQuestions();

  it("all questions with string mapToField map to valid WizardAnswers keys", () => {
    // We can't fully type-check at runtime, but we verify they're non-empty strings
    const withStringMap = questions.filter(
      (q) => typeof q.mapToField === "string"
    );
    for (const q of withStringMap) {
      expect((q.mapToField as string).length).toBeGreaterThan(0);
    }
  });

  it("no duplicate mapToField strings within a single step", () => {
    for (const s of WIZARD_STEPS) {
      const stringFields = s.questions
        .filter((q) => typeof q.mapToField === "string")
        .map((q) => q.mapToField as string);
      expect(new Set(stringFields).size).toBe(stringFields.length);
    }
  });

  // Verify specific expected mappings
  const expectedMappings: [string, string][] = [
    ["companyName", "companyName"],
    ["companySize", "companySize"],
    ["isEUBased", "isEUBased"],
    ["outputUsedInEU", "outputUsedInEU"],
    ["role", "role"],
    ["systemDescription", "systemDescription"],
    ["militaryDefenceOnly", "militaryDefenceOnly"],
    ["scientificResearchOnly", "scientificResearchOnly"],
    ["personalNonProfessional", "personalNonProfessional"],
    ["openSourceNonHighRisk", "openSourceNonHighRisk"],
    ["usesSubliminaManipulation", "usesSubliminaManipulation"],
    ["manipulationCausesSignificantHarm", "manipulationCausesSignificantHarm"],
    ["exploitsVulnerabilities", "exploitsVulnerabilities"],
    ["exploitationCausesSignificantHarm", "exploitationCausesSignificantHarm"],
    ["socialScoring", "socialScoring"],
    ["criminalRiskProfiling", "criminalRiskProfiling"],
    ["crimeProfilingBasedSolelyOnPersonality", "crimeProfilingBasedSolelyOnPersonality"],
    ["crimeProfilingSupportingHumanAssessment", "crimeProfilingSupportingHumanAssessment"],
    ["facialRecognitionScraping", "facialRecognitionScraping"],
    ["workplaceEmotionDetection", "workplaceEmotionDetection"],
    ["workplaceEmotionForMedicalSafety", "workplaceEmotionForMedicalSafety"],
    ["biometricCategorisationSensitive", "biometricCategorisationSensitive"],
    ["biometricCatForLawEnforcementLabelling", "biometricCatForLawEnforcementLabelling"],
    ["realtimeBiometricPublicSpaces", "realtimeBiometricPublicSpaces"],
    ["realtimeBiometricForLEException", "realtimeBiometricForLEException"],
    ["realtimeBiometricHasJudicialAuth", "realtimeBiometricHasJudicialAuth"],
    ["isSafetyComponent", "isSafetyComponent"],
    ["productUnderAnnexI", "productUnderAnnexI"],
    ["requiresThirdPartyConformity", "requiresThirdPartyConformity"],
    ["usesBiometrics", "usesBiometrics"],
    ["isBiometricVerificationOnly", "isBiometricVerificationOnly"],
    ["biometricType", "biometricType"],
    ["criticalInfrastructure", "criticalInfrastructure"],
    ["educationUseCase", "educationUseCase"],
    ["educationType", "educationType"],
    ["employmentUseCase", "employmentUseCase"],
    ["employmentType", "employmentType"],
    ["essentialServicesUseCase", "essentialServicesUseCase"],
    ["essentialServiceType", "essentialServiceType"],
    ["lawEnforcementUseCase", "lawEnforcementUseCase"],
    ["lawEnforcementType", "lawEnforcementType"],
    ["migrationUseCase", "migrationUseCase"],
    ["migrationType", "migrationType"],
    ["justiceUseCase", "justiceUseCase"],
    ["justiceType", "justiceType"],
    ["posesSignificantRiskOfHarm", "posesSignificantRiskOfHarm"],
    ["performsProfiling", "performsProfiling"],
    ["narrowProceduralTask", "narrowProceduralTask"],
    ["improvesHumanActivity", "improvesHumanActivity"],
    ["detectsPatterns", "detectsPatterns"],
    ["preparatoryTask", "preparatoryTask"],
    ["interactsWithHumans", "interactsWithHumans"],
    ["generatesMedia", "generatesMedia"],
    ["generatesDeepfakes", "generatesDeepfakes"],
    ["generatesText", "generatesText"],
    ["usesEmotionRecognition", "usesEmotionRecognition"],
    ["usesBiometricCategorisation", "usesBiometricCategorisation"],
    ["isGeneralPurposeModel", "isGeneralPurposeModel"],
    ["gpaiOpenSource", "gpaiOpenSource"],
    ["gpaiTrainingCompute", "gpaiTrainingCompute"],
    ["gpaiHighImpactCapabilities", "gpaiHighImpactCapabilities"],
    ["putOwnNameOrBrandOnSystem", "putOwnNameOrBrandOnSystem"],
    ["madeSubstantialModification", "madeSubstantialModification"],
    ["changedPurposeToHighRisk", "changedPurposeToHighRisk"],
    ["broughtSystemFromOutsideEU", "broughtSystemFromOutsideEU"],
    ["resellsOrDistributesSystem", "resellsOrDistributesSystem"],
    ["appointedAsAuthorisedRep", "appointedAsAuthorisedRep"],
    ["usesThirdPartyAIComponents", "usesThirdPartyAIComponents"],
    ["sectorSpecificLegislation", "sectorSpecificLegislation"],
    ["processesPersonalData", "processesPersonalData"],
    ["processesSpecialCategoryData", "processesSpecialCategoryData"],
    ["processesChildrenData", "processesChildrenData"],
    ["hasAuthorisedRepInEU", "hasAuthorisedRepInEU"],
    ["systemAlreadyOnMarketBeforeAug2026", "systemAlreadyOnMarketBeforeAug2026"],
    ["gpaiAlreadyOnMarketBeforeAug2025", "gpaiAlreadyOnMarketBeforeAug2025"],
    ["usedByPublicAuthority", "usedByPublicAuthority"],
    ["isLargeScaleITSystem", "isLargeScaleITSystem"],
    ["isPublicBodyOrPublicService", "isPublicBodyOrPublicService"],
    ["gpaiUsedAsHighRiskComponent", "gpaiUsedAsHighRiskComponent"],
  ];

  test.each(expectedMappings)(
    "question '%s' maps to WizardAnswers field '%s'",
    (questionId, expectedField) => {
      expect(question(questionId).mapToField).toBe(expectedField);
    }
  );

  it("every question maps to a string field (no function mappers in current data)", () => {
    for (const q of questions) {
      expect(typeof q.mapToField).toBe("string");
    }
  });

  it("total mapped fields equals total questions (79)", () => {
    expect(expectedMappings.length).toBe(questions.length);
  });
});
