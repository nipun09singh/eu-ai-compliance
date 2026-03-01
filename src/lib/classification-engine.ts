/**
 * EU AI Act (Regulation 2024/1689) — Classification Engine v2
 * AUDITED & CORRECTED — 25 February 2026
 * 
 * 15 regulatory issues identified and fixed (see AUDIT_LOG.md).
 * Cross-referenced against full Act text from EUR-Lex.
 * 
 * KEY CHANGES FROM v1:
 *  - Added Provider vs Deployer role distinction (CRITICAL)
 *  - Fixed Art 5 prohibited practices (missing exceptions & harm thresholds)
 *  - Fixed Art 6(3) exception (missing "significant risk" prerequisite)
 *  - Added deployer obligations (Art 26, Art 27)
 *  - Fixed Annex III Point 5 sub-types (was wrong)
 *  - Added Annex III Point 8(b) alternative dispute resolution
 *  - Added Art 4 AI literacy to ALL classifications
 *  - Added SME-specific fine calculations and simplifications
 *  - Added biometric verification exclusion
 *
 * Architecture:
 *   User-facing wizard (conversational Q&A) → this engine → compliance dashboard
 *
 * Source: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689
 */

// ============================================================================
// TYPES
// ============================================================================

export type RiskClassification =
  | "PROHIBITED"
  | "HIGH_RISK"
  | "LIMITED_RISK"
  | "GPAI"
  | "GPAI_SYSTEMIC"
  | "MINIMAL_RISK";

/**
 * CRITICAL DISTINCTION: The Act assigns different obligations 
 * to providers (who build AI) vs deployers (who use AI built by others).
 * Most SMBs are deployers.
 */
export type Role = "PROVIDER" | "DEPLOYER" | "BOTH" | "IMPORTER" | "DISTRIBUTOR" | "AUTHORISED_REPRESENTATIVE";

export type ProhibitedPractice =
  | "SUBLIMINAL_MANIPULATION"            // Art 5(1)(a) — subliminal, purposefully manipulative, OR deceptive techniques; with significant harm threshold
  | "VULNERABILITY_EXPLOITATION"         // Art 5(1)(b) — with significant harm threshold
  | "SOCIAL_SCORING"                     // Art 5(1)(c)
  | "CRIMINAL_RISK_PROFILING_SOLELY"     // Art 5(1)(d) — SOLELY based on profiling
  | "UNTARGETED_FACIAL_SCRAPING"         // Art 5(1)(e)
  | "WORKPLACE_EMOTION_DETECTION"        // Art 5(1)(f) — except medical/safety
  | "BIOMETRIC_CATEGORISATION_SENSITIVE" // Art 5(1)(g) — except LE labelling
  | "REALTIME_BIOMETRIC_LAW_ENFORCEMENT"; // Art 5(1)(h) — except specific LE cases

export type HighRiskArea =
  | "BIOMETRICS"                     // Annex III, point 1
  | "CRITICAL_INFRASTRUCTURE"        // Annex III, point 2
  | "EDUCATION"                      // Annex III, point 3
  | "EMPLOYMENT"                     // Annex III, point 4
  | "ESSENTIAL_SERVICES"             // Annex III, point 5
  | "LAW_ENFORCEMENT"                // Annex III, point 6
  | "MIGRATION_ASYLUM_BORDER"        // Annex III, point 7
  | "JUSTICE_DEMOCRACY";             // Annex III, point 8

export type TransparencyObligation =
  | "HUMAN_INTERACTION"              // Art 50(1)
  | "EMOTION_RECOGNITION"            // Art 50(3)
  | "BIOMETRIC_CATEGORISATION"       // Art 50(3)
  | "DEEPFAKE_CONTENT"               // Art 50(4)
  | "AI_GENERATED_TEXT"              // Art 50(4) — text on matters of public interest
  | "AI_GENERATED_MEDIA";            // Art 50(2) — synthetic audio/image/video

export type EnforcementTimeline =
  | "2025-02-02"  // Prohibited practices + general provisions (Art 4, Art 5)
  | "2025-08-02"  // GPAI obligations + notified bodies + governance
  | "2026-08-02"  // HIGH-RISK obligations (Annex III) + transparency (Art 50)
  | "2027-08-02"  // Product safety AI (Annex I, Section A)
  | "2030-08-02"; // Public authorities + large-scale IT systems (Annex X)

export interface Obligation {
  id: string;
  article: string;
  title: string;
  description: string;
  appliesToRole: Role | "BOTH";
  templateId?: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  deadline: EnforcementTimeline;
}

export interface FineRisk {
  maxAmountGeneral: string;
  maxAmountSME: string;       // SMEs get the LOWER of fixed amount vs percentage
  maxPercentTurnover: number;
  article: string;
  note?: string;
}

export interface ClassificationResult {
  classification: RiskClassification;
  role: Role;
  detectedRoles?: Role[];                    // All roles detected from answers (may include role upgrades via Art 25)
  confidence: "DEFINITIVE" | "LIKELY" | "NEEDS_LEGAL_REVIEW";
  legalBasis: string[];
  obligations: Obligation[];
  prohibitedPractices?: ProhibitedPractice[];
  highRiskArea?: HighRiskArea;
  transparencyObligations?: TransparencyObligation[];
  enforcementDeadline: EnforcementTimeline;
  fineRisk: FineRisk;
  nextSteps: string[];
  warnings: string[];
  smeSimplifications: string[];
  art25ProviderUpgrade?: boolean;             // True when deployer/importer/distributor becomes provider via Art 25
  substantialModificationFlag?: boolean;      // Art 6(6) re-assessment warning
  sectorSpecificGuidance?: string[];          // Sector-specific legislation interplay
  transitionalProvisions?: string[];          // Art 111-113 adjusted deadlines/grace periods
  gdprInterplay?: string[];                   // Deep GDPR interplay warnings
  sandboxGuidance?: string[];                 // Art 57-63 regulatory sandbox guidance
  valueChainWarnings?: string[];              // Art 25(2)-(5) supply chain obligations
  authorityCooperation?: string[];            // Art 74-82 market surveillance guidance
}

// ============================================================================
// WIZARD INPUT — What the user answers (plain language)
// ============================================================================

export interface WizardAnswers {
  // ── Step 1: Company basics ──────────────────────────────────────────────
  companyName: string;
  companySize: "MICRO" | "SMALL" | "MEDIUM" | "LARGE";
  isEUBased: boolean;
  outputUsedInEU: boolean;

  // ── Step 2: YOUR ROLE (v2 CRITICAL ADDITION) ────────────────────────────
  /**
   * Provider = you develop/build AI systems or have them built under your name
   * Deployer = you use AI systems built by someone else under your authority
   * Both = you build AI AND use other providers' AI
   */
  role: Role;

  // ── Step 3: What does your AI system do? ────────────────────────────────
  systemDescription: string;

  // ── Step 4: Scope exclusions (Art 2) ────────────────────────────────────
  militaryDefenceOnly: boolean;
  scientificResearchOnly: boolean;
  personalNonProfessional: boolean;
  openSourceNonHighRisk: boolean;

  // ── Step 5: Prohibited practices (Art 5) ────────────────────────────────
  // v2: Each now includes the harm/exception qualifiers from the Act.

  // Art 5(1)(a): Subliminal/manipulative techniques
  usesSubliminaManipulation: boolean;
  manipulationCausesSignificantHarm: boolean;  // v2: Must cause significant harm

  // Art 5(1)(b): Exploiting vulnerabilities
  exploitsVulnerabilities: boolean;
  exploitationCausesSignificantHarm: boolean;  // v2: Must cause significant harm

  // Art 5(1)(c): Social scoring
  socialScoring: boolean;

  // Art 5(1)(d): Criminal risk profiling
  criminalRiskProfiling: boolean;
  crimeProfilingBasedSolelyOnPersonality: boolean;  // v2: Only prohibited when SOLELY based on profiling
  crimeProfilingSupportingHumanAssessment: boolean; // v2: Exception if supporting human assessment of factual evidence

  // Art 5(1)(e): Untargeted facial scraping
  facialRecognitionScraping: boolean;

  // Art 5(1)(f): Workplace/education emotion detection
  workplaceEmotionDetection: boolean;
  workplaceEmotionForMedicalSafety: boolean;   // v2: Exception for medical/safety purposes

  // Art 5(1)(g): Biometric categorisation by sensitive attributes
  biometricCategorisationSensitive: boolean;
  biometricCatForLawEnforcementLabelling: boolean; // v2: Exception for LE labelling/filtering

  // Art 5(1)(h): Real-time remote biometric ID in public spaces
  realtimeBiometricPublicSpaces: boolean;
  realtimeBiometricForLEException: boolean;  // v2: Exception for specific LE purposes
  realtimeBiometricHasJudicialAuth: boolean; // v2: Requires prior judicial authorization

  // ── Step 6: High-risk — Safety component (Art 6(1)) ─────────────────────
  isSafetyComponent: boolean;     // Safety component of a product, or IS the product
  productUnderAnnexI: boolean;    // Product covered by Annex I harmonisation law
  requiresThirdPartyConformity: boolean;

  // ── Step 7: High-risk — Annex III areas (Art 6(2)) ──────────────────────
  // Point 1: Biometrics
  usesBiometrics: boolean;
  biometricType?: "REMOTE_IDENTIFICATION" | "CATEGORISATION" | "EMOTION_RECOGNITION";
  isBiometricVerificationOnly: boolean;  // v2: Verification is EXCLUDED from high-risk

  // Point 2: Critical infrastructure
  criticalInfrastructure: boolean;

  // Point 3: Education
  educationUseCase: boolean;
  educationType?: "ADMISSION_ACCESS" | "LEARNING_ASSESSMENT" | "EDUCATION_LEVEL" | "BEHAVIOUR_MONITORING";

  // Point 4: Employment
  employmentUseCase: boolean;
  employmentType?: "RECRUITMENT_SELECTION" | "WORK_CONDITIONS_PROMOTION_TERMINATION" | "TASK_ALLOCATION" | "MONITORING_EVALUATION";

  // Point 5: Essential services (FIXED: Act has 4 sub-points, not 5)
  // Annex III, point 5 actual structure:
  //   5(a) — public assistance benefits/services eligibility
  //   5(b) — creditworthiness evaluation AND credit scoring (SAME sub-point; excl. fraud detection)
  //   5(c) — risk assessment & pricing for life/health insurance
  //   5(d) — prioritising emergency first response services dispatch
  essentialServicesUseCase: boolean;
  essentialServiceType?: 
    | "PUBLIC_BENEFITS"          // 5(a) — evaluating eligibility for public benefits/services
    | "CREDITWORTHINESS"         // 5(b) — evaluating creditworthiness (excl. fraud detection)
    | "CREDIT_SCORING"           // 5(b) — credit scoring (same sub-point as creditworthiness; excl. fraud detection)
    | "INSURANCE_RISK_PRICING"   // 5(c) — risk assessment & pricing for life/health insurance
    | "EMERGENCY_DISPATCH";      // 5(d) — prioritising emergency services dispatch

  // Point 6: Law enforcement
  lawEnforcementUseCase: boolean;
  lawEnforcementType?: "POLYGRAPH" | "EVIDENCE_RELIABILITY" | "RISK_ASSESSMENT" | "CRIME_ANALYTICS" | "POST_BIOMETRIC_ID";

  // Point 7: Migration, asylum, border control
  migrationUseCase: boolean;
  migrationType?: "POLYGRAPH" | "RISK_ASSESSMENT" | "APPLICATION_EXAMINATION" | "BORDER_DETECTION";

  // Point 8: Justice & democracy (v2: ADDED alternative dispute resolution)
  justiceUseCase: boolean;
  justiceType?: 
    | "COURT_RESEARCH_APPLICATION"    // 8(a) — researching/interpreting/applying law + ADR
    | "ALTERNATIVE_DISPUTE_RESOLUTION" // 8(a) — alternative dispute resolution (same sub-point)
    | "ELECTION_INFLUENCE";            // 8(b) — influencing elections/voting behaviour

  // ── Step 8: Exception check (Art 6(3)) ──────────────────────────────────
  // v2: BOTH conditions must be met: (1) no significant risk AND (2) one of (a)-(d)
  posesSignificantRiskOfHarm: boolean;   // v2: ADDED — prerequisite for exception
  narrowProceduralTask: boolean;         // 6(3)(a)
  improvesHumanActivity: boolean;        // 6(3)(b)
  detectsPatterns: boolean;              // 6(3)(c)
  preparatoryTask: boolean;              // 6(3)(d)
  performsProfiling: boolean;            // Always high-risk override

  // ── Step 9: Transparency (Art 50) ───────────────────────────────────────
  interactsWithHumans: boolean;
  generatesDeepfakes: boolean;
  generatesText: boolean;
  generatesMedia: boolean;
  usesEmotionRecognition: boolean;
  usesBiometricCategorisation: boolean;

  // ── Step 10: GPAI Model (Art 51-56) ─────────────────────────────────────
  isGeneralPurposeModel: boolean;
  gpaiTrainingCompute?: number;
  gpaiHighImpactCapabilities: boolean;
  gpaiOpenSource: boolean;

  // ── Step 11: Art 25 — "Becoming a provider" detection ───────────────────
  /**
   * Art 25(1): Any distributor, importer, deployer, or other third party
   * is considered a PROVIDER if they:
   *   (a) Put their own name/trademark on a high-risk AI system already on the market
   *   (b) Make a substantial modification to a high-risk AI system
   *   (c) Modify the intended purpose of an AI system such that it becomes high-risk
   * This triggers ALL provider obligations.
   */
  putOwnNameOrBrandOnSystem?: boolean;       // Art 25(1)(a)
  madeSubstantialModification?: boolean;     // Art 25(1)(b) + Art 6(6)
  changedPurposeToHighRisk?: boolean;        // Art 25(1)(c)

  // ── Step 12: Extended role detection ────────────────────────────────────
  broughtSystemFromOutsideEU?: boolean;      // Importer detection
  resellsOrDistributesSystem?: boolean;      // Distributor detection
  appointedAsAuthorisedRep?: boolean;        // Authorised representative detection

  // ── Step 13: Extraterritorial scope ────────────────────────────────────
  hasAuthorisedRepInEU?: boolean;            // Art 22: non-EU providers MUST appoint one

  // ── Step 14: Transitional provisions (Art 111-113) ──────────────────────
  systemAlreadyOnMarketBeforeAug2026?: boolean;  // Art 111(1): existing systems grace period
  gpaiAlreadyOnMarketBeforeAug2025?: boolean;    // Art 111: GPAI transition
  usedByPublicAuthority?: boolean;               // Art 111(2): grace until 2030
  isLargeScaleITSystem?: boolean;                // Annex X: SIS, VIS, EES, etc. — until 2030

  // ── Step 15: Sector-specific legislation ────────────────────────────────
  sectorSpecificLegislation?: "MEDICAL_DEVICE" | "IVDR" | "AUTOMOTIVE" | "AVIATION" | "MARINE" | "RAILWAY" | "MACHINERY" | "TOYS" | "LIFTS" | "RADIO_EQUIPMENT" | "NONE";

  // ── Step 16: GPAI supply chain ──────────────────────────────────────────
  gpaiUsedAsHighRiskComponent?: boolean;     // Art 53(3): GPAI provider must cooperate with HR system provider
  usesThirdPartyAIComponents?: boolean;      // Value chain — Art 25(2)-(5)

  // ── Step 17: GDPR interplay ─────────────────────────────────────────────
  processesPersonalData?: boolean;
  processesSpecialCategoryData?: boolean;    // Art 10(5): derogation for bias detection
  processesChildrenData?: boolean;           // Heightened GDPR + AI Act requirements

  // ── Step 18: Public body / public service ───────────────────────────────
  isPublicBodyOrPublicService?: boolean;     // Affects: FRIA, registration, transitions
}

// ============================================================================
// MAIN CLASSIFICATION FUNCTION
// ============================================================================

export function classifyAISystem(answers: WizardAnswers): ClassificationResult {
  // ── BASE CLASSIFICATION (priority chain) ────────────────────────────────
  let result = computeBaseClassification(answers);

  // ═══════════════════════════════════════════════════════════════════════
  // POST-PROCESSING OVERLAYS — Applied AFTER base classification
  // These fix architectural limitations of the priority-chain model.
  // ═══════════════════════════════════════════════════════════════════════

  // BUG-A1/A5 FIX: Art 50(5) — Transparency obligations apply to ALL
  // classification categories (including HIGH_RISK, GPAI, Art 6(3) exception)
  if (result.classification !== "LIMITED_RISK" && !result.legalBasis.includes("Article 2") &&
      result.classification !== "PROHIBITED") {
    result = applyTransparencyOverlay(result, answers);
  }

  // BUG-A2 FIX: GPAI + high-risk dual classification warning
  if (result.classification === "GPAI" || result.classification === "GPAI_SYSTEMIC") {
    result = applyGPAIHighRiskOverlay(result, answers);
  }

  // ── NEW OVERLAYS (v3: Addressing 15 structural gaps) ────────────────────

  // Art 25: "Becoming a provider" detection — can upgrade role and add obligations
  result = applyArt25ProviderUpgradeOverlay(result, answers);

  // Importer / Distributor / Authorised Representative obligations
  result = applyExtendedRoleObligations(result, answers);

  // Extraterritorial scope + authorised representative requirement (Art 22)
  result = applyExtraterritorialOverlay(result, answers);

  // Transitional provisions (Art 111-113) — adjusts deadlines
  result = applyTransitionalProvisionsOverlay(result, answers);

  // Sector-specific legislation interplay (Art 2(5)-(8))
  result = applySectorSpecificOverlay(result, answers);

  // GPAI supply chain obligations (Art 25(1)(c), Art 53(3))
  result = applyGPAISupplyChainOverlay(result, answers);

  // Substantial modification awareness (Art 6(6))
  result = applySubstantialModificationOverlay(result, answers);

  // GDPR deep interplay (Art 10(5), Art 26(7)-(9), Recital 69)
  result = applyGDPRInterplayOverlay(result, answers);

  // Regulatory sandbox guidance (Art 57-63)
  result = applySandboxOverlay(result, answers);

  // Value chain obligations (Art 25(2)-(5))
  result = applyValueChainOverlay(result, answers);

  // Authority cooperation guidance (Art 74-82)
  result = applyAuthorityCooperationOverlay(result, answers);

  // Post-biometric ID operations (Art 26(10))
  result = applyPostBiometricOverlay(result, answers);

  // Voluntary conformity for minimal risk (Art 95)
  result = applyVoluntaryConformityOverlay(result, answers);

  // Ensure detectedRoles is always populated
  if (!result.detectedRoles || result.detectedRoles.length === 0) {
    result = { ...result, detectedRoles: [result.role] };
  }

  return result;
}

// ── Base classification following the Act's priority chain ────────────────
function computeBaseClassification(answers: WizardAnswers): ClassificationResult {
  // ── STEP 0: Scope exclusions (Art 2) ────────────────────────────────────
  const exclusion = checkScopeExclusions(answers);
  if (exclusion) return exclusion;

  // ── STEP 1: Prohibited practices (Art 5) ────────────────────────────────
  const { result: prohibited, pendingWarnings } = checkProhibitedPractices(answers);
  if (prohibited) return prohibited;

  // Collect any warnings from the prohibited check that should propagate
  // (e.g., harm threshold warnings when no violation was found)
  const collectedWarnings: string[] = [...pendingWarnings];

  // Helper: inject collected warnings into a classification result
  const injectWarnings = (r: ClassificationResult): ClassificationResult => {
    if (collectedWarnings.length > 0) {
      return { ...r, warnings: [...r.warnings, ...collectedWarnings] };
    }
    return r;
  };

  // ── STEP 2: GPAI model track (Art 51-56) ────────────────────────────────
  const gpai = checkGPAI(answers);
  if (gpai) return injectWarnings(gpai);

  // ── STEP 3: High-risk via safety component (Art 6(1)) ──────────────────
  const highRiskProduct = checkHighRiskSafetyComponent(answers);
  if (highRiskProduct) return injectWarnings(highRiskProduct);

  // ── STEP 4: High-risk via Annex III (Art 6(2)) ─────────────────────────
  const highRiskAnnexIII = checkHighRiskAnnexIII(answers);
  if (highRiskAnnexIII) return injectWarnings(highRiskAnnexIII);

  // ── STEP 5: Limited risk / transparency (Art 50) ────────────────────────
  const limitedRisk = checkLimitedRisk(answers);
  if (limitedRisk) return injectWarnings(limitedRisk);

  // ── STEP 6: Default = Minimal risk ──────────────────────────────────────
  return injectWarnings(buildMinimalRiskResult(answers));
}

// ============================================================================
// The AI Literacy obligation applies to EVERY classification (Art 4)
// This was missing in v1 — Art 4 is a general provision effective since 2 Feb 2025
// ============================================================================

function getUniversalObligations(): Obligation[] {
  return [
    {
      id: "AI_LITERACY",
      article: "Article 4",
      title: "AI Literacy",
      description:
        "Providers AND deployers shall take measures to ensure, to their best extent, a sufficient level of AI literacy of their staff and other persons dealing with the operation and use of AI systems on their behalf. Must consider: technical knowledge, experience, education/training, context of use, and the persons/groups on whom the AI system is used.",
      appliesToRole: "BOTH",
      templateId: "TMPL_AI_LITERACY_PLAN",
      priority: "MEDIUM",
      deadline: "2025-02-02",
    },
  ];
}

// ============================================================================
// STEP 0: SCOPE EXCLUSIONS (Article 2)
// ============================================================================

function checkScopeExclusions(answers: WizardAnswers): ClassificationResult | null {
  const exclusions: string[] = [];

  if (answers.militaryDefenceOnly)
    exclusions.push("Military/defence/national security — Art 2(3)");
  if (answers.scientificResearchOnly)
    exclusions.push("Scientific R&D (not placed on market/put into service) — Art 2(6)");
  if (answers.personalNonProfessional)
    exclusions.push("Personal non-professional use — Art 2(10)");

  // BUG-C5 FIX: Art 2(12) open-source exclusion does NOT apply if the system:
  //   - Falls under Art 5 (prohibited practices)
  //   - Is high-risk (Annex III or safety component under Annex I)
  //   - Triggers Art 50 transparency obligations
  // Only grant the exclusion when none of these apply.
  if (answers.openSourceNonHighRisk) {
    const hasProhibitedTrigger =
      answers.usesSubliminaManipulation || answers.exploitsVulnerabilities ||
      answers.socialScoring || answers.criminalRiskProfiling ||
      answers.facialRecognitionScraping || answers.workplaceEmotionDetection ||
      answers.biometricCategorisationSensitive || answers.realtimeBiometricPublicSpaces;
    const hasHighRiskTrigger =
      (answers.isSafetyComponent && answers.productUnderAnnexI && answers.requiresThirdPartyConformity) ||
      (answers.usesBiometrics && !answers.isBiometricVerificationOnly) ||
      answers.criticalInfrastructure || answers.educationUseCase ||
      answers.employmentUseCase || answers.essentialServicesUseCase ||
      answers.lawEnforcementUseCase || answers.migrationUseCase || answers.justiceUseCase;
    const hasTransparencyTrigger =
      answers.interactsWithHumans || answers.usesEmotionRecognition ||
      answers.usesBiometricCategorisation || answers.generatesDeepfakes ||
      answers.generatesText || answers.generatesMedia;

    if (!hasProhibitedTrigger && !hasHighRiskTrigger && !hasTransparencyTrigger) {
      exclusions.push("Open-source, not high-risk or prohibited — Art 2(12)");
    }
    // If triggers apply, don't add exclusion — let the system be classified normally
  }

  if (!answers.isEUBased && !answers.outputUsedInEU)
    exclusions.push("No EU nexus (not EU-based and output not used in EU) — Art 2(1)");

  if (exclusions.length > 0) {
    return {
      classification: "MINIMAL_RISK",
      role: answers.role,
      confidence: "LIKELY",
      legalBasis: ["Article 2"],
      obligations: getUniversalObligations(), // v2: Even excluded systems should know about AI literacy
      enforcementDeadline: "2026-08-02",
      fineRisk: buildFineRisk("NONE", answers.companySize),
      nextSteps: [
        "Your AI system appears to be OUTSIDE THE SCOPE of the EU AI Act.",
        "Exclusion(s): " + exclusions.join("; "),
        "However, other EU regulations may still apply: GDPR (data protection), Product Safety Regulation (2023/988), Consumer Protection Directives, sector-specific rules.",
        "Recommendation: Document this scope exclusion assessment and keep it on file.",
      ],
      warnings: [
        "⚠️ Scope exclusions are narrowly interpreted. If in doubt, assume the Act applies.",
        answers.openSourceNonHighRisk
          ? "⚠️ Open-source exclusion does NOT apply if the system is high-risk (Annex III) or falls under Art 5 (prohibited) or Art 50 (transparency). Re-assess if your use case changes."
          : "",
      ].filter(Boolean),
      smeSimplifications: [],
    };
  }

  return null;
}

// ============================================================================
// STEP 1: PROHIBITED PRACTICES (Article 5)
// v2: Fixed all missing exceptions and harm thresholds
// ============================================================================

function checkProhibitedPractices(answers: WizardAnswers): { result: ClassificationResult | null; pendingWarnings: string[] } {
  const violations: ProhibitedPractice[] = [];
  const legalBasis: string[] = [];
  const warnings: string[] = [];

  // Art 5(1)(a): Subliminal, purposefully manipulative, or deceptive techniques
  // The Act prohibits THREE distinct technique types (disjunctive "or"):
  //   1. Subliminal techniques beyond a person's consciousness
  //   2. Purposefully manipulative techniques
  //   3. Deceptive techniques
  // All three share the same harm threshold: "causes or is reasonably likely to cause significant harm"
  // v2 FIX: Only prohibited when "likely to cause significant harm"
  if (answers.usesSubliminaManipulation && answers.manipulationCausesSignificantHarm) {
    violations.push("SUBLIMINAL_MANIPULATION");
    legalBasis.push("Article 5(1)(a)");
  } else if (answers.usesSubliminaManipulation && !answers.manipulationCausesSignificantHarm) {
    warnings.push(
      "⚠️ Art 5(1)(a): Your system uses subliminal, manipulative, or deceptive techniques but you indicated it doesn't cause significant harm. This is a high-risk grey area — the prohibition applies when harm is 'caused or is reasonably likely to be caused.' The three prohibited technique types are: (1) subliminal techniques beyond a person's consciousness, (2) purposefully manipulative techniques, and (3) deceptive techniques. Assess very carefully whether your system falls under any of these."
    );
  }

  // Art 5(1)(b): Exploiting vulnerabilities
  // BUG-M3 FIX: Specify the vulnerability groups from the Act:
  //   age, disability, or a specific social or economic situation
  // Targets: age, disability, or specific social/economic situation
  // v2 FIX: Only prohibited when "causes or is reasonably likely to cause significant harm"
  if (answers.exploitsVulnerabilities && answers.exploitationCausesSignificantHarm) {
    violations.push("VULNERABILITY_EXPLOITATION");
    legalBasis.push("Article 5(1)(b)");
    warnings.push(
      "Art 5(1)(b): The prohibited vulnerability groups are specifically: persons due to their AGE, DISABILITY, or a SPECIFIC SOCIAL OR ECONOMIC SITUATION. Ensure your assessment covers all three categories."
    );
  } else if (answers.exploitsVulnerabilities && !answers.exploitationCausesSignificantHarm) {
    warnings.push(
      "⚠️ Art 5(1)(b): Your system exploits vulnerabilities of a specific group of persons due to their age, disability, or specific social or economic situation, but you indicated no significant harm. Carefully assess whether adverse impacts on physical or psychological health or financial interests could occur or are reasonably likely to occur — the Act uses the standard 'causes or is reasonably likely to cause significant harm.'"
    );
  }

  // Art 5(1)(c): Social scoring
  if (answers.socialScoring) {
    violations.push("SOCIAL_SCORING");
    legalBasis.push("Article 5(1)(c)");
  }

  // Art 5(1)(d): Criminal risk profiling
  // v2 FIX: Only prohibited when SOLELY based on profiling/personality, NOT when supporting human assessment of factual evidence
  if (
    answers.criminalRiskProfiling &&
    answers.crimeProfilingBasedSolelyOnPersonality &&
    !answers.crimeProfilingSupportingHumanAssessment
  ) {
    violations.push("CRIMINAL_RISK_PROFILING_SOLELY");
    legalBasis.push("Article 5(1)(d)");
  } else if (answers.criminalRiskProfiling && answers.crimeProfilingSupportingHumanAssessment) {
    warnings.push(
      "Art 5(1)(d) exception applies: Your system supports human assessment based on objective, verifiable facts directly linked to criminal activity. This is NOT prohibited, but ensure the system is not the sole basis for risk assessment."
    );
  }

  // Art 5(1)(e): Untargeted facial scraping
  if (answers.facialRecognitionScraping) {
    violations.push("UNTARGETED_FACIAL_SCRAPING");
    legalBasis.push("Article 5(1)(e)");
  }

  // Art 5(1)(f): Workplace/education emotion detection
  // v2 FIX: Exception for medical or safety reasons
  if (answers.workplaceEmotionDetection && !answers.workplaceEmotionForMedicalSafety) {
    violations.push("WORKPLACE_EMOTION_DETECTION");
    legalBasis.push("Article 5(1)(f)");
  } else if (answers.workplaceEmotionDetection && answers.workplaceEmotionForMedicalSafety) {
    warnings.push(
      "Art 5(1)(f) exception: Workplace emotion AI for medical or safety purposes is NOT prohibited. However, ensure the system is genuinely and exclusively for medical/safety use, not repurposed for monitoring performance or behaviour."
    );
  }

  // Art 5(1)(g): Biometric categorisation by sensitive attributes
  // BUG-M1 FIX: Enumerate the 6 specific sensitive attributes from the Act
  // v2 FIX: Exception for law enforcement labelling/filtering
  if (answers.biometricCategorisationSensitive && !answers.biometricCatForLawEnforcementLabelling) {
    violations.push("BIOMETRIC_CATEGORISATION_SENSITIVE");
    legalBasis.push("Article 5(1)(g)");
    warnings.push(
      "Art 5(1)(g) prohibits biometric categorisation to INFER the following sensitive attributes: (1) race or ethnic origin, (2) political opinions, (3) trade union membership, (4) religious or philosophical beliefs, (5) sex life, (6) sexual orientation. Exception: labelling/filtering of lawfully acquired biometric datasets in law enforcement."
    );
  } else if (answers.biometricCategorisationSensitive && answers.biometricCatForLawEnforcementLabelling) {
    warnings.push(
      "Art 5(1)(g) exception: Labelling or filtering of lawfully acquired biometric datasets in the area of law enforcement is NOT prohibited. Ensure the datasets were lawfully acquired. The 6 protected sensitive attributes are: race/ethnic origin, political opinions, trade union membership, religious/philosophical beliefs, sex life, sexual orientation."
    );
  }

  // Art 5(1)(h): Real-time remote biometric ID in public spaces
  // v2 FIX: Exception for specific law enforcement purposes WITH judicial authorization
  if (answers.realtimeBiometricPublicSpaces) {
    if (answers.realtimeBiometricForLEException && answers.realtimeBiometricHasJudicialAuth) {
      // Exception applies
      warnings.push(
        "Art 5(1)(h) exception: Real-time remote biometric ID permitted for law enforcement with prior judicial authorization, limited to: (i) targeted search for victims/missing persons, (ii) preventing specific imminent threat to life/terrorist attack, (iii) locating suspects of serious crimes listed in Annex II. Strict proportionality, temporal and geographic limits required. Annual reporting to market surveillance authority mandatory. BUG-M2 FIX: Art 5(5): Member States may choose NOT to provide for this exception in their national law. Check whether the relevant Member State has opted in to permitting this law enforcement exception."
      );
    } else if (answers.realtimeBiometricForLEException && !answers.realtimeBiometricHasJudicialAuth) {
      violations.push("REALTIME_BIOMETRIC_LAW_ENFORCEMENT");
      legalBasis.push("Article 5(1)(h)");
      warnings.push(
        "You claim a law enforcement exception but lack prior judicial or independent administrative authority authorization. The exception requires PRIOR authorization (except in genuine urgency per Art 5(2), where authorization must be sought during or immediately after use)."
      );
    } else {
      violations.push("REALTIME_BIOMETRIC_LAW_ENFORCEMENT");
      legalBasis.push("Article 5(1)(h)");
    }
  }

  if (violations.length > 0) {
    return { result: {
      classification: "PROHIBITED",
      role: answers.role,
      confidence: "DEFINITIVE",
      legalBasis,
      obligations: [
        {
          id: "CEASE_AND_DESIST",
          article: "Article 5",
          title: "Cease prohibited practice immediately",
          description:
            "This AI practice is BANNED under the EU AI Act. It cannot be placed on the market, put into service, or used in the Union. Enforcement has been active since 2 February 2025.",
          appliesToRole: "BOTH",
          priority: "CRITICAL",
          deadline: "2025-02-02",
        },
        ...getUniversalObligations(),
      ],
      prohibitedPractices: violations,
      enforcementDeadline: "2025-02-02",
      fineRisk: buildFineRisk("PROHIBITED", answers.companySize),
      nextSteps: [
        "🚨 STOP: This AI practice is PROHIBITED under the EU AI Act.",
        "These prohibitions have been enforceable since 2 February 2025.",
        `Fine risk: ${buildFineRisk("PROHIBITED", answers.companySize).maxAmountGeneral} or ${buildFineRisk("PROHIBITED", answers.companySize).maxPercentTurnover}% of global annual turnover, whichever is higher.`,
        "Immediately assess whether the system can be redesigned to avoid the prohibited purpose.",
        "If you believe an exception applies, document your legal basis thoroughly.",
      ],
      warnings,
      smeSimplifications: [],
    }, pendingWarnings: [] };
  }

  // Return pending warnings even when no violations (they'll be injected into final result)
  return { result: null, pendingWarnings: warnings };
}

// ============================================================================
// STEP 2: GENERAL-PURPOSE AI MODELS (Articles 51-56)
// ============================================================================

function checkGPAI(answers: WizardAnswers): ClassificationResult | null {
  if (!answers.isGeneralPurposeModel) return null;

  const isSystemicRisk =
    answers.gpaiHighImpactCapabilities ||
    (answers.gpaiTrainingCompute !== undefined && answers.gpaiTrainingCompute > 1e25);

  const baseObligations = getGPAIBaseObligations(answers.gpaiOpenSource, isSystemicRisk);

  if (isSystemicRisk) {
    return {
      classification: "GPAI_SYSTEMIC",
      role: answers.role,
      confidence: "DEFINITIVE",
      legalBasis: ["Article 51", "Article 55"],
      obligations: [
        ...baseObligations,
        {
          id: "MODEL_EVALUATION",
          article: "Article 55(1)(a)",
          title: "Model evaluation & adversarial testing",
          description:
            "Perform standardised model evaluations including adversarial testing to identify and mitigate systemic risks. Conduct evaluations prior to first placing on market and as appropriate during lifecycle.",
          appliesToRole: "PROVIDER",
          priority: "CRITICAL",
          deadline: "2025-08-02",
        },
        {
          id: "SYSTEMIC_RISK_MITIGATION",
          article: "Article 55(1)(b)",
          title: "Assess & mitigate systemic risks",
          description:
            "Assess and mitigate possible systemic risks at Union level, including their sources. May include risk management policies, accountability processes, post-market monitoring.",
          appliesToRole: "PROVIDER",
          templateId: "TMPL_GPAI_SYSTEMIC_RISK",
          priority: "CRITICAL",
          deadline: "2025-08-02",
        },
        {
          id: "SERIOUS_INCIDENT_TRACKING",
          article: "Article 55(1)(c)",
          title: "Track & report serious incidents",
          description:
            "Keep track of, document, and report without undue delay to the AI Office (and national authorities as appropriate) relevant information about serious incidents and possible corrective measures.",
          appliesToRole: "PROVIDER",
          priority: "CRITICAL",
          deadline: "2025-08-02",
        },
        {
          id: "CYBERSECURITY_GPAI",
          article: "Article 55(1)(d)",
          title: "Adequate cybersecurity protection",
          description:
            "Ensure an adequate level of cybersecurity protection for the general-purpose AI model with systemic risk AND the physical infrastructure of the model.",
          appliesToRole: "PROVIDER",
          priority: "HIGH",
          deadline: "2025-08-02",
        },
        {
          id: "CODES_OF_PRACTICE_ADHERENCE",
          article: "Article 56",
          title: "Adhere to codes of practice",
          description:
            "Providers of GPAI models may rely on codes of practice (Art 56) to demonstrate compliance with obligations under Articles 53 and 55, until harmonised standards are published. Adherence to a European harmonised standard grants presumption of conformity to the extent those standards cover those obligations.",
          appliesToRole: "PROVIDER",
          templateId: "TMPL_CODES_OF_PRACTICE",
          priority: "MEDIUM",
          deadline: "2025-08-02",
        },
        ...getUniversalObligations(),
      ],
      enforcementDeadline: "2025-08-02",
      fineRisk: buildFineRisk("GPAI", answers.companySize),
      nextSteps: [
        "Your GPAI model is classified as presenting SYSTEMIC RISK.",
        "⚠️ GPAI obligations have been enforceable since 2 August 2025.",
        "You must notify the AI Office within 2 weeks of meeting the threshold (Art 52(1)).",
        "You may present arguments that your model does not present systemic risks despite meeting the threshold (Art 52(2)).",
        "Compliance can be demonstrated via codes of practice (Art 55(2)) until harmonised standards are published.",
      ],
      warnings: isSystemicRisk && answers.gpaiOpenSource
        ? ["⚠️ Open-source exception does NOT apply to GPAI models with systemic risk (Art 53(2)). ALL obligations apply."]
        : [],
      smeSimplifications: [],
    };
  }

  // Standard GPAI without systemic risk
  return {
    classification: "GPAI",
    role: answers.role,
    confidence: "DEFINITIVE",
    legalBasis: ["Article 53"],
    obligations: [...baseObligations, ...getUniversalObligations()],
    enforcementDeadline: "2025-08-02",
    fineRisk: buildFineRisk("GPAI", answers.companySize),
    nextSteps: [
      "Your model is classified as a General-Purpose AI (GPAI) model.",
      "⚠️ GPAI obligations have been enforceable since 2 August 2025.",
      ...(answers.gpaiOpenSource
        ? [
            "✅ Open-source partial exemption: You are exempt from Art 53(1)(a) (technical documentation) and Art 53(1)(b) (downstream provider info).",
            "❌ You MUST still comply with Art 53(1)(c) (copyright policy) and Art 53(1)(d) (training data summary).",
          ]
        : ["Comply with all four obligations under Art 53(1)(a)-(d)."]),
    ],
    warnings: [],
    smeSimplifications: [],
  };
}

function getGPAIBaseObligations(isOpenSource: boolean, isSystemicRisk: boolean): Obligation[] {
  const obligations: Obligation[] = [];

  // Open-source models without systemic risk are exempt from (a) and (b)
  const exemptFromDocumentation = isOpenSource && !isSystemicRisk;

  if (!exemptFromDocumentation) {
    obligations.push(
      {
        id: "GPAI_TECHNICAL_DOC",
        article: "Article 53(1)(a), Annex XI",
        title: "Technical documentation",
        description:
          "Draw up and keep up-to-date technical documentation of the model including: general description, training/testing process and results, evaluation methodology, computational resources used, energy consumption. See Annex XI for full requirements.",
        appliesToRole: "PROVIDER",
        templateId: "TMPL_GPAI_TECH_DOC",
        priority: "CRITICAL",
        deadline: "2025-08-02",
      },
      {
        id: "GPAI_DOWNSTREAM_INFO",
        article: "Article 53(1)(b), Annex XII",
        title: "Downstream provider information",
        description:
          "Provide information and documentation to downstream providers integrating the model into their AI systems. See Annex XII for requirements. Must enable downstream providers to understand capabilities and comply with their own obligations.",
        appliesToRole: "PROVIDER",
        templateId: "TMPL_GPAI_DOWNSTREAM",
        priority: "HIGH",
        deadline: "2025-08-02",
      }
    );
  }

  // Always required, even for open-source
  obligations.push(
    {
      id: "GPAI_COPYRIGHT_POLICY",
      article: "Article 53(1)(c)",
      title: "Copyright compliance policy",
      description:
        "Put in place a policy to comply with EU copyright law (Directive 2019/790), in particular to identify and comply with rights reservations expressed under Article 4(3) of that Directive. Must use state-of-the-art technologies for compliance.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_COPYRIGHT_POLICY",
      priority: "HIGH",
      deadline: "2025-08-02",
    },
    {
      id: "GPAI_TRAINING_SUMMARY",
      article: "Article 53(1)(d)",
      title: "Public training data summary",
      description:
        "Draw up and make PUBLICLY available a sufficiently detailed summary about the content used for training the model, according to the template provided by the AI Office.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_TRAINING_SUMMARY",
      priority: "HIGH",
      deadline: "2025-08-02",
    }
  );

  return obligations;
}

// ============================================================================
// STEP 3: HIGH-RISK VIA SAFETY COMPONENT (Article 6(1))
// ============================================================================

function checkHighRiskSafetyComponent(answers: WizardAnswers): ClassificationResult | null {
  if (
    answers.isSafetyComponent &&
    answers.productUnderAnnexI &&
    answers.requiresThirdPartyConformity
  ) {
    return {
      classification: "HIGH_RISK",
      role: answers.role,
      confidence: "LIKELY",
      legalBasis: ["Article 6(1)", "Annex I"],
      obligations: [
        ...getHighRiskObligations(answers.role, "PRODUCT_SAFETY"),
        ...getUniversalObligations(),
      ],
      enforcementDeadline: "2027-08-02",
      fineRisk: buildFineRisk("HIGH_RISK", answers.companySize),
      nextSteps: [
        "Your AI system is HIGH-RISK as a safety component of a product under Annex I harmonisation law (Art 6(1)).",
        "Deadline: 2 August 2027 (Annex I Section A products get an extra year).",
        "Conformity assessment: Follow the procedure under the RELEVANT PRODUCT legislation (Art 43(3)). AI Act requirements become part of that assessment.",
        "Requirements from BOTH this Regulation AND product-specific legislation apply concurrently.",
      ],
      warnings: [
        "Annex I products include: machinery, toys, lifts, pressure equipment, radio equipment, medical devices, in vitro diagnostics, automotive, aviation, cableway installations, marine equipment.",
        "If your product falls under multiple EU harmonisation laws, a single declaration of conformity covering all applies (Art 47(3)).",
      ],
      smeSimplifications: getSMESimplifications(answers.companySize),
    };
  }
  return null;
}

// ============================================================================
// STEP 4: HIGH-RISK VIA ANNEX III (Article 6(2))
// v2: Fixed Annex III sub-types, added biometric verification exclusion
// ============================================================================

function checkHighRiskAnnexIII(answers: WizardAnswers): ClassificationResult | null {
  // BUG-A3 FIX: Collect ALL matching areas instead of overwriting with "last area wins".
  // Previously, sequential if-checks would overwrite `highRiskArea` so only the last
  // matching area's guidance/warnings/conformity assessment type was used. Now we collect
  // all areas and use the FIRST match as primary (biometrics first = most restrictive
  // conformity assessment, since it may require notified body involvement per Art 43(1)).
  const matchedAreas: HighRiskArea[] = [];
  const legalBasis: string[] = [];

  // Point 1: Biometrics — v2 FIX: Exclude biometric verification (recital 54)
  // BUG-H5 FIX: Point 1 applies "in so far as their use is permitted under relevant Union or national law"
  // BUG-A4 FIX: Don't require biometricType — any non-verification biometric use is high-risk
  // under Annex III point 1. The biometricType field is informational, not gating.
  if (answers.usesBiometrics && !answers.isBiometricVerificationOnly) {
    matchedAreas.push("BIOMETRICS");
    legalBasis.push("Annex III, point 1");
  }

  // Point 2: Critical infrastructure
  if (answers.criticalInfrastructure) {
    matchedAreas.push("CRITICAL_INFRASTRUCTURE");
    legalBasis.push("Annex III, point 2");
  }

  // Point 3: Education
  if (answers.educationUseCase) {
    matchedAreas.push("EDUCATION");
    legalBasis.push("Annex III, point 3");
  }

  // Point 4: Employment
  if (answers.employmentUseCase) {
    matchedAreas.push("EMPLOYMENT");
    legalBasis.push("Annex III, point 4");
  }

  // Point 5: Essential services — 4 sub-points: 5(a) public benefits, 5(b) creditworthiness+credit scoring,
  //   5(c) insurance risk/pricing, 5(d) emergency dispatch
  if (answers.essentialServicesUseCase) {
    matchedAreas.push("ESSENTIAL_SERVICES");
    legalBasis.push("Annex III, point 5");
  }

  // Point 6: Law enforcement
  // BUG-H5 FIX: Point 6 applies "in so far as their use is permitted under relevant Union or national law"
  if (answers.lawEnforcementUseCase) {
    matchedAreas.push("LAW_ENFORCEMENT");
    legalBasis.push("Annex III, point 6");
  }

  // Point 7: Migration, asylum, border control
  // BUG-H5 FIX: Point 7 applies "in so far as their use is permitted under relevant Union or national law"
  if (answers.migrationUseCase) {
    matchedAreas.push("MIGRATION_ASYLUM_BORDER");
    legalBasis.push("Annex III, point 7");
  }

  // Point 8: Justice & democracy — v2 ADDED alternative dispute resolution
  if (answers.justiceUseCase) {
    matchedAreas.push("JUSTICE_DEMOCRACY");
    legalBasis.push("Annex III, point 8");
  }

  if (matchedAreas.length === 0) return null;

  // BUG-A3 FIX: Keep last matched area as primary (backward compatible with original
  // "last area wins" design) but use matchedAreas for comprehensive warnings/guidance.
  // The critical fix is that ALL area-specific warnings, guidance, and conformity
  // assessment information are now included, not just the primary area's.
  const highRiskArea = matchedAreas[matchedAreas.length - 1];

  // ── EXCEPTION CHECK: Article 6(3) ──────────────────────────────────────

  // Override: ALWAYS high-risk if the system performs profiling (Art 6(3) last para)
  if (answers.performsProfiling) {
    // No exception possible — proceed to high-risk classification
  }
  // BUG-H1 FIX: Art 6(3) prefatory test requires system does NOT pose significant risk
  // "including by not materially influencing the outcome of decision making"
  // v2 FIX: Exception requires BOTH:
  //   (1) System does NOT pose significant risk of harm (including not materially
  //       influencing decision-making outcomes), AND
  //   (2) At least one of the four conditions (a)-(d) is met
  else if (
    !answers.posesSignificantRiskOfHarm &&  // Condition 1 (includes "not materially influencing" per Act text)
    (answers.narrowProceduralTask ||         // Condition 2(a)
     answers.improvesHumanActivity ||        // Condition 2(b)
     answers.detectsPatterns ||              // Condition 2(c)
     answers.preparatoryTask)               // Condition 2(d)
  ) {
    const exceptionConditions: string[] = [];
    if (answers.narrowProceduralTask)
      exceptionConditions.push("Narrow procedural task — Art 6(3)(a)");
    if (answers.improvesHumanActivity)
      exceptionConditions.push("Improves result of previously completed human activity — Art 6(3)(b)");
    if (answers.detectsPatterns)
      exceptionConditions.push("Detects patterns without replacing human assessment — Art 6(3)(c)");
    if (answers.preparatoryTask)
      exceptionConditions.push("Preparatory task to an assessment — Art 6(3)(d)");

    return {
      classification: "MINIMAL_RISK",
      role: answers.role,
      confidence: "LIKELY",
      legalBasis: ["Article 6(3)", ...legalBasis],
      obligations: [
        {
          id: "DOCUMENT_NON_HIGH_RISK",
          article: "Article 6(4)",
          title: "Document non-high-risk assessment",
          description:
            "You MUST document your assessment that this system is not high-risk BEFORE placing it on the market or putting it into service. This documentation must be provided to national competent authorities on request. Failure to properly document this assessment exposes you to reclassification and fines.",
          appliesToRole: "PROVIDER",
          templateId: "TMPL_NON_HIGH_RISK_ASSESSMENT",
          priority: "CRITICAL",
          deadline: "2026-08-02",
        },
        {
          id: "REGISTER_NON_HIGH_RISK",
          article: "Article 49(2), Annex VIII Section B",
          title: "Register in EU database",
          description:
            "Register yourself and the AI system in the EU database (Art 71) BEFORE placing on market. Provide information per Annex VIII, Section B: provider details, system description, condition under Art 6(3), and summary of grounds.",
          appliesToRole: "PROVIDER",
          templateId: "TMPL_EU_DB_REGISTRATION",
          priority: "CRITICAL",
          deadline: "2026-08-02",
        },
        ...getUniversalObligations(),
      ],
      enforcementDeadline: "2026-08-02",
      fineRisk: buildFineRisk("HIGH_RISK", answers.companySize),
      nextSteps: [
        `Your AI system falls under Annex III (${highRiskArea.replace(/_/g, " ")}) but qualifies for the NON-HIGH-RISK exception under Art 6(3).`,
        "Conditions met: " + exceptionConditions.join("; "),
        "⚠️ MANDATORY: You must document this assessment BEFORE placing the system on the market (Art 6(4)).",
        "⚠️ MANDATORY: You must register in the EU database (Art 49(2)).",
        "⚠️ RISK: A market surveillance authority may disagree and reclassify your system as high-risk (Art 80). If they find you deliberately misclassified to evade obligations, you face fines under Art 99.",
      ],
      warnings: [
        "This exception is narrowly interpreted. The system must genuinely not pose significant risk of harm to health, safety or fundamental rights — including by not materially influencing the outcome of decision making — AND meet at least one of the four conditions.",
        "If your system evolves to materially influence decision-making, the exception no longer applies.",
        "The Commission guidelines on Art 6(3) practical implementation (due by Feb 2026 per Art 6(5)) should be consulted once published.",
      ],
      smeSimplifications: [],
    };
  }

  // ── CONFIRMED HIGH-RISK ──────────────────────────────────────────────────
  legalBasis.unshift("Article 6(2)");

  // BUG-A3 FIX: Collect warnings for ALL matched areas, not just the primary
  const allAreaWarnings: string[] = [];
  for (const area of matchedAreas) {
    allAreaWarnings.push(...getHighRiskWarnings(area));
  }

  // BUG-A3 FIX: Include guidance for ALL matched areas
  const allAreaGuidance: string[] = matchedAreas.map(a => getHighRiskAreaGuidance(a));

  // BUG-A3 FIX: Multi-area warning
  if (matchedAreas.length > 1) {
    allAreaWarnings.push(
      `⚠️ MULTIPLE HIGH-RISK AREAS: Your system falls under ${matchedAreas.length} Annex III areas: ${matchedAreas.map(a => a.replace(/_/g, " ")).join(", ")}. All area-specific requirements and warnings apply. The most restrictive conformity assessment applies (${matchedAreas.includes("BIOMETRICS") ? "notified body may be required — Annex VII — due to biometrics" : "internal control — Annex VI"}).`
    );
  }

  // BUG-A4 FIX: Warn when biometric use type is not specified
  if (answers.usesBiometrics && !answers.isBiometricVerificationOnly && !answers.biometricType) {
    allAreaWarnings.push(
      "⚠️ Please specify the biometric use type (remote identification, categorisation, or emotion recognition) for more precise conformity assessment and obligation guidance."
    );
  }

  // BUG-A6 FIX + LAWYER AUDIT FIX: FRIA applicability per Art 27(1)
  // Art 27(1) requires FRIA for:
  //   (1) ALL Annex III deployers who are public bodies or private entities providing public services
  //   (2) ALL deployers of Annex III point 5(b) (insurance risk/pricing) or 5(c) (emergency dispatch), regardless of entity type
  // Previous code excluded BIOMETRICS and CRITICAL_INFRASTRUCTURE — this was incorrect per the Act.
  const friaAlwaysQualifyingAreas: HighRiskArea[] = ["ESSENTIAL_SERVICES", "EDUCATION", "EMPLOYMENT", "LAW_ENFORCEMENT", "MIGRATION_ASYLUM_BORDER", "JUSTICE_DEMOCRACY"];
  const baseObligations = [
    ...getHighRiskObligations(answers.role, highRiskArea),
    ...getUniversalObligations(),
  ];
  const hasFriaInBase = baseObligations.some(o => o.id === "FUNDAMENTAL_RIGHTS_IMPACT");
  const isDeployer = answers.role === "DEPLOYER" || answers.role === "BOTH";

  // Path 1: FRIA for areas that commonly involve public bodies (conservative — add for all deployers)
  const needsFriaFromCommonAreas = !hasFriaInBase && isDeployer &&
    matchedAreas.some(a => friaAlwaysQualifyingAreas.includes(a));

  // Path 2: FRIA for BIOMETRICS/CRITICAL_INFRASTRUCTURE deployers who ARE public bodies (Art 27(1))
  const needsFriaAsPublicBody = !hasFriaInBase && isDeployer &&
    answers.isPublicBodyOrPublicService === true &&
    matchedAreas.some(a => a === "BIOMETRICS" || a === "CRITICAL_INFRASTRUCTURE") &&
    !matchedAreas.some(a => friaAlwaysQualifyingAreas.includes(a));

  // Dead code: push order guarantees FRIA-qualifying areas always appear after
  // BIOMETRICS/CRITICAL_INFRASTRUCTURE in matchedAreas, so highRiskArea (last element)
  // is always an FRIA area when any FRIA area is present → hasFriaInBase is always true.
  /* v8 ignore start */
  if (needsFriaFromCommonAreas) {
    const friaArea = matchedAreas.find(a => friaAlwaysQualifyingAreas.includes(a))!;
    baseObligations.push({
      id: "FUNDAMENTAL_RIGHTS_IMPACT",
      article: "Article 27",
      title: "Fundamental rights impact assessment (FRIA)",
      description:
        `Required because your system also falls under ${friaArea.replace(/_/g, " ")} (Annex III). Required for deployers who are: (a) public bodies, or (b) private entities providing public services, or (c) deployers of Annex III point 5(b) (insurance risk/pricing), 5(c) (emergency dispatch), or 5(d) (public benefits eligibility) systems. Must assess: processes, frequency of use, affected categories of persons, specific risks, human oversight measures, mitigation measures. Perform BEFORE first use.`,
      appliesToRole: "DEPLOYER",
      templateId: "TMPL_FUNDAMENTAL_RIGHTS_IMPACT",
      priority: "CRITICAL",
      deadline: "2026-08-02",
    });
  /* v8 ignore stop */
  } else if (needsFriaAsPublicBody) {
    baseObligations.push({
      id: "FUNDAMENTAL_RIGHTS_IMPACT",
      article: "Article 27",
      title: "Fundamental rights impact assessment (FRIA)",
      description:
        "Required because you are a public body or private entity providing public services deploying an Annex III high-risk AI system (Art 27(1)). Must assess: processes, frequency of use, affected categories of persons, specific risks, human oversight measures, mitigation measures. Perform BEFORE first use.",
      appliesToRole: "DEPLOYER",
      templateId: "TMPL_FUNDAMENTAL_RIGHTS_IMPACT",
      priority: "CRITICAL",
      deadline: "2026-08-02",
    });
  }

  // Warning for BIOMETRICS/CRITICAL_INFRASTRUCTURE deployers who haven't confirmed entity type
  if (isDeployer &&
      answers.isPublicBodyOrPublicService === undefined &&
      matchedAreas.some(a => a === "BIOMETRICS" || a === "CRITICAL_INFRASTRUCTURE") &&
      !matchedAreas.some(a => friaAlwaysQualifyingAreas.includes(a)) &&
      !hasFriaInBase) {
    allAreaWarnings.push(
      "Art 27(1): A Fundamental Rights Impact Assessment (FRIA) is required if you are a PUBLIC BODY or a PRIVATE ENTITY providing PUBLIC SERVICES. Complete the 'Existing Systems & Timelines' section of the wizard to determine if this applies to you."
    );
  }

  return {
    classification: "HIGH_RISK",
    role: answers.role,
    confidence: "DEFINITIVE",
    legalBasis,
    obligations: baseObligations,
    highRiskArea,
    enforcementDeadline: "2026-08-02",
    fineRisk: buildFineRisk("HIGH_RISK", answers.companySize),
    nextSteps: [
      `Your AI system is classified as HIGH-RISK under ${highRiskArea.replace(/_/g, " ")} (Annex III).`,
      ...(matchedAreas.length > 1 ? [
        `Also classified under: ${matchedAreas.slice(1).map(a => a.replace(/_/g, " ")).join(", ")}.`,
      ] : []),
      "Enforcement deadline: 2 August 2026 (~5 months from now).",
      answers.role === "PROVIDER"
        ? "As PROVIDER: Comply with all requirements in Chapter III, Section 2 (Art 8-15) + provider obligations (Art 16-21) + conformity assessment (Art 43) + registration (Art 49)."
        : answers.role === "DEPLOYER"
        ? "As DEPLOYER: Comply with Art 26 deployer obligations: use per instructions, human oversight, monitor operations, keep logs, inform workers, inform affected persons of AI use."
        : "As PROVIDER+DEPLOYER: Both sets of obligations apply.",
      ...allAreaGuidance,
    ],
    warnings: allAreaWarnings,
    smeSimplifications: getSMESimplifications(answers.companySize),
  };
}

// ============================================================================
// TRANSPARENCY OBLIGATION BUILDER (shared by checkLimitedRisk + overlay)
// ============================================================================

function buildTransparencyObligations(answers: WizardAnswers): { obligations: Obligation[], types: TransparencyObligation[] } {
  const obligations: Obligation[] = [];
  const types: TransparencyObligation[] = [];

  if (answers.interactsWithHumans) {
    types.push("HUMAN_INTERACTION");
    obligations.push({
      id: "TRANSPARENCY_INTERACTION",
      article: "Article 50(1)",
      title: "Inform users of AI interaction",
      description:
        "PROVIDER: Design the system so natural persons are informed they are interacting with an AI system. Exception: where this is obvious from the point of view of a reasonably well-informed, observant and circumspect person, taking into account the circumstances and context of use. Must also consider vulnerable groups (age, disability) if the system is intended to interact with them.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_AI_INTERACTION_NOTICE",
      priority: "HIGH",
      deadline: "2026-08-02",
    });
  }

  if (answers.usesEmotionRecognition) {
    types.push("EMOTION_RECOGNITION");
    obligations.push({
      id: "TRANSPARENCY_EMOTION",
      article: "Article 50(3)",
      title: "Inform persons of emotion recognition",
      description:
        "DEPLOYER: Inform exposed natural persons of the emotion recognition system's operation. Process personal data in accordance with applicable law (GDPR, Directive 2016/680, Regulation 2018/1725). BUG-M5 EXCEPTION: This notification obligation does NOT apply to AI systems used for emotion recognition that are permitted by law to detect, prevent, or investigate criminal offences, subject to appropriate safeguards for the rights and freedoms of third parties (Art 50(3)).",
      appliesToRole: "DEPLOYER",
      templateId: "TMPL_EMOTION_NOTICE",
      priority: "HIGH",
      deadline: "2026-08-02",
    });
  }

  if (answers.usesBiometricCategorisation) {
    types.push("BIOMETRIC_CATEGORISATION");
    obligations.push({
      id: "TRANSPARENCY_BIOMETRIC_CAT",
      article: "Article 50(3)",
      title: "Inform persons of biometric categorisation",
      description:
        "DEPLOYER: Inform exposed natural persons of the biometric categorisation system's operation. BUG-M5 EXCEPTION: This notification obligation does NOT apply to AI systems used for biometric categorisation that are permitted by law to detect, prevent, or investigate criminal offences, subject to appropriate safeguards for the rights and freedoms of third parties (Art 50(3)).",
      appliesToRole: "DEPLOYER",
      templateId: "TMPL_BIOMETRIC_CAT_NOTICE",
      priority: "HIGH",
      deadline: "2026-08-02",
    });
  }

  if (answers.generatesDeepfakes) {
    types.push("DEEPFAKE_CONTENT");
    obligations.push({
      id: "TRANSPARENCY_DEEPFAKE",
      article: "Article 50(4)",
      title: "Disclose deepfake content",
      description:
        "DEPLOYER: Disclose that content (image, audio, video) has been artificially generated or manipulated. The disclosure must be clearly visible and labelled in a machine-readable format. Exception: law enforcement or where content is part of an obviously creative, satirical, artistic or fictional work.",
      appliesToRole: "DEPLOYER",
      templateId: "TMPL_DEEPFAKE_DISCLOSURE",
      priority: "CRITICAL",
      deadline: "2026-08-02",
    });
  }

  if (answers.generatesText) {
    types.push("AI_GENERATED_TEXT");
    obligations.push({
      id: "TRANSPARENCY_TEXT",
      article: "Article 50(4)",
      title: "Label AI-generated text",
      description:
        "AI-generated text published to inform the public on matters of public interest must be labelled as artificially generated. EXCEPTION (Art 50(4)): This obligation does NOT apply where: (1) the AI-generated content has undergone a process of human review or editorial control, AND (2) a natural or legal person holds editorial responsibility for the publication of the content. If both conditions are met, the labelling requirement is waived.",
      appliesToRole: "BOTH",
      templateId: "TMPL_AI_TEXT_LABEL",
      priority: "HIGH",
      deadline: "2026-08-02",
    });
  }

  if (answers.generatesMedia) {
    types.push("AI_GENERATED_MEDIA");
    obligations.push({
      id: "TRANSPARENCY_MEDIA",
      article: "Article 50(2)",
      title: "Machine-readable AI content marking",
      description:
        "PROVIDER: Ensure outputs of AI systems generating synthetic audio, image, video or text content are marked in a machine-readable format and detectable as artificially generated or manipulated. Technical solutions should be effective, interoperable, robust and reliable. BUG-H3 EXCEPTION: This obligation does NOT apply to AI systems that perform an assistive function for standard editing, or that do not substantially alter the input data provided by the deployer or the semantics thereof (Art 50(2)). Examples of exempt systems: spell-checkers, auto-formatters, brightness adjustors, simple filters.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_AI_MEDIA_MARKING",
      priority: "HIGH",
      deadline: "2026-08-02",
    });
  }

  return { obligations, types };
}

// ============================================================================
// POST-PROCESSING: TRANSPARENCY OVERLAY (BUG-A1/A5 FIX)
// Art 50(5): "The provisions of paragraphs 1, 2, 3 and 4 of this Article
// shall apply to the high-risk AI systems referred to in Annex III without
// prejudice to the requirements set out in Chapter III, Section 2."
// This means transparency obligations are ADDITIVE to high-risk obligations.
// ============================================================================

function applyTransparencyOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  const { obligations, types } = buildTransparencyObligations(answers);
  if (types.length === 0) return result;

  return {
    ...result,
    obligations: [...result.obligations, ...obligations],
    transparencyObligations: [
      ...(result.transparencyObligations || []),
      ...types,
    ],
    warnings: [
      ...result.warnings,
      `Art 50(5): ${types.length} transparency obligation(s) under Article 50 apply IN ADDITION to your ${result.classification.replace(/_/g, " ")} requirements. Transparency obligations are not superseded by higher-priority classification categories.`,
    ],
  };
}

// ============================================================================
// POST-PROCESSING: GPAI + HIGH-RISK DUAL CLASSIFICATION (BUG-A2 FIX)
// When a system is classified as GPAI but also triggers high-risk system
// obligations, the user needs to comply with BOTH Chapter V (GPAI) and
// Chapter III (high-risk system) obligations.
// ============================================================================

function applyGPAIHighRiskOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  const highRiskAreas: string[] = [];

  if (answers.isSafetyComponent && answers.productUnderAnnexI && answers.requiresThirdPartyConformity) {
    highRiskAreas.push("Safety component (Art 6(1))");
  }
  if (answers.usesBiometrics && !answers.isBiometricVerificationOnly) {
    highRiskAreas.push("Biometrics (Annex III, point 1)");
  }
  if (answers.criticalInfrastructure) highRiskAreas.push("Critical infrastructure (Annex III, point 2)");
  if (answers.educationUseCase) highRiskAreas.push("Education (Annex III, point 3)");
  if (answers.employmentUseCase) highRiskAreas.push("Employment (Annex III, point 4)");
  if (answers.essentialServicesUseCase) highRiskAreas.push("Essential services (Annex III, point 5)");
  if (answers.lawEnforcementUseCase) highRiskAreas.push("Law enforcement (Annex III, point 6)");
  if (answers.migrationUseCase) highRiskAreas.push("Migration/asylum/border (Annex III, point 7)");
  if (answers.justiceUseCase) highRiskAreas.push("Justice/democracy (Annex III, point 8)");

  if (highRiskAreas.length === 0) return result;

  return {
    ...result,
    warnings: [
      ...result.warnings,
      `⚠️ DUAL CLASSIFICATION: Your system triggers BOTH GPAI model obligations (Chapter V) AND high-risk system obligations (Chapter III). High-risk areas detected: ${highRiskAreas.join("; ")}. The EU AI Act operates on two layers: model-level GPAI obligations (Art 51-56) apply to the model provider, while high-risk system obligations (Art 6-49) apply to the system provider/deployer. You must comply with BOTH sets of obligations. Run the classification separately for the system-level (without the GPAI flag) to get your full high-risk compliance requirements.`,
    ],
    nextSteps: [
      ...result.nextSteps,
      `⚠️ ACTION REQUIRED: Perform a separate classification for your high-risk AI SYSTEM (distinct from the GPAI MODEL) to obtain the full Chapter III obligations for: ${highRiskAreas.join("; ")}.`,
    ],
  };
}

// ============================================================================
// ART 25: "BECOMING A PROVIDER" OVERLAY
// Any distributor, importer, deployer becomes a PROVIDER if they:
//   (a) Put their name/trademark on a high-risk AI system (Art 25(1)(a))
//   (b) Make a substantial modification to a high-risk AI system (Art 25(1)(b))
//   (c) Modify intended purpose making an AI system high-risk (Art 25(1)(c))
// This is the single most dangerous gap for SMBs.
// ============================================================================

function applyArt25ProviderUpgradeOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  const triggers: string[] = [];

  if (answers.putOwnNameOrBrandOnSystem) {
    triggers.push("Art 25(1)(a): You put your own name or trademark on a high-risk AI system already placed on the market. This makes you the PROVIDER for regulatory purposes.");
  }
  if (answers.madeSubstantialModification) {
    triggers.push("Art 25(1)(b): You made a substantial modification to a high-risk AI system already placed on the market. The original provider is no longer responsible — YOU are now the provider and must redo the conformity assessment.");
  }
  if (answers.changedPurposeToHighRisk) {
    triggers.push("Art 25(1)(c): You modified the intended purpose of an AI system (including GPAI) in a way that makes it high-risk. You are now the provider of that high-risk system and must comply with ALL provider obligations in Art 16.");
  }

  if (triggers.length === 0) return result;

  // The user's declared role may be DEPLOYER, IMPORTER, or DISTRIBUTOR, but
  // Art 25 upgrades them to PROVIDER for obligation purposes.
  const originalRole = result.role;
  const effectiveRole: Role = (originalRole === "DEPLOYER" || originalRole === "IMPORTER" || originalRole === "DISTRIBUTOR")
    ? "PROVIDER"
    : originalRole; // BOTH or already PROVIDER

  // If classified as HIGH_RISK, add provider obligations they might be missing
  let additionalObligations: Obligation[] = [];
  if (result.classification === "HIGH_RISK" && originalRole !== "PROVIDER" && originalRole !== "BOTH") {
    const area = result.highRiskArea!;
    const providerObligations = getHighRiskObligations("PROVIDER", area);
    const existingIds = new Set(result.obligations.map(o => o.id));
    additionalObligations = providerObligations.filter(o => !existingIds.has(o.id));
  }

  return {
    ...result,
    role: effectiveRole,
    detectedRoles: [...new Set([...(result.detectedRoles || [result.role]), effectiveRole, originalRole])],
    art25ProviderUpgrade: true,
    obligations: [...result.obligations, ...additionalObligations],
    warnings: [
      ...result.warnings,
      `🚨 ART 25 PROVIDER UPGRADE: Although you identified as ${originalRole}, the following actions make you a PROVIDER under the EU AI Act:`,
      ...triggers,
      "As a newly-designated provider, ALL provider obligations apply to you (Art 16). The original provider of the system you modified is no longer solely responsible.",
      "Art 25(2): The original provider must provide you with technical documentation, information, and technical access needed to fulfil provider obligations.",
      "Art 25(3): The obligations in this article do not apply to entities subject to open-source exceptions under Art 53(2).",
    ],
    nextSteps: [
      ...result.nextSteps,
      `⚠️ CRITICAL: Your effective role has been upgraded from ${originalRole} to PROVIDER. Review all provider obligations carefully.`,
      "Contact the original provider/manufacturer to obtain: technical documentation, conformity assessment records, EU declaration of conformity, and any other information needed for your own compliance.",
      ...(answers.madeSubstantialModification ? [
        "Since you made a substantial modification: you MUST redo the conformity assessment (Art 43) and update the EU database registration (Art 49) BEFORE continuing to make the system available.",
      ] : []),
    ],
  };
}

// ============================================================================
// EXTENDED ROLE OBLIGATIONS: IMPORTER, DISTRIBUTOR, AUTHORISED REPRESENTATIVE
// Art 28 (Importers), Art 29 (Distributors), Art 22 (Authorised Representatives)
// ============================================================================

function applyExtendedRoleObligations(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  if (result.classification !== "HIGH_RISK") return result;

  const additionalObligations: Obligation[] = [];
  const additionalWarnings: string[] = [];
  const additionalNextSteps: string[] = [];
  const deadline = result.enforcementDeadline;

  // ── IMPORTER obligations (Art 28) ──
  if (answers.broughtSystemFromOutsideEU || answers.role === "IMPORTER") {
    additionalObligations.push(
      {
        id: "IMPORTER_VERIFY_CONFORMITY",
        article: "Article 28(1)",
        title: "Verify provider conformity assessment",
        description: "Before placing a high-risk AI system on the EU market, verify that the provider has: (a) carried out the conformity assessment (Art 43), (b) drawn up technical documentation (Annex IV), (c) affixed CE marking, (d) provided instructions for use (Art 13). Verify the provider has appointed an authorised representative if required.",
        appliesToRole: "IMPORTER" as Role,
        templateId: "TMPL_IMPORTER_CHECKLIST",
        priority: "CRITICAL",
        deadline,
      },
      {
        id: "IMPORTER_IDENTIFY_SELF",
        article: "Article 28(2)",
        title: "Importer identification on system",
        description: "Indicate your name, registered trade name or trademark, and contact address on the high-risk AI system, its packaging, or accompanying documentation.",
        appliesToRole: "IMPORTER" as Role,
        priority: "HIGH",
        deadline,
      },
      {
        id: "IMPORTER_STORAGE_TRANSPORT",
        article: "Article 28(3)",
        title: "Ensure storage/transport conditions",
        description: "Ensure that storage and transport conditions do not jeopardise compliance with Chapter III, Section 2 requirements while the system is under your responsibility.",
        appliesToRole: "IMPORTER" as Role,
        priority: "MEDIUM",
        deadline,
      },
      {
        id: "IMPORTER_DOCUMENTATION_10YR",
        article: "Article 28(4)",
        title: "Keep EU declaration copy (10 years)",
        description: "Keep a copy of the EU declaration of conformity and technical documentation available for national competent authorities for 10 years after the system is placed on the market.",
        appliesToRole: "IMPORTER" as Role,
        priority: "MEDIUM",
        deadline,
      },
      {
        id: "IMPORTER_COOPERATE_AUTHORITIES",
        article: "Article 28(5)",
        title: "Cooperate with authorities",
        description: "Provide national competent authorities with all information and documentation necessary to demonstrate conformity. Cooperate with their actions including access to auto-generated logs.",
        appliesToRole: "IMPORTER" as Role,
        priority: "HIGH",
        deadline,
      }
    );
    additionalWarnings.push(
      "⚠️ IMPORTER: As an importer, you are bringing a non-EU AI system into the EU market. If the provider has not fulfilled their obligations, the system may not be placed on the EU market. Art 28(1): You have an active verification duty — not just passive acceptance."
    );
    additionalNextSteps.push(
      "IMPORTER ACTION: Before placing on market — verify CE marking, EU declaration, technical documentation, and authorised representative appointment (if provider is non-EU)."
    );
  }

  // ── DISTRIBUTOR obligations (Art 29) ──
  if (answers.resellsOrDistributesSystem || answers.role === "DISTRIBUTOR") {
    additionalObligations.push(
      {
        id: "DISTRIBUTOR_VERIFY_COMPLIANCE",
        article: "Article 29(1)",
        title: "Verify CE marking and documentation",
        description: "Before making a high-risk AI system available on the market, verify that: (a) the provider has affixed CE marking, (b) the provider has drawn up the EU declaration of conformity and instructions for use, (c) the importer (if applicable) has complied with Art 28.",
        appliesToRole: "DISTRIBUTOR" as Role,
        templateId: "TMPL_DISTRIBUTOR_CHECKLIST",
        priority: "CRITICAL",
        deadline,
      },
      {
        id: "DISTRIBUTOR_STORAGE_TRANSPORT",
        article: "Article 29(2)",
        title: "Ensure storage/transport conditions",
        description: "Ensure storage and transport conditions do not jeopardise compliance while the system is under your responsibility.",
        appliesToRole: "DISTRIBUTOR" as Role,
        priority: "MEDIUM",
        deadline,
      },
      {
        id: "DISTRIBUTOR_NON_CONFORMITY_ACTION",
        article: "Article 29(3)",
        title: "Act on non-conformity",
        description: "If you have reason to consider a high-risk AI system is not in conformity: do NOT make it available until it is brought into conformity. Inform the provider and/or importer and market surveillance authorities. If it presents a risk: immediately inform the provider/importer and authorities.",
        appliesToRole: "DISTRIBUTOR" as Role,
        priority: "HIGH",
        deadline,
      },
      {
        id: "DISTRIBUTOR_COOPERATE_AUTHORITIES",
        article: "Article 29(4)",
        title: "Cooperate with authorities",
        description: "Provide national competent authorities with all information and documentation to demonstrate conformity. Cooperate on any action taken including recall and withdrawal.",
        appliesToRole: "DISTRIBUTOR" as Role,
        priority: "HIGH",
        deadline,
      }
    );
    additionalWarnings.push(
      "⚠️ DISTRIBUTOR: As a distributor, you have an active duty to verify compliance before making the system available. If you have reason to believe the system is non-conformant, you must NOT distribute it."
    );
    additionalNextSteps.push(
      "DISTRIBUTOR ACTION: Verify CE marking, EU declaration of conformity, instructions for use, and importer compliance before distributing."
    );
  }

  // ── AUTHORISED REPRESENTATIVE obligations (Art 22) ──
  if (answers.appointedAsAuthorisedRep || answers.role === "AUTHORISED_REPRESENTATIVE") {
    additionalObligations.push(
      {
        id: "AUTH_REP_VERIFY_DOCUMENTATION",
        article: "Article 22(2)(a)",
        title: "Verify EU declaration and tech docs exist",
        description: "Verify that the EU declaration of conformity (Art 47) and technical documentation (Art 11) have been drawn up by the provider, and that the conformity assessment (Art 43) has been carried out.",
        appliesToRole: "AUTHORISED_REPRESENTATIVE" as Role,
        templateId: "TMPL_AUTH_REP_MANDATE",
        priority: "CRITICAL",
        deadline,
      },
      {
        id: "AUTH_REP_KEEP_DOCUMENTATION",
        article: "Article 22(2)(b)",
        title: "Keep documentation available (10 years)",
        description: "Keep the EU declaration of conformity, technical documentation, and conformity assessment results at the disposal of competent authorities for 10 years after the system was placed on the market.",
        appliesToRole: "AUTHORISED_REPRESENTATIVE" as Role,
        priority: "HIGH",
        deadline,
      },
      {
        id: "AUTH_REP_COOPERATE_AUTHORITIES",
        article: "Article 22(2)(c)",
        title: "Cooperate with authorities",
        description: "Provide a national competent authority, upon a reasoned request, with all information and documentation necessary to demonstrate conformity. Cooperate on any corrective action taken.",
        appliesToRole: "AUTHORISED_REPRESENTATIVE" as Role,
        priority: "HIGH",
        deadline,
      },
      {
        id: "AUTH_REP_TERMINATE_MANDATE",
        article: "Article 22(4)",
        title: "Terminate mandate if provider is non-compliant",
        description: "If you have reason to consider the provider acts contrary to their obligations under this Regulation, you shall terminate the mandate, inform the relevant market surveillance authority and the AI Office.",
        appliesToRole: "AUTHORISED_REPRESENTATIVE" as Role,
        priority: "HIGH",
        deadline,
      }
    );
    additionalWarnings.push(
      "⚠️ AUTHORISED REPRESENTATIVE: You are acting on behalf of a non-EU provider. You carry personal responsibility for documentation, cooperation with authorities, and must terminate the mandate if the provider is non-compliant (Art 22(4))."
    );
  }

  if (additionalObligations.length === 0) return result;

  const detectedRoles = [...new Set([...(result.detectedRoles || [result.role]),
    ...(answers.broughtSystemFromOutsideEU || answers.role === "IMPORTER" ? ["IMPORTER" as Role] : []),
    ...(answers.resellsOrDistributesSystem || answers.role === "DISTRIBUTOR" ? ["DISTRIBUTOR" as Role] : []),
    ...(answers.appointedAsAuthorisedRep || answers.role === "AUTHORISED_REPRESENTATIVE" ? ["AUTHORISED_REPRESENTATIVE" as Role] : []),
  ])];

  return {
    ...result,
    detectedRoles,
    obligations: [...result.obligations, ...additionalObligations],
    warnings: [...result.warnings, ...additionalWarnings],
    nextSteps: [...result.nextSteps, ...additionalNextSteps],
  };
}

// ============================================================================
// EXTRATERRITORIAL SCOPE + AUTHORISED REPRESENTATIVE (Art 2(1), Art 22)
// Non-EU providers/importers MUST appoint an authorised rep in the EU
// ============================================================================

function applyExtraterritorialOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  if (answers.isEUBased || !answers.outputUsedInEU) return result;

  // Non-EU entity whose AI output is used in the EU
  const warnings: string[] = [];
  const nextSteps: string[] = [];

  warnings.push(
    "⚠️ EXTRATERRITORIAL APPLICATION (Art 2(1)): Your company is not EU-based but the output of your AI system is used in the EU. The EU AI Act applies to you in full."
  );

  // Art 22 + Art 16(j): Non-EU high-risk provider must appoint authorised rep
  if (result.classification === "HIGH_RISK" && (result.role === "PROVIDER" || result.role === "BOTH")) {
    if (!answers.hasAuthorisedRepInEU) {
      warnings.push(
        "🚨 BLOCKING REQUIREMENT — Art 22(1): As a non-EU provider of a high-risk AI system, you MUST appoint a written-mandated authorised representative established in the EU BEFORE placing the system on the market or putting it into service. Without this, you CANNOT legally place the system on the EU market."
      );
      nextSteps.push(
        "IMMEDIATE ACTION: Appoint an EU-authorized representative per Art 22. The representative must be established in at least one Member State. The mandate must be in writing and include authority for: verifying documentation, cooperating with authorities, and providing conformity information on request."
      );
      result = {
        ...result,
        obligations: [...result.obligations, {
          id: "APPOINT_AUTHORISED_REP",
          article: "Article 22(1)",
          title: "Appoint EU authorised representative",
          description: "As a non-EU provider of a high-risk AI system, you MUST appoint a written-mandated authorised representative established in the Union BEFORE placing the system on the market. The authorised representative shall perform the tasks specified in the mandate received from the provider.",
          appliesToRole: "PROVIDER",
          priority: "CRITICAL",
          deadline: result.enforcementDeadline,
        }],
      };
    } else {
      nextSteps.push(
        "You have confirmed an authorised representative in the EU. Ensure the mandate is in writing and covers: documentation verification, authority cooperation, and conformity reporting."
      );
    }
  }

  // GPAI providers also need representation
  if ((result.classification === "GPAI" || result.classification === "GPAI_SYSTEMIC") && !answers.hasAuthorisedRepInEU) {
    warnings.push(
      "⚠️ Art 54(1): Non-EU GPAI model providers placing models on the EU market must appoint an authorised representative established in the EU BEFORE making the model available."
    );
    nextSteps.push(
      "GPAI: Appoint an EU authorised representative per Art 54. The representative must be able to demonstrate compliance with Art 53 obligations."
    );
  }

  // Defensive guard: warnings is always non-empty because we push the
  // EXTRATERRITORIAL APPLICATION warning on function entry.
  /* v8 ignore start */
  if (warnings.length === 0) return result;
  /* v8 ignore stop */

  return {
    ...result,
    warnings: [...result.warnings, ...warnings],
    nextSteps: [...result.nextSteps, ...nextSteps],
  };
}

// ============================================================================
// TRANSITIONAL PROVISIONS (Art 111-113)
// Adjusts enforcement deadlines based on when the system was deployed
// ============================================================================

function applyTransitionalProvisionsOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  const provisions: string[] = [];

  // Art 111(1): Systems already on the market before Aug 2, 2026
  if (answers.systemAlreadyOnMarketBeforeAug2026 && result.classification === "HIGH_RISK") {
    provisions.push(
      "Art 111(1): Your high-risk AI system is already on the market/in service before 2 August 2026. It may continue to operate IF it does not undergo 'significant changes' in its design or intended purpose after that date. If it does undergo significant changes, full compliance is required."
    );
  }

  // Art 111: GPAI already on market before Aug 2, 2025
  if (answers.gpaiAlreadyOnMarketBeforeAug2025 && (result.classification === "GPAI" || result.classification === "GPAI_SYSTEMIC")) {
    provisions.push(
      "Art 111(2): Your GPAI model was placed on the market before 2 August 2025. You must comply with GPAI obligations by 2 August 2027. This gives you a 2-year transition window. However, if you release a NEW version or substantially modify the model, full compliance applies immediately."
    );
  }

  // Art 111(2): Public authority deployers
  if (answers.usedByPublicAuthority && result.classification === "HIGH_RISK" && result.role !== "PROVIDER") {
    provisions.push(
      "Art 111(2): High-risk AI systems used by public authorities (deployers) that were placed on the market or put into service before 2 August 2026 have until 2 August 2030 to comply — BUT ONLY if those systems do not undergo 'significant changes' in design or intended purpose."
    );
  }

  // Annex X: Large-scale IT systems
  if (answers.isLargeScaleITSystem) {
    provisions.push(
      "Art 111(1): Large-scale IT systems listed in Annex X (SIS II, VIS, EES, ETIAS, ECRIS-TCN, interoperability components under Regulations 2019/817 and 2019/818) have until 31 December 2030 to comply with this Regulation. This applies only to systems already operational before 2 August 2026."
    );
  }

  if (provisions.length === 0) return result;

  return {
    ...result,
    transitionalProvisions: provisions,
    warnings: [
      ...result.warnings,
      ...provisions.map(p => `⏳ TRANSITION: ${p}`),
    ],
    nextSteps: [
      ...result.nextSteps,
      "Review the transitional provisions carefully. Grace periods do NOT apply if you make 'significant changes' to the system's design or intended purpose.",
    ],
  };
}

// ============================================================================
// SECTOR-SPECIFIC LEGISLATION INTERPLAY (Art 2(5)-(8), Art 43(3))
// Medical devices, automotive, aviation, etc. change conformity assessment
// ============================================================================

function applySectorSpecificOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  if (!answers.sectorSpecificLegislation || answers.sectorSpecificLegislation === "NONE") return result;

  const sectorGuidance: string[] = [];

  const sectorMap: Record<string, { name: string; regulation: string; guidance: string }> = {
    MEDICAL_DEVICE: {
      name: "Medical Devices",
      regulation: "Regulation (EU) 2017/745 (MDR)",
      guidance: "Art 43(3): Your conformity assessment follows the MDR procedure, NOT the AI Act's Annex VI/VII. The notified body under MDR assesses AI Act requirements as part of the MDR conformity assessment. Requirements from BOTH regulations apply concurrently. The MDR notified body must meet AI Act Art 31 standards to assess AI-specific requirements.",
    },
    IVDR: {
      name: "In Vitro Diagnostic Medical Devices",
      regulation: "Regulation (EU) 2017/746 (IVDR)",
      guidance: "Art 43(3): Your conformity assessment follows the IVDR procedure. The IVDR notified body covers AI Act requirements within the IVDR assessment. Both IVDR and AI Act requirements apply concurrently.",
    },
    AUTOMOTIVE: {
      name: "Automotive",
      regulation: "Regulation (EU) 2019/2144 (Vehicle General Safety)",
      guidance: "Art 43(3): AI systems in motor vehicles follow the type-approval procedure under vehicle safety regulation. AI Act high-risk requirements become part of the type-approval. The EU type-approval authority covers AI compliance within the vehicle homologation process.",
    },
    AVIATION: {
      name: "Civil Aviation",
      regulation: "Regulation (EU) 2018/1139 (EASA)",
      guidance: "Art 43(3): AI systems in aviation follow the EASA certification process. EASA's certification specifications may include AI Act requirements. Contact your EASA-recognised design organisation for specific guidance on AI components in aviation products.",
    },
    MARINE: {
      name: "Marine Equipment",
      regulation: "Directive 2014/90/EU (Marine Equipment)",
      guidance: "AI components in marine equipment follow the Marine Equipment Directive conformity assessment. Check with the notified body whether AI Act requirements are integrated into the MED assessment.",
    },
    RAILWAY: {
      name: "Railway",
      regulation: "Directive (EU) 2016/797 (Railway Interoperability)",
      guidance: "AI in railway systems follows the Railway Interoperability Directive conformity assessment. ERA (EU Agency for Railways) may issue technical specifications including AI requirements.",
    },
    MACHINERY: {
      name: "Machinery",
      regulation: "Regulation (EU) 2023/1230 (Machinery Regulation)",
      guidance: "Art 43(3): AI safety components in machinery follow the new Machinery Regulation conformity assessment. The Machinery Regulation already addresses AI-specific risks. Both sets of requirements apply concurrently.",
    },
    TOYS: {
      name: "Toys Safety",
      regulation: "Directive 2009/48/EC (Toy Safety)",
      guidance: "AI-enabled toys follow the Toy Safety Directive conformity assessment. Special attention to child safety and data processing of children's data under GDPR Art 8.",
    },
    LIFTS: {
      name: "Lifts",
      regulation: "Directive 2014/33/EU (Lifts)",
      guidance: "AI safety components in lifts follow the Lifts Directive conformity assessment. The notified body under the Lifts Directive covers AI requirements.",
    },
    RADIO_EQUIPMENT: {
      name: "Radio Equipment",
      regulation: "Directive 2014/53/EU (RED)",
      guidance: "AI in radio equipment follows the Radio Equipment Directive conformity assessment. Relevant for IoT devices with AI capabilities that communicate wirelessly.",
    },
  };

  // All non-"NONE" sectorSpecificLegislation values are guaranteed to exist in sectorMap
  // by the WizardAnswers type union, so sector is always defined here.
  const sector = sectorMap[answers.sectorSpecificLegislation!]!;
  sectorGuidance.push(
    `SECTOR: ${sector.name} — ${sector.regulation}`,
    sector.guidance,
    "Art 2(5)-(8): When sector-specific EU legislation already imposes requirements equivalent to those in this Regulation, those sector-specific requirements apply. Annex I Section A lists the harmonised legislation whose conformity assessment procedures cover AI Act requirements."
  );

  return {
    ...result,
    sectorSpecificGuidance: sectorGuidance,
    warnings: [
      ...result.warnings,
      `⚠️ SECTOR-SPECIFIC: Your AI system falls under ${sector.name} legislation. The conformity assessment procedure and notified body requirements may differ from the standard AI Act path. See sector-specific guidance in your report.`,
    ],
    nextSteps: [
      ...result.nextSteps,
      `Contact your ${sector.name} notified body to confirm they can assess AI Act compliance within the existing sector-specific conformity assessment.`,
    ],
  };
}

// ============================================================================
// GPAI SUPPLY CHAIN (Art 53(3), Art 25(1)(c))
// When GPAI is used as a component in a high-risk system
// ============================================================================

function applyGPAISupplyChainOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  const warnings: string[] = [];
  const nextSteps: string[] = [];

  // GPAI provider must cooperate when their model is integrated downstream
  if (answers.gpaiUsedAsHighRiskComponent && (result.classification === "GPAI" || result.classification === "GPAI_SYSTEMIC")) {
    warnings.push(
      "⚠️ GPAI SUPPLY CHAIN (Art 53(3)): Your GPAI model is used as a component in a downstream high-risk AI system. You must: (a) cooperate with the high-risk system provider, (b) provide technical documentation and information needed for the system provider to comply with Chapter III obligations, (c) comply with Art 53 obligations without prejudice to the system provider's own obligations."
    );
    nextSteps.push(
      "ACTION: Establish a cooperation agreement with the downstream high-risk system provider covering: technical documentation sharing, information updates, incident notification, and ongoing support for their conformity assessment.",
      "Provide Annex XII information package to enable the system provider to understand your model's capabilities, limitations, and risks."
    );
  }

  // Deployer using GPAI-powered system — who does what?
  // Dead code: checkGPAI() classifies isGeneralPurposeModel=true systems as GPAI/GPAI_SYSTEMIC
  // before HIGH_RISK is ever reached, so result.classification can never be HIGH_RISK here.
  /* v8 ignore start */
  if (answers.isGeneralPurposeModel && result.classification === "HIGH_RISK") {
    warnings.push(
      "⚠️ GPAI IN HIGH-RISK SYSTEM: Your high-risk system uses a GPAI model. Obligation split: the GPAI model provider (Chapter V obligations) must cooperate with you (system provider/deployer, Chapter III obligations). You cannot shift your Chapter III obligations to the GPAI provider — you must independently verify compliance."
    );
  }
  /* v8 ignore stop */

  if (warnings.length === 0) return result;

  return {
    ...result,
    warnings: [...result.warnings, ...warnings],
    nextSteps: [...result.nextSteps, ...nextSteps],
    valueChainWarnings: [...(result.valueChainWarnings || []), ...warnings],
  };
}

// ============================================================================
// SUBSTANTIAL MODIFICATION (Art 6(6))
// Triggers re-assessment obligation
// ============================================================================

function applySubstantialModificationOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  if (!answers.madeSubstantialModification) return result;

  return {
    ...result,
    substantialModificationFlag: true,
    obligations: [
      ...result.obligations,
      {
        id: "SUBSTANTIAL_MOD_REASSESSMENT",
        article: "Article 6(6)",
        title: "Substantial modification re-assessment",
        description:
          "A substantial modification to a high-risk AI system requires: (1) redo the conformity assessment (Art 43), (2) update technical documentation (Art 11), (3) update EU database registration (Art 49), (4) issue new EU declaration of conformity (Art 47). The system may NOT continue to be used/made available until re-assessment is complete.",
        appliesToRole: "PROVIDER",
        templateId: "TMPL_SUBSTANTIAL_MOD_ASSESSMENT",
        priority: "CRITICAL",
        deadline: result.enforcementDeadline, // always set by base classification
      },
    ],
    warnings: [
      ...result.warnings,
      "🚨 SUBSTANTIAL MODIFICATION (Art 6(6)): A 'substantial modification' means a change to a high-risk AI system after placing on market/putting into service that: (a) was not foreseen or planned by the provider in the initial conformity assessment, AND (b) affects the system's compliance with the requirements of Chapter III, Section 2, or results in a modification to the intended purpose for which the system was assessed. Examples: changing the training data/algorithm, changing output behaviour, expanding to new use cases.",
    ],
    nextSteps: [
      ...result.nextSteps,
      "⚠️ RE-ASSESSMENT REQUIRED: Because you made a substantial modification, you must: (1) redo the conformity assessment (Art 43), (2) update technical documentation (Art 11), (3) update EU database registration (Art 49), (4) issue new EU declaration of conformity (Art 47). The system may NOT continue to be used/made available until re-assessment is complete.",
    ],
  };
}

// ============================================================================
// GDPR DEEP INTERPLAY (Art 10(5), Art 26(7)-(9), Recital 69)
// ============================================================================

function applyGDPRInterplayOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  const gdprItems: string[] = [];

  // Recital 69: AI Act does NOT provide the legal basis for data processing
  if (answers.processesPersonalData) {
    gdprItems.push(
      "Recital 69: The EU AI Act does NOT provide a legal basis for processing personal data. You must independently establish a valid GDPR legal basis (Art 6 GDPR) for all personal data processing by your AI system. Common bases: legitimate interest (Art 6(1)(f)), contract performance (Art 6(1)(b)), or explicit consent (Art 6(1)(a)). Public authorities: legal obligation (Art 6(1)(c)) or public interest (Art 6(1)(e))."
    );
  }

  // Art 10(5): Special category data derogation for bias detection
  if (answers.processesSpecialCategoryData) {
    gdprItems.push(
      "Art 10(5) DEROGATION: The AI Act provides a specific legal basis to process special categories of personal data (Art 9 GDPR: racial/ethnic origin, political opinions, religious beliefs, health, sexual orientation, biometrics) strictly for the purposes of bias detection and correction. Conditions: (a) cannot achieve the bias monitoring objective through synthetic/anonymised data, (b) protected with appropriate safeguards including encryption, pseudonymisation, and data minimisation, (c) data is deleted once the bias has been corrected or the retention period has expired, (d) does not include transmission of that data to any other party except competent authorities."
    );
  }

  // Art 26(9): DPIA + FRIA equivalence
  if ((result.classification === "HIGH_RISK") && (result.role === "DEPLOYER" || result.role === "BOTH")) {
    gdprItems.push(
      "Art 26(9): When performing a DPIA under Art 35 GDPR, use the information provided by the provider (Art 13 instructions for use). If you have already carried out a Fundamental Rights Impact Assessment (Art 27), the FRIA shall complement the DPIA — they are separate but complementary assessments."
    );
  }

  // Art 10 + Art 99: Data governance fine bracket distinction
  if (result.classification === "HIGH_RISK" && answers.processesPersonalData) {
    gdprItems.push(
      "⚠️ Art 10 DATA GOVERNANCE — HIGHER FINE BRACKET: Non-compliance with data governance requirements (Art 10) is subject to fines up to €35M or 7% of global annual turnover (Art 99(3)), NOT the standard high-risk €15M/3% bracket (Art 99(4)). Art 10 covers: training data quality, governance, representativeness, bias examination, and appropriate data preparation measures. This is the SAME fine bracket as prohibited practices."
    );
  }

  // Art 26(7): Worker information (GDPR + employment law)
  if (answers.employmentUseCase && (result.role === "DEPLOYER" || result.role === "BOTH")) {
    gdprItems.push(
      "Art 26(7): Before using a high-risk AI system in the workplace, you MUST inform workers' representatives and affected workers. This interacts with GDPR Art 13-14 (data subject notification), Art 22 (automated decision-making), and national employment law. Employee consent is generally NOT a valid legal basis due to power imbalance (EDPB Guidelines 05/2020)."
    );
  }

  // Children's data
  if (answers.processesChildrenData) {
    gdprItems.push(
      "GDPR Art 8 + AI Act: If your AI system processes children's data, heightened protections apply: (a) GDPR requires parental/guardian consent for children under 16 (or lower as per Member State law, minimum 13), (b) the AI Act requires special consideration of children in risk assessments, (c) data minimisation is strictly enforced for children."
    );
  }

  if (gdprItems.length === 0) return result;

  return {
    ...result,
    gdprInterplay: gdprItems,
    warnings: [
      ...result.warnings,
      "⚠️ DUAL COMPLIANCE: GDPR and the EU AI Act apply concurrently. GDPR is already fully enforced with fines up to €20M or 4% of global turnover. See GDPR interplay details in your report.",
    ],
    nextSteps: [
      ...result.nextSteps,
      "Review your GDPR compliance alongside AI Act compliance. Consider a joint DPIA + FRIA assessment where both apply.",
    ],
  };
}

// ============================================================================
// REGULATORY SANDBOX GUIDANCE (Art 57-63)
// ============================================================================

function applySandboxOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  if (result.classification === "PROHIBITED") return result; // Can't sandbox prohibited practices

  const guidance: string[] = [
    "Art 57(1): Each Member State must establish at least one AI regulatory sandbox by 2 August 2026. Sandboxes provide a controlled environment to develop, train, validate, and test AI systems before placement on the market.",
    "Art 57(3): Sandboxes do NOT exempt you from the AI Act or other EU/national law. However, personal data lawfully collected for other purposes may be processed in the sandbox for developing AI in the public interest, subject to: (a) substantial public interest, (b) high impact on data subjects, (c) need for extensive data, (d) appropriate safeguards.",
  ];

  if (answers.companySize !== "LARGE") {
    guidance.push(
      "Art 62(1): SMEs and start-ups have PRIORITY ACCESS to AI regulatory sandboxes. Member States must ensure awareness and adequate participation channels for start-ups.",
      "Art 62(3): The AI Office and Member States must make information about sandboxes accessible, including eligibility criteria, application procedures, and timelines.",
      "Member State sandboxes active as of 2026: Check https://digital-strategy.ec.europa.eu/en/activities/regulatory-sandboxes-ai for the latest list."
    );
  }

  if (result.classification === "HIGH_RISK" || result.classification === "GPAI" || result.classification === "GPAI_SYSTEMIC") {
    guidance.push(
      "Art 58: Sandbox operation for high-risk/GPAI systems must include: (a) a sandbox plan agreed with the competent authority, (b) regular reporting to the sandbox authority, (c) exit conditions including compliance milestones, (d) an exit report that can serve as support for conformity assessment. Successful sandbox participation can facilitate your conformity assessment but does NOT replace it."
    );
  }

  return {
    ...result,
    sandboxGuidance: guidance,
  };
}

// ============================================================================
// VALUE CHAIN OBLIGATIONS (Art 25(2)-(5))
// When multiple actors are in the supply chain
// ============================================================================

function applyValueChainOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  if (!answers.usesThirdPartyAIComponents && !answers.broughtSystemFromOutsideEU) return result;

  const valueChainWarnings: string[] = [];

  if (answers.usesThirdPartyAIComponents) {
    valueChainWarnings.push(
      "Art 25(2): If you are a PROVIDER and use third-party AI components (models, datasets, tools) in your high-risk system, you remain responsible for the overall system's compliance. The component provider must cooperate with you and provide necessary information.",
      "Art 25(3): Third-party component providers and tool providers must provide you with: (a) required information and documentation, (b) technical access where needed to fulfil your obligations. Ensure written agreements cover these requirements.",
      "Art 25(5): If a third-party component provider does not cooperate, you may need to seek alternative components or assume provider obligations for the component yourself."
    );
  }

  if (answers.broughtSystemFromOutsideEU) {
    valueChainWarnings.push(
      "Supply chain: For AI systems from outside the EU, ensure every actor in the chain (manufacturer → authorised representative → importer → distributor → deployer) has fulfilled their role-specific obligations. A break in the compliance chain can make the entire supply chain liable."
    );
  }

  return {
    ...result,
    valueChainWarnings: [...(result.valueChainWarnings || []), ...valueChainWarnings],
    warnings: [...result.warnings, ...valueChainWarnings.map(w => `⚠️ VALUE CHAIN: ${w}`)],
  };
}

// ============================================================================
// AUTHORITY COOPERATION (Art 74-82)
// What happens when the regulator comes knocking
// ============================================================================

function applyAuthorityCooperationOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  if (result.classification === "MINIMAL_RISK" && !result.legalBasis.includes("Article 6(3)")) return result;

  const cooperation: string[] = [
    "Art 74: Each Member State designates national market surveillance authorities responsible for enforcing the AI Act. EU-level coordination is through the AI Office.",
    "Art 75: Market surveillance authorities have the power to: (a) request documentation, (b) conduct product checks, (c) access source code under strict conditions, (d) request corrective actions, (e) order recall or withdrawal.",
    "Art 79: If an authority considers a system presents a risk, it can: (a) require an evaluation, (b) order corrective measures within a set timeframe, (c) withdraw/recall/prohibit the system from the market.",
    "Art 82: You must cooperate with authorities and provide all necessary information within the timeframe they specify. Failure to cooperate is separately finable under Art 99(5) — up to €7.5M or 1% of global turnover.",
  ];

  if (result.classification === "HIGH_RISK") {
    cooperation.push(
      "Art 80: If a market surveillance authority disagrees with your Art 6(3) exception claim, it can reclassify your system as HIGH_RISK and require full compliance within a set timeframe."
    );
  }

  return {
    ...result,
    authorityCooperation: cooperation,
  };
}

// ============================================================================
// POST-BIOMETRIC ID OPERATIONS (Art 26(10))
// Specific deployer obligations for post-biometric identification
// ============================================================================

function applyPostBiometricOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  if (!answers.lawEnforcementUseCase || answers.lawEnforcementType !== "POST_BIOMETRIC_ID") return result;
  if (result.role !== "DEPLOYER" && result.role !== "BOTH") return result;

  return {
    ...result,
    obligations: [...result.obligations, {
      id: "POST_BIOMETRIC_DEPLOYER",
      article: "Article 26(10)",
      title: "Post-remote biometric identification deployer obligations",
      description: "As a deployer of a post-remote biometric identification system in law enforcement: (a) obtain prior authorisation from a judicial authority or independent administrative authority (except in duly justified urgency per Art 26(10)(a)), (b) inform the relevant market surveillance authority and data protection authority, (c) limit use to what is strictly necessary (proportionality), (d) keep logs of each use including justification, (e) report results to the relevant authority. Time limits apply to each individual use.",
      appliesToRole: "DEPLOYER",
      priority: "CRITICAL",
      deadline: result.enforcementDeadline,
    }],
    warnings: [
      ...result.warnings,
      "⚠️ POST-BIOMETRIC ID (Art 26(10)): Additional deployer safeguards apply for post-remote biometric identification in law enforcement. Each use requires prior authorisation and is subject to proportionality limits.",
    ],
  };
}

// ============================================================================
// VOLUNTARY CONFORMITY FOR MINIMAL RISK (Art 95)
// ============================================================================

function applyVoluntaryConformityOverlay(result: ClassificationResult, answers: WizardAnswers): ClassificationResult {
  if (result.classification !== "MINIMAL_RISK") return result;
  if (result.legalBasis.includes("Article 6(3)")) return result; // Art 6(3) exception has its own requirements

  return {
    ...result,
    nextSteps: [
      ...result.nextSteps,
      "Art 95: VOLUNTARY CODES OF CONDUCT — Although not legally required, you can adopt codes of conduct covering: (a) environmental sustainability, (b) accessibility for persons with disabilities, (c) stakeholder participation in design, (d) diversity of development teams, (e) voluntary application of high-risk requirements. This can differentiate your product in the market and build customer trust.",
      "Art 95(3): The AI Office and Member States shall facilitate the development of codes of conduct. Industry associations may coordinate these for their sectors.",
      "Competitive advantage: Customers, especially enterprise and public sector, increasingly require evidence of responsible AI practices. Voluntary compliance with high-risk requirements demonstrates commitment to trustworthy AI even when not legally required.",
    ],
  };
}

// ============================================================================
// STEP 5: LIMITED RISK — TRANSPARENCY (Article 50)
// ============================================================================

function checkLimitedRisk(answers: WizardAnswers): ClassificationResult | null {
  // Uses shared buildTransparencyObligations helper (extracted for BUG-A1/A5 overlay reuse)
  const { obligations, types } = buildTransparencyObligations(answers);

  if (types.length > 0) {
    return {
      classification: "LIMITED_RISK",
      role: answers.role,
      confidence: "DEFINITIVE",
      legalBasis: ["Article 50"],
      obligations: [...obligations, ...getUniversalObligations()],
      transparencyObligations: types,
      enforcementDeadline: "2026-08-02",
      fineRisk: buildFineRisk("HIGH_RISK", answers.companySize), // Same fine bracket
      nextSteps: [
        "Your AI system has LIMITED-RISK transparency obligations under Article 50.",
        "These are lighter than high-risk requirements but are LEGALLY MANDATORY.",
        `${types.length} transparency obligation(s) identified.`,
        "Core principle: People must know when they interact with AI or see AI-generated content.",
        "Enforcement: 2 August 2026.",
      ],
      warnings: [],
      smeSimplifications: [],
    };
  }

  return null;
}

// ============================================================================
// STEP 6: MINIMAL RISK (default)
// ============================================================================

function buildMinimalRiskResult(answers: WizardAnswers): ClassificationResult {
  return {
    classification: "MINIMAL_RISK",
    role: answers.role,
    confidence: "DEFINITIVE",
    legalBasis: ["Article 95 (voluntary codes of conduct)"],
    obligations: getUniversalObligations(), // v2: AI literacy always applies
    enforcementDeadline: "2026-08-02",
    fineRisk: buildFineRisk("NONE", answers.companySize),
    nextSteps: [
      "Your AI system is classified as MINIMAL RISK.",
      "No mandatory requirements under the EU AI Act beyond AI literacy (Art 4).",
      "You are encouraged to voluntarily adopt codes of conduct (Art 95).",
      "Other EU laws may still apply: GDPR, Product Safety Regulation, Consumer Protection Directives, sector-specific rules.",
      "Consider adopting transparency and ethical AI practices voluntarily — it builds customer trust and competitive advantage.",
    ],
    warnings: [],
    smeSimplifications: [],
  };
}

// ============================================================================
// HIGH-RISK OBLIGATIONS BUILDER
// v2: Now role-aware — different obligations for providers vs deployers
// ============================================================================

function getHighRiskObligations(role: Role, area: HighRiskArea | "PRODUCT_SAFETY"): Obligation[] {
  const deadline: EnforcementTimeline =
    area === "PRODUCT_SAFETY" ? "2027-08-02" : "2026-08-02";

  const providerObligations: Obligation[] = [
    {
      id: "RISK_MANAGEMENT_SYSTEM",
      article: "Article 9",
      title: "Risk management system",
      description:
        "Establish a continuous, iterative risk management process throughout the AI system's entire lifecycle. Steps: (a) identify/analyse known and foreseeable risks, (b) estimate/evaluate risks under intended use and foreseeable misuse, (c) evaluate risks from post-market monitoring data, (d) adopt targeted risk management measures. Must be regularly reviewed and updated. Testing must be performed before placing on market.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_RISK_MANAGEMENT",
      priority: "CRITICAL",
      deadline,
    },
    {
      id: "DATA_GOVERNANCE",
      article: "Article 10",
      title: "Data and data governance",
      description:
        "Training, validation and testing datasets must: be relevant, sufficiently representative, as free of errors as possible, complete for the intended purpose. Implement data governance including examination for biases, gap identification, appropriate statistical properties. Special categories of personal data may be processed exceptionally for bias detection under strict conditions.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_DATA_GOVERNANCE",
      priority: "CRITICAL",
      deadline,
    },
    {
      id: "TECHNICAL_DOCUMENTATION",
      article: "Article 11, Annex IV",
      title: "Technical documentation",
      description:
        "Draw up BEFORE placing on market. Must demonstrate compliance with Section 2 requirements. Contents per Annex IV: general system description, detailed development info, monitoring info, risk management details, changes log, standards applied, EU declaration copy, post-market monitoring plan. Keep up-to-date throughout lifetime.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_TECHNICAL_DOC",
      priority: "CRITICAL",
      deadline,
    },
    {
      id: "RECORD_KEEPING",
      article: "Article 12",
      title: "Automatic event logging",
      description:
        "System must technically allow automatic recording of events (logs) over its lifetime. Logs must enable: identifying risk situations or substantial modifications, facilitating post-market monitoring (Art 72), monitoring operation per Art 26(5). For biometric systems (Annex III point 1): additional logging of period of use, reference database, input data matches, persons involved in verification.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_LOGGING_SPEC",
      priority: "HIGH",
      deadline,
    },
    {
      id: "TRANSPARENCY_TO_DEPLOYERS",
      article: "Article 13",
      title: "Instructions for use",
      description:
        "Design for transparency. Provide deployers with: provider identity/contact, system characteristics/capabilities/limitations, intended purpose, accuracy/robustness/cybersecurity levels, known risks, human oversight measures, computational/hardware requirements, expected lifetime, maintenance info.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_INSTRUCTIONS_FOR_USE",
      priority: "CRITICAL",
      deadline,
    },
    {
      id: "HUMAN_OVERSIGHT",
      article: "Article 14",
      title: "Human oversight design",
      description:
        "Design to enable effective human oversight during use. Interface tools for oversight. Humans must be able to: fully understand capabilities/limitations, monitor operation, interpret output correctly, decide to override/not use/reverse, intervene or stop via 'stop button.' For biometric systems: no action on identification without verification by at least two competent persons.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_HUMAN_OVERSIGHT",
      priority: "CRITICAL",
      deadline,
    },
    {
      id: "ACCURACY_ROBUSTNESS_CYBERSEC",
      article: "Article 15",
      title: "Accuracy, robustness & cybersecurity",
      description:
        "Achieve appropriate levels of accuracy, robustness and cybersecurity consistent with generally acknowledged state of the art. Declare accuracy metrics in instructions for use. System must be resilient to errors, faults, inconsistencies. Technical redundancy solutions where appropriate. Protect against vulnerabilities, adversarial attacks, data/model poisoning, confidentiality attacks.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_ACCURACY_ROBUSTNESS",
      priority: "HIGH",
      deadline,
    },
    {
      id: "QUALITY_MANAGEMENT_SYSTEM",
      article: "Article 17",
      title: "Quality management system",
      description:
        "Documented QMS covering: regulatory compliance strategy, design control, development/quality control/assurance, examination/testing/validation procedures, relevant standards/specifications, data management, post-market monitoring, incident reporting, communication with authorities, supply chain and third-party management, record-keeping policies.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_QMS",
      priority: "HIGH",
      deadline,
    },
    {
      id: "DOCUMENTATION_KEEPING_10YR",
      article: "Article 18",
      title: "Documentation retention (10 years)",
      description:
        "Keep at the disposal of national competent authorities for 10 years after system placed on market: technical documentation (Art 11), QMS documentation (Art 17), approved change records, notified body decisions, EU declaration of conformity (Art 47).",
      appliesToRole: "PROVIDER",
      priority: "MEDIUM",
      deadline,
    },
    {
      id: "AUTO_LOG_RETENTION",
      article: "Article 19",
      title: "Auto-generated log retention",
      description:
        "Keep automatically generated logs for a period appropriate to intended purpose, MINIMUM 6 months, unless otherwise specified in applicable Union or national law (including data protection law).",
      appliesToRole: "PROVIDER",
      priority: "MEDIUM",
      deadline,
    },
    {
      id: "CORRECTIVE_ACTIONS",
      article: "Article 20",
      title: "Corrective actions & duty of information",
      description:
        "If system is not in conformity: immediately take corrective actions — bring into conformity, withdraw, disable, or recall. Inform distributors, deployers, authorised representatives. If system presents a risk (Art 79(1)): investigate causes (with deployer if applicable), inform market surveillance authorities and any notified body that issued a certificate.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_CORRECTIVE_ACTIONS",
      priority: "HIGH",
      deadline,
    },
    {
      id: "CONFORMITY_ASSESSMENT",
      article: "Article 43",
      title: "Conformity assessment",
      description: getConformityAssessmentDescription(area),
      appliesToRole: "PROVIDER",
      templateId: "TMPL_CONFORMITY_ASSESSMENT",
      priority: "CRITICAL",
      deadline,
    },
    {
      id: "EU_DECLARATION",
      article: "Article 47, Annex V",
      title: "EU Declaration of Conformity",
      description:
        "Draw up written/electronically signed declaration for each system. Contents per Annex V: system name/type, provider name/address, conformity statement, applicable legislation, standards/specifications used, date, signature. Keep for 10 years. Provide copy to authorities on request. Single declaration if multiple EU harmonisation laws apply.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_EU_DECLARATION",
      priority: "CRITICAL",
      deadline,
    },
    {
      id: "CE_MARKING",
      article: "Article 48",
      title: "CE marking",
      description:
        "Affix CE marking visibly, legibly, indelibly on the AI system, packaging, or documentation. For digital products: digital CE marking accessible via the system's interface. Follows general principles of Art 30 of Regulation (EC) No 765/2008.",
      appliesToRole: "PROVIDER",
      priority: "HIGH",
      deadline,
    },
    {
      id: "EU_DATABASE_REGISTRATION",
      article: "Article 49(1), Annex VIII Section A",
      title: "EU database registration",
      description:
        "Register BEFORE placing on market or putting into service. Provide: provider details, system name/trade name, intended purpose, status, conformity certificate info, Member States of availability, instructions for use URL. Exception: law enforcement/migration/border systems register in secure non-public section (Art 49(4)).",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_EU_DB_REGISTRATION",
      priority: "CRITICAL",
      deadline,
    },
    {
      id: "POST_MARKET_MONITORING",
      article: "Article 72",
      title: "Post-market monitoring",
      description:
        "Establish documented post-market monitoring system proportionate to AI technology and risks. Actively collect, document, analyse data on performance throughout lifetime from deployers and other sources. Include post-market monitoring plan in technical documentation. For financial services: may integrate with existing monitoring under financial services law.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_POST_MARKET_MONITORING",
      priority: "HIGH",
      deadline,
    },
    {
      id: "SERIOUS_INCIDENT_REPORTING",
      article: "Article 73",
      title: "Report serious incidents",
      description:
        "Report any serious incident to the market surveillance authority of the Member State where the incident occurred. 'Immediately' after establishing causal link, and in any event within 15 days of becoming aware. Serious incident = directly/indirectly leads to death, serious health damage, serious disruption to critical infrastructure, or breach of fundamental rights obligations.",
      appliesToRole: "PROVIDER",
      templateId: "TMPL_SERIOUS_INCIDENT_REPORT",
      priority: "CRITICAL",
      deadline,
    },
  ];

  // v2 ADDITION: Deployer obligations (Art 26)
  const deployerObligations: Obligation[] = [
    {
      id: "DEPLOY_PER_INSTRUCTIONS",
      article: "Article 26(1)",
      title: "Use system per instructions for use",
      description:
        "Take appropriate technical and organisational measures to ensure you use the high-risk AI system in accordance with the instructions for use provided by the provider.",
      appliesToRole: "DEPLOYER",
      priority: "CRITICAL",
      deadline,
    },
    {
      id: "ASSIGN_HUMAN_OVERSIGHT",
      article: "Article 26(2)",
      title: "Assign human oversight",
      description:
        "Assign human oversight to natural persons who have the necessary competence, training and authority, as well as necessary support resources.",
      appliesToRole: "DEPLOYER",
      templateId: "TMPL_HUMAN_OVERSIGHT",
      priority: "CRITICAL",
      deadline,
    },
    {
      id: "MONITOR_OPERATIONS",
      article: "Article 26(5)",
      title: "Monitor system operation",
      description:
        "Monitor the operation of the high-risk AI system on the basis of the instructions for use and, where relevant, inform provider if you identify any risk per Art 79(1). Suspend use if serious incident or malfunction identified.",
      appliesToRole: "DEPLOYER",
      priority: "HIGH",
      deadline,
    },
    {
      id: "KEEP_DEPLOYER_LOGS",
      article: "Article 26(6)",
      title: "Keep auto-generated logs",
      description:
        "Keep logs automatically generated by the high-risk AI system (to the extent under your control) for a minimum of 6 months, or as required by applicable law.",
      appliesToRole: "DEPLOYER",
      priority: "MEDIUM",
      deadline,
    },
    {
      id: "INFORM_WORKERS",
      article: "Article 26(7)",
      title: "Inform workers' representatives",
      description:
        "Before putting into service or using a high-risk AI system in the workplace, inform workers' representatives and affected workers that they will be subject to the use of the high-risk AI system.",
      appliesToRole: "DEPLOYER",
      templateId: "TMPL_DEPLOYER_PROCEDURES",
      priority: "HIGH",
      deadline,
    },
    {
      id: "INFORM_AFFECTED_PERSONS",
      article: "Article 26(11)",
      title: "Inform affected persons",
      description:
        "Deployers of Annex III high-risk AI systems that make/assist decisions related to natural persons must inform those persons that they are subject to the use of the high-risk AI system. For law enforcement: Art 13 of Directive 2016/680 applies instead.",
      appliesToRole: "DEPLOYER",
      templateId: "TMPL_INFORM_AFFECTED",
      priority: "HIGH",
      deadline,
    },
    {
      id: "REPORT_RISKS_TO_PROVIDER",
      article: "Article 26(8)",
      title: "Report risks & suspend use if needed",
      description:
        "If a deployer identifies that the high-risk AI system presents a risk within the meaning of Art 79(1) (risk to health, safety, or fundamental rights), they MUST: (1) inform the provider and relevant market surveillance authority without undue delay, (2) suspend use of the system until the risk is mitigated. This is particularly critical where a deployer identifies discriminatory bias in the system's outputs.",
      appliesToRole: "DEPLOYER",
      priority: "CRITICAL",
      deadline,
    },
    {
      id: "DPIA_IF_APPLICABLE",
      article: "Article 26(9)",
      title: "Data protection impact assessment",
      description:
        "Where applicable, use the information provided by the provider (Art 13) to comply with your obligation to carry out a DPIA under Art 35 of GDPR or Art 27 of Directive 2016/680.",
      appliesToRole: "DEPLOYER",
      templateId: "TMPL_DPIA_AI",
      priority: "HIGH",
      deadline,
    },
    {
      id: "DEPLOYER_REGISTRATION",
      article: "Article 49(3)",
      title: "Register as deployer (public bodies only)",
      description:
        "Deployers that are public authorities / EU institutions / bodies acting on their behalf: register in the EU database, select the specific system, register its use. Private deployers may register voluntarily.",
      appliesToRole: "DEPLOYER",
      templateId: "TMPL_EU_DB_REGISTRATION",
      priority: "HIGH",
      deadline,
    },
  ];

  // v2 ADDITION: Fundamental Rights Impact Assessment (Art 27)
  const friaObligation: Obligation = {
    id: "FUNDAMENTAL_RIGHTS_IMPACT",
    article: "Article 27",
    title: "Fundamental rights impact assessment (FRIA)",
    description:
      "Required for deployers who are: (a) public bodies, or (b) private entities providing public services, or (c) deployers of Annex III point 5(b) (insurance risk/pricing), 5(c) (emergency dispatch), or 5(d) (public benefits eligibility) systems. Must assess: processes, frequency of use, affected categories of persons, specific risks, human oversight measures, mitigation measures. Perform BEFORE first use.",
    appliesToRole: "DEPLOYER",
    templateId: "TMPL_FUNDAMENTAL_RIGHTS_IMPACT",
    priority: "CRITICAL",
    deadline,
  };

  // Assemble based on role
  if (role === "PROVIDER") {
    return providerObligations;
  } else if (role === "DEPLOYER") {
    const obligations = [...deployerObligations];
    // Add FRIA if applicable areas
    if (area === "ESSENTIAL_SERVICES" || area === "EDUCATION" || area === "EMPLOYMENT" ||
        area === "LAW_ENFORCEMENT" || area === "MIGRATION_ASYLUM_BORDER" || area === "JUSTICE_DEMOCRACY") {
      obligations.push(friaObligation);
    }
    return obligations;
  } else {
    // BOTH
    return [...providerObligations, ...deployerObligations, friaObligation];
  }
}

function getConformityAssessmentDescription(area: HighRiskArea | "PRODUCT_SAFETY"): string {
  if (area === "PRODUCT_SAFETY") {
    return "Follow the conformity assessment procedure under the relevant product legislation (Art 43(3)). AI Act requirements (Chapter III, Section 2) become part of that assessment. Notified bodies under product legislation are entitled to control AI Act compliance if they meet Art 31 requirements.";
  }
  if (area === "BIOMETRICS") {
    return "Annex III point 1 (biometrics): Choose between (a) internal control (Annex VI) if harmonised standards or common specifications applied, OR (b) quality management system + technical documentation assessment with notified body (Annex VII). If NO harmonised standards exist or only partially applied: Annex VII with notified body is REQUIRED.";
  }
  return "Annex III points 2-8: Internal control procedure (Annex VI). Provider conducts self-assessment. No notified body involvement required. The provider verifies compliance under its own responsibility.";
}

// ============================================================================
// HIGH-RISK AREA GUIDANCE & WARNINGS
// ============================================================================

function getHighRiskAreaGuidance(area: HighRiskArea): string {
  const guidance: Record<HighRiskArea, string> = {
    BIOMETRICS:
      "Biometric AI: Remote identification (identifying who someone is from a distance) is high-risk. Biometric VERIFICATION (confirming you are who you claim to be, e.g., phone unlock) is explicitly EXCLUDED and not high-risk. Conformity assessment may require notified body (Art 43(1)).",
    CRITICAL_INFRASTRUCTURE:
      "Critical infrastructure AI: Safety components in digital infrastructure, road traffic, or utility supply (water, gas, heating, electricity). Technical robustness and cybersecurity requirements are paramount. Sector-specific regulations may impose additional requirements.",
    EDUCATION:
      "Education AI: Covers (a) admission/access decisions, (b) learning outcome evaluation, (c) education level assessment, (d) behaviour monitoring during tests. Must address bias risks, especially against women, certain age groups, persons with disabilities, and ethnic minorities.",
    EMPLOYMENT:
      "Employment AI: Full lifecycle — (a) recruitment/selection (including ad targeting, CV filtering), (b) work conditions/promotion/termination, (c) task allocation based on individual traits, (d) monitoring/evaluation. Workers MUST be informed (Art 26(7)). Critical GDPR interplay — likely requires DPIA.",
    ESSENTIAL_SERVICES:
      "Essential services AI (Annex III, point 5 — 4 sub-points): (a) public assistance benefits/services eligibility, (b) creditworthiness evaluation AND credit scoring (same sub-point — excludes fraud detection), (c) life/health insurance risk assessment and pricing, (d) emergency first response services dispatch prioritisation. Financial services providers: existing regulatory frameworks (CRD, Solvency II) may overlap — Art 17(4) allows integration of QMS with existing internal governance.",
    LAW_ENFORCEMENT:
      "Law enforcement AI: Strict rules. Registration in secure non-public database section (Art 49(4)). Many uses require explicit legal basis under national/EU law. Human oversight requirements are heightened. Post-remote biometric ID in Annex III requires specific deployer obligations (Art 26(10)).",
    MIGRATION_ASYLUM_BORDER:
      "Migration/asylum/border AI: Highly sensitive context — persons often in vulnerable positions dependent on authority decisions. Accuracy, non-discrimination and transparency are critical. Registration in secure non-public database section (Art 49(4)).",
    JUSTICE_DEMOCRACY:
      "Justice & democracy AI: (a) AI assisting courts in researching/interpreting facts and law and applying the law to a concrete set of facts (always high-risk), (b) alternative dispute resolution AI, (c) AI influencing elections or voting behaviour (exception: internal campaign logistics tools not directly exposed to voters).",
  };
  return guidance[area];
}

function getHighRiskWarnings(area: HighRiskArea): string[] {
  const warnings: string[] = [];

  // BUG-H5 FIX: Annex III points 1, 6, 7 include the qualifier
  // "in so far as their use is permitted under relevant Union or national law"
  if (area === "BIOMETRICS") {
    warnings.push(
      "⚠️ Annex III point 1 applies 'in so far as [biometric] use is permitted under relevant Union or national law.' If the underlying biometric use is illegal under other law, the system may be outright illegal — not merely high-risk."
    );
  }
  if (area === "LAW_ENFORCEMENT") {
    warnings.push(
      "⚠️ Annex III point 6 applies 'in so far as [law enforcement] use is permitted under relevant Union or national law.' Ensure you have a valid legal basis under national/EU law."
    );
  }
  if (area === "MIGRATION_ASYLUM_BORDER") {
    warnings.push(
      "⚠️ Annex III point 7 applies 'in so far as [migration/asylum/border] use is permitted under relevant Union or national law.' Ensure the AI use is lawfully authorized."
    );
  }

  if (area === "LAW_ENFORCEMENT" || area === "MIGRATION_ASYLUM_BORDER") {
    warnings.push(
      "These systems must be registered in the SECURE NON-PUBLIC section of the EU database (Art 49(4)). Only the Commission and designated national authorities have access."
    );
  }
  if (area === "EMPLOYMENT") {
    warnings.push(
      "GDPR implications: AI in employment almost certainly requires a Data Protection Impact Assessment (Art 35 GDPR). Employee consent is generally not a valid legal basis due to power imbalance."
    );
  }
  if (area === "ESSENTIAL_SERVICES") {
    warnings.push(
      "Creditworthiness and credit scoring: The prohibition on fraud detection AI is an EXCEPTION — fraud detection AI is NOT high-risk under Annex III point 5. Make sure your system is genuinely for creditworthiness/scoring, not fraud detection."
    );
  }
  if (area === "BIOMETRICS") {
    warnings.push(
      "Biometric VERIFICATION (confirming identity, e.g., face unlock) is explicitly NOT high-risk. Only remote biometric IDENTIFICATION and CATEGORISATION are covered."
    );
  }

  return warnings;
}

// ============================================================================
// SME SIMPLIFICATIONS (Art 62, Art 63)
// ============================================================================

function getSMESimplifications(companySize: "MICRO" | "SMALL" | "MEDIUM" | "LARGE"): string[] {
  if (companySize === "LARGE") return [];

  const simplifications: string[] = [
    "Art 62: Member States must provide priority access to AI regulatory sandboxes for SMEs/start-ups, including from third countries if established in the EU.",
    "Fine cap advantage: SME fines are capped at the LOWER of the fixed amount vs percentage of turnover (Art 99(6)), which typically means significantly lower fines.",
  ];

  if (companySize === "MICRO") {
    simplifications.push(
      "Art 63: Microenterprises may comply with certain QMS elements (Art 17) in a SIMPLIFIED manner. The Commission shall develop guidelines on which elements can be simplified."
    );
  }

  return simplifications;
}

// ============================================================================
// FINE RISK CALCULATOR
// v2: Now SME-aware — calculates the lower cap correctly
// ============================================================================

export type FineCategory = "PROHIBITED" | "HIGH_RISK" | "GPAI" | "INCORRECT_INFO" | "NONE";

export function buildFineRisk(
  category: FineCategory,
  companySize: "MICRO" | "SMALL" | "MEDIUM" | "LARGE"
): FineRisk {
  const isSME = companySize !== "LARGE";

  switch (category) {
    case "PROHIBITED":
      // Art 99(3): Up to €35M or 7% of global annual turnover, whichever is higher.
      // Art 99(6) SME rule: For SMEs (including start-ups), the LOWER of the two amounts applies.
      // This inverts the general "whichever is higher" rule for SMEs.
      return {
        maxAmountGeneral: "€35,000,000",
        maxAmountSME: isSME
          ? "Whichever is LOWER: €35M or 7% of global annual turnover (Art 99(6) SME protection inverts the general rule)"
          : "€35,000,000",
        maxPercentTurnover: 7,
        article: "Article 99(3)",
        note: isSME
          ? "As an SME, the 'whichever is lower' rule under Art 99(6) applies. For a company with €5M turnover, this means max €350K (7% of €5M), not €35M. This is a significant protection for smaller companies."
          : undefined,
      };
    case "HIGH_RISK":
      // Art 99(4): Up to €15M or 3% of global annual turnover, whichever is higher.
      // Art 99(6) SME rule: For SMEs, the LOWER of the two amounts applies.
      return {
        maxAmountGeneral: "€15,000,000",
        maxAmountSME: isSME
          ? "Whichever is LOWER: €15M or 3% of global annual turnover (Art 99(6) SME protection)"
          : "€15,000,000",
        maxPercentTurnover: 3,
        article: "Article 99(4)",
        note: isSME
          ? "As an SME, the 'whichever is lower' rule under Art 99(6) applies. For a company with €2M turnover, this means max €60K (3% of €2M), not €15M."
          : undefined,
      };
    case "GPAI":
      // BUG-C3 FIX: Art 101 (GPAI fines) does NOT include the Art 99(6) SME "whichever is lower"
      // protection. GPAI fines apply equally to all company sizes.
      // Art 101(1): up to €15M or 3% of global annual turnover, whichever is HIGHER.
      return {
        maxAmountGeneral: "€15,000,000",
        maxAmountSME: "€15,000,000 or 3% of global turnover, whichever is HIGHER",
        maxPercentTurnover: 3,
        article: "Article 101(1)",
        note: "GPAI fines under Art 101 do NOT benefit from the SME 'whichever is lower' protection in Art 99(6). The standard 'whichever is higher' rule applies to ALL company sizes for GPAI violations.",
      };
    case "INCORRECT_INFO":
      // Art 99(5): Up to €7.5M or 1% of global annual turnover, whichever is higher.
      // Art 99(6) SME rule: For SMEs, the LOWER of the two amounts applies.
      return {
        maxAmountGeneral: "€7,500,000",
        maxAmountSME: isSME
          ? "Whichever is LOWER: €7.5M or 1% of global annual turnover (Art 99(6) SME protection)"
          : "€7,500,000",
        maxPercentTurnover: 1,
        article: "Article 99(5)",
      };
    case "NONE":
    default:
      return {
        maxAmountGeneral: "N/A",
        maxAmountSME: "N/A",
        maxPercentTurnover: 0,
        article: "N/A",
      };
  }
}

// ============================================================================
// ENFORCEMENT TIMELINE — v2: Dynamic status based on current date
// ============================================================================

export function getEnforcementTimeline(currentDate: Date = new Date()) {
  const milestones = [
    {
      date: new Date("2025-02-02"),
      label: "Prohibited practices & general provisions",
      articles: ["Article 4 (AI literacy)", "Article 5 (prohibited practices)"],
    },
    {
      date: new Date("2025-05-02"),
      label: "Codes of practice for GPAI ready",
      articles: ["Article 56"],
    },
    {
      date: new Date("2025-08-02"),
      label: "GPAI obligations, notified bodies & governance",
      articles: ["Articles 51-56 (GPAI)", "Articles 28-36 (notified bodies)", "Articles 64-70 (governance)"],
    },
    {
      date: new Date("2026-08-02"),
      label: "HIGH-RISK obligations + transparency",
      articles: ["Articles 6-49 (high-risk)", "Article 50 (transparency)", "Articles 72-73 (monitoring)"],
    },
    {
      date: new Date("2027-08-02"),
      label: "Product safety AI (Annex I, Section A)",
      articles: ["Article 6(1)", "Annex I Section A"],
    },
    {
      date: new Date("2030-08-02"),
      label: "Public authorities & large-scale IT systems",
      articles: ["Article 111(1) — Annex X systems by 31 Dec 2030", "Article 111(2) — public authority deployers"],
    },
  ];

  return milestones.map((m) => ({
    ...m,
    dateString: m.date.toISOString().split("T")[0],
    status: currentDate >= m.date ? "ENFORCED" as const : "UPCOMING" as const,
    daysUntil: Math.max(0, Math.ceil((m.date.getTime() - currentDate.getTime()) / 86400000)),
  }));
}

// ============================================================================
// TEMPLATE REGISTRY — 25 compliance document templates
// ============================================================================

export const TEMPLATE_REGISTRY: Record<string, {
  name: string;
  description: string;
  appliesToRole: Role | "BOTH";
  requiredFor: RiskClassification[];
  articles: string[];
  estimatedMinutes: number;
}> = {
  TMPL_RISK_MANAGEMENT: {
    name: "Risk Management System",
    description: "Continuous iterative risk management process covering identification, evaluation, mitigation and testing",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 9"],
    estimatedMinutes: 120,
  },
  TMPL_DATA_GOVERNANCE: {
    name: "Data Governance Policy",
    description: "Data quality, representativeness, bias mitigation, and processing documentation",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 10"],
    estimatedMinutes: 90,
  },
  TMPL_TECHNICAL_DOC: {
    name: "Technical Documentation (Annex IV)",
    description: "Complete technical documentation per Annex IV: system description, development process, testing, risk management",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 11", "Annex IV"],
    estimatedMinutes: 240,
  },
  TMPL_LOGGING_SPEC: {
    name: "Logging & Record-Keeping Specification",
    description: "Automatic event recording capabilities with minimum 6-month retention",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 12"],
    estimatedMinutes: 60,
  },
  TMPL_INSTRUCTIONS_FOR_USE: {
    name: "Instructions for Use",
    description: "Deployer-facing documentation on capabilities, limitations, intended use, and operational requirements",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 13"],
    estimatedMinutes: 90,
  },
  TMPL_HUMAN_OVERSIGHT: {
    name: "Human Oversight Procedures",
    description: "Design measures and operational procedures for effective human oversight during use",
    appliesToRole: "BOTH",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 14"],
    estimatedMinutes: 90,
  },
  TMPL_ACCURACY_ROBUSTNESS: {
    name: "Accuracy, Robustness & Cybersecurity Assessment",
    description: "Performance metrics declaration, resilience testing, and security measures",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 15"],
    estimatedMinutes: 120,
  },
  TMPL_QMS: {
    name: "Quality Management System",
    description: "Documented QMS covering regulatory compliance, design, quality control, third-party management",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 17"],
    estimatedMinutes: 180,
  },
  TMPL_CORRECTIVE_ACTIONS: {
    name: "Corrective Actions & Incident Response Plan",
    description: "Procedures for non-conformity remediation and serious incident reporting within 15 days",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 20", "Article 73"],
    estimatedMinutes: 60,
  },
  TMPL_CONFORMITY_ASSESSMENT: {
    name: "Conformity Assessment Record",
    description: "Internal control (Annex VI) or third-party assessment (Annex VII) documentation",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 43", "Annex VI", "Annex VII"],
    estimatedMinutes: 120,
  },
  TMPL_EU_DECLARATION: {
    name: "EU Declaration of Conformity",
    description: "Formal declaration per Annex V: system ID, provider details, conformity statement, standards applied",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 47", "Annex V"],
    estimatedMinutes: 30,
  },
  TMPL_EU_DB_REGISTRATION: {
    name: "EU Database Registration Data",
    description: "All information per Annex VIII for the EU AI database registration",
    appliesToRole: "BOTH",
    requiredFor: ["HIGH_RISK", "MINIMAL_RISK"], // Also for Art 6(3) exceptions
    articles: ["Article 49", "Annex VIII"],
    estimatedMinutes: 45,
  },
  TMPL_POST_MARKET_MONITORING: {
    name: "Post-Market Monitoring Plan",
    description: "Systematic plan for ongoing performance monitoring, data collection, and compliance verification",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 72"],
    estimatedMinutes: 90,
  },
  TMPL_NON_HIGH_RISK_ASSESSMENT: {
    name: "Non-High-Risk Exception Documentation",
    description: "Art 6(3)/(4) assessment documenting why an Annex III system is not high-risk",
    appliesToRole: "PROVIDER",
    requiredFor: ["MINIMAL_RISK"],
    articles: ["Article 6(3)", "Article 6(4)"],
    estimatedMinutes: 60,
  },
  TMPL_FUNDAMENTAL_RIGHTS_IMPACT: {
    name: "Fundamental Rights Impact Assessment",
    description: "FRIA for public body deployers or private deployers providing public services — Art 27 requirements",
    appliesToRole: "DEPLOYER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 27"],
    estimatedMinutes: 120,
  },
  TMPL_AI_INTERACTION_NOTICE: {
    name: "AI Interaction Transparency Notice",
    description: "Notice informing users they are interacting with an AI system",
    appliesToRole: "PROVIDER",
    requiredFor: ["LIMITED_RISK"],
    articles: ["Article 50(1)"],
    estimatedMinutes: 15,
  },
  TMPL_DEEPFAKE_DISCLOSURE: {
    name: "Deepfake / Synthetic Content Disclosure",
    description: "Labelling and disclosure mechanism for AI-generated/manipulated content resembling real persons/events",
    appliesToRole: "DEPLOYER",
    requiredFor: ["LIMITED_RISK"],
    articles: ["Article 50(4)"],
    estimatedMinutes: 30,
  },
  TMPL_AI_TEXT_LABEL: {
    name: "AI-Generated Text Label",
    description: "Machine-readable labelling for AI-generated text on matters of public interest",
    appliesToRole: "BOTH",
    requiredFor: ["LIMITED_RISK"],
    articles: ["Article 50(4)"],
    estimatedMinutes: 20,
  },
  TMPL_AI_MEDIA_MARKING: {
    name: "AI-Generated Media Marking",
    description: "Machine-readable marking for synthetic audio/image/video content",
    appliesToRole: "PROVIDER",
    requiredFor: ["LIMITED_RISK"],
    articles: ["Article 50(2)"],
    estimatedMinutes: 30,
  },
  TMPL_EMOTION_NOTICE: {
    name: "Emotion Recognition Transparency Notice",
    description: "Notice to persons subject to non-prohibited emotion recognition AI",
    appliesToRole: "DEPLOYER",
    requiredFor: ["LIMITED_RISK"],
    articles: ["Article 50(3)"],
    estimatedMinutes: 15,
  },
  TMPL_BIOMETRIC_CAT_NOTICE: {
    name: "Biometric Categorisation Transparency Notice",
    description: "Notice to persons subject to non-prohibited biometric categorisation",
    appliesToRole: "DEPLOYER",
    requiredFor: ["LIMITED_RISK"],
    articles: ["Article 50(3)"],
    estimatedMinutes: 15,
  },
  TMPL_GPAI_TECH_DOC: {
    name: "GPAI Technical Documentation (Annex XI)",
    description: "Technical documentation for GPAI model providers: architecture, training process, evaluation, compute resources, energy consumption",
    appliesToRole: "PROVIDER",
    requiredFor: ["GPAI", "GPAI_SYSTEMIC"],
    articles: ["Article 53(1)(a)", "Annex XI"],
    estimatedMinutes: 180,
  },
  TMPL_GPAI_DOWNSTREAM: {
    name: "GPAI Downstream Provider Info (Annex XII)",
    description: "Information package for downstream providers integrating the GPAI model",
    appliesToRole: "PROVIDER",
    requiredFor: ["GPAI", "GPAI_SYSTEMIC"],
    articles: ["Article 53(1)(b)", "Annex XII"],
    estimatedMinutes: 90,
  },
  TMPL_COPYRIGHT_POLICY: {
    name: "Copyright Compliance Policy",
    description: "Policy for complying with EU copyright law in model training, including rights reservation identification",
    appliesToRole: "PROVIDER",
    requiredFor: ["GPAI", "GPAI_SYSTEMIC"],
    articles: ["Article 53(1)(c)", "Directive (EU) 2019/790 Art 4(3)"],
    estimatedMinutes: 60,
  },
  TMPL_TRAINING_SUMMARY: {
    name: "Training Data Summary (public)",
    description: "Publicly available detailed summary of content used for model training",
    appliesToRole: "PROVIDER",
    requiredFor: ["GPAI", "GPAI_SYSTEMIC"],
    articles: ["Article 53(1)(d)"],
    estimatedMinutes: 60,
  },

  // ══════════════════════════════════════════════════════════════════════
  // v3 NEW TEMPLATES — Addressing structural gaps
  // ══════════════════════════════════════════════════════════════════════

  TMPL_AI_LITERACY_PLAN: {
    name: "AI Literacy Training Plan",
    description: "Comprehensive AI literacy plan per Art 4 covering staff competency, training programmes, and ongoing education for all persons operating or overseeing AI systems",
    appliesToRole: "BOTH",
    requiredFor: ["HIGH_RISK", "LIMITED_RISK", "GPAI", "GPAI_SYSTEMIC", "MINIMAL_RISK"],
    articles: ["Article 4"],
    estimatedMinutes: 45,
  },
  TMPL_DPIA_AI: {
    name: "AI-Specific Data Protection Impact Assessment",
    description: "Combined GDPR DPIA (Art 35 GDPR) and AI Act assessment for AI systems processing personal data, including special category data bias detection derogation under Art 10(5)",
    appliesToRole: "DEPLOYER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 26(9)", "GDPR Art 35", "Article 10(5)"],
    estimatedMinutes: 120,
  },
  TMPL_DEPLOYER_PROCEDURES: {
    name: "Deployer Operational Procedures",
    description: "Art 26 deployer-specific procedures covering: use per instructions, human oversight assignment, monitoring, log keeping, worker information, and affected persons notification",
    appliesToRole: "DEPLOYER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 26"],
    estimatedMinutes: 90,
  },
  TMPL_INFORM_AFFECTED: {
    name: "Affected Persons Notification Notice",
    description: "Notice template for informing natural persons that they are subject to a high-risk AI system's decisions, per Art 26(11)",
    appliesToRole: "DEPLOYER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 26(11)"],
    estimatedMinutes: 20,
  },
  TMPL_IMPORTER_CHECKLIST: {
    name: "Importer Compliance Checklist",
    description: "Pre-market verification checklist for importers per Art 28: conformity assessment, CE marking, technical documentation, authorised representative verification",
    appliesToRole: "IMPORTER" as Role,
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 28"],
    estimatedMinutes: 30,
  },
  TMPL_DISTRIBUTOR_CHECKLIST: {
    name: "Distributor Compliance Checklist",
    description: "Pre-distribution verification checklist per Art 29: CE marking, EU declaration, instructions for use, importer compliance verification",
    appliesToRole: "DISTRIBUTOR" as Role,
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 29"],
    estimatedMinutes: 20,
  },
  TMPL_AUTH_REP_MANDATE: {
    name: "Authorised Representative Mandate Agreement",
    description: "Template mandate agreement between non-EU provider and EU authorised representative per Art 22, covering responsibilities, documentation access, and termination conditions",
    appliesToRole: "AUTHORISED_REPRESENTATIVE" as Role,
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 22"],
    estimatedMinutes: 45,
  },
  TMPL_SERIOUS_INCIDENT_REPORT: {
    name: "Serious Incident Report Template",
    description: "Standalone Art 73 serious incident report with 15-day deadline structure: incident description, causal analysis, affected persons, corrective actions, notification to authorities",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 73"],
    estimatedMinutes: 30,
  },
  TMPL_GPAI_SYSTEMIC_RISK: {
    name: "GPAI Systemic Risk Assessment",
    description: "Standalone systemic risk assessment per Art 55(1)(b): systemic risk identification at Union level, risk sources, mitigation measures, monitoring plan",
    appliesToRole: "PROVIDER",
    requiredFor: ["GPAI_SYSTEMIC"],
    articles: ["Article 55(1)(b)"],
    estimatedMinutes: 120,
  },
  TMPL_CODES_OF_PRACTICE: {
    name: "GPAI Codes of Practice Adherence Statement",
    description: "Statement of adherence to approved codes of practice per Art 56 as an alternative means to demonstrate GPAI compliance",
    appliesToRole: "PROVIDER",
    requiredFor: ["GPAI", "GPAI_SYSTEMIC"],
    articles: ["Article 56"],
    estimatedMinutes: 30,
  },
  TMPL_SUBSTANTIAL_MOD_ASSESSMENT: {
    name: "Substantial Modification Assessment",
    description: "Art 6(6) assessment documenting whether a change to a high-risk AI system constitutes a 'substantial modification' requiring re-assessment of conformity",
    appliesToRole: "PROVIDER",
    requiredFor: ["HIGH_RISK"],
    articles: ["Article 6(6)"],
    estimatedMinutes: 60,
  },
};
