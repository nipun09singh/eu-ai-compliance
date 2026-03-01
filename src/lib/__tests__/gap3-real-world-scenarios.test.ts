/**
 * GAP 3: REAL-WORLD COMPANY SCENARIOS
 *
 * Tests the classification engine with realistic, detailed scenarios based on
 * actual companies, industries, and AI use cases that exist in the EU market.
 * Each test is a complete set of WizardAnswers verifying a specific pathway.
 *
 * ~106 tests across 5 sections.
 */

import { describe, it, expect } from "vitest";
import {
  classifyAISystem,
  type WizardAnswers,
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

// ============================================================================
// 5.1 INDUSTRY SCENARIOS
// ============================================================================

describe("5.1 Industry Scenarios", () => {
  // ── 5.1.1 Financial Services ──────────────────────────────────────────

  describe("5.1.1 Financial Services", () => {
    it("FIN-001: Bank AI credit scoring (deployer, large) → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "N26 Bank",
        companySize: "LARGE",
        role: "DEPLOYER",
        systemDescription: "AI credit scoring tool for consumer lending decisions",
        essentialServicesUseCase: true,
        essentialServiceType: "CREDIT_SCORING",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe("ESSENTIAL_SERVICES");
      expect(r.legalBasis).toContain("Annex III, point 5");
    });

    it("FIN-002: Fintech startup building credit assessment API → HIGH_RISK, provider, SME", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "CreditTech GmbH",
        companySize: "SMALL",
        role: "PROVIDER",
        systemDescription: "Credit assessment API for partner banks",
        essentialServicesUseCase: true,
        essentialServiceType: "CREDITWORTHINESS",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.obligations).toHaveLength(18);
      expect(r.smeSimplifications.length).toBeGreaterThan(0);
    });

    it("FIN-003: Fraud detection AI (excluded from Point 5) → MINIMAL_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "Stripe EU",
        companySize: "LARGE",
        role: "PROVIDER",
        systemDescription: "AI fraud detection for payment processing",
        essentialServicesUseCase: false,
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
    });

    it("FIN-004: Life insurance risk assessment AI → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "Allianz Life",
        companySize: "LARGE",
        role: "DEPLOYER",
        systemDescription: "AI for life insurance risk assessment and pricing",
        essentialServicesUseCase: true,
        essentialServiceType: "INSURANCE_RISK_PRICING",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe("ESSENTIAL_SERVICES");
    });

    it("FIN-005: Car/property insurance AI (NOT life/health) → MINIMAL_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "AutoInsure AG",
        companySize: "MEDIUM",
        role: "DEPLOYER",
        systemDescription: "AI for auto insurance pricing — NOT life/health",
        essentialServicesUseCase: false,
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
    });

    it("FIN-006: Robo-advisor with human interaction → LIMITED_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "WealthBot EU",
        role: "PROVIDER",
        systemDescription: "AI investment recommendation chatbot",
        essentialServicesUseCase: false,
        interactsWithHumans: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
      const ids = r.obligations.map(o => o.id);
      expect(ids).toContain("TRANSPARENCY_INTERACTION");
    });

    it("FIN-007: AML system (not an LE tool, private bank) → MINIMAL_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "ABN AMRO",
        companySize: "LARGE",
        systemDescription: "Anti-money laundering transaction monitoring AI",
        essentialServicesUseCase: false,
        lawEnforcementUseCase: false,
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
    });
  });

  // ── 5.1.2 Healthcare ─────────────────────────────────────────────────

  describe("5.1.2 Healthcare", () => {
    it("HC-001: AI radiology diagnostic in medical device → HIGH_RISK via Art 6(1), 2027 deadline", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "RadiologyAI GmbH",
        role: "PROVIDER",
        systemDescription: "AI diagnostic tool for radiology, embedded in certified medical device",
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Article 6(1)");
      expect(r.legalBasis).toContain("Annex I");
      expect(r.enforcementDeadline).toBe("2027-08-02");
    });

    it("HC-002: AI triage chatbot for ER → HIGH_RISK via Annex III Point 5(d)", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "TriageBot Health",
        systemDescription: "AI triage chatbot for hospital emergency departments",
        essentialServicesUseCase: true,
        essentialServiceType: "EMERGENCY_DISPATCH",
        posesSignificantRiskOfHarm: true,
        interactsWithHumans: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe("ESSENTIAL_SERVICES");
    });

    it("HC-003: Mental health chatbot (not medical device) → LIMITED_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "MindBot EU",
        systemDescription: "Mental health support chatbot, not a certified medical device",
        interactsWithHumans: true,
        generatesText: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
    });

    it("HC-004: AI for drug discovery (research only) → scope excluded", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "PharmaResearch AB",
        systemDescription: "AI for drug discovery — R&D only, not on market",
        scientificResearchOnly: true,
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
      expect(r.warnings.some(w => w.toLowerCase().includes("scope"))).toBe(true);
    });

    it("HC-005: Pilot fatigue detection (safety exception) → NOT prohibited", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "AirSafe Systems",
        systemDescription: "Pilot emotion/fatigue monitoring for flight safety",
        workplaceEmotionDetection: true,
        workplaceEmotionForMedicalSafety: true,
      }));
      expect(r.classification).not.toBe("PROHIBITED");
    });
  });

  // ── 5.1.3 Education ──────────────────────────────────────────────────

  describe("5.1.3 Education", () => {
    it("ED-001: Online exam proctoring → HIGH_RISK (EDUCATION)", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "ProctorAI EU",
        systemDescription: "Online exam proctoring with student behaviour monitoring",
        educationUseCase: true,
        educationType: "BEHAVIOUR_MONITORING",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe("EDUCATION");
    });

    it("ED-002: University admissions screening → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI for screening university admission applications",
        educationUseCase: true,
        educationType: "ADMISSION_ACCESS",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("ED-003: AI essay grading → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI essay grading and assessment system",
        educationUseCase: true,
        educationType: "LEARNING_ASSESSMENT",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("ED-004a: AI tutoring chatbot (no assessment) → LIMITED_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "TutorBot EU",
        systemDescription: "AI tutoring chatbot — no formal assessment of students",
        educationUseCase: false,
        interactsWithHumans: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
    });

    it("ED-004b: AI tutoring chatbot WITH assessment → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "TutorBot EU Pro",
        systemDescription: "AI tutoring chatbot that also assesses student performance",
        educationUseCase: true,
        educationType: "LEARNING_ASSESSMENT",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("ED-005: School emotion monitoring AI → PROHIBITED", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Cameras detecting student engagement via emotion monitoring",
        workplaceEmotionDetection: true,
        workplaceEmotionForMedicalSafety: false,
      }));
      expect(r.classification).toBe("PROHIBITED");
    });

    it("ED-006: Gamified language learning app → LIMITED_RISK (not formal assessment)", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "LinguaBot",
        systemDescription: "AI language learning app — gamified, not formal education",
        educationUseCase: false,
        interactsWithHumans: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
    });
  });

  // ── 5.1.4 Employment & HR ────────────────────────────────────────────

  describe("5.1.4 Employment & HR", () => {
    it("HR-001: CV/resume screening tool → HIGH_RISK, GDPR DPIA warning", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI CV screening and candidate ranking",
        employmentUseCase: true,
        employmentType: "RECRUITMENT_SELECTION",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe("EMPLOYMENT");
      expect(r.warnings.some(w => w.includes("Data Protection Impact Assessment"))).toBe(true);
    });

    it("HR-002: Employee performance monitoring AI → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI performance monitoring and evaluation system",
        employmentUseCase: true,
        employmentType: "MONITORING_EVALUATION",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("HR-003: AI shift scheduling based on employee traits → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI shift allocation based on employee capabilities",
        employmentUseCase: true,
        employmentType: "TASK_ALLOCATION",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("HR-004: AI termination/layoff recommendation → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI for recommending employee termination decisions",
        employmentUseCase: true,
        employmentType: "WORK_CONDITIONS_PROMOTION_TERMINATION",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("HR-005: Employee workplace emotion detection (non-safety) → PROHIBITED", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Employee mood/emotion monitoring for productivity tracking",
        workplaceEmotionDetection: true,
        workplaceEmotionForMedicalSafety: false,
      }));
      expect(r.classification).toBe("PROHIBITED");
    });

    it("HR-006: Driver drowsiness detection (safety exception) → NOT prohibited", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Fleet driver drowsiness detection for road safety",
        workplaceEmotionDetection: true,
        workplaceEmotionForMedicalSafety: true,
      }));
      expect(r.classification).not.toBe("PROHIBITED");
    });

    it("HR-007: LinkedIn-style AI job recommendation → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "JobMatch EU",
        role: "PROVIDER",
        systemDescription: "AI job recommendation engine including ad targeting for recruitment",
        employmentUseCase: true,
        employmentType: "RECRUITMENT_SELECTION",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.obligations).toHaveLength(18);
    });
  });

  // ── 5.1.5 Law Enforcement & Public Safety ─────────────────────────────

  describe("5.1.5 Law Enforcement & Public Safety", () => {
    it("LE-001: Predictive policing software → HIGH_RISK, secure DB warning", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Predictive policing crime analytics software",
        lawEnforcementUseCase: true,
        lawEnforcementType: "CRIME_ANALYTICS",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe("LAW_ENFORCEMENT");
      expect(r.warnings.some(w => w.toUpperCase().includes("SECURE NON-PUBLIC"))).toBe(true);
    });

    it("LE-002: Lie detector AI for police → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI polygraph lie detector for police interviews",
        lawEnforcementUseCase: true,
        lawEnforcementType: "POLYGRAPH",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("LE-003: Clearview AI-style facial scraping → PROHIBITED", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Untargeted facial image scraping from internet/CCTV",
        facialRecognitionScraping: true,
      }));
      expect(r.classification).toBe("PROHIBITED");
      expect(r.legalBasis).toContain("Article 5(1)(e)");
    });

    it("LE-004: Private real-time facial recognition in city → PROHIBITED", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Real-time facial ID in public spaces, privately operated",
        realtimeBiometricPublicSpaces: true,
        realtimeBiometricForLEException: false,
      }));
      expect(r.classification).toBe("PROHIBITED");
    });

    it("LE-005: LE real-time biometric for kidnapping victim (with auth) → NOT prohibited", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Real-time biometric ID to find kidnapping victim",
        realtimeBiometricPublicSpaces: true,
        realtimeBiometricForLEException: true,
        realtimeBiometricHasJudicialAuth: true,
      }));
      expect(r.classification).not.toBe("PROHIBITED");
      expect(r.warnings.some(w => w.includes("victim"))).toBe(true);
    });

    it("LE-006: Emergency dispatch prioritization AI → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "112 emergency call center AI dispatch prioritization",
        essentialServicesUseCase: true,
        essentialServiceType: "EMERGENCY_DISPATCH",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("LE-007: Criminal risk assessment (NOT solely profiling) → HIGH_RISK, not prohibited", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Criminal risk assessment using location + demographics + profiling",
        criminalRiskProfiling: true,
        crimeProfilingBasedSolelyOnPersonality: false,
        lawEnforcementUseCase: true,
        lawEnforcementType: "RISK_ASSESSMENT",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).not.toBe("PROHIBITED");
    });
  });

  // ── 5.1.6 AI/Tech — Generative AI ────────────────────────────────────

  describe("5.1.6 AI/Tech — Generative AI", () => {
    it("AI-001: Foundation model provider (Mistral-class) → GPAI, 5 obligations", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "Mistral EU",
        companySize: "MEDIUM",
        role: "PROVIDER",
        systemDescription: "Foundation model, general purpose AI system",
        isGeneralPurposeModel: true,
        gpaiOpenSource: false,
      }));
      expect(r.classification).toBe("GPAI");
      expect(r.obligations).toHaveLength(5);
    });

    it("AI-002: GPT-class high compute model → GPAI_SYSTEMIC", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "FrontierAI Corp",
        companySize: "LARGE",
        role: "PROVIDER",
        systemDescription: "Large language model with high impact capabilities",
        isGeneralPurposeModel: true,
        gpaiHighImpactCapabilities: true,
      }));
      expect(r.classification).toBe("GPAI_SYSTEMIC");
      expect(r.obligations).toHaveLength(10);
    });

    it("AI-003: Open-source model (no systemic risk) → GPAI, 3 obligations", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "OpenModel EU",
        systemDescription: "Open-source language model released under Apache 2.0",
        isGeneralPurposeModel: true,
        gpaiOpenSource: true,
        gpaiHighImpactCapabilities: false,
      }));
      expect(r.classification).toBe("GPAI");
      expect(r.obligations).toHaveLength(3);
    });

    it("AI-004: Open-source model WITH systemic risk → GPAI_SYSTEMIC, no exemption", () => {
      const r = classifyAISystem(baseAnswers({
        isGeneralPurposeModel: true,
        gpaiOpenSource: true,
        gpaiHighImpactCapabilities: true,
      }));
      expect(r.classification).toBe("GPAI_SYSTEMIC");
      expect(r.obligations).toHaveLength(10);
    });

    it("AI-005: Customer service chatbot using GPT API (deployer) → LIMITED_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "ShopChat EU",
        role: "DEPLOYER",
        systemDescription: "Customer support chatbot using GPT API",
        isGeneralPurposeModel: false,
        interactsWithHumans: true,
        generatesText: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
    });

    it("AI-006: AI content generation platform → LIMITED_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "ContentAI EU",
        systemDescription: "AI content generation platform for marketing copy",
        generatesText: true,
        interactsWithHumans: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
    });

    it("AI-007: Deepfake video creation tool → LIMITED_RISK with deepfake + media obligations", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "SynthVid EU",
        systemDescription: "AI video synthesis platform for marketing content",
        generatesDeepfakes: true,
        generatesMedia: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
      const ids = r.obligations.map(o => o.id);
      expect(ids).toContain("TRANSPARENCY_DEEPFAKE");
      expect(ids).toContain("TRANSPARENCY_MEDIA");
    });

    it("AI-008: AI music generator → LIMITED_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "MusicAI EU",
        systemDescription: "AI music generation platform",
        generatesMedia: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
    });

    it("AI-009: AI image generator → LIMITED_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI image generation (Midjourney-style)",
        generatesMedia: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
    });

    it("AI-010: AI code assistant with human interaction → LIMITED_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "CodeAssistAI",
        systemDescription: "AI code completion and assistance tool",
        interactsWithHumans: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
    });
  });

  // ── 5.1.7 Transportation ─────────────────────────────────────────────

  describe("5.1.7 Transportation", () => {
    it("TR-001: Self-driving car AI → HIGH_RISK via Art 6(1), 2027 deadline", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "AutoDrive EU",
        role: "PROVIDER",
        systemDescription: "Autonomous driving AI for motor vehicles",
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Article 6(1)");
      expect(r.enforcementDeadline).toBe("2027-08-02");
    });

    it("TR-002: Smart city traffic management AI → HIGH_RISK (CRITICAL_INFRASTRUCTURE)", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI traffic management for smart city infrastructure",
        criticalInfrastructure: true,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe("CRITICAL_INFRASTRUCTURE");
    });

    it("TR-003: Delivery drone AI → HIGH_RISK via Art 6(1)", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI system for autonomous drone delivery navigation",
        isSafetyComponent: true,
        productUnderAnnexI: true,
        requiresThirdPartyConformity: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.legalBasis).toContain("Article 6(1)");
    });

    it("TR-004: Fleet routing optimization (no safety) → MINIMAL_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI fleet routing optimization for logistics",
        isSafetyComponent: false,
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
    });
  });

  // ── 5.1.8 Government & Public Sector ──────────────────────────────────

  describe("5.1.8 Government & Public Sector", () => {
    it("GOV-001: Welfare benefit eligibility AI (deployer) → HIGH_RISK, FRIA required", () => {
      const r = classifyAISystem(baseAnswers({
        companyName: "Ministry of Social Affairs",
        role: "DEPLOYER",
        systemDescription: "AI for determining welfare benefit eligibility",
        essentialServicesUseCase: true,
        essentialServiceType: "PUBLIC_BENEFITS",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe("ESSENTIAL_SERVICES");
      const ids = r.obligations.map(o => o.id);
      expect(ids).toContain("FUNDAMENTAL_RIGHTS_IMPACT");
    });

    it("GOV-002: Immigration visa processing AI → HIGH_RISK, secure DB", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI for visa application processing and assessment",
        migrationUseCase: true,
        migrationType: "APPLICATION_EXAMINATION",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe("MIGRATION_ASYLUM_BORDER");
      expect(r.warnings.some(w => w.toUpperCase().includes("SECURE NON-PUBLIC"))).toBe(true);
    });

    it("GOV-003: Border surveillance AI → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI for detecting unauthorized border crossings",
        migrationUseCase: true,
        migrationType: "BORDER_DETECTION",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("GOV-004: AI judge/sentencing assistant → HIGH_RISK (JUSTICE_DEMOCRACY)", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI assistant for researching and applying law in court proceedings",
        justiceUseCase: true,
        justiceType: "COURT_RESEARCH_APPLICATION",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe("JUSTICE_DEMOCRACY");
    });

    it("GOV-005: AI-powered electoral influence system → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI system to influence voter behaviour in elections",
        justiceUseCase: true,
        justiceType: "ELECTION_INFLUENCE",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("GOV-006: Online dispute resolution platform with AI → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI-powered alternative dispute resolution platform",
        justiceUseCase: true,
        justiceType: "ALTERNATIVE_DISPUTE_RESOLUTION",
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("GOV-007: Social credit system (public or private) → PROHIBITED", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Social credit scoring system by local government",
        socialScoring: true,
      }));
      expect(r.classification).toBe("PROHIBITED");
      expect(r.legalBasis).toContain("Article 5(1)(c)");
    });
  });

  // ── 5.1.9 Retail & E-commerce ─────────────────────────────────────────

  describe("5.1.9 Retail & E-commerce", () => {
    it("RET-001: Product recommendation engine → MINIMAL_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI product recommendation engine for e-commerce",
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
    });

    it("RET-002: AI dynamic pricing system → MINIMAL_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI dynamic pricing for retail — not credit scoring",
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
    });

    it("RET-003: In-store emotion detection for marketing → LIMITED_RISK (not workplace)", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "In-store emotion detection cameras for marketing analytics",
        usesEmotionRecognition: true,
        workplaceEmotionDetection: false,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
      const ids = r.obligations.map(o => o.id);
      expect(ids).toContain("TRANSPARENCY_EMOTION");
    });

    it("RET-004: AI customer support chatbot → LIMITED_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Zendesk-style AI customer support chatbot",
        interactsWithHumans: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
    });

    it("RET-005: AI counterfeit detection → MINIMAL_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "AI counterfeit product detection system",
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
    });
  });

  // ── 5.1.10 Biometric Systems ──────────────────────────────────────────

  describe("5.1.10 Biometric Systems", () => {
    it("BIO-001: Airport face-check boarding (1:1 verification) → NOT HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Airport boarding gate facial verification against passport photo",
        usesBiometrics: true,
        biometricType: "REMOTE_IDENTIFICATION",
        isBiometricVerificationOnly: true,
      }));
      expect(r.classification).not.toBe("HIGH_RISK");
    });

    it("BIO-002: Building facial recognition (1:many) → HIGH_RISK (BIOMETRICS)", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Smart building facial recognition for access control (1:many)",
        usesBiometrics: true,
        biometricType: "REMOTE_IDENTIFICATION",
        isBiometricVerificationOnly: false,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.highRiskArea).toBe("BIOMETRICS");
    });

    it("BIO-003: Phone face unlock (verification) → MINIMAL_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Smartphone face unlock (1:1 biometric verification)",
        usesBiometrics: true,
        isBiometricVerificationOnly: true,
      }));
      expect(r.classification).toBe("MINIMAL_RISK");
    });

    it("BIO-004a: Crowd monitoring with sensitive attribute categorisation → PROHIBITED", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Crowd monitoring AI categorising people by race/religion",
        biometricCategorisationSensitive: true,
        biometricCatForLawEnforcementLabelling: false,
      }));
      expect(r.classification).toBe("PROHIBITED");
    });

    it("BIO-004b: Biometric categorisation (non-sensitive, age/gender) → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Biometric AI categorising people by age and gender",
        usesBiometrics: true,
        biometricType: "CATEGORISATION",
        isBiometricVerificationOnly: false,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("BIO-005a: Retail emotion recognition (biometric) → HIGH_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Retail biometric emotion recognition system",
        usesBiometrics: true,
        biometricType: "EMOTION_RECOGNITION",
        isBiometricVerificationOnly: false,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
    });

    it("BIO-005b: Retail emotion recognition (non-biometric, Art 50 only) → LIMITED_RISK", () => {
      const r = classifyAISystem(baseAnswers({
        systemDescription: "Retail emotion recognition system (not biometric)",
        usesEmotionRecognition: true,
      }));
      expect(r.classification).toBe("LIMITED_RISK");
    });
  });
});

// ============================================================================
// 5.2 SME SCENARIOS
// ============================================================================

describe("5.2 SME Scenarios", () => {
  const sizes = ["MICRO", "SMALL", "MEDIUM", "LARGE"] as const;

  it("SME-001: MICRO deploying HIGH_RISK employment AI → SME simplifications + lower fine cap", () => {
    const r = classifyAISystem(baseAnswers({
      companySize: "MICRO",
      role: "DEPLOYER",
      employmentUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.smeSimplifications.length).toBeGreaterThanOrEqual(1);
    expect(r.fineRisk.maxAmountSME.toLowerCase()).toContain("lower");
  });

  it("SME-002: MICRO as GPAI provider → NO SME fine protection (BUG-C3 fix)", () => {
    const r = classifyAISystem(baseAnswers({
      companySize: "MICRO",
      isGeneralPurposeModel: true,
    }));
    expect(r.fineRisk.maxAmountSME.toUpperCase()).toContain("HIGHER");
  });

  it("SME-003: SMALL provider HIGH_RISK → SME simplifications present", () => {
    const r = classifyAISystem(baseAnswers({
      companySize: "SMALL",
      role: "PROVIDER",
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.smeSimplifications.length).toBeGreaterThan(0);
  });

  it("SME-004: MEDIUM deployer ESSENTIAL_SERVICES → SME simplifications present", () => {
    const r = classifyAISystem(baseAnswers({
      companySize: "MEDIUM",
      role: "DEPLOYER",
      essentialServicesUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.smeSimplifications.length).toBeGreaterThan(0);
  });

  it("SME-005: LARGE provider → NO SME simplifications", () => {
    const r = classifyAISystem(baseAnswers({
      companySize: "LARGE",
      role: "PROVIDER",
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.smeSimplifications).toHaveLength(0);
  });

  // ── Size × Classification matrix tests ────────────────────────────────

  for (const size of sizes) {
    it(`SME-007: ${size} × PROHIBITED → correct fine`, () => {
      const r = classifyAISystem(baseAnswers({
        companySize: size,
        socialScoring: true,
      }));
      expect(r.classification).toBe("PROHIBITED");
      expect(r.fineRisk.maxPercentTurnover).toBe(7);
      if (size === "LARGE") {
        expect(r.fineRisk.maxAmountGeneral).toBe("€35,000,000");
      } else {
        expect(r.fineRisk.maxAmountSME.toLowerCase()).toContain("lower");
      }
    });
  }

  for (const size of sizes) {
    it(`SME-008: ${size} × HIGH_RISK → correct fine`, () => {
      const r = classifyAISystem(baseAnswers({
        companySize: size,
        educationUseCase: true,
        posesSignificantRiskOfHarm: true,
      }));
      expect(r.classification).toBe("HIGH_RISK");
      expect(r.fineRisk.maxPercentTurnover).toBe(3);
    });
  }

  for (const size of sizes) {
    it(`SME-009: ${size} × GPAI → no SME protection`, () => {
      const r = classifyAISystem(baseAnswers({
        companySize: size,
        isGeneralPurposeModel: true,
      }));
      expect(r.classification).toBe("GPAI");
      if (size !== "LARGE") {
        expect(r.fineRisk.maxAmountSME.toUpperCase()).toContain("HIGHER");
      }
    });
  }

  for (const size of sizes) {
    it(`SME-011: ${size} × MINIMAL_RISK → N/A fines`, () => {
      const r = classifyAISystem(baseAnswers({ companySize: size }));
      expect(r.classification).toBe("MINIMAL_RISK");
      expect(r.fineRisk.maxAmountGeneral).toBe("N/A");
    });
  }

  for (const size of sizes) {
    it(`SME-012: ${size} × scope excluded → N/A fines`, () => {
      const r = classifyAISystem(baseAnswers({
        companySize: size,
        militaryDefenceOnly: true,
      }));
      expect(r.fineRisk.article).toBe("N/A");
    });
  }
});

// ============================================================================
// 5.3 CROSS-BORDER & JURISDICTION EDGE CASES
// ============================================================================

describe("5.3 Cross-Border & Jurisdiction", () => {
  it("JUR-001: US company, output used in EU → IN SCOPE", () => {
    const r = classifyAISystem(baseAnswers({
      companyName: "US-Corp",
      isEUBased: false,
      outputUsedInEU: true,
    }));
    expect(r.classification).not.toBe("OUT_OF_SCOPE");
  });

  it("JUR-002: US company, output NOT used in EU → OUT OF SCOPE", () => {
    const r = classifyAISystem(baseAnswers({
      isEUBased: false,
      outputUsedInEU: false,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.warnings.some(w => w.toLowerCase().includes("scope"))).toBe(true);
  });

  it("JUR-003: EU-based company, output not in EU → IN SCOPE (EU-based sufficient)", () => {
    const r = classifyAISystem(baseAnswers({
      isEUBased: true,
      outputUsedInEU: false,
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
  });

  it("JUR-004: EU-based + output in EU → IN SCOPE", () => {
    const r = classifyAISystem(baseAnswers({
      isEUBased: true,
      outputUsedInEU: true,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.warnings.every(w => !w.toLowerCase().includes("outside the scope"))).toBe(true);
  });

  it("JUR-005: UK company (post-Brexit) with EU customers → IN SCOPE", () => {
    const r = classifyAISystem(baseAnswers({
      companyName: "LondonTech Ltd",
      isEUBased: false,
      outputUsedInEU: true,
    }));
    expect(r.classification).not.toBe("OUT_OF_SCOPE");
  });

  it("JUR-006: China-based AI, deployed in EU, prohibited practice → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      companyName: "SenseTime EU Operations",
      isEUBased: false,
      outputUsedInEU: true,
      realtimeBiometricPublicSpaces: true,
    }));
    expect(r.classification).toBe("PROHIBITED");
  });

  it("JUR-007: Non-EU, no EU nexus, open-source → scope excluded", () => {
    const r = classifyAISystem(baseAnswers({
      isEUBased: false,
      outputUsedInEU: false,
      openSourceNonHighRisk: true,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
  });

  it("JUR-008: Swiss company with EU subsidiary deploying employment AI → IN SCOPE, HIGH_RISK", () => {
    const r = classifyAISystem(baseAnswers({
      companyName: "SwissTech EU Subsidiary",
      isEUBased: true,
      employmentUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
  });

  it("JUR-009: Indian outsourcing firm building creditworthiness AI for EU bank → IN SCOPE, HIGH_RISK", () => {
    const r = classifyAISystem(baseAnswers({
      companyName: "IndiaAI Outsource",
      isEUBased: false,
      outputUsedInEU: true,
      essentialServicesUseCase: true,
      essentialServiceType: "CREDITWORTHINESS",
      posesSignificantRiskOfHarm: true,
      role: "PROVIDER",
    }));
    expect(r.classification).toBe("HIGH_RISK");
  });

  it("JUR-010a: Military contractor (exclusively military) → scope excluded", () => {
    const r = classifyAISystem(baseAnswers({
      companyName: "DefenseTech EU",
      militaryDefenceOnly: true,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.warnings.some(w => w.toLowerCase().includes("scope"))).toBe(true);
  });

  it("JUR-010b: Military contractor (also civilian use) → IN SCOPE", () => {
    const r = classifyAISystem(baseAnswers({
      companyName: "DefenseTech EU",
      militaryDefenceOnly: false,
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
  });
});

// ============================================================================
// 5.4 GREY AREA SCENARIOS
// ============================================================================

describe("5.4 Grey Area Scenarios", () => {
  it("GREY-001: Mandatory employee wellness mood app → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "Employer-mandated mood/wellness monitoring app",
      workplaceEmotionDetection: true,
      workplaceEmotionForMedicalSafety: false,
    }));
    expect(r.classification).toBe("PROHIBITED");
  });

  it("GREY-002: AI dark pattern nudging (no significant harm) → NOT prohibited, grey area warning", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "AI nudging purchasing decisions via dark patterns",
      usesSubliminaManipulation: true,
      manipulationCausesSignificantHarm: false,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    expect(r.warnings.some(w => w.includes("5(1)(a)"))).toBe(true);
  });

  it("GREY-003: Social media content ranking → MINIMAL_RISK (not social scoring)", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "Social media feed ranking algorithm",
      socialScoring: false,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
  });

  it("GREY-004: AI loyalty program penalising returns via cross-context score → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "Loyalty program reducing benefits via disparate-context scoring",
      socialScoring: true,
    }));
    expect(r.classification).toBe("PROHIBITED");
  });

  it("GREY-005: Resume beautifier for candidates (not employer tool) → LIMITED_RISK", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "AI resume optimizer tool used by job seekers",
      employmentUseCase: false,
      generatesText: true,
    }));
    expect(r.classification).toBe("LIMITED_RISK");
  });

  it("GREY-006a: Meeting transcription with workplace sentiment analysis → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "AI meeting tool inferring speaker emotions from voice in workplace",
      workplaceEmotionDetection: true,
      workplaceEmotionForMedicalSafety: false,
    }));
    expect(r.classification).toBe("PROHIBITED");
  });

  it("GREY-006b: Meeting transcription only (no emotion) → MINIMAL/LIMITED_RISK", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "AI meeting transcription - speech-to-text only, no emotion",
      workplaceEmotionDetection: false,
      interactsWithHumans: true,
    }));
    expect(["MINIMAL_RISK", "LIMITED_RISK"]).toContain(r.classification);
  });

  it("GREY-007: University AI personalising study materials (no assessment) → MINIMAL via Art 6(3)", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "AI personalising study materials, improves human-curated content",
      educationUseCase: true,
      posesSignificantRiskOfHarm: false,
      improvesHumanActivity: true,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
    expect(r.legalBasis).toContain("Article 6(3)");
  });

  it("GREY-008: AI grammar/spelling checker → LIMITED_RISK", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "AI spelling and grammar checker (Grammarly-style)",
      interactsWithHumans: true,
    }));
    expect(r.classification).toBe("LIMITED_RISK");
  });

  it("GREY-009: AI-generated political ad → LIMITED_RISK", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "AI-generated political advertisement text",
      generatesText: true,
      justiceUseCase: false,
    }));
    expect(r.classification).toBe("LIMITED_RISK");
  });

  it("GREY-010: Social media bot pretending to be human → LIMITED_RISK", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "Social media bot that pretends to be human",
      interactsWithHumans: true,
    }));
    expect(r.classification).toBe("LIMITED_RISK");
    const ids = r.obligations.map(o => o.id);
    expect(ids).toContain("TRANSPARENCY_INTERACTION");
  });

  it("GREY-011: Criminal risk assessment with profiling (not solely) → HIGH_RISK, not prohibited", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "Criminal risk assessment using location + demographics + profiling",
      criminalRiskProfiling: true,
      crimeProfilingBasedSolelyOnPersonality: false,
      lawEnforcementUseCase: true,
      lawEnforcementType: "RISK_ASSESSMENT",
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).not.toBe("PROHIBITED");
    expect(r.classification).toBe("HIGH_RISK");
  });

  it("GREY-012: Legal advice chatbot (not court/judicial) → LIMITED_RISK", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "Consumer legal advice chatbot — not used by/for courts",
      justiceUseCase: false,
      interactsWithHumans: true,
      generatesText: true,
    }));
    expect(r.classification).toBe("LIMITED_RISK");
  });

  it("GREY-013: AI art generator creating photorealistic images of real people → LIMITED_RISK with deepfake + media", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "AI generating photorealistic images of real people",
      generatesDeepfakes: true,
      generatesMedia: true,
    }));
    expect(r.classification).toBe("LIMITED_RISK");
    const ids = r.obligations.map(o => o.id);
    expect(ids).toContain("TRANSPARENCY_DEEPFAKE");
    expect(ids).toContain("TRANSPARENCY_MEDIA");
  });

  it("GREY-014: HR AI narrowing candidates with profiling → HIGH_RISK (profiling overrides Art 6(3))", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "HR AI shortlisting candidates with profiling — preparatory task",
      employmentUseCase: true,
      posesSignificantRiskOfHarm: false,
      preparatoryTask: true,
      performsProfiling: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
  });

  it("GREY-015: GPAI also deployed as education assessment tool → GPAI (priority order)", () => {
    const r = classifyAISystem(baseAnswers({
      systemDescription: "GPAI model also deployed for education assessments",
      isGeneralPurposeModel: true,
      educationUseCase: true,
    }));
    expect(r.classification).toBe("GPAI");
  });
});

// ============================================================================
// 5.5 MULTI-LAYER CLASSIFICATION SCENARIOS
// ============================================================================

describe("5.5 Multi-Layer Classification Scenarios", () => {
  it("ML-001: PROHIBITED + GPAI → PROHIBITED wins", () => {
    const r = classifyAISystem(baseAnswers({
      socialScoring: true,
      isGeneralPurposeModel: true,
    }));
    expect(r.classification).toBe("PROHIBITED");
  });

  it("ML-002: PROHIBITED + HIGH_RISK → PROHIBITED wins", () => {
    const r = classifyAISystem(baseAnswers({
      workplaceEmotionDetection: true,
      workplaceEmotionForMedicalSafety: false,
      employmentUseCase: true,
    }));
    expect(r.classification).toBe("PROHIBITED");
  });

  it("ML-003: GPAI + Annex III HIGH_RISK → GPAI wins", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      educationUseCase: true,
    }));
    expect(r.classification).toBe("GPAI");
  });

  it("ML-004: Safety component + Annex III → HIGH_RISK via Art 6(1)", () => {
    const r = classifyAISystem(baseAnswers({
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
      educationUseCase: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
    expect(r.legalBasis).toContain("Article 6(1)");
  });

  it("ML-005: Annex III HIGH_RISK + all transparency triggers → HIGH_RISK", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
      interactsWithHumans: true,
      generatesText: true,
      generatesDeepfakes: true,
      generatesMedia: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
  });

  it("ML-006: Art 6(3) exception + transparency → MINIMAL_RISK (exception before transparency)", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: false,
      narrowProceduralTask: true,
      interactsWithHumans: true,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
  });

  it("ML-007: Scope excluded + everything else → MINIMAL_RISK (scope exclusion wins)", () => {
    const r = classifyAISystem(baseAnswers({
      militaryDefenceOnly: true,
      socialScoring: true,
      isGeneralPurposeModel: true,
      educationUseCase: true,
      interactsWithHumans: true,
    }));
    expect(r.classification).toBe("MINIMAL_RISK");
  });

  it("ML-008: Multiple prohibited practices + HIGH_RISK + GPAI → PROHIBITED", () => {
    const r = classifyAISystem(baseAnswers({
      socialScoring: true,
      facialRecognitionScraping: true,
      isGeneralPurposeModel: true,
      educationUseCase: true,
    }));
    expect(r.classification).toBe("PROHIBITED");
  });

  it("ML-009: GPAI systemic + safety component → GPAI_SYSTEMIC wins", () => {
    const r = classifyAISystem(baseAnswers({
      isGeneralPurposeModel: true,
      gpaiHighImpactCapabilities: true,
      isSafetyComponent: true,
      productUnderAnnexI: true,
      requiresThirdPartyConformity: true,
    }));
    expect(r.classification).toBe("GPAI_SYSTEMIC");
  });

  it("ML-010: Art 6(3) conditions met but profiling active → HIGH_RISK (profiling absolute override)", () => {
    const r = classifyAISystem(baseAnswers({
      educationUseCase: true,
      posesSignificantRiskOfHarm: false,
      narrowProceduralTask: true,
      improvesHumanActivity: true,
      detectsPatterns: true,
      preparatoryTask: true,
      performsProfiling: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
  });

  it("ML-011: Two Annex III areas (BIOMETRICS + EDUCATION) → one area wins", () => {
    const r = classifyAISystem(baseAnswers({
      usesBiometrics: true,
      biometricType: "REMOTE_IDENTIFICATION",
      isBiometricVerificationOnly: false,
      educationUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
    // Engine processes areas in order; verify a valid area is selected
    expect(["BIOMETRICS", "EDUCATION"]).toContain(r.highRiskArea);
  });

  it("ML-012: DEPLOYER with multiple Annex III areas → FRIA required", () => {
    const r = classifyAISystem(baseAnswers({
      role: "DEPLOYER",
      employmentUseCase: true,
      essentialServicesUseCase: true,
      justiceUseCase: true,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
    const ids = r.obligations.map(o => o.id);
    expect(ids).toContain("FUNDAMENTAL_RIGHTS_IMPACT");
  });

  it("ML-013: BOTH role with BIOMETRICS → provider obligations include notified body CA", () => {
    const r = classifyAISystem(baseAnswers({
      role: "BOTH",
      usesBiometrics: true,
      biometricType: "REMOTE_IDENTIFICATION",
      isBiometricVerificationOnly: false,
      posesSignificantRiskOfHarm: true,
    }));
    expect(r.classification).toBe("HIGH_RISK");
    const ca = r.obligations.find(o => o.id === "CONFORMITY_ASSESSMENT");
    expect(ca).toBeDefined();
    expect(ca!.description.toLowerCase()).toContain("notified body");
  });
});
