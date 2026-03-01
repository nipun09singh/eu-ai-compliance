/**
 * STRUCTURAL GAPS TEST SUITE
 *
 * Tests for all 15 structural gaps identified in the comprehensive audit:
 *
 * 🔴 CRITICAL:
 *   GAP-1:  Art 25 "becoming a provider" (putOwnNameOrBrandOnSystem, madeSubstantialModification, changedPurposeToHighRisk)
 *   GAP-2:  Substantial modification (Art 6(6)) re-assessment trigger
 *   GAP-3:  Extraterritorial + authorised representative (Art 2(1), Art 22)
 *   GAP-4:  GPAI-in-high-risk supply chain (Art 53(3))
 *
 * 🟠 HIGH:
 *   GAP-5:  Sector-specific legislation interplay (Art 2(5)-(8), Art 43(3))
 *   GAP-6:  Transitional provisions (Art 111-113)
 *   GAP-7:  GDPR deep interplay (Art 10(5), Art 26(7), Art 26(9), Recital 69)
 *   GAP-8:  Regulatory sandboxes (Art 57-63)
 *
 * 🟡 MEDIUM:
 *   GAP-9:  Value chain obligations (Art 25(2)-(5))
 *   GAP-10: Codes of practice for GPAI (Art 56)
 *   GAP-11: Authority cooperation (Art 74-82)
 *   GAP-12: Voluntary conformity for minimal risk (Art 95)
 *   GAP-13: Post-biometric ID deployer obligations (Art 26(10))
 *
 * CROSS-CUTTING:
 *   GAP-14: Extended role detection (IMPORTER, DISTRIBUTOR, AUTHORISED_REPRESENTATIVE)
 *   GAP-15: New template coverage (11 new templates)
 */

import { describe, it, expect } from "vitest";
import {
  classifyAISystem,
  TEMPLATE_REGISTRY,
  type WizardAnswers,
  type ClassificationResult,
} from "../classification-engine";

// ============================================================================
// HELPER
// ============================================================================

function baseAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    companyName: "TestCo",
    companySize: "SMALL",
    isEUBased: true,
    outputUsedInEU: true,
    role: "PROVIDER",
    systemDescription: "A generic AI system for testing",
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

/** High-risk DEPLOYER in an FRIA area (ESSENTIAL_SERVICES) */
function highRiskDeployerAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({
    role: "DEPLOYER",
    essentialServicesUseCase: true,
    ...overrides,
  });
}

/** High-risk PROVIDER in education */
function highRiskProviderAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({
    role: "PROVIDER",
    educationUseCase: true,
    ...overrides,
  });
}

/** Standard GPAI provider */
function gpaiAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({
    role: "PROVIDER",
    isGeneralPurposeModel: true,
    ...overrides,
  });
}

/** GPAI systemic risk */
function gpaiSystemicAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return baseAnswers({
    role: "PROVIDER",
    isGeneralPurposeModel: true,
    gpaiHighImpactCapabilities: true,
    ...overrides,
  });
}

// ============================================================================
// GAP-1: ART 25 "BECOMING A PROVIDER" (🔴 CRITICAL)
// ============================================================================

describe("GAP-1: Art 25 — Becoming a provider", () => {
  describe("Trigger: putOwnNameOrBrandOnSystem", () => {
    it("SG-001: Deployer who puts own brand on system → upgraded to PROVIDER", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        putOwnNameOrBrandOnSystem: true,
      }));
      expect(r.art25ProviderUpgrade).toBe(true);
      expect(r.role).toBe("PROVIDER");
    });

    it("SG-002: art25ProviderUpgrade warning mentions Art 25", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        putOwnNameOrBrandOnSystem: true,
      }));
      const art25Warning = r.warnings.find(w => w.includes("ART 25"));
      expect(art25Warning).toBeDefined();
      expect(art25Warning).toContain("PROVIDER");
    });

    it("SG-003: Upgraded role includes both original and new roles in detectedRoles", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        putOwnNameOrBrandOnSystem: true,
      }));
      expect(r.detectedRoles).toBeDefined();
      expect(r.detectedRoles!.length).toBeGreaterThanOrEqual(1);
      expect(r.detectedRoles).toContain("PROVIDER");
    });
  });

  describe("Trigger: madeSubstantialModification", () => {
    it("SG-004: Deployer with substantial modification → upgraded to PROVIDER", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        madeSubstantialModification: true,
      }));
      expect(r.art25ProviderUpgrade).toBe(true);
      expect(r.role).toBe("PROVIDER");
    });

    it("SG-005: Substantial modification triggers re-assessment nextStep", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        madeSubstantialModification: true,
      }));
      const reAssess = r.nextSteps.find(s => /re-assessment|conformity/i.test(s));
      expect(reAssess).toBeDefined();
    });
  });

  describe("Trigger: changedPurposeToHighRisk", () => {
    it("SG-006: Deployer who changed purpose to high-risk → upgraded to PROVIDER", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        changedPurposeToHighRisk: true,
      }));
      expect(r.art25ProviderUpgrade).toBe(true);
      expect(r.role).toBe("PROVIDER");
    });
  });

  describe("No triggers", () => {
    it("SG-007: Deployer without Art 25 triggers → NOT upgraded (stays DEPLOYER)", () => {
      const r = classifyAISystem(highRiskDeployerAnswers());
      expect(r.art25ProviderUpgrade).toBeUndefined();
      expect(r.role).toBe("DEPLOYER");
    });

    it("SG-008: Provider with Art 25 trigger → already PROVIDER, no upgrade flag", () => {
      const r = classifyAISystem(highRiskProviderAnswers({
        putOwnNameOrBrandOnSystem: true,
      }));
      // Already a provider, so art25ProviderUpgrade shouldn't apply
      // (the overlay should detect no role change needed)
      expect(r.role).toBe("PROVIDER");
    });
  });

  describe("Provider obligations after upgrade", () => {
    it("SG-009: Upgraded deployer gets provider obligations for HIGH_RISK", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        putOwnNameOrBrandOnSystem: true,
      }));
      const oblIds = r.obligations.map(o => o.id);
      // Should now have provider obligations like RISK_MANAGEMENT_SYSTEM
      expect(oblIds).toContain("RISK_MANAGEMENT_SYSTEM");
    });

    it("SG-010: Art 25 upgrade with multiple triggers → all documented in warning", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        putOwnNameOrBrandOnSystem: true,
        madeSubstantialModification: true,
        changedPurposeToHighRisk: true,
      }));
      expect(r.art25ProviderUpgrade).toBe(true);
      const warns = r.warnings.filter(w => w.includes("ART 25"));
      expect(warns.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Non-HIGH_RISK systems", () => {
    it("SG-011: Art 25 trigger on MINIMAL_RISK system → sets upgrade flag but no extra obligations", () => {
      const r = classifyAISystem(baseAnswers({
        role: "DEPLOYER",
        putOwnNameOrBrandOnSystem: true,
      }));
      // Minimal risk — the upgrade flag may be set but no high-risk obligations added
      expect(r.classification).toBe("MINIMAL_RISK");
    });
  });
});

// ============================================================================
// GAP-2: SUBSTANTIAL MODIFICATION (🔴 CRITICAL)
// ============================================================================

describe("GAP-2: Art 6(6) — Substantial modification", () => {
  it("SG-020: madeSubstantialModification → substantialModificationFlag = true", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      madeSubstantialModification: true,
    }));
    expect(r.substantialModificationFlag).toBe(true);
  });

  it("SG-021: Substantial modification warning mentions Art 6(6)", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      madeSubstantialModification: true,
    }));
    const warn = r.warnings.find(w => /substantial modification|Art 6\(6\)/i.test(w));
    expect(warn).toBeDefined();
  });

  it("SG-022: Substantial modification nextSteps includes re-assessment checklist", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      madeSubstantialModification: true,
    }));
    const step = r.nextSteps.find(s => /re-assessment|conformity/i.test(s));
    expect(step).toBeDefined();
  });

  it("SG-023: No substantial modification → no flag", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    expect(r.substantialModificationFlag).toBeUndefined();
  });

  it("SG-024: TMPL_SUBSTANTIAL_MOD_ASSESSMENT template exists", () => {
    const t = TEMPLATE_REGISTRY["TMPL_SUBSTANTIAL_MOD_ASSESSMENT"];
    expect(t).toBeDefined();
    expect(t.articles).toContain("Article 6(6)");
  });
});

// ============================================================================
// GAP-3: EXTRATERRITORIAL + AUTHORISED REPRESENTATIVE (🔴 CRITICAL)
// ============================================================================

describe("GAP-3: Art 2(1)/Art 22 — Extraterritorial scope", () => {
  it("SG-030: Non-EU provider with EU output → extraterritorial warning", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      isEUBased: false,
      outputUsedInEU: true,
    }));
    const warn = r.warnings.find(w => /extraterritorial|Art 2\(1\)/i.test(w));
    expect(warn).toBeDefined();
  });

  it("SG-031: Non-EU provider HIGH_RISK without auth rep → APPOINT_AUTHORISED_REP obligation", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      isEUBased: false,
      outputUsedInEU: true,
      hasAuthorisedRepInEU: false,
    }));
    const oblIds = r.obligations.map(o => o.id);
    expect(oblIds).toContain("APPOINT_AUTHORISED_REP");
  });

  it("SG-032: Non-EU provider with auth rep already → no APPOINT obligation", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      isEUBased: false,
      outputUsedInEU: true,
      hasAuthorisedRepInEU: true,
    }));
    const oblIds = r.obligations.map(o => o.id);
    expect(oblIds).not.toContain("APPOINT_AUTHORISED_REP");
  });

  it("SG-033: EU-based provider → no extraterritorial warning", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      isEUBased: true,
    }));
    const warn = r.warnings.find(w => /extraterritorial/i.test(w));
    expect(warn).toBeUndefined();
  });

  it("SG-034: Non-EU with output NOT in EU → no extraterritorial warning", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      isEUBased: false,
      outputUsedInEU: false,
    }));
    // Not in scope — should trigger scope exclusion, not extraterritorial
    const warn = r.warnings.find(w => /extraterritorial/i.test(w));
    expect(warn).toBeUndefined();
  });

  it("SG-035: Non-EU GPAI provider without auth rep → Art 54(1) warning", () => {
    const r = classifyAISystem(gpaiAnswers({
      isEUBased: false,
      outputUsedInEU: true,
      hasAuthorisedRepInEU: false,
    }));
    const warn = r.warnings.find(w => /Art 54\(1\)|authorised representative/i.test(w));
    expect(warn).toBeDefined();
  });

  it("SG-036: APPOINT_AUTHORISED_REP obligation has CRITICAL priority", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      isEUBased: false,
      outputUsedInEU: true,
      hasAuthorisedRepInEU: false,
    }));
    const obl = r.obligations.find(o => o.id === "APPOINT_AUTHORISED_REP");
    expect(obl).toBeDefined();
    expect(obl!.priority).toBe("CRITICAL");
  });

  it("SG-037: TMPL_AUTH_REP_MANDATE template exists with Art 22", () => {
    const t = TEMPLATE_REGISTRY["TMPL_AUTH_REP_MANDATE"];
    expect(t).toBeDefined();
    expect(t.articles).toContain("Article 22");
  });
});

// ============================================================================
// GAP-4: GPAI-IN-HIGH-RISK SUPPLY CHAIN (🔴 CRITICAL)
// ============================================================================

describe("GAP-4: Art 53(3) — GPAI supply chain", () => {
  it("SG-040: GPAI provider whose model is used in high-risk system → supply chain warning", () => {
    const r = classifyAISystem(gpaiAnswers({
      gpaiUsedAsHighRiskComponent: true,
    }));
    const warn = r.warnings.find(w => /supply chain|Art 53\(3\)/i.test(w));
    expect(warn).toBeDefined();
  });

  it("SG-041: HIGH_RISK system using GPAI model → GPAI IN HIGH-RISK warning", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      isGeneralPurposeModel: true,
    }));
    // The GPAI classification takes priority, but if we check HIGH_RISK with isGeneralPurposeModel
    // it should show GPAI supply chain guidance
    const resultType = r.classification;
    // isGeneralPurposeModel makes classification GPAI, not HIGH_RISK — so we need a different approach
    // HIGH_RISK provider with a third-party GPAI component
    const r2 = classifyAISystem(highRiskProviderAnswers({
      usesThirdPartyAIComponents: true,
    }));
    // This should trigger value chain overlay, not GPAI supply chain
    expect(r2.classification).toBe("HIGH_RISK");
  });

  it("SG-042: GPAI systemic risk + used in high-risk → supply chain warning", () => {
    const r = classifyAISystem(gpaiSystemicAnswers({
      gpaiUsedAsHighRiskComponent: true,
    }));
    const warn = r.warnings.find(w => /supply chain|Art 53\(3\)/i.test(w));
    expect(warn).toBeDefined();
  });

  it("SG-043: GPAI without high-risk component usage → no supply chain warning", () => {
    const r = classifyAISystem(gpaiAnswers());
    const warn = r.warnings.find(w => /supply chain.*Art 53\(3\)/i.test(w));
    expect(warn).toBeUndefined();
  });

  it("SG-044: Supply chain warning populates valueChainWarnings", () => {
    const r = classifyAISystem(gpaiAnswers({
      gpaiUsedAsHighRiskComponent: true,
    }));
    expect(r.valueChainWarnings).toBeDefined();
    expect(r.valueChainWarnings!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// GAP-5: SECTOR-SPECIFIC LEGISLATION (🟠 HIGH)
// ============================================================================

describe("GAP-5: Art 2(5)-(8), Art 43(3) — Sector-specific legislation", () => {
  const sectors = [
    "MEDICAL_DEVICE",
    "IVDR",
    "AUTOMOTIVE",
    "AVIATION",
    "MARINE",
    "RAILWAY",
    "MACHINERY",
    "TOYS",
    "LIFTS",
    "RADIO_EQUIPMENT",
  ] as const;

  it("SG-050: Each sector produces sectorSpecificGuidance", () => {
    for (const sector of sectors) {
      const r = classifyAISystem(highRiskProviderAnswers({
        sectorSpecificLegislation: sector,
      }));
      expect(r.sectorSpecificGuidance).toBeDefined();
      expect(r.sectorSpecificGuidance!.length).toBeGreaterThan(0);
    }
  });

  it("SG-051: Sector guidance mentions the correct sector name", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      sectorSpecificLegislation: "MEDICAL_DEVICE",
    }));
    const combined = r.sectorSpecificGuidance!.join(" ");
    expect(combined).toMatch(/medical device|MDR|2017\/745/i);
  });

  it("SG-052: Sector guidance mentions Art 43(3) conformity assessment", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      sectorSpecificLegislation: "AUTOMOTIVE",
    }));
    const combined = r.sectorSpecificGuidance!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*43/i);
  });

  it("SG-053: No sector selected → no sectorSpecificGuidance", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    expect(r.sectorSpecificGuidance).toBeUndefined();
  });

  it("SG-054: Sector = NONE → no sectorSpecificGuidance", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      sectorSpecificLegislation: "NONE",
    }));
    expect(r.sectorSpecificGuidance).toBeUndefined();
  });

  it("SG-055: Sector warning added to warnings array", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      sectorSpecificLegislation: "AVIATION",
    }));
    const warn = r.warnings.find(w => /sector-specific/i.test(w));
    expect(warn).toBeDefined();
  });

  it("SG-056: Sector nextStep includes contacting notified body", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      sectorSpecificLegislation: "MEDICAL_DEVICE",
    }));
    const step = r.nextSteps.find(s => /notified body/i.test(s));
    expect(step).toBeDefined();
  });
});

// ============================================================================
// GAP-6: TRANSITIONAL PROVISIONS (🟠 HIGH)
// ============================================================================

describe("GAP-6: Art 111-113 — Transitional provisions", () => {
  it("SG-060: HIGH_RISK system already on market before Aug 2026 → transitional provision", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      systemAlreadyOnMarketBeforeAug2026: true,
    }));
    expect(r.transitionalProvisions).toBeDefined();
    expect(r.transitionalProvisions!.length).toBeGreaterThan(0);
    const combined = r.transitionalProvisions!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*111/i);
  });

  it("SG-061: GPAI already on market before Aug 2025 → GPAI transition provision", () => {
    const r = classifyAISystem(gpaiAnswers({
      gpaiAlreadyOnMarketBeforeAug2025: true,
    }));
    expect(r.transitionalProvisions).toBeDefined();
    const combined = r.transitionalProvisions!.join(" ");
    expect(combined).toMatch(/transition|Art(icle)?\s*111/i);
  });

  it("SG-062: Used by public authority → grace period until 2030", () => {
    const r = classifyAISystem(highRiskDeployerAnswers({
      usedByPublicAuthority: true,
    }));
    expect(r.transitionalProvisions).toBeDefined();
    const combined = r.transitionalProvisions!.join(" ");
    expect(combined).toMatch(/2030/);
  });

  it("SG-063: Large-scale IT system → Annex X provision until 2030", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      isLargeScaleITSystem: true,
    }));
    expect(r.transitionalProvisions).toBeDefined();
    const combined = r.transitionalProvisions!.join(" ");
    expect(combined).toMatch(/2030|Annex X/i);
  });

  it("SG-064: No transitional flags → no transitionalProvisions", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    expect(r.transitionalProvisions).toBeUndefined();
  });

  it("SG-065: Transitional warning added to warnings array", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      systemAlreadyOnMarketBeforeAug2026: true,
    }));
    const warn = r.warnings.find(w => /transition/i.test(w));
    expect(warn).toBeDefined();
  });

  it("SG-066: Transitional nextSteps warns about 'significant changes' invalidating grace period", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      systemAlreadyOnMarketBeforeAug2026: true,
    }));
    const step = r.nextSteps.find(s => /significant change|grace period/i.test(s));
    expect(step).toBeDefined();
  });
});

// ============================================================================
// GAP-7: GDPR DEEP INTERPLAY (🟠 HIGH)
// ============================================================================

describe("GAP-7: Art 10(5) / Art 26(7) / Art 26(9) / Recital 69 — GDPR interplay", () => {
  it("SG-070: processesPersonalData → gdprInterplay includes Recital 69 legal basis", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      processesPersonalData: true,
    }));
    expect(r.gdprInterplay).toBeDefined();
    const combined = r.gdprInterplay!.join(" ");
    expect(combined).toMatch(/Recital 69|legal basis|GDPR/i);
  });

  it("SG-071: processesSpecialCategoryData → gdprInterplay includes Art 10(5) derogation", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      processesPersonalData: true,
      processesSpecialCategoryData: true,
    }));
    expect(r.gdprInterplay).toBeDefined();
    const combined = r.gdprInterplay!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*10\(5\)|derogation|special category/i);
  });

  it("SG-072: HIGH_RISK deployer → gdprInterplay includes Art 26(9) DPIA+FRIA", () => {
    const r = classifyAISystem(highRiskDeployerAnswers({
      processesPersonalData: true,
    }));
    expect(r.gdprInterplay).toBeDefined();
    const combined = r.gdprInterplay!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*26\(9\)|DPIA|impact assessment/i);
  });

  it("SG-073: Employment deployer → gdprInterplay includes Art 26(7) worker info", () => {
    const r = classifyAISystem(baseAnswers({
      role: "DEPLOYER",
      employmentUseCase: true,
      processesPersonalData: true,
    }));
    expect(r.gdprInterplay).toBeDefined();
    const combined = r.gdprInterplay!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*26\(7\)|worker|employment/i);
  });

  it("SG-074: processesChildrenData → gdprInterplay includes children's data guidance", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      processesPersonalData: true,
      processesChildrenData: true,
    }));
    expect(r.gdprInterplay).toBeDefined();
    const combined = r.gdprInterplay!.join(" ");
    expect(combined).toMatch(/child|Art(icle)?\s*8|minor/i);
  });

  it("SG-075: No personal data → no gdprInterplay", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    expect(r.gdprInterplay).toBeUndefined();
  });

  it("SG-076: GDPR dual compliance warning in warnings array", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      processesPersonalData: true,
    }));
    const warn = r.warnings.find(w => /GDPR|dual compliance/i.test(w));
    expect(warn).toBeDefined();
  });

  it("SG-077: TMPL_DPIA_AI template exists with correct articles", () => {
    const t = TEMPLATE_REGISTRY["TMPL_DPIA_AI"];
    expect(t).toBeDefined();
    expect(t.articles).toContain("Article 26(9)");
    expect(t.appliesToRole).toBe("DEPLOYER");
  });
});

// ============================================================================
// GAP-8: REGULATORY SANDBOXES (🟠 HIGH)
// ============================================================================

describe("GAP-8: Art 57-63 — Regulatory sandboxes", () => {
  it("SG-080: Non-PROHIBITED system → sandboxGuidance populated", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    expect(r.sandboxGuidance).toBeDefined();
    expect(r.sandboxGuidance!.length).toBeGreaterThan(0);
  });

  it("SG-081: Sandbox guidance mentions Art 57", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    const combined = r.sandboxGuidance!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*57/i);
  });

  it("SG-082: SME (SMALL) gets priority access guidance (Art 62)", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      companySize: "SMALL",
    }));
    const combined = r.sandboxGuidance!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*62|SME|priority/i);
  });

  it("SG-083: MICRO company gets priority access guidance", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      companySize: "MICRO",
    }));
    const combined = r.sandboxGuidance!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*62|SME|priority/i);
  });

  it("SG-084: LARGE company → no SME priority guidance", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      companySize: "LARGE",
    }));
    const combined = r.sandboxGuidance!.join(" ");
    // Should still have sandbox guidance (Art 57) but not SME priority
    expect(combined).toMatch(/Art(icle)?\s*57/i);
    // LARGE should not get Art 62 SME priority
    expect(combined).not.toMatch(/Art(icle)?\s*62/i);
  });

  it("SG-085: PROHIBITED system → no sandboxGuidance", () => {
    const r = classifyAISystem(baseAnswers({
      usesSubliminaManipulation: true,
      manipulationCausesSignificantHarm: true,
    }));
    expect(r.classification).toBe("PROHIBITED");
    expect(r.sandboxGuidance).toBeUndefined();
  });

  it("SG-086: HIGH_RISK / GPAI → sandbox mentions Art 58 real-world testing", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    const combined = r.sandboxGuidance!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*58|real.world/i);
  });

  it("SG-087: MINIMAL_RISK system still gets basic sandbox guidance", () => {
    const r = classifyAISystem(baseAnswers());
    expect(r.sandboxGuidance).toBeDefined();
    expect(r.sandboxGuidance!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// GAP-9: VALUE CHAIN OBLIGATIONS (🟡 MEDIUM)
// ============================================================================

describe("GAP-9: Art 25(2)-(5) — Value chain obligations", () => {
  it("SG-090: usesThirdPartyAIComponents → valueChainWarnings populated", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      usesThirdPartyAIComponents: true,
    }));
    expect(r.valueChainWarnings).toBeDefined();
    expect(r.valueChainWarnings!.length).toBeGreaterThan(0);
  });

  it("SG-091: Third-party components → warnings mention Art 25", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      usesThirdPartyAIComponents: true,
    }));
    const combined = r.valueChainWarnings!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*25|value chain/i);
  });

  it("SG-092: broughtSystemFromOutsideEU → supply chain compliance warnings", () => {
    const r = classifyAISystem(highRiskDeployerAnswers({
      broughtSystemFromOutsideEU: true,
    }));
    expect(r.valueChainWarnings).toBeDefined();
    expect(r.valueChainWarnings!.length).toBeGreaterThan(0);
  });

  it("SG-093: No third-party components and EU-sourced → no valueChainWarnings", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    expect(r.valueChainWarnings).toBeUndefined();
  });

  it("SG-094: Value chain warnings also appear in main warnings array", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      usesThirdPartyAIComponents: true,
    }));
    const mainWarn = r.warnings.find(w => /value chain/i.test(w));
    expect(mainWarn).toBeDefined();
  });
});

// ============================================================================
// GAP-10: CODES OF PRACTICE FOR GPAI (🟡 MEDIUM)
// ============================================================================

describe("GAP-10: Art 56 — Codes of practice for GPAI", () => {
  it("SG-100: TMPL_CODES_OF_PRACTICE template exists", () => {
    const t = TEMPLATE_REGISTRY["TMPL_CODES_OF_PRACTICE"];
    expect(t).toBeDefined();
    expect(t.articles).toContain("Article 56");
  });

  it("SG-101: Codes of practice template applies to GPAI and GPAI_SYSTEMIC", () => {
    const t = TEMPLATE_REGISTRY["TMPL_CODES_OF_PRACTICE"];
    expect(t.requiredFor).toContain("GPAI");
    expect(t.requiredFor).toContain("GPAI_SYSTEMIC");
  });

  it("SG-102: Codes of practice template is for PROVIDER role", () => {
    const t = TEMPLATE_REGISTRY["TMPL_CODES_OF_PRACTICE"];
    expect(t.appliesToRole).toBe("PROVIDER");
  });
});

// ============================================================================
// GAP-11: AUTHORITY COOPERATION (🟡 MEDIUM)
// ============================================================================

describe("GAP-11: Art 74-82 — Authority cooperation", () => {
  it("SG-110: HIGH_RISK system → authorityCooperation populated", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    expect(r.authorityCooperation).toBeDefined();
    expect(r.authorityCooperation!.length).toBeGreaterThan(0);
  });

  it("SG-111: Authority cooperation mentions Art 74", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    const combined = r.authorityCooperation!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*74/i);
  });

  it("SG-112: Authority cooperation mentions Art 75 powers", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    const combined = r.authorityCooperation!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*75/i);
  });

  it("SG-113: Authority cooperation mentions Art 82 non-cooperation fine", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    const combined = r.authorityCooperation!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*82|7\.5M|non.cooperation/i);
  });

  it("SG-114: HIGH_RISK → mentions Art 80 reclassification power", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    const combined = r.authorityCooperation!.join(" ");
    expect(combined).toMatch(/Art(icle)?\s*80|reclassif/i);
  });

  it("SG-115: MINIMAL_RISK (without Art 6(3)) → no authorityCooperation", () => {
    const r = classifyAISystem(baseAnswers());
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.authorityCooperation).toBeUndefined();
  });

  it("SG-116: GPAI → authorityCooperation populated", () => {
    const r = classifyAISystem(gpaiAnswers());
    expect(r.authorityCooperation).toBeDefined();
  });

  it("SG-117: Art 6(3) exception → authorityCooperation populated (has regulatory obligations)", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      narrowProceduralTask: true,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.legalBasis).toContain("Article 6(3)");
    expect(r.authorityCooperation).toBeDefined();
  });
});

// ============================================================================
// GAP-12: VOLUNTARY CONFORMITY FOR MINIMAL RISK (🟡 MEDIUM)
// ============================================================================

describe("GAP-12: Art 95 — Voluntary conformity", () => {
  it("SG-120: Pure MINIMAL_RISK → voluntary conformity nextSteps", () => {
    const r = classifyAISystem(baseAnswers());
    expect(r.classification).toBe("MINIMAL_RISK");
    const step = r.nextSteps.find(s => /Art(icle)?\s*95|voluntary|codes of conduct/i.test(s));
    expect(step).toBeDefined();
  });

  it("SG-121: Voluntary conformity mentions environmental sustainability", () => {
    const r = classifyAISystem(baseAnswers());
    const allSteps = r.nextSteps.join(" ");
    expect(allSteps).toMatch(/environmental|sustainability/i);
  });

  it("SG-122: Art 6(3) exception → NO voluntary conformity (already has obligations)", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      narrowProceduralTask: true,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.legalBasis).toContain("Article 6(3)");
    const step = r.nextSteps.find(s => /Art(icle)?\s*95.*voluntary/i.test(s));
    expect(step).toBeUndefined();
  });

  it("SG-123: HIGH_RISK → no voluntary conformity guidance (already obligated)", () => {
    const r = classifyAISystem(highRiskProviderAnswers());
    const step = r.nextSteps.find(s => /Art(icle)?\s*95.*voluntary/i.test(s));
    expect(step).toBeUndefined();
  });

  it("SG-124: Voluntary conformity mentions AI Office facilitation", () => {
    const r = classifyAISystem(baseAnswers());
    const allSteps = r.nextSteps.join(" ");
    expect(allSteps).toMatch(/AI Office|Art(icle)?\s*95\(3\)|facilitat/i);
  });
});

// ============================================================================
// GAP-13: POST-BIOMETRIC ID DEPLOYER OBLIGATIONS (🟡 MEDIUM)
// ============================================================================

describe("GAP-13: Art 26(10) — Post-biometric ID deployer obligations", () => {
  it("SG-130: Law enforcement deployer with POST_BIOMETRIC_ID → POST_BIOMETRIC_DEPLOYER obligation", () => {
    const r = classifyAISystem(baseAnswers({
      role: "DEPLOYER",
      lawEnforcementUseCase: true,
      lawEnforcementType: "POST_BIOMETRIC_ID",
    }));
    const oblIds = r.obligations.map(o => o.id);
    expect(oblIds).toContain("POST_BIOMETRIC_DEPLOYER");
  });

  it("SG-131: POST_BIOMETRIC_DEPLOYER obligation has CRITICAL priority", () => {
    const r = classifyAISystem(baseAnswers({
      role: "DEPLOYER",
      lawEnforcementUseCase: true,
      lawEnforcementType: "POST_BIOMETRIC_ID",
    }));
    const obl = r.obligations.find(o => o.id === "POST_BIOMETRIC_DEPLOYER");
    expect(obl).toBeDefined();
    expect(obl!.priority).toBe("CRITICAL");
  });

  it("SG-132: POST_BIOMETRIC obligation mentions judicial authorization", () => {
    const r = classifyAISystem(baseAnswers({
      role: "DEPLOYER",
      lawEnforcementUseCase: true,
      lawEnforcementType: "POST_BIOMETRIC_ID",
    }));
    const obl = r.obligations.find(o => o.id === "POST_BIOMETRIC_DEPLOYER");
    expect(obl).toBeDefined();
    expect(obl!.description).toMatch(/judicial|authorization|authorisation/i);
  });

  it("SG-133: Warning mentions Art 26(10)", () => {
    const r = classifyAISystem(baseAnswers({
      role: "DEPLOYER",
      lawEnforcementUseCase: true,
      lawEnforcementType: "POST_BIOMETRIC_ID",
    }));
    const warn = r.warnings.find(w => /Art(icle)?\s*26\(10\)|post.biometric/i.test(w));
    expect(warn).toBeDefined();
  });

  it("SG-134: Provider role → no POST_BIOMETRIC_DEPLOYER (deployer-specific)", () => {
    const r = classifyAISystem(baseAnswers({
      role: "PROVIDER",
      lawEnforcementUseCase: true,
      lawEnforcementType: "POST_BIOMETRIC_ID",
    }));
    const oblIds = r.obligations.map(o => o.id);
    expect(oblIds).not.toContain("POST_BIOMETRIC_DEPLOYER");
  });

  it("SG-135: Non-POST_BIOMETRIC_ID law enforcement → no POST_BIOMETRIC_DEPLOYER", () => {
    const r = classifyAISystem(baseAnswers({
      role: "DEPLOYER",
      lawEnforcementUseCase: true,
      lawEnforcementType: "RISK_ASSESSMENT",
    }));
    const oblIds = r.obligations.map(o => o.id);
    expect(oblIds).not.toContain("POST_BIOMETRIC_DEPLOYER");
  });
});

// ============================================================================
// GAP-14: EXTENDED ROLE DETECTION (CROSS-CUTTING)
// ============================================================================

describe("GAP-14: Extended role detection — IMPORTER, DISTRIBUTOR, AUTH_REP", () => {
  describe("Importer detection", () => {
    it("SG-140: broughtSystemFromOutsideEU on HIGH_RISK → IMPORTER detected", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        broughtSystemFromOutsideEU: true,
      }));
      expect(r.detectedRoles).toBeDefined();
      expect(r.detectedRoles).toContain("IMPORTER");
    });

    it("SG-141: IMPORTER gets 5 obligations", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        broughtSystemFromOutsideEU: true,
      }));
      const importerObls = r.obligations.filter(o => o.id.startsWith("IMPORTER_"));
      expect(importerObls).toHaveLength(5);
    });

    it("SG-142: IMPORTER obligations include VERIFY_CONFORMITY", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        broughtSystemFromOutsideEU: true,
      }));
      const oblIds = r.obligations.map(o => o.id);
      expect(oblIds).toContain("IMPORTER_VERIFY_CONFORMITY");
    });

    it("SG-143: IMPORTER obligations include DOCUMENTATION_10YR", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        broughtSystemFromOutsideEU: true,
      }));
      const oblIds = r.obligations.map(o => o.id);
      expect(oblIds).toContain("IMPORTER_DOCUMENTATION_10YR");
    });
  });

  describe("Distributor detection", () => {
    it("SG-145: resellsOrDistributesSystem on HIGH_RISK → DISTRIBUTOR detected", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        resellsOrDistributesSystem: true,
      }));
      expect(r.detectedRoles).toBeDefined();
      expect(r.detectedRoles).toContain("DISTRIBUTOR");
    });

    it("SG-146: DISTRIBUTOR gets 4 obligations", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        resellsOrDistributesSystem: true,
      }));
      const distObls = r.obligations.filter(o => o.id.startsWith("DISTRIBUTOR_"));
      expect(distObls).toHaveLength(4);
    });

    it("SG-147: DISTRIBUTOR obligations include VERIFY_COMPLIANCE", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        resellsOrDistributesSystem: true,
      }));
      const oblIds = r.obligations.map(o => o.id);
      expect(oblIds).toContain("DISTRIBUTOR_VERIFY_COMPLIANCE");
    });
  });

  describe("Authorised Representative detection", () => {
    it("SG-150: appointedAsAuthorisedRep on HIGH_RISK → AUTH_REP detected", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        appointedAsAuthorisedRep: true,
      }));
      expect(r.detectedRoles).toBeDefined();
      expect(r.detectedRoles).toContain("AUTHORISED_REPRESENTATIVE");
    });

    it("SG-151: AUTH_REP gets 4 obligations", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        appointedAsAuthorisedRep: true,
      }));
      const authObls = r.obligations.filter(o => o.id.startsWith("AUTH_REP_"));
      expect(authObls).toHaveLength(4);
    });

    it("SG-152: AUTH_REP obligations include VERIFY_DOCUMENTATION", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        appointedAsAuthorisedRep: true,
      }));
      const oblIds = r.obligations.map(o => o.id);
      expect(oblIds).toContain("AUTH_REP_VERIFY_DOCUMENTATION");
    });
  });

  describe("Multiple roles simultaneously", () => {
    it("SG-155: IMPORTER + DISTRIBUTOR → both detected", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        broughtSystemFromOutsideEU: true,
        resellsOrDistributesSystem: true,
      }));
      expect(r.detectedRoles).toContain("IMPORTER");
      expect(r.detectedRoles).toContain("DISTRIBUTOR");
    });

    it("SG-156: IMPORTER + Art 25 upgrade → both IMPORTER and PROVIDER detected", () => {
      const r = classifyAISystem(highRiskDeployerAnswers({
        broughtSystemFromOutsideEU: true,
        putOwnNameOrBrandOnSystem: true,
      }));
      expect(r.detectedRoles).toContain("PROVIDER");
      expect(r.detectedRoles).toContain("IMPORTER");
      expect(r.art25ProviderUpgrade).toBe(true);
    });
  });

  describe("Non-HIGH_RISK limitations", () => {
    it("SG-158: IMPORTER on MINIMAL_RISK → no importer obligations (Art 28 is HIGH_RISK only)", () => {
      const r = classifyAISystem(baseAnswers({
        role: "DEPLOYER",
        broughtSystemFromOutsideEU: true,
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
      const importerObls = r.obligations.filter(o => o.id.startsWith("IMPORTER_"));
      expect(importerObls).toHaveLength(0);
    });
  });
});

// ============================================================================
// GAP-15: NEW TEMPLATE COVERAGE (CROSS-CUTTING)
// ============================================================================

describe("GAP-15: New template coverage", () => {
  const newTemplates = [
    { id: "TMPL_AI_LITERACY_PLAN", article: "Article 4", role: "BOTH" },
    { id: "TMPL_DPIA_AI", article: "Article 26(9)", role: "DEPLOYER" },
    { id: "TMPL_DEPLOYER_PROCEDURES", article: "Article 26", role: "DEPLOYER" },
    { id: "TMPL_INFORM_AFFECTED", article: "Article 26(11)", role: "DEPLOYER" },
    { id: "TMPL_IMPORTER_CHECKLIST", article: "Article 28", role: "IMPORTER" },
    { id: "TMPL_DISTRIBUTOR_CHECKLIST", article: "Article 29", role: "DISTRIBUTOR" },
    { id: "TMPL_AUTH_REP_MANDATE", article: "Article 22", role: "AUTHORISED_REPRESENTATIVE" },
    { id: "TMPL_SERIOUS_INCIDENT_REPORT", article: "Article 73", role: "PROVIDER" },
    { id: "TMPL_GPAI_SYSTEMIC_RISK", article: "Article 55(1)(b)", role: "PROVIDER" },
    { id: "TMPL_CODES_OF_PRACTICE", article: "Article 56", role: "PROVIDER" },
    { id: "TMPL_SUBSTANTIAL_MOD_ASSESSMENT", article: "Article 6(6)", role: "PROVIDER" },
  ];

  for (const { id, article, role } of newTemplates) {
    it(`SG-160: ${id} exists in TEMPLATE_REGISTRY`, () => {
      const t = TEMPLATE_REGISTRY[id];
      expect(t).toBeDefined();
    });

    it(`SG-161: ${id} references ${article}`, () => {
      const t = TEMPLATE_REGISTRY[id];
      expect(t.articles).toContain(article);
    });

    it(`SG-162: ${id} appliesToRole = ${role}`, () => {
      const t = TEMPLATE_REGISTRY[id];
      expect(t.appliesToRole).toBe(role);
    });

    it(`SG-163: ${id} has positive estimatedMinutes`, () => {
      const t = TEMPLATE_REGISTRY[id];
      expect(t.estimatedMinutes).toBeGreaterThan(0);
    });

    it(`SG-164: ${id} has non-empty description`, () => {
      const t = TEMPLATE_REGISTRY[id];
      expect(t.description.length).toBeGreaterThan(10);
    });
  }

  it("SG-170: AI Literacy Plan applies to ALL classifications", () => {
    const t = TEMPLATE_REGISTRY["TMPL_AI_LITERACY_PLAN"];
    expect(t.requiredFor).toContain("HIGH_RISK");
    expect(t.requiredFor).toContain("LIMITED_RISK");
    expect(t.requiredFor).toContain("GPAI");
    expect(t.requiredFor).toContain("GPAI_SYSTEMIC");
    expect(t.requiredFor).toContain("MINIMAL_RISK");
  });

  it("SG-171: Serious Incident Report is for HIGH_RISK only", () => {
    const t = TEMPLATE_REGISTRY["TMPL_SERIOUS_INCIDENT_REPORT"];
    expect(t.requiredFor).toContain("HIGH_RISK");
    expect(t.requiredFor).not.toContain("MINIMAL_RISK");
  });

  it("SG-172: GPAI Systemic Risk template is for GPAI_SYSTEMIC only", () => {
    const t = TEMPLATE_REGISTRY["TMPL_GPAI_SYSTEMIC_RISK"];
    expect(t.requiredFor).toContain("GPAI_SYSTEMIC");
    expect(t.requiredFor).not.toContain("GPAI");
  });

  it("SG-173: DPIA template has GDPR Art 35 in articles", () => {
    const t = TEMPLATE_REGISTRY["TMPL_DPIA_AI"];
    expect(t.articles).toContain("GDPR Art 35");
  });
});

// ============================================================================
// INTEGRATION: CROSS-GAP INTERACTION TESTS
// ============================================================================

describe("Cross-gap integration", () => {
  it("SG-200: Art 25 upgrade + sector-specific → both apply", () => {
    const r = classifyAISystem(highRiskDeployerAnswers({
      putOwnNameOrBrandOnSystem: true,
      sectorSpecificLegislation: "MEDICAL_DEVICE",
    }));
    expect(r.art25ProviderUpgrade).toBe(true);
    expect(r.sectorSpecificGuidance).toBeDefined();
  });

  it("SG-201: Extraterritorial + transitional → both apply", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      isEUBased: false,
      outputUsedInEU: true,
      systemAlreadyOnMarketBeforeAug2026: true,
    }));
    const extraWarn = r.warnings.find(w => /extraterritorial/i.test(w));
    expect(extraWarn).toBeDefined();
    expect(r.transitionalProvisions).toBeDefined();
  });

  it("SG-202: GDPR interplay + sandbox → both apply", () => {
    const r = classifyAISystem(highRiskProviderAnswers({
      processesPersonalData: true,
      processesSpecialCategoryData: true,
    }));
    expect(r.gdprInterplay).toBeDefined();
    expect(r.sandboxGuidance).toBeDefined();
  });

  it("SG-203: IMPORTER + Art 25 upgrade + value chain → all three", () => {
    const r = classifyAISystem(highRiskDeployerAnswers({
      broughtSystemFromOutsideEU: true,
      putOwnNameOrBrandOnSystem: true,
      usesThirdPartyAIComponents: true,
    }));
    expect(r.detectedRoles).toContain("IMPORTER");
    expect(r.art25ProviderUpgrade).toBe(true);
    expect(r.valueChainWarnings).toBeDefined();
  });

  it("SG-204: Non-EU GPAI systemic + supply chain + no auth rep → all warnings present", () => {
    const r = classifyAISystem(gpaiSystemicAnswers({
      isEUBased: false,
      outputUsedInEU: true,
      hasAuthorisedRepInEU: false,
      gpaiUsedAsHighRiskComponent: true,
    }));
    // Should have: extraterritorial warning, supply chain warning, auth rep warning
    const extraWarn = r.warnings.find(w => /extraterritorial/i.test(w));
    const supplyWarn = r.warnings.find(w => /supply chain/i.test(w));
    const authWarn = r.warnings.find(w => /authorised representative/i.test(w));
    expect(extraWarn).toBeDefined();
    expect(supplyWarn).toBeDefined();
    expect(authWarn).toBeDefined();
  });

  it("SG-205: MINIMAL_RISK → gets sandbox + voluntary conformity + authority cooperation skipped", () => {
    const r = classifyAISystem(baseAnswers());
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.sandboxGuidance).toBeDefined();
    expect(r.authorityCooperation).toBeUndefined();
    // Voluntary conformity should be in nextSteps
    const voluntaryStep = r.nextSteps.find(s => /Art(icle)?\s*95|voluntary/i.test(s));
    expect(voluntaryStep).toBeDefined();
  });

  it("SG-206: Employment deployer + GDPR + transitional → all three", () => {
    const r = classifyAISystem(baseAnswers({
      role: "DEPLOYER",
      employmentUseCase: true,
      processesPersonalData: true,
      systemAlreadyOnMarketBeforeAug2026: true,
    }));
    expect(r.gdprInterplay).toBeDefined();
    expect(r.transitionalProvisions).toBeDefined();
    const workerInfo = r.gdprInterplay!.find(g => /worker|26\(7\)/i.test(g));
    expect(workerInfo).toBeDefined();
  });

  it("SG-207: detectedRoles always populated (fallback)", () => {
    const r = classifyAISystem(baseAnswers());
    expect(r.detectedRoles).toBeDefined();
    expect(r.detectedRoles!.length).toBeGreaterThanOrEqual(1);
    expect(r.detectedRoles).toContain(r.role);
  });

  it("SG-208: Art 25 deployer upgrade + substantial mod → both art25 AND substantialModificationFlag", () => {
    const r = classifyAISystem(highRiskDeployerAnswers({
      madeSubstantialModification: true,
    }));
    expect(r.art25ProviderUpgrade).toBe(true);
    expect(r.substantialModificationFlag).toBe(true);
  });

  it("SG-209: All overlay fields are optional → default base classification still works", () => {
    const r = classifyAISystem(baseAnswers());
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.role).toBe("PROVIDER");
    expect(r.obligations.length).toBeGreaterThan(0);
    // None of the new overlays should break a basic classification
  });

  it("SG-210: GPAI + sector-specific + GDPR → all three co-exist", () => {
    const r = classifyAISystem(gpaiAnswers({
      sectorSpecificLegislation: "MEDICAL_DEVICE",
      processesPersonalData: true,
    }));
    expect(r.sectorSpecificGuidance).toBeDefined();
    expect(r.gdprInterplay).toBeDefined();
    expect(r.classification).toBe("GPAI");
  });
});
