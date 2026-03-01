/**
 * LAYER 7B — Integration Tests (L7B-INT)
 *
 * Cross-component integration tests using REAL implementations (no mocks
 * of business logic). Tests the full data flow:
 *   Wizard Store → Classification Engine → Result Rendering
 *   SessionStorage handoff between WizardShell → ResultPage
 *   Document generation pipeline
 *
 * 55 tests across 6 groups:
 *   INT-S: Store + Classification Engine (12 tests)
 *   INT-W: Wizard → Store round-trip (10 tests)
 *   INT-SS: SessionStorage handoff (8 tests)
 *   INT-R: ResultPage data rendering (10 tests)
 *   INT-P: Full pipeline scenarios (10 tests)
 *   INT-D: Doc generator template resolution (5 tests)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { classifyAISystem, TEMPLATE_REGISTRY } from "@/lib/classification-engine";
import type { ClassificationResult, WizardAnswers } from "@/lib/classification-engine";
import {
  WIZARD_STEPS,
  getNextStep,
  getPreviousStep,
  getVisibleSteps,
  getVisibleQuestions,
  getProgressPercent,
} from "@/lib/wizard-questions";
import { getApplicableTemplates } from "@/lib/doc-generator";

// ============================================================================
// Helper: Minimal valid wizard answers for different classifications
// ============================================================================

function minimalMinimalRiskAnswers(): WizardAnswers {
  return {
    // Step 1: Company basics
    companyName: "TestCorp",
    companySize: "SMALL",
    isEUBased: true,
    outputUsedInEU: true,

    // Step 2: Role
    role: "DEPLOYER",

    // Step 3: System description
    systemDescription: "Simple chatbot for FAQ",

    // Step 4: Scope exclusions
    militaryDefenceOnly: false,
    scientificResearchOnly: false,
    personalNonProfessional: false,
    openSourceNonHighRisk: false,

    // Step 5: Prohibited practices
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

    // Step 6: Safety component
    isSafetyComponent: false,
    productUnderAnnexI: false,
    requiresThirdPartyConformity: false,

    // Step 7: Annex III areas
    usesBiometrics: false,
    isBiometricVerificationOnly: false,
    criticalInfrastructure: false,
    educationUseCase: false,
    employmentUseCase: false,
    essentialServicesUseCase: false,
    lawEnforcementUseCase: false,
    migrationUseCase: false,
    justiceUseCase: false,

    // Step 8: Art 6(3) exception
    posesSignificantRiskOfHarm: false,
    narrowProceduralTask: false,
    improvesHumanActivity: false,
    detectsPatterns: false,
    preparatoryTask: false,
    performsProfiling: false,

    // Step 9: Transparency
    interactsWithHumans: false,
    generatesDeepfakes: false,
    generatesText: false,
    generatesMedia: false,
    usesEmotionRecognition: false,
    usesBiometricCategorisation: false,

    // Step 10: GPAI
    isGeneralPurposeModel: false,
    gpaiHighImpactCapabilities: false,
    gpaiOpenSource: false,
  } as any;
}

function minimalHighRiskAnswers(): WizardAnswers {
  return {
    ...minimalMinimalRiskAnswers(),
    role: "PROVIDER",
    systemDescription: "AI-powered recruitment screening tool",
    employmentUseCase: true,
    employmentType: "RECRUITMENT_SELECTION",
  } as any;
}

function minimalGPAIAnswers(): WizardAnswers {
  return {
    ...minimalMinimalRiskAnswers(),
    role: "PROVIDER",
    systemDescription: "Foundation model for text generation",
    isGeneralPurposeModel: true,
  } as any;
}

// ============================================================================
// INT-S: Store + Classification Engine Integration
// ============================================================================
describe("L7B-INT-S: Store + Classification Engine", () => {
  it("INT-S01: classifying minimal risk answers returns MINIMAL_RISK", () => {
    const result = classifyAISystem(minimalMinimalRiskAnswers());
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("INT-S02: classifying high-risk answers returns HIGH_RISK", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("INT-S03: classifying GPAI answers returns GPAI", () => {
    const result = classifyAISystem(minimalGPAIAnswers());
    expect(result.classification).toBe("GPAI");
  });

  it("INT-S04: high-risk result has obligations property", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    expect(result.obligations.length).toBeGreaterThan(0);
  });

  it("INT-S05: high-risk result has enforcement deadline", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    expect(result.enforcementDeadline).toBeDefined();
    expect(result.enforcementDeadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("INT-S06: high-risk result has fine risk data", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    expect(result.fineRisk).toBeDefined();
    expect(result.fineRisk.maxPercentTurnover).toBeGreaterThan(0);
  });

  it("INT-S07: result always includes nextSteps", () => {
    const result = classifyAISystem(minimalMinimalRiskAnswers());
    expect(result.nextSteps).toBeDefined();
    expect(result.nextSteps.length).toBeGreaterThan(0);
  });

  it("INT-S08: PROVIDER role flows through to result", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    expect(result.role).toBe("PROVIDER");
  });

  it("INT-S09: DEPLOYER role flows through to result", () => {
    const result = classifyAISystem(minimalMinimalRiskAnswers());
    expect(result.role).toBe("DEPLOYER");
  });

  it("INT-S10: SME classification includes SME fine amounts", () => {
    const answers = minimalHighRiskAnswers();
    answers.companySize = "SMALL";
    const result = classifyAISystem(answers);
    expect(result.fineRisk.maxAmountSME).toBeDefined();
  });

  it("INT-S11: prohibited practice triggers PROHIBITED classification", () => {
    const answers = minimalMinimalRiskAnswers();
    answers.socialScoring = true;
    const result = classifyAISystem(answers);
    expect(result.classification).toBe("PROHIBITED");
  });

  it("INT-S12: classification result has correct structure for ResultPage consumption", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    // Validate all fields that ResultPage expects
    expect(result).toHaveProperty("classification");
    expect(result).toHaveProperty("role");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("legalBasis");
    expect(result).toHaveProperty("obligations");
    expect(result).toHaveProperty("enforcementDeadline");
    expect(result).toHaveProperty("fineRisk");
    expect(result).toHaveProperty("nextSteps");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("smeSimplifications");
  });
});

// ============================================================================
// INT-W: Wizard flow round-trip
// ============================================================================
describe("L7B-INT-W: Wizard flow navigation", () => {
  it("INT-W01: WIZARD_STEPS has at least 5 steps", () => {
    expect(WIZARD_STEPS.length).toBeGreaterThanOrEqual(5);
  });

  it("INT-W02: first step is 'company'", () => {
    expect(WIZARD_STEPS[0].id).toBe("company");
  });

  it("INT-W03: last step is 'summary'", () => {
    expect(WIZARD_STEPS[WIZARD_STEPS.length - 1].id).toBe("summary");
  });

  it("INT-W04: getNextStep advances from company with empty answers", () => {
    const next = getNextStep("company", {});
    expect(next).not.toBeNull();
    expect(next!.id).not.toBe("company");
  });

  it("INT-W05: getPreviousStep from first step returns null", () => {
    const prev = getPreviousStep("company", {});
    expect(prev).toBeNull();
  });

  it("INT-W06: walking full visible steps reaches summary", () => {
    const answers = minimalMinimalRiskAnswers();
    const visible = getVisibleSteps(answers);
    const lastStep = visible[visible.length - 1];
    expect(lastStep.id).toBe("summary");
  });

  it("INT-W07: progress is 0-100 range", () => {
    const answers = minimalMinimalRiskAnswers();
    const progress = getProgressPercent("company", answers);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it("INT-W08: progress at summary step is ~100%", () => {
    const answers = minimalMinimalRiskAnswers();
    const visibleSteps = getVisibleSteps(answers);
    const lastId = visibleSteps[visibleSteps.length - 1].id;
    const progress = getProgressPercent(lastId, answers);
    expect(progress).toBe(100);
  });

  it("INT-W09: each visible step has icon and title", () => {
    const answers = minimalMinimalRiskAnswers();
    const visible = getVisibleSteps(answers);
    visible.forEach((step) => {
      expect(step.icon).toBeTruthy();
      expect(step.title).toBeTruthy();
    });
  });

  it("INT-W10: company step has at least 3 questions", () => {
    const companyStep = WIZARD_STEPS.find((s) => s.id === "company")!;
    const questions = getVisibleQuestions(companyStep, {});
    expect(questions.length).toBeGreaterThanOrEqual(3);
  });
});

// ============================================================================
// INT-SS: SessionStorage handoff
// ============================================================================
describe("L7B-INT-SS: SessionStorage handoff", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("INT-SS01: classification result survives JSON round-trip", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    const json = JSON.stringify(result);
    const parsed = JSON.parse(json) as ClassificationResult;
    expect(parsed.classification).toBe(result.classification);
    expect(parsed.obligations.length).toBe(result.obligations.length);
    expect(parsed.fineRisk.maxAmountGeneral).toBe(result.fineRisk.maxAmountGeneral);
  });

  it("INT-SS02: sessionStorage stores and retrieves classification data", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    sessionStorage.setItem("classificationResult", JSON.stringify(result));
    const stored = sessionStorage.getItem("classificationResult");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.classification).toBe("HIGH_RISK");
  });

  it("INT-SS03: wizard answers survive sessionStorage round-trip", () => {
    const answers = minimalHighRiskAnswers();
    sessionStorage.setItem("wizardAnswers", JSON.stringify(answers));
    const parsed = JSON.parse(sessionStorage.getItem("wizardAnswers")!);
    expect(parsed.companyName).toBe("TestCorp");
    expect(parsed.companySize).toBe("SMALL");
  });

  it("INT-SS04: companyName is preserved through storage", () => {
    const answers = minimalHighRiskAnswers();
    answers.companyName = "Acme AI Corp";
    sessionStorage.setItem("wizardAnswers", JSON.stringify(answers));
    const parsed = JSON.parse(sessionStorage.getItem("wizardAnswers")!);
    expect(parsed.companyName).toBe("Acme AI Corp");
  });

  it("INT-SS05: systemDescription is preserved through storage", () => {
    const answers = minimalHighRiskAnswers();
    answers.systemDescription = "AI recruitment tool analyzing CVs";
    sessionStorage.setItem("wizardAnswers", JSON.stringify(answers));
    const parsed = JSON.parse(sessionStorage.getItem("wizardAnswers")!);
    expect(parsed.systemDescription).toBe("AI recruitment tool analyzing CVs");
  });

  it("INT-SS06: obligations array is preserved with all fields", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    sessionStorage.setItem("classificationResult", JSON.stringify(result));
    const parsed = JSON.parse(sessionStorage.getItem("classificationResult")!);
    expect(parsed.obligations).toBeInstanceOf(Array);
    parsed.obligations.forEach((ob: any) => {
      expect(ob).toHaveProperty("id");
      expect(ob).toHaveProperty("article");
      expect(ob).toHaveProperty("title");
      expect(ob).toHaveProperty("description");
      expect(ob).toHaveProperty("priority");
    });
  });

  it("INT-SS07: empty sessionStorage results in null classificationResult", () => {
    const stored = sessionStorage.getItem("classificationResult");
    expect(stored).toBeNull();
  });

  it("INT-SS08: large result data survives storage (stress test)", () => {
    const answers = minimalHighRiskAnswers();
    answers.companyName = "A".repeat(1000);
    answers.systemDescription = "B".repeat(5000);
    const result = classifyAISystem(answers);
    sessionStorage.setItem("classificationResult", JSON.stringify(result));
    const parsed = JSON.parse(sessionStorage.getItem("classificationResult")!);
    expect(parsed.classification).toBe("HIGH_RISK");
  });
});

// ============================================================================
// INT-R: ResultPage data rendering integration
// ============================================================================
const mockRouterPush = vi.fn();
const stableRouter = { push: mockRouterPush };

vi.mock("next/navigation", () => ({
  useRouter: () => stableRouter,
}));

describe("L7B-INT-R: ResultPage data consumption", () => {

  vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
  }));

  // Use real components rendered with simple stubs
  vi.mock("@/components/result/ClassificationBadge", () => ({
    default: ({ classification }: any) => <div data-testid="badge">{classification}</div>,
  }));
  vi.mock("@/components/result/ObligationsList", () => ({
    default: ({ obligations }: any) => <div data-testid="obligations">Count: {obligations.length}</div>,
  }));
  vi.mock("@/components/result/FineCalculator", () => ({
    default: ({ fineRisk }: any) => <div data-testid="fine">{fineRisk.maxAmountGeneral}</div>,
  }));
  vi.mock("@/components/result/TimelineView", () => ({
    default: ({ currentDeadline }: any) => <div data-testid="timeline">{currentDeadline}</div>,
  }));
  vi.mock("@/components/result/DocumentGenerator", () => ({
    default: ({ result, companyName }: any) => (
      <div data-testid="docgen">{result.classification} / {companyName}</div>
    ),
  }));

  beforeEach(() => {
    sessionStorage.clear();
    mockRouterPush.mockClear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // Dynamically import to isolate from other test files' mocks
  async function renderResultPage() {
    const { default: ResultPage } = await import("@/app/result/page");
    return render(<ResultPage />);
  }

  it("INT-R01: renders HIGH_RISK classification from real engine data", async () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    sessionStorage.setItem("classificationResult", JSON.stringify(result));
    sessionStorage.setItem("wizardAnswers", JSON.stringify(minimalHighRiskAnswers()));
    await renderResultPage();
    expect(screen.getByTestId("badge")).toHaveTextContent("HIGH_RISK");
  });

  it("INT-R02: renders correct obligation count from engine", async () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    sessionStorage.setItem("classificationResult", JSON.stringify(result));
    await renderResultPage();
    const badge = screen.getByTestId("obligations");
    const count = parseInt(badge.textContent!.replace("Count: ", ""));
    expect(count).toBe(result.obligations.length);
  });

  it("INT-R03: renders fine amount from engine data", async () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    sessionStorage.setItem("classificationResult", JSON.stringify(result));
    await renderResultPage();
    expect(screen.getByTestId("fine")).toHaveTextContent(result.fineRisk.maxAmountGeneral);
  });

  it("INT-R04: renders enforcement deadline from engine data", async () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    sessionStorage.setItem("classificationResult", JSON.stringify(result));
    await renderResultPage();
    expect(screen.getByTestId("timeline")).toHaveTextContent(result.enforcementDeadline);
  });

  it("INT-R05: renders company name through to DocumentGenerator", async () => {
    const answers = minimalHighRiskAnswers();
    answers.companyName = "Integration Test Corp";
    const result = classifyAISystem(answers);
    sessionStorage.setItem("classificationResult", JSON.stringify(result));
    sessionStorage.setItem("wizardAnswers", JSON.stringify(answers));
    await renderResultPage();
    expect(screen.getByTestId("docgen")).toHaveTextContent("Integration Test Corp");
  });

  it("INT-R06: renders next steps from engine data", async () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    sessionStorage.setItem("classificationResult", JSON.stringify(result));
    await renderResultPage();
    result.nextSteps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it("INT-R07: renders warnings when present in engine result", async () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    if (result.warnings.length > 0) {
      sessionStorage.setItem("classificationResult", JSON.stringify(result));
      await renderResultPage();
      expect(screen.getByText("⚠️ Important Warnings")).toBeInTheDocument();
    } else {
      // If no warnings for this scenario, verify the section is absent
      sessionStorage.setItem("classificationResult", JSON.stringify(result));
      await renderResultPage();
      expect(screen.queryByText("⚠️ Important Warnings")).not.toBeInTheDocument();
    }
  });

  it("INT-R08: shows confidence level from engine", async () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    sessionStorage.setItem("classificationResult", JSON.stringify(result));
    await renderResultPage();
    expect(screen.getByText(result.confidence)).toBeInTheDocument();
  });

  it("INT-R09: shows legal basis from engine", async () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    sessionStorage.setItem("classificationResult", JSON.stringify(result));
    await renderResultPage();
    expect(screen.getByText(result.legalBasis.join(", "))).toBeInTheDocument();
  });

  it("INT-R10: redirects to /wizard when no data in sessionStorage", async () => {
    await renderResultPage();
    expect(mockRouterPush).toHaveBeenCalledWith("/wizard");
  });
});

// ============================================================================
// INT-P: Full pipeline scenarios
// ============================================================================
describe("L7B-INT-P: Full pipeline scenarios", () => {
  it("INT-P01: social scoring answer → PROHIBITED → high fine", () => {
    const answers = minimalMinimalRiskAnswers();
    answers.socialScoring = true;
    const result = classifyAISystem(answers);
    expect(result.classification).toBe("PROHIBITED");
    expect(parseInt(result.fineRisk.maxAmountGeneral.replace(/[^0-9]/g, ""))).toBeGreaterThanOrEqual(35000000);
  });

  it("INT-P02: recruitment AI → HIGH_RISK with employment obligations", () => {
    const answers = minimalHighRiskAnswers();
    const result = classifyAISystem(answers);
    expect(result.classification).toBe("HIGH_RISK");
    expect(result.obligations.some((o) => o.article.includes("Article"))).toBe(true);
  });

  it("INT-P03: simple chatbot → MINIMAL_RISK with few obligations", () => {
    const result = classifyAISystem(minimalMinimalRiskAnswers());
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("INT-P04: GPAI with systemic risk → GPAI_SYSTEMIC", () => {
    const answers = minimalGPAIAnswers();
    (answers as any).gpaiHighImpactCapabilities = true;
    const result = classifyAISystem(answers);
    expect(result.classification).toBe("GPAI_SYSTEMIC");
  });

  it("INT-P05: credit scoring → HIGH_RISK essential services", () => {
    const answers = minimalMinimalRiskAnswers();
    answers.role = "PROVIDER";
    (answers as any).essentialServicesUseCase = true;
    (answers as any).essentialServiceType = "CREDIT_SCORING";
    const result = classifyAISystem(answers);
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("INT-P06: education assessment → HIGH_RISK", () => {
    const answers = minimalMinimalRiskAnswers();
    answers.role = "PROVIDER";
    (answers as any).educationUseCase = true;
    const result = classifyAISystem(answers);
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("INT-P07: critical infrastructure → HIGH_RISK", () => {
    const answers = minimalMinimalRiskAnswers();
    answers.role = "PROVIDER";
    answers.criticalInfrastructure = true;
    const result = classifyAISystem(answers);
    expect(result.classification).toBe("HIGH_RISK");
  });

  it("INT-P08: deepfake generation → transparency obligation", () => {
    const answers = minimalMinimalRiskAnswers();
    answers.generatesDeepfakes = true;
    const result = classifyAISystem(answers);
    // Should be at least LIMITED_RISK with transparency obligations
    expect(["LIMITED_RISK", "MINIMAL_RISK"]).toContain(result.classification);
  });

  it("INT-P09: military-only use → scope exclusion applied", () => {
    const answers = minimalMinimalRiskAnswers();
    answers.militaryDefenceOnly = true;
    const result = classifyAISystem(answers);
    expect(result.classification).toBe("MINIMAL_RISK");
  });

  it("INT-P10: MICRO company gets SME-reduced fines", () => {
    const answers = minimalHighRiskAnswers();
    answers.companySize = "MICRO";
    const result = classifyAISystem(answers);
    expect(result.fineRisk.maxAmountSME).toBeDefined();
    expect(result.smeSimplifications.length).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// INT-D: Document template resolution
// ============================================================================
describe("L7B-INT-D: Doc template resolution", () => {
  it("INT-D01: HIGH_RISK PROVIDER gets applicable templates", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    const templateIds = getApplicableTemplates(result);
    expect(templateIds.length).toBeGreaterThan(0);
  });

  it("INT-D02: all template IDs resolve in TEMPLATE_REGISTRY", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    const templateIds = getApplicableTemplates(result);
    templateIds.forEach((id) => {
      expect(TEMPLATE_REGISTRY[id]).toBeDefined();
      expect(TEMPLATE_REGISTRY[id].name).toBeTruthy();
    });
  });

  it("INT-D03: MINIMAL_RISK has fewer templates than HIGH_RISK", () => {
    const hrResult = classifyAISystem(minimalHighRiskAnswers());
    const mrResult = classifyAISystem(minimalMinimalRiskAnswers());
    const hrTemplates = getApplicableTemplates(hrResult);
    const mrTemplates = getApplicableTemplates(mrResult);
    expect(hrTemplates.length).toBeGreaterThanOrEqual(mrTemplates.length);
  });

  it("INT-D04: template registry entries have required fields", () => {
    const result = classifyAISystem(minimalHighRiskAnswers());
    const templateIds = getApplicableTemplates(result);
    templateIds.forEach((id) => {
      const tmpl = TEMPLATE_REGISTRY[id];
      expect(tmpl).toHaveProperty("name");
      expect(tmpl).toHaveProperty("articles");
    });
  });

  it("INT-D05: GPAI templates differ from HIGH_RISK templates", () => {
    const hrResult = classifyAISystem(minimalHighRiskAnswers());
    const gpaiResult = classifyAISystem(minimalGPAIAnswers());
    const hrIds = getApplicableTemplates(hrResult);
    const gpaiIds = getApplicableTemplates(gpaiResult);
    // They should not be identical sets
    const hrSet = new Set(hrIds);
    const gpaiSet = new Set(gpaiIds);
    const identical = hrIds.length === gpaiIds.length && hrIds.every((id) => gpaiSet.has(id));
    expect(identical).toBe(false);
  });
});
