/**
 * COMBINATORIAL COVERAGE TESTS — EU AI Act Classification Engine
 *
 * Systematically covers all meaningful combinatorial paths through the engine.
 * Uses parameterized tests (test.each) to eliminate the "combinatorial explosion"
 * excuse — the engine has a finite number of decision branches, not 2^50.
 *
 * Matrices covered:
 *   C.1: 8 Annex III areas × 3 roles × 3 outcomes (confirmed, Art 6(3) exception, profiling override)
 *   C.2: 8 Annex III areas × 4 Art 6(3) conditions (a)-(d)
 *   C.3: 6 transparency triggers × 5 classification categories (overlay)
 *   C.4: GPAI dual classification × 9 high-risk triggers × 2 GPAI types
 *   C.5: Multi-area Annex III pairs — C(8,2) = 28 pairs
 *   C.6: Open-source exclusion × blocking triggers
 */

import { describe, it, expect } from "vitest";
import {
  classifyAISystem,
  type WizardAnswers,
  type HighRiskArea,
} from "../classification-engine";

// ============================================================================
// HELPER: Base answers template (minimal risk default)
// ============================================================================

function baseAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    companyName: "CombiTestCo",
    companySize: "SMALL",
    isEUBased: true,
    outputUsedInEU: true,
    role: "PROVIDER",
    systemDescription: "Combinatorial test system",
    militaryDefenceOnly: false,
    scientificResearchOnly: false,
    personalNonProfessional: false,
    openSourceNonHighRisk: false,
    usesSubliminaManipulation: false,
    manipulationCausesSignificantHarm: false,
    exploitsVulnerabilities: false,
    exploitationCausesSignificantHarm: false,
    socialScoring: false,
    criminalRiskProfiling: false,
    crimeProfilingBasedSolelyOnPersonality: false,
    crimeProfilingSupportingHumanAssessment: false,
    facialRecognitionScraping: false,
    workplaceEmotionDetection: false,
    workplaceEmotionForMedicalSafety: false,
    biometricCategorisationSensitive: false,
    biometricCatForLawEnforcementLabelling: false,
    realtimeBiometricPublicSpaces: false,
    realtimeBiometricForLEException: false,
    realtimeBiometricHasJudicialAuth: false,
    isSafetyComponent: false,
    productUnderAnnexI: false,
    requiresThirdPartyConformity: false,
    usesBiometrics: false,
    isBiometricVerificationOnly: false,
    criticalInfrastructure: false,
    educationUseCase: false,
    employmentUseCase: false,
    essentialServicesUseCase: false,
    lawEnforcementUseCase: false,
    migrationUseCase: false,
    justiceUseCase: false,
    posesSignificantRiskOfHarm: false,
    narrowProceduralTask: false,
    improvesHumanActivity: false,
    detectsPatterns: false,
    preparatoryTask: false,
    performsProfiling: false,
    interactsWithHumans: false,
    generatesDeepfakes: false,
    generatesText: false,
    generatesMedia: false,
    usesEmotionRecognition: false,
    usesBiometricCategorisation: false,
    isGeneralPurposeModel: false,
    gpaiHighImpactCapabilities: false,
    gpaiOpenSource: false,
    ...overrides,
  };
}

// ============================================================================
// AREA TRIGGER MAP — maps each Annex III area to the WizardAnswers overrides
// ============================================================================

type AreaTrigger = { area: HighRiskArea; trigger: Partial<WizardAnswers>; annexPoint: string };

const AREA_TRIGGERS: AreaTrigger[] = [
  { area: "BIOMETRICS", trigger: { usesBiometrics: true, biometricType: "REMOTE_IDENTIFICATION", isBiometricVerificationOnly: false }, annexPoint: "Annex III, point 1" },
  { area: "CRITICAL_INFRASTRUCTURE", trigger: { criticalInfrastructure: true }, annexPoint: "Annex III, point 2" },
  { area: "EDUCATION", trigger: { educationUseCase: true }, annexPoint: "Annex III, point 3" },
  { area: "EMPLOYMENT", trigger: { employmentUseCase: true }, annexPoint: "Annex III, point 4" },
  { area: "ESSENTIAL_SERVICES", trigger: { essentialServicesUseCase: true }, annexPoint: "Annex III, point 5" },
  { area: "LAW_ENFORCEMENT", trigger: { lawEnforcementUseCase: true }, annexPoint: "Annex III, point 6" },
  { area: "MIGRATION_ASYLUM_BORDER", trigger: { migrationUseCase: true }, annexPoint: "Annex III, point 7" },
  { area: "JUSTICE_DEMOCRACY", trigger: { justiceUseCase: true }, annexPoint: "Annex III, point 8" },
];

// FRIA applies to these areas (for DEPLOYER/BOTH roles)
const FRIA_AREAS: HighRiskArea[] = [
  "ESSENTIAL_SERVICES", "EDUCATION", "EMPLOYMENT",
  "LAW_ENFORCEMENT", "MIGRATION_ASYLUM_BORDER", "JUSTICE_DEMOCRACY",
];

// ============================================================================
// C.1: 8 ANNEX III AREAS × 3 ROLES × 3 OUTCOMES = 72 COMBOS
// Outcomes: confirmed HIGH_RISK, Art 6(3) exception, profiling override
// ============================================================================

describe("C.1: Annex III areas × roles × outcomes", () => {
  const roles = ["PROVIDER", "DEPLOYER", "BOTH"] as const;

  // ── C.1.A: Confirmed HIGH_RISK (no exception) ──
  describe("Confirmed HIGH_RISK: 8 areas × 3 roles", () => {
    const cases = AREA_TRIGGERS.flatMap(({ area, trigger, annexPoint }) =>
      roles.map(role => ({
        name: `${area} × ${role}`,
        area,
        role,
        trigger,
        annexPoint,
      }))
    );

    it.each(cases)("$name → HIGH_RISK with correct area, legal basis, and role-appropriate obligations", ({
      area, role, trigger, annexPoint,
    }) => {
      const r = classifyAISystem(baseAnswers({
        ...trigger,
        role,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe(area);
      expect(r.role).toBe(role);
      expect(r.legalBasis).toContain(annexPoint);
      expect(r.legalBasis).toContain("Article 6(2)");
      expect(r.enforcementDeadline).toBe("2026-08-02");

      // Role-appropriate obligations
      if (role === "PROVIDER") {
        const ids = r.obligations.map(o => o.id);
        expect(ids).toContain("RISK_MANAGEMENT_SYSTEM");
        expect(ids).toContain("TECHNICAL_DOCUMENTATION");
        expect(ids).toContain("CONFORMITY_ASSESSMENT");
        expect(ids).not.toContain("DEPLOY_PER_INSTRUCTIONS");
      } else if (role === "DEPLOYER") {
        const ids = r.obligations.map(o => o.id);
        expect(ids).toContain("DEPLOY_PER_INSTRUCTIONS");
        expect(ids).toContain("ASSIGN_HUMAN_OVERSIGHT");
        expect(ids).not.toContain("RISK_MANAGEMENT_SYSTEM");
        // FRIA check
        if (FRIA_AREAS.includes(area)) {
          expect(ids).toContain("FUNDAMENTAL_RIGHTS_IMPACT");
        }
      } else {
        // BOTH
        const ids = r.obligations.map(o => o.id);
        expect(ids).toContain("RISK_MANAGEMENT_SYSTEM");
        expect(ids).toContain("DEPLOY_PER_INSTRUCTIONS");
        expect(ids).toContain("FUNDAMENTAL_RIGHTS_IMPACT");
      }

      // AI literacy always present
      expect(r.obligations.map(o => o.id)).toContain("AI_LITERACY");
    });
  });

  // ── C.1.B: Art 6(3) exception — all 8 areas ──
  describe("Art 6(3) exception: 8 areas × PROVIDER", () => {
    it.each(AREA_TRIGGERS)("$area → MINIMAL_RISK with exception documentation",
      ({ area, trigger, annexPoint }) => {
        const r = classifyAISystem(baseAnswers({
          ...trigger,
          role: "PROVIDER",
          posesSignificantRiskOfHarm: false,
          narrowProceduralTask: true,
        }));
        expect(r.classification).toBe("MINIMAL_RISK");
        expect(r.legalBasis).toContain("Article 6(3)");
        expect(r.legalBasis).toContain(annexPoint);
        // Must have documentation and registration obligations
        const ids = r.obligations.map(o => o.id);
        expect(ids).toContain("DOCUMENT_NON_HIGH_RISK");
        expect(ids).toContain("REGISTER_NON_HIGH_RISK");
        expect(ids).toContain("AI_LITERACY");
        // Must warn about narrow interpretation
        expect(r.warnings.some(w => w.includes("narrowly interpreted"))).toBe(true);
        // nextSteps should reference the area
        expect(r.nextSteps.some(s => s.includes(area.replace(/_/g, " ")))).toBe(true);
      }
    );
  });

  // ── C.1.C: Profiling override blocks Art 6(3) exception — all 8 areas ──
  describe("Profiling override: 8 areas", () => {
    it.each(AREA_TRIGGERS)("$area + profiling → HIGH_RISK even with exception conditions met",
      ({ area, trigger }) => {
        const r = classifyAISystem(baseAnswers({
          ...trigger,
          posesSignificantRiskOfHarm: false,
          narrowProceduralTask: true,
          performsProfiling: true,
        }));
        expect(r.classification).toBe("HIGH_RISK");
        expect(r.highRiskArea).toBe(area);
      }
    );
  });
});

// ============================================================================
// C.2: 8 ANNEX III AREAS × 4 ART 6(3) CONDITIONS = 32 COMBOS
// Each of the four exception conditions independently for each area
// ============================================================================

describe("C.2: Annex III areas × Art 6(3) conditions (a)-(d)", () => {
  const conditions = [
    { name: "6(3)(a) narrow procedural task", override: { narrowProceduralTask: true } as Partial<WizardAnswers>, label: "Art 6(3)(a)" },
    { name: "6(3)(b) improves human activity", override: { improvesHumanActivity: true } as Partial<WizardAnswers>, label: "Art 6(3)(b)" },
    { name: "6(3)(c) detects patterns", override: { detectsPatterns: true } as Partial<WizardAnswers>, label: "Art 6(3)(c)" },
    { name: "6(3)(d) preparatory task", override: { preparatoryTask: true } as Partial<WizardAnswers>, label: "Art 6(3)(d)" },
  ];

  const cases = AREA_TRIGGERS.flatMap(({ area, trigger }) =>
    conditions.map(cond => ({
      name: `${area} × ${cond.name}`,
      area,
      trigger,
      condOverride: cond.override,
      condLabel: cond.label,
    }))
  );

  it.each(cases)("$name → MINIMAL_RISK exception when no significant risk",
    ({ trigger, condOverride, condLabel }) => {
      const r = classifyAISystem(baseAnswers({
        ...trigger,
        posesSignificantRiskOfHarm: false,
        ...condOverride,
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
      expect(r.legalBasis).toContain("Article 6(3)");
      // The specific condition should appear in nextSteps
      expect(r.nextSteps.some(s => s.includes(condLabel))).toBe(true);
    }
  );

  // Verify exception fails when posesSignificantRiskOfHarm=true (even with conditions met)
  describe("Exception BLOCKED when significant risk = true", () => {
    it.each(AREA_TRIGGERS)("$area + significant risk + all conditions → HIGH_RISK",
      ({ area, trigger }) => {
        const r = classifyAISystem(baseAnswers({
          ...trigger,
          posesSignificantRiskOfHarm: true,
          narrowProceduralTask: true,
          improvesHumanActivity: true,
          detectsPatterns: true,
          preparatoryTask: true,
        }));
        expect(r.classification).toBe("HIGH_RISK");
        expect(r.highRiskArea).toBe(area);
      }
    );
  });
});

// ============================================================================
// C.3: 6 TRANSPARENCY TRIGGERS × 5 CLASSIFICATION CATEGORIES = 30 COMBOS
// Overlay applies to: HIGH_RISK (Annex III), HIGH_RISK (safety), GPAI,
// GPAI_SYSTEMIC, MINIMAL_RISK (Art 6(3) exception)
// ============================================================================

describe("C.3: Transparency overlay × classification categories", () => {
  const transparencyTriggers = [
    { name: "interactsWithHumans", override: { interactsWithHumans: true } as Partial<WizardAnswers>, obligId: "TRANSPARENCY_INTERACTION", type: "HUMAN_INTERACTION" },
    { name: "usesEmotionRecognition", override: { usesEmotionRecognition: true } as Partial<WizardAnswers>, obligId: "TRANSPARENCY_EMOTION", type: "EMOTION_RECOGNITION" },
    { name: "usesBiometricCategorisation", override: { usesBiometricCategorisation: true } as Partial<WizardAnswers>, obligId: "TRANSPARENCY_BIOMETRIC_CAT", type: "BIOMETRIC_CATEGORISATION" },
    { name: "generatesDeepfakes", override: { generatesDeepfakes: true } as Partial<WizardAnswers>, obligId: "TRANSPARENCY_DEEPFAKE", type: "DEEPFAKE_CONTENT" },
    { name: "generatesText", override: { generatesText: true } as Partial<WizardAnswers>, obligId: "TRANSPARENCY_TEXT", type: "AI_GENERATED_TEXT" },
    { name: "generatesMedia", override: { generatesMedia: true } as Partial<WizardAnswers>, obligId: "TRANSPARENCY_MEDIA", type: "AI_GENERATED_MEDIA" },
  ];

  // Classification contexts that should receive the transparency overlay
  const classContexts = [
    {
      name: "HIGH_RISK (Annex III EDUCATION)",
      base: { educationUseCase: true, posesSignificantRiskOfHarm: true } as Partial<WizardAnswers>,
      expectedClass: "HIGH_RISK",
    },
    {
      name: "HIGH_RISK (safety component)",
      base: { isSafetyComponent: true, productUnderAnnexI: true, requiresThirdPartyConformity: true } as Partial<WizardAnswers>,
      expectedClass: "HIGH_RISK",
    },
    {
      name: "GPAI",
      base: { isGeneralPurposeModel: true } as Partial<WizardAnswers>,
      expectedClass: "GPAI",
    },
    {
      name: "GPAI_SYSTEMIC",
      base: { isGeneralPurposeModel: true, gpaiHighImpactCapabilities: true } as Partial<WizardAnswers>,
      expectedClass: "GPAI_SYSTEMIC",
    },
    {
      name: "MINIMAL_RISK (Art 6(3) exception)",
      base: { educationUseCase: true, posesSignificantRiskOfHarm: false, narrowProceduralTask: true } as Partial<WizardAnswers>,
      expectedClass: "MINIMAL_RISK",
    },
  ];

  const cases = classContexts.flatMap(ctx =>
    transparencyTriggers.map(tt => ({
      name: `${ctx.name} + ${tt.name}`,
      classBase: ctx.base,
      expectedClass: ctx.expectedClass,
      triggerOverride: tt.override,
      obligId: tt.obligId,
      type: tt.type,
    }))
  );

  it.each(cases)("$name → transparency obligation added via overlay",
    ({ classBase, expectedClass, triggerOverride, obligId, type }) => {
      const r = classifyAISystem(baseAnswers({ ...classBase, ...triggerOverride }));
      expect(r.classification).toBe(expectedClass);
      // Transparency obligation must be present
      const ids = r.obligations.map(o => o.id);
      expect(ids).toContain(obligId);
      expect(r.transparencyObligations).toContain(type);
      // Art 50(5) warning
      expect(r.warnings.some(w => w.includes("Art 50(5)"))).toBe(true);
    }
  );

  // Also verify standalone LIMITED_RISK (no overlay — direct classification)
  describe("LIMITED_RISK (standalone) — direct classification, NOT overlay", () => {
    it.each(transparencyTriggers)("$name alone → LIMITED_RISK with obligation",
      ({ override, obligId, type }) => {
        const r = classifyAISystem(baseAnswers(override));
        expect(r.classification).toBe("LIMITED_RISK");
        expect(r.obligations.map(o => o.id)).toContain(obligId);
        expect(r.transparencyObligations).toContain(type);
        // No "Art 50(5)" overlay warning for standalone LIMITED_RISK
        expect(r.warnings.some(w => w.includes("Art 50(5)"))).toBe(false);
      }
    );
  });

  // PROHIBITED and scope-excluded should NOT get overlay
  describe("NO overlay for PROHIBITED or scope-excluded", () => {
    it.each(transparencyTriggers)("PROHIBITED + $name → NO transparency overlay",
      ({ override }) => {
        const r = classifyAISystem(baseAnswers({ socialScoring: true, ...override }));
        expect(r.classification).toBe("PROHIBITED");
        expect(r.transparencyObligations).toBeUndefined();
      }
    );

    it.each(transparencyTriggers)("Scope excluded + $name → NO transparency overlay",
      ({ override }) => {
        const r = classifyAISystem(baseAnswers({ militaryDefenceOnly: true, ...override }));
        expect(r.transparencyObligations).toBeUndefined();
      }
    );
  });
});

// ============================================================================
// C.4: GPAI DUAL CLASSIFICATION × 9 HIGH-RISK TRIGGERS × 2 GPAI TYPES = 18
// ============================================================================

describe("C.4: GPAI dual classification × high-risk triggers", () => {
  const gpaiTypes = [
    { name: "GPAI", overrides: { isGeneralPurposeModel: true } as Partial<WizardAnswers>, expectedClass: "GPAI" },
    { name: "GPAI_SYSTEMIC", overrides: { isGeneralPurposeModel: true, gpaiHighImpactCapabilities: true } as Partial<WizardAnswers>, expectedClass: "GPAI_SYSTEMIC" },
  ];

  const hrTriggers = [
    { name: "safety component", trigger: { isSafetyComponent: true, productUnderAnnexI: true, requiresThirdPartyConformity: true } as Partial<WizardAnswers> },
    ...AREA_TRIGGERS.map(at => ({ name: at.area, trigger: at.trigger })),
  ];

  const cases = gpaiTypes.flatMap(gp =>
    hrTriggers.map(hr => ({
      name: `${gp.name} + ${hr.name}`,
      gpaiOverrides: gp.overrides,
      expectedClass: gp.expectedClass,
      hrTrigger: hr.trigger,
    }))
  );

  it.each(cases)("$name → GPAI wins classification + DUAL CLASSIFICATION warning",
    ({ gpaiOverrides, expectedClass, hrTrigger }) => {
      const r = classifyAISystem(baseAnswers({ ...gpaiOverrides, ...hrTrigger }));
      expect(r.classification).toBe(expectedClass);
      expect(r.warnings.some(w => w.includes("DUAL CLASSIFICATION"))).toBe(true);
      expect(r.nextSteps.some(s => s.includes("ACTION REQUIRED"))).toBe(true);
    }
  );

  // No warning when no high-risk triggers
  it.each(gpaiTypes)("$name alone → NO dual classification warning",
    ({ overrides, expectedClass }) => {
      const r = classifyAISystem(baseAnswers(overrides));
      expect(r.classification).toBe(expectedClass);
      expect(r.warnings.some(w => w.includes("DUAL CLASSIFICATION"))).toBe(false);
    }
  );
});

// ============================================================================
// C.5: MULTI-AREA ANNEX III PAIRS — C(8,2) = 28 PAIRS
// Verifies that when two areas are triggered simultaneously:
//   - Both legal bases are present
//   - Multi-area warning is generated
//   - Warnings from BOTH areas are included
//   - Last area wins for highRiskArea (backward compatible)
// ============================================================================

describe("C.5: Multi-area Annex III pairs", () => {
  const pairs: Array<{ name: string; a: AreaTrigger; b: AreaTrigger }> = [];
  for (let i = 0; i < AREA_TRIGGERS.length; i++) {
    for (let j = i + 1; j < AREA_TRIGGERS.length; j++) {
      pairs.push({
        name: `${AREA_TRIGGERS[i].area} + ${AREA_TRIGGERS[j].area}`,
        a: AREA_TRIGGERS[i],
        b: AREA_TRIGGERS[j],
      });
    }
  }

  it.each(pairs)("$name → HIGH_RISK with both legal bases and multi-area warning",
    ({ a, b }) => {
      const r = classifyAISystem(baseAnswers({
        ...a.trigger,
        ...b.trigger,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain(a.annexPoint);
      expect(r.legalBasis).toContain(b.annexPoint);
      // Last area wins (by Annex III point order: b comes after a)
      expect(r.highRiskArea).toBe(b.area);
      // Multi-area warning
      expect(r.warnings.some(w => w.includes("MULTIPLE HIGH-RISK AREAS"))).toBe(true);
      // Both areas mentioned in warnings
      expect(r.warnings.some(w =>
        w.includes(a.area.replace(/_/g, " ")) && w.includes(b.area.replace(/_/g, " "))
      )).toBe(true);
    }
  );

  // ── DEPLOYER multi-area — FRIA should be included if ANY qualifying area matches ──
  it("DEPLOYER BIOMETRICS + EDUCATION → FRIA from EDUCATION", () => {
    const r = classifyAISystem(baseAnswers({
      role: "DEPLOYER",
      usesBiometrics: true,
      biometricType: "REMOTE_IDENTIFICATION",
      isBiometricVerificationOnly: false,
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
    const ids = r.obligations.map(o => o.id);
    expect(ids).toContain("FUNDAMENTAL_RIGHTS_IMPACT");
  });

  it("DEPLOYER CRITICAL_INFRASTRUCTURE + EMPLOYMENT → FRIA from EMPLOYMENT", () => {
    const r = classifyAISystem(baseAnswers({
      role: "DEPLOYER",
      criticalInfrastructure: true,
      employmentUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
    const ids = r.obligations.map(o => o.id);
    expect(ids).toContain("FUNDAMENTAL_RIGHTS_IMPACT");
  });

  it("DEPLOYER BIOMETRICS + CRITICAL_INFRASTRUCTURE → NO FRIA (neither qualifies)", () => {
    const r = classifyAISystem(baseAnswers({
      role: "DEPLOYER",
      usesBiometrics: true,
      biometricType: "REMOTE_IDENTIFICATION",
      isBiometricVerificationOnly: false,
      criticalInfrastructure: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
    const ids = r.obligations.map(o => o.id);
    expect(ids).not.toContain("FUNDAMENTAL_RIGHTS_IMPACT");
    // But should have public body warning
    expect(r.warnings.some(w => w.includes("Art 27"))).toBe(true);
  });
});

// ============================================================================
// C.6: OPEN-SOURCE EXCLUSION × BLOCKING TRIGGERS
// Art 2(12): Open-source exclusion is cancelled by prohibited, high-risk, or
// transparency triggers. Test each blocking trigger independently.
// ============================================================================

describe("C.6: Open-source exclusion × blocking triggers", () => {
  // ── Prohibited practice triggers that should block open-source exclusion ──
  const prohibitedBlockers = [
    { name: "subliminal manipulation", override: { usesSubliminaManipulation: true } as Partial<WizardAnswers> },
    { name: "vulnerability exploitation", override: { exploitsVulnerabilities: true } as Partial<WizardAnswers> },
    { name: "social scoring", override: { socialScoring: true } as Partial<WizardAnswers> },
    { name: "criminal risk profiling", override: { criminalRiskProfiling: true } as Partial<WizardAnswers> },
    { name: "facial scraping", override: { facialRecognitionScraping: true } as Partial<WizardAnswers> },
    { name: "workplace emotion", override: { workplaceEmotionDetection: true } as Partial<WizardAnswers> },
    { name: "biometric cat sensitive", override: { biometricCategorisationSensitive: true } as Partial<WizardAnswers> },
    { name: "realtime biometric", override: { realtimeBiometricPublicSpaces: true } as Partial<WizardAnswers> },
  ];

  it.each(prohibitedBlockers)("open-source + $name → exclusion BLOCKED (not scope-excluded)",
    ({ override }) => {
      const r = classifyAISystem(baseAnswers({
        openSourceNonHighRisk: true,
        ...override,
      }));
      // Should NOT be scope-excluded (Art 2 exclusion should not apply)
      // The actual classification depends on the specific trigger
      const notExcluded = !r.nextSteps.some(s => s.includes("OUTSIDE THE SCOPE"));
      expect(notExcluded).toBe(true);
    }
  );

  // ── High-risk triggers that should block open-source exclusion ──
  const highRiskBlockers = [
    { name: "safety component", override: { isSafetyComponent: true, productUnderAnnexI: true, requiresThirdPartyConformity: true } as Partial<WizardAnswers> },
    { name: "biometrics", override: { usesBiometrics: true, biometricType: "REMOTE_IDENTIFICATION" as const, isBiometricVerificationOnly: false } as Partial<WizardAnswers> },
    { name: "critical infrastructure", override: { criticalInfrastructure: true } as Partial<WizardAnswers> },
    { name: "education", override: { educationUseCase: true } as Partial<WizardAnswers> },
    { name: "employment", override: { employmentUseCase: true } as Partial<WizardAnswers> },
    { name: "essential services", override: { essentialServicesUseCase: true } as Partial<WizardAnswers> },
    { name: "law enforcement", override: { lawEnforcementUseCase: true } as Partial<WizardAnswers> },
    { name: "migration", override: { migrationUseCase: true } as Partial<WizardAnswers> },
    { name: "justice", override: { justiceUseCase: true } as Partial<WizardAnswers> },
  ];

  it.each(highRiskBlockers)("open-source + $name → exclusion BLOCKED",
    ({ override }) => {
      const r = classifyAISystem(baseAnswers({
        openSourceNonHighRisk: true,
        posesSignificantRiskOfHarm: true,
        ...override,
      }));
      const notExcluded = !r.nextSteps.some(s => s.includes("OUTSIDE THE SCOPE"));
      expect(notExcluded).toBe(true);
    }
  );

  // ── Transparency triggers that should block open-source exclusion ──
  const transparencyBlockers = [
    { name: "interactsWithHumans", override: { interactsWithHumans: true } as Partial<WizardAnswers> },
    { name: "usesEmotionRecognition", override: { usesEmotionRecognition: true } as Partial<WizardAnswers> },
    { name: "usesBiometricCategorisation", override: { usesBiometricCategorisation: true } as Partial<WizardAnswers> },
    { name: "generatesDeepfakes", override: { generatesDeepfakes: true } as Partial<WizardAnswers> },
    { name: "generatesText", override: { generatesText: true } as Partial<WizardAnswers> },
    { name: "generatesMedia", override: { generatesMedia: true } as Partial<WizardAnswers> },
  ];

  it.each(transparencyBlockers)("open-source + $name → exclusion BLOCKED",
    ({ override }) => {
      const r = classifyAISystem(baseAnswers({
        openSourceNonHighRisk: true,
        ...override,
      }));
      const notExcluded = !r.nextSteps.some(s => s.includes("OUTSIDE THE SCOPE"));
      expect(notExcluded).toBe(true);
    }
  );

  // ── Clean open-source (no blockers) → scope excluded ──
  it("open-source + NO blockers → scope excluded", () => {
    const r = classifyAISystem(baseAnswers({
      openSourceNonHighRisk: true,
    }));
    expect(r.nextSteps.some(s => s.includes("OUTSIDE THE SCOPE"))).toBe(true);
  });
});

// ============================================================================
// C.7: ANNEX III AREA-SPECIFIC CONFORMITY ASSESSMENT DESCRIPTIONS
// Verify that each area gets the correct conformity assessment procedure
// ============================================================================

describe("C.7: Conformity assessment per area", () => {
  it("BIOMETRICS → mentions notified body (Annex VII)", () => {
    const r = classifyAISystem(baseAnswers({
      usesBiometrics: true,
      biometricType: "REMOTE_IDENTIFICATION",
      isBiometricVerificationOnly: false,
      posesSignificantRiskOfHarm: true,
    }));
    const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
    expect(ca).toBeDefined();
    expect(ca!.description.toLowerCase()).toContain("notified body");
    expect(ca!.description).toContain("Annex VII");
  });

  const nonBiometricAreas = AREA_TRIGGERS.filter(a => a.area !== "BIOMETRICS");

  it.each(nonBiometricAreas)("$area → internal control (Annex VI), no notified body",
    ({ trigger }) => {
      const r = classifyAISystem(baseAnswers({
        ...trigger,
        posesSignificantRiskOfHarm: true,
      }));
      const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
      expect(ca).toBeDefined();
      expect(ca!.description).toContain("Annex VI");
      expect(ca!.description.toLowerCase()).toContain("internal control");
    }
  );

  it("PRODUCT_SAFETY → references relevant product legislation", () => {
    const r = classifyAISystem(baseAnswers({
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
    }));
    const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
    expect(ca).toBeDefined();
    expect(ca!.description.toLowerCase()).toContain("product legislation");
  });
});

// ============================================================================
// C.8: DEPLOYER FRIA AREAS — exhaustive check for all 8 areas × DEPLOYER
// ============================================================================

describe("C.8: FRIA per area for DEPLOYER", () => {
  it.each(AREA_TRIGGERS)("DEPLOYER + $area → FRIA included = %s",
    ({ area, trigger }) => {
      const r = classifyAISystem(baseAnswers({
        ...trigger,
        role: "DEPLOYER",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      const hasFria = r.obligations.some(o => o.id === "FUNDAMENTAL_RIGHTS_IMPACT");

      if (FRIA_AREAS.includes(area)) {
        expect(hasFria).toBe(true);
      } else {
        // BIOMETRICS and CRITICAL_INFRASTRUCTURE → no FRIA but public body warning
        expect(hasFria).toBe(false);
        expect(r.warnings.some(w => w.includes("Art 27"))).toBe(true);
      }
    }
  );
});

// ============================================================================
// C.9: ART 6(3) EXCEPTION REQUIRES BOTH CONDITIONS
// Condition 1: posesSignificantRiskOfHarm = false
// Condition 2: at least one of (a)-(d)
// Neither alone should grant the exception.
// ============================================================================

describe("C.9: Art 6(3) requires BOTH conditions", () => {
  it.each(AREA_TRIGGERS)("$area + no significant risk BUT no (a)-(d) condition → HIGH_RISK",
    ({ trigger }) => {
      const r = classifyAISystem(baseAnswers({
        ...trigger,
        posesSignificantRiskOfHarm: false,
        // No (a)-(d) conditions → exception doesn't apply
        narrowProceduralTask: false,
        improvesHumanActivity: false,
        detectsPatterns: false,
        preparatoryTask: false,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    }
  );

  it.each(AREA_TRIGGERS)("$area + significant risk = true + all (a)-(d) → HIGH_RISK (condition 1 blocks)",
    ({ area, trigger }) => {
      const r = classifyAISystem(baseAnswers({
        ...trigger,
        posesSignificantRiskOfHarm: true,
        narrowProceduralTask: true,
        improvesHumanActivity: true,
        detectsPatterns: true,
        preparatoryTask: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe(area);
    }
  );
});

// ============================================================================
// C.10: SME SIMPLIFICATIONS × HIGH-RISK AREAS × COMPANY SIZES
// ============================================================================

describe("C.10: SME simplifications for HIGH_RISK by company size", () => {
  const sizes = ["MICRO", "SMALL", "MEDIUM", "LARGE"] as const;

  const cases = sizes.flatMap(size =>
    [AREA_TRIGGERS[2]].map(at => ({ // EDUCATION as representative area
      name: `${at.area} × ${size}`,
      trigger: at.trigger,
      size,
    }))
  );

  it.each(cases)("$name → correct SME simplifications", ({ trigger, size }) => {
    const r = classifyAISystem(baseAnswers({
      ...trigger,
      companySize: size,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");

    if (size === "LARGE") {
      expect(r.smeSimplifications).toHaveLength(0);
    } else {
      expect(r.smeSimplifications.length).toBeGreaterThan(0);
      // All SMEs get sandbox and fine cap advantages
      expect(r.smeSimplifications.some(s => s.includes("sandbox"))).toBe(true);
      expect(r.smeSimplifications.some(s => s.includes("Fine cap"))).toBe(true);
    }

    if (size === "MICRO") {
      expect(r.smeSimplifications.some(s => s.includes("Microenterprise"))).toBe(true);
    }
  });
});

// ============================================================================
// C.11: PROHIBITED PRACTICES — EACH PRACTICE × EXCEPTION VARIANTS
// Verify every prohibited practice's exception path produces correct warnings
// ============================================================================

describe("C.11: Prohibited practice exception variants", () => {
  // Art 5(1)(a): manipulation with vs without significant harm
  it("Art 5(1)(a): manipulation + harm → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      usesSubliminaManipulation: true,
      manipulationCausesSignificantHarm: true,
    }));
    expect(r.classification).toBe("PROHIBITED");
    expect(r.prohibitedPractices).toContain("SUBLIMINAL_MANIPULATION");
  });

  it("Art 5(1)(a): manipulation + NO harm → NOT prohibited, grey-area warning", () => {
    const r = classifyAISystem(baseAnswers({
      usesSubliminaManipulation: true,
      manipulationCausesSignificantHarm: false,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    expect(r.warnings.some(w => w.includes("Art 5(1)(a)"))).toBe(true);
  });

  // Art 5(1)(b): vulnerability exploitation with vs without harm
  it("Art 5(1)(b): exploitation + harm → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      exploitsVulnerabilities: true,
      exploitationCausesSignificantHarm: true,
    }));
    expect(r.classification).toBe("PROHIBITED");
    expect(r.prohibitedPractices).toContain("VULNERABILITY_EXPLOITATION");
  });

  it("Art 5(1)(b): exploitation + NO harm → NOT prohibited, grey-area warning", () => {
    const r = classifyAISystem(baseAnswers({
      exploitsVulnerabilities: true,
      exploitationCausesSignificantHarm: false,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    expect(r.warnings.some(w => w.includes("Art 5(1)(b)"))).toBe(true);
  });

  // Art 5(1)(d): criminal risk profiling — 3 variants
  it("Art 5(1)(d): solely personality + no human support → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      criminalRiskProfiling: true,
      crimeProfilingBasedSolelyOnPersonality: true,
      crimeProfilingSupportingHumanAssessment: false,
    }));
    expect(r.classification).toBe("PROHIBITED");
    expect(r.prohibitedPractices).toContain("CRIMINAL_RISK_PROFILING_SOLELY");
  });

  it("Art 5(1)(d): supports human assessment → NOT prohibited, exception warning", () => {
    const r = classifyAISystem(baseAnswers({
      criminalRiskProfiling: true,
      crimeProfilingBasedSolelyOnPersonality: true,
      crimeProfilingSupportingHumanAssessment: true,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    expect(r.warnings.some(w => w.includes("Art 5(1)(d)"))).toBe(true);
  });

  it("Art 5(1)(d): NOT solely personality → NOT prohibited", () => {
    const r = classifyAISystem(baseAnswers({
      criminalRiskProfiling: true,
      crimeProfilingBasedSolelyOnPersonality: false,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
  });

  // Art 5(1)(f): workplace emotion — medical/safety exception
  it("Art 5(1)(f): workplace emotion + NOT medical → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      workplaceEmotionDetection: true,
      workplaceEmotionForMedicalSafety: false,
    }));
    expect(r.classification).toBe("PROHIBITED");
    expect(r.prohibitedPractices).toContain("WORKPLACE_EMOTION_DETECTION");
  });

  it("Art 5(1)(f): workplace emotion + medical → NOT prohibited, exception warning", () => {
    const r = classifyAISystem(baseAnswers({
      workplaceEmotionDetection: true,
      workplaceEmotionForMedicalSafety: true,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    expect(r.warnings.some(w => w.includes("Art 5(1)(f)"))).toBe(true);
  });

  // Art 5(1)(g): biometric categorisation — LE labelling exception
  it("Art 5(1)(g): sensitive biometric cat + NOT LE → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      biometricCategorisationSensitive: true,
      biometricCatForLawEnforcementLabelling: false,
    }));
    expect(r.classification).toBe("PROHIBITED");
    expect(r.prohibitedPractices).toContain("BIOMETRIC_CATEGORISATION_SENSITIVE");
  });

  it("Art 5(1)(g): sensitive biometric cat + LE labelling → NOT prohibited, exception warning", () => {
    const r = classifyAISystem(baseAnswers({
      biometricCategorisationSensitive: true,
      biometricCatForLawEnforcementLabelling: true,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    expect(r.warnings.some(w => w.includes("Art 5(1)(g)"))).toBe(true);
  });

  // Art 5(1)(h): realtime biometric — LE exception with/without judicial auth
  it("Art 5(1)(h): realtime biometric + NO LE exception → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      realtimeBiometricPublicSpaces: true,
      realtimeBiometricForLEException: false,
    }));
    expect(r.classification).toBe("PROHIBITED");
    expect(r.prohibitedPractices).toContain("REALTIME_BIOMETRIC_LAW_ENFORCEMENT");
  });

  it("Art 5(1)(h): realtime biometric + LE + judicial auth → NOT prohibited", () => {
    const r = classifyAISystem(baseAnswers({
      realtimeBiometricPublicSpaces: true,
      realtimeBiometricForLEException: true,
      realtimeBiometricHasJudicialAuth: true,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    expect(r.warnings.some(w => w.includes("Art 5(1)(h)"))).toBe(true);
  });

  it("Art 5(1)(h): realtime biometric + LE + NO judicial auth → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      realtimeBiometricPublicSpaces: true,
      realtimeBiometricForLEException: true,
      realtimeBiometricHasJudicialAuth: false,
    }));
    expect(r.classification).toBe("PROHIBITED");
    expect(r.warnings.some(w => w.toLowerCase().includes("authorization"))).toBe(true);
  });
});

// ============================================================================
// C.12: PRIORITY CHAIN — ALL POSSIBLE PRIORITY OVERRIDES
// Verify the strict ordering: Scope > Prohibited > GPAI > Safety > Annex III >
// Limited > Minimal. Higher priority always wins over lower.
// ============================================================================

describe("C.12: Classification priority chain correctness", () => {
  it("Scope exclusion beats everything", () => {
    const r = classifyAISystem(baseAnswers({
      militaryDefenceOnly: true,
      socialScoring: true,
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
      educationUseCase: true,
      interactsWithHumans: true,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.nextSteps.some(s => s.includes("OUTSIDE THE SCOPE"))).toBe(true);
  });

  it("Prohibited beats GPAI, HIGH_RISK, LIMITED", () => {
    const r = classifyAISystem(baseAnswers({
      socialScoring: true,
      isGeneralPurposeModel: true,
      educationUseCase: true,
      interactsWithHumans: true,
    }));
    expect(r.classification).toBe("PROHIBITED");
  });

  it("GPAI beats safety component, Annex III, LIMITED", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
      educationUseCase: true,
      interactsWithHumans: true,
    }));
    expect(r.classification).toBe("GPAI");
  });

  it("Safety component beats Annex III, LIMITED", () => {
    const r = classifyAISystem(baseAnswers({
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
      educationUseCase: true,
      interactsWithHumans: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
    expect(r.legalBasis).toContain("Article 6(1)");
  });

  it("Annex III beats LIMITED", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      interactsWithHumans: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
    expect(r.legalBasis).toContain("Article 6(2)");
  });

  it("LIMITED beats MINIMAL", () => {
    const r = classifyAISystem(baseAnswers({
      interactsWithHumans: true,
    }));
    expect(r.classification).toBe("LIMITED_RISK");
  });

  it("Default is MINIMAL", () => {
    const r = classifyAISystem(baseAnswers());
    expect(r.classification).toBe("MINIMAL_RISK");
  });
});
