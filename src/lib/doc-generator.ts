/**
 * EU AI Act Compliance Document Generator
 * 
 * Uses Claude API to generate compliance documents based on classification results.
 * Each document template is purpose-built for a specific EU AI Act obligation.
 * 
 * Architecture:
 *   ClassificationResult → select applicable templates → build prompts → Claude API → documents
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  type ClassificationResult,
  type Role,
  type RiskClassification,
  type HighRiskArea,
  type TransparencyObligation,
  TEMPLATE_REGISTRY,
} from "./classification-engine";

// ============================================================================
// TYPES
// ============================================================================

export interface GeneratedDocument {
  templateId: string;
  templateName: string;
  article: string;
  content: string;
  generatedAt: string;
  wordCount: number;
  disclaimer: string;
}

export interface GenerationRequest {
  result: ClassificationResult;
  companyName: string;
  systemDescription: string;
  selectedTemplateIds?: string[]; // If omitted, generates all applicable
}

export interface GenerationProgress {
  total: number;
  completed: number;
  current: string;
}

// ============================================================================
// CLAUDE API CLIENT
// ============================================================================

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Set it in .env.local"
    );
  }
  return new Anthropic({ apiKey });
}

// ============================================================================
// TEMPLATE SELECTION
// ============================================================================

/**
 * Returns template IDs applicable to this classification result.
 * Filters by role + risk classification.
 */
export function getApplicableTemplates(
  result: ClassificationResult
): string[] {
  // Collect all roles including detected roles (IMPORTER, DISTRIBUTOR, AUTH_REP)
  const allRoles = new Set<string>();
  allRoles.add(result.role);
  if (result.role === "BOTH") {
    allRoles.add("PROVIDER");
    allRoles.add("DEPLOYER");
  }
  if (result.detectedRoles) {
    for (const r of result.detectedRoles) {
      allRoles.add(r);
    }
  }

  return Object.entries(TEMPLATE_REGISTRY)
    .filter(([, tmpl]) => {
      // Check classification match
      const classMatch = tmpl.requiredFor.includes(result.classification);
      if (!classMatch) return false;

      // Check role match
      if (tmpl.appliesToRole === "BOTH") return true;
      return allRoles.has(tmpl.appliesToRole);
    })
    .map(([id]) => id);
}

/**
 * Returns total estimated generation time in minutes for applicable templates.
 */
export function getEstimatedTime(templateIds: string[]): number {
  return templateIds.reduce((sum, id) => {
    const tmpl = TEMPLATE_REGISTRY[id];
    return sum + (tmpl?.estimatedMinutes ?? 0);
  }, 0);
}

// ============================================================================
// PROMPT ENGINEERING
// ============================================================================

const SYSTEM_PROMPT = `You are a senior EU AI Act compliance specialist generating compliance documentation for businesses.

CRITICAL RULES:
1. All documents MUST reference specific articles of Regulation (EU) 2024/1689 (the EU AI Act).
2. Use formal but clear language — the audience is SMB managers, NOT lawyers.
3. Include practical, actionable sections — not just legal boilerplate.
4. Use [COMPANY] and [AI SYSTEM] as placeholders where the user needs to fill in specifics.
5. Structure documents with clear headings, numbered sections, and tables where useful.
6. Include a "What to do next" section at the end of every document.
7. NEVER invent or fabricate article numbers — only reference real articles from the EU AI Act.
8. Mark sections requiring user input with ⚠️ ACTION REQUIRED.
9. Output in Markdown format.
10. Include a version date and document ID for traceability.`;

function buildTemplatePrompt(
  templateId: string,
  result: ClassificationResult,
  companyName: string,
  systemDescription: string
): string {
  const tmpl = TEMPLATE_REGISTRY[templateId];
  /* v8 ignore start */
  if (!tmpl) throw new Error(`Unknown template: ${templateId}`);
  /* v8 ignore stop */

  const context = buildContextBlock(result, companyName, systemDescription);
  const specific = getTemplateSpecificInstructions(templateId, result);

  return `${context}

---

TASK: Generate a complete "${tmpl.name}" document.

DESCRIPTION: ${tmpl.description}

LEGAL BASIS: ${tmpl.articles.join(", ")}

ROLE: This document is for the ${result.role === "BOTH" ? "provider AND deployer" : result.role.toLowerCase()}.

${specific}

Generate a comprehensive, production-ready compliance document. Include all required sections, practical guidance, and clear action items. The document should be usable as-is after filling in the marked placeholders.`;
}

function buildContextBlock(
  result: ClassificationResult,
  companyName: string,
  systemDescription: string
): string {
  const lines = [
    `COMPANY: ${companyName}`,
    `AI SYSTEM DESCRIPTION: ${systemDescription}`,
    `CLASSIFICATION: ${formatClassification(result.classification)}`,
    `ROLE: ${result.role}`,
    `CONFIDENCE: ${result.confidence}`,
    `LEGAL BASIS: ${result.legalBasis.join(", ")}`,
    `ENFORCEMENT DEADLINE: ${result.enforcementDeadline}`,
  ];

  if (result.highRiskArea) {
    lines.push(`HIGH-RISK AREA: ${formatHighRiskArea(result.highRiskArea)}`);
  }
  if (result.transparencyObligations?.length) {
    lines.push(`TRANSPARENCY OBLIGATIONS: ${result.transparencyObligations.join(", ")}`);
  }
  if (result.prohibitedPractices?.length) {
    lines.push(`PROHIBITED PRACTICES FLAGGED: ${result.prohibitedPractices.join(", ")}`);
  }
  if (result.fineRisk) {
    lines.push(`MAX FINE: ${result.fineRisk.maxAmountGeneral} / ${result.fineRisk.maxPercentTurnover}% turnover`);
  }
  if (result.smeSimplifications.length > 0) {
    lines.push(`SME SIMPLIFICATIONS APPLY: Yes`);
  }

  return lines.join("\n");
}

function formatClassification(c: RiskClassification): string {
  const map: Record<RiskClassification, string> = {
    PROHIBITED: "Prohibited AI Practice (Art 5)",
    HIGH_RISK: "High-Risk AI System (Art 6)",
    LIMITED_RISK: "Limited Risk — Transparency Obligations (Art 50)",
    GPAI: "General-Purpose AI Model (Art 51-53)",
    GPAI_SYSTEMIC: "GPAI with Systemic Risk (Art 51-55)",
    MINIMAL_RISK: "Minimal Risk (voluntary compliance)",
  };
  return map[c];
}

function formatHighRiskArea(area: HighRiskArea): string {
  const map: Record<HighRiskArea, string> = {
    BIOMETRICS: "Biometrics (Annex III, Point 1)",
    CRITICAL_INFRASTRUCTURE: "Critical Infrastructure (Annex III, Point 2)",
    EDUCATION: "Education & Vocational Training (Annex III, Point 3)",
    EMPLOYMENT: "Employment & Workers Management (Annex III, Point 4)",
    ESSENTIAL_SERVICES: "Essential Private & Public Services (Annex III, Point 5)",
    LAW_ENFORCEMENT: "Law Enforcement (Annex III, Point 6)",
    MIGRATION_ASYLUM_BORDER: "Migration, Asylum & Border Control (Annex III, Point 7)",
    JUSTICE_DEMOCRACY: "Administration of Justice & Democratic Processes (Annex III, Point 8)",
  };
  return map[area];
}

// ============================================================================
// TEMPLATE-SPECIFIC INSTRUCTIONS
// ============================================================================

function getTemplateSpecificInstructions(
  templateId: string,
  result: ClassificationResult
): string {
  const instructions: Record<string, string> = {
    TMPL_RISK_MANAGEMENT: `
REQUIRED SECTIONS per Article 9:
1. Risk identification and analysis (known and reasonably foreseeable risks)
2. Risk estimation and evaluation (likelihood + severity)
3. Risk mitigation measures (design-level + technical + organizational)
4. Testing procedures (pre-market + ongoing)
5. Residual risk assessment matrix
6. Continuous monitoring and update procedures
7. Documentation of all risk management activities
Include a practical risk register table with columns: Risk ID, Description, Likelihood (1-5), Impact (1-5), Risk Score, Mitigation, Residual Risk, Owner, Status.`,

    TMPL_DATA_GOVERNANCE: `
REQUIRED SECTIONS per Article 10:
1. Data governance objectives and scope
2. Training data: sources, collection methods, quality criteria
3. Validation and testing data: separation methodology
4. Bias detection and mitigation procedures
5. Data representativeness assessment (relevant to geographic, contextual, behavioural, functional setting)
6. Gap identification methodology
7. Data quality metrics and thresholds
8. Personal data processing (GDPR interplay — Recital 69)
9. Data update and correction procedures
Include a data quality checklist table.`,

    TMPL_TECHNICAL_DOC: `
REQUIRED SECTIONS per Article 11 + Annex IV:
1. General description: intended purpose, provider details, system version
2. Detailed system architecture and design specifications
3. Development process description: methodology, tools, frameworks
4. Data requirements and data processing pipeline
5. Component descriptions and interaction flows
6. Algorithm/model description (without requiring trade secrets)
7. Key design choices and assumptions
8. Validation and testing: methodology, metrics, results, limitations
9. Cybersecurity measures (Art 15 requirements)
10. Hardware/compute requirements
11. Version history and change log
12. Instructions for other parties in the value chain
Make this structured for a notified body review if applicable.`,

    TMPL_LOGGING_SPEC: `
REQUIRED SECTIONS per Article 12:
1. Logging objectives and regulatory requirements
2. Events to be logged (minimum: start/stop, input data characteristics, output data, human oversight interactions, errors/anomalies)
3. Log data format and schema
4. Storage: location, retention period (minimum 6 months per Art 12(1)), access controls
5. Monitoring and alerting rules
6. Log review procedures and frequency
7. Data protection considerations for logged data
8. Integration with existing monitoring infrastructure
Include a log events table with: Event Type, Data Captured, Trigger, Retention.`,

    TMPL_INSTRUCTIONS_FOR_USE: `
REQUIRED SECTIONS per Article 13:
1. Provider identification and contact details
2. AI system characteristics, capabilities, and limitations
3. Intended purpose and conditions of use
4. Foreseeable misuse scenarios and warnings
5. Performance metrics (accuracy, robustness, cybersecurity — Art 15)
6. Technical requirements for deployment
7. Maintenance and update procedures
8. Human oversight measures and requirements (Art 14)
9. Input data specifications
10. Known limitations and bias considerations
11. Expected operational lifetime and support terms
Write this as a practical deployer-facing manual.`,

    TMPL_HUMAN_OVERSIGHT: `
REQUIRED SECTIONS per Article 14:
1. Overview of human oversight requirements and objectives
2. Human-machine interface design measures
3. Competency requirements for human overseers
4. Decision authority framework: when can humans override AI?
5. Escalation procedures (automation bias mitigation)
6. Training requirements for operators
7. Performance monitoring by human overseers
8. "Stop" or "override" mechanism documentation
9. Failsafe procedures when oversight is compromised
10. Oversight documentation and record-keeping
${result.role === "DEPLOYER" || result.role === "BOTH" ? "Include deployer-specific measures per Art 26(2): ensure use in accordance with instructions, assign competent persons, ensure input data relevance." : ""}`,

    TMPL_ACCURACY_ROBUSTNESS: `
REQUIRED SECTIONS per Article 15:
1. Accuracy: declared metrics, measurement methodology, testing conditions
2. Robustness: adversarial testing, performance degradation thresholds
3. Cybersecurity: threat model, attack surface analysis, protective measures
4. Bias and fairness assessment results
5. Performance across demographic groups (if applicable)
6. Error handling and fallback mechanisms
7. Redundancy measures
8. Continuous monitoring plan for deployed system
Include a performance metrics table with: Metric, Target Value, Measured Value, Test Conditions, Date.`,

    TMPL_QMS: `
REQUIRED SECTIONS per Article 17:
1. QMS scope and objectives
2. Regulatory compliance strategy (EU AI Act + sector-specific)
3. Design and development controls per Art 8-15
4. Quality control procedures (examination, testing, validation)
5. Data management procedures (Art 10)
6. Third-party management (supply chain quality)
7. Document control and records management
8. Resource management (competency, training)
9. Corrective and preventive actions (link to Art 20)
10. Communication with regulators (Art 62)
11. Continuous improvement methodology
12. Internal audit schedule and procedures
Align with ISO 42001 structure where applicable.`,

    TMPL_CORRECTIVE_ACTIONS: `
REQUIRED SECTIONS per Articles 20 and 73:
1. Non-conformity identification and classification procedures
2. Root cause analysis methodology
3. Immediate corrective actions
4. Preventive measures (systemic fixes)
5. Communication plan: notifying competent authorities (Art 73)
6. Serious incident reporting (Art 73): within 15 days for life/health threats, 30 days for fundamental rights
7. Recall and withdrawal procedures
8. Market surveillance cooperation (Art 74-75)
9. Record-keeping of all incidents and actions taken
10. Lessons-learned integration into QMS
Include an incident response flowchart description.`,

    TMPL_CONFORMITY_ASSESSMENT: `
REQUIRED SECTIONS per Article 43:
1. Assessment pathway determination:
   ${result.highRiskArea === "BIOMETRICS" || result.highRiskArea === "CRITICAL_INFRASTRUCTURE" ? "- Third-party assessment REQUIRED (Annex VII) for biometrics/critical infrastructure" : "- Internal control (Annex VI) applies unless sector-specific law requires third-party"}
2. Annex VI (Internal Control): compliance verification, technical documentation review, QMS assessment
3. Annex VII (Third-Party): notified body involvement, testing protocols, certification
4. Standards applied (harmonised standards per Art 40, or common specifications per Art 41)
5. EU Declaration of Conformity preparation (link to TMPL_EU_DECLARATION)
6. CE marking requirements (Art 48)
7. Post-conformity obligations (maintaining compliance)
8. Re-assessment triggers (substantial modification — Art 6(6))`,

    TMPL_EU_DECLARATION: `
REQUIRED SECTIONS per Article 47 + Annex V:
1. Header: "EU DECLARATION OF CONFORMITY"
2. AI system: name, version, unique identifier, any additional reference
3. Provider: name, registered address, contact details
4. Declaration statement: "This declaration of conformity is issued under the sole responsibility of the provider."
5. Statement of conformity with requirements of Chapter III, Section 2
6. Standards and specifications applied (harmonised standards, common specifications, or other)
7. Where applicable: name and ID of the notified body, conformity assessment performed, certificate issued
8. Place and date of issue
9. Signatory: name, function, signature
10. Additional information (optional)
Format this as a fill-in-the-blanks formal document ready for signature.`,

    TMPL_EU_DB_REGISTRATION: `
REQUIRED SECTIONS per Article 49 + Annex VIII:
1. Registration scope: which EU database (high-risk AI systems per Art 71)
2. Required data fields per Annex VIII:
   - Provider name, address, contact
   - AI system trade name and version
   - Intended purpose description
   - Status: on the market / in service / withdrawn
   - Risk classification and Annex III area
   - Member States of deployment
   - Conformity assessment type and certificate reference
   - URL for instructions of use
3. Data update obligations (when information changes)
4. Registration timing (before placing on market / putting into service)
5. Deployer registration requirements (if applicable per Art 49(3))`,

    TMPL_POST_MARKET_MONITORING: `
REQUIRED SECTIONS per Article 72:
1. Monitoring objectives and scope
2. Data collection strategy: sources, types, frequency
3. Performance metrics to track (alignment with pre-market benchmarks)
4. Feedback mechanisms from deployers and users
5. Incident and near-miss tracking
6. Trend analysis and drift detection
7. Trigger conditions for corrective actions
8. Integration with QMS and risk management system
9. Reporting obligations to competent authorities
10. Review and update schedule for the monitoring plan
11. Relationship with sector-specific post-market obligations
Include a monitoring dashboard specification.`,

    TMPL_NON_HIGH_RISK_ASSESSMENT: `
REQUIRED SECTIONS per Article 6(3) and 6(4):
1. System identification and Annex III area it falls under
2. Assessment that the system does NOT pose a significant risk of harm to health, safety, or fundamental rights
3. Documentation of which Art 6(3) condition is met:
   (a) Performs a narrow procedural task, OR
   (b) Improves the result of a previously completed human activity, OR
   (c) Detects decision-making patterns without replacing/influencing human assessment, OR
   (d) Performs a preparatory task
4. Confirmation that the system does NOT perform profiling per Regulation 2016/679
5. Art 6(4): Notification to competent authority BEFORE placing on market
6. EU database registration (still required per Art 49(2))
7. Risk assessment supporting the exception claim
Include a clear justification matrix.`,

    TMPL_FUNDAMENTAL_RIGHTS_IMPACT: `
REQUIRED SECTIONS per Article 27:
1. Assessment scope and methodology
2. Description of deployer's processes where the AI system is used
3. Categories of natural persons and groups likely to be affected
4. Specific risks to fundamental rights (per EU Charter):
   - Right to human dignity
   - Right to non-discrimination
   - Right to privacy and data protection
   - Rights of the child
   - Rights of persons with disabilities
   - Other applicable rights
5. Impact on specific groups (vulnerable populations)
6. Mitigation measures for identified risks
7. Human oversight arrangements (link to Art 14)
8. Governance processes for flagging issues
9. Accessibility considerations for persons with disabilities
10. Communication plan for affected persons
Only required for: deployers that are public bodies OR private entities providing public services.`,

    TMPL_AI_INTERACTION_NOTICE: `
Generate a clear, concise transparency notice per Article 50(1).
REQUIREMENTS:
1. Inform the natural person that they are interacting with an AI system
2. Must be provided BEFORE or AT the first point of interaction
3. Must be clear, meaningful, visible
4. Exception: obvious from circumstances to a reasonably well-informed person
5. Include: what the AI system does, what data it processes, how to reach a human
Draft 3 versions: (A) banner/popup text, (B) terms-of-service clause, (C) in-app notification.`,

    TMPL_DEEPFAKE_DISCLOSURE: `
Generate a synthetic content disclosure mechanism per Article 50(4).
REQUIREMENTS:
1. Label AI-generated or manipulated content that resembles existing persons, objects, places, events
2. Disclosure must be clear and distinguishable
3. Machine-readable marking format (Art 50(2) interplay)
4. Exception: artistic, satirical, fictional work — but must not undermine Art 50(4) protection
5. Include: visual label design guidance, metadata format, placement recommendations
Draft: disclosure text, technical implementation guidance, and user-facing label.`,

    TMPL_AI_TEXT_LABEL: `
Generate an AI-generated text labelling policy per Article 50(4).
REQUIREMENTS:
1. Label text that is AI-generated AND published to inform the public on matters of public interest
2. Machine-readable format
3. Exception: human-reviewed and editorially controlled text (but a natural person holds editorial responsibility)
4. Include: labelling methodology, metadata standards, integration guidance`,

    TMPL_AI_MEDIA_MARKING: `
Generate an AI-generated media marking specification per Article 50(2).
REQUIREMENTS:
1. Machine-readable marking for synthetic audio, image, and video content
2. Effective, interoperable, robust, reliable
3. Must consider technical standards and specifications (Art 50(6))
4. Include: watermarking approach, metadata embedding, C2PA/Content Credentials guidance
5. Technical specification for detection systems to identify marked content`,

    TMPL_EMOTION_NOTICE: `
Generate an emotion recognition transparency notice per Article 50(3).
REQUIREMENTS:
1. Inform natural persons exposed to emotion recognition system
2. Must be provided before processing
3. GDPR interplay: data protection obligations also apply
4. Include: what emotions/states are detected, purpose, data retention, opt-out mechanism
Draft: in-app notice, physical signage text, and privacy policy clause.`,

    TMPL_BIOMETRIC_CAT_NOTICE: `
Generate a biometric categorisation transparency notice per Article 50(3).
REQUIREMENTS:
1. Inform natural persons exposed to biometric categorisation
2. Must be provided before processing
3. Only for non-prohibited biometric categorisation (sensitive attribute categorisation is Art 5 prohibited)
4. Include: what categories are inferred, purpose, data retention, opt-out mechanism
Draft: in-app notice, physical signage text, and privacy policy clause.`,

    TMPL_GPAI_TECH_DOC: `
REQUIRED SECTIONS per Article 53(1)(a) + Annex XI:
1. Model identification: name, version, release date, provider
2. Architecture description: model type, parameters, training approach
3. Training process: data curation, preprocessing, hyperparameters, optimisation
4. Compute resources: type, quantity, training duration, energy consumption (Art 53(1)(a)(iv))
5. Evaluation methodology and results: benchmarks, capabilities, limitations
6. Known risks and mitigation measures
7. Intended and reasonably foreseeable downstream uses
8. Modalities supported (text, image, audio, video, etc.)
9. Version control and model card
10. Red-teaming and adversarial testing results (Art 55(1)(a) if systemic risk)
${result.classification === "GPAI_SYSTEMIC" ? "SYSTEMIC RISK ADDITIONS per Art 55:\n- Model evaluation per Art 55(1)(a) including adversarial testing\n- Systemic risk assessment and mitigation\n- Serious incident tracking and reporting to AI Office\n- Adequate cybersecurity protections" : ""}`,

    TMPL_GPAI_DOWNSTREAM: `
REQUIRED SECTIONS per Article 53(1)(b) + Annex XII:
1. Model capabilities and limitations for downstream providers
2. Integration guidance: APIs, input/output formats, constraints
3. Intended use and restrictions
4. Known risks that downstream providers must address
5. Training data summary reference (link to public summary)
6. Acceptable use policy
7. Fine-tuning and modification guidance
8. Responsibility delineation: what the GPAI provider handles vs downstream provider
9. Support and incident escalation procedures
10. Compliance obligations that transfer to downstream providers`,

    TMPL_COPYRIGHT_POLICY: `
REQUIRED SECTIONS per Article 53(1)(c) + Directive (EU) 2019/790 Art 4(3):
1. Policy scope and objectives
2. EU copyright law compliance framework
3. Text and data mining: rights reservation identification process
4. Opt-out mechanism implementation (Art 4(3) of Directive 2019/790)
5. State-of-the-art technology for rights reservation identification
6. Data source documentation and provenance tracking
7. Licensing agreements and permissions inventory
8. Complaint and takedown procedure
9. Regular review and update process
10. Public accessibility of this policy (Art 53(1)(c) requires it)`,

    TMPL_TRAINING_SUMMARY: `
REQUIRED SECTIONS per Article 53(1)(d):
1. General description of training data content
2. Data sources: types and categories (web crawls, licensed datasets, synthetic data, etc.)
3. Data curation and selection methodology
4. Volume and composition metrics
5. Copyright compliance measures taken
6. Personal data handling
7. Known gaps, limitations, and representativeness issues
8. Geographic and linguistic coverage
9. Temporal coverage and currency of data
10. Template compliance with AI Office guidance (when available)
NOTE: This must be made PUBLICLY available. Draft for public disclosure.`,

    // ═══ v3 NEW TEMPLATE INSTRUCTIONS ═══

    TMPL_AI_LITERACY_PLAN: `
REQUIRED SECTIONS per Article 4:
1. Scope: all staff members who operate or oversee AI systems
2. Competency framework:
   - Technical literacy (understanding capabilities and limitations)
   - Regulatory awareness (EU AI Act rights and obligations)
   - Ethical considerations (bias, fairness, transparency)
   - Risk awareness (what can go wrong and escalation)
3. Training programme:
   - Initial onboarding training (before AI system interaction)
   - Role-specific modules (developer, operator, overseer, decision-maker)
   - Ongoing refresher schedule (at minimum annually)
4. Assessment methodology: how competency is measured and validated
5. Record-keeping: training logs, completion certificates, competency assessments
6. Accountability: designated AI literacy officer/champion
7. Resources and tools provided
8. Update triggers: new system deployment, regulatory changes, incidents
NOTE: Art 4 applies to ALL providers and deployers regardless of risk classification — this is a UNIVERSAL obligation.`,

    TMPL_DPIA_AI: `
REQUIRED SECTIONS combining GDPR Art 35 + EU AI Act Art 26(9):
1. Systematic description of the AI processing:
   - Purpose and legal basis under GDPR
   - Data flows (personal data lifecycle in the AI system)
   - Categories of data subjects
   - Categories of personal data processed
2. Necessity and proportionality assessment
3. Risk assessment to rights and freedoms:
   - Automated decision-making risks (GDPR Art 22)
   - Profiling risks
   - Special category data risks (if applicable)
   - Children's data risks (if applicable)
4. Art 10(5) derogation analysis (if processing special category data for bias detection):
   - Strict necessity demonstration
   - Safeguards implemented (anonymisation, access controls, deletion schedule)
   - Why bias cannot be detected without the special category data
5. AI-specific risk factors:
   - Model opacity and explainability
   - Drift and performance degradation risks
   - Scale of processing
6. Fundamental rights impact linkage (connect DPIA findings to FRIA per Art 27)
7. Mitigation measures
8. DPO consultation record
9. Supervisory authority consultation (if required — GDPR Art 36)
10. Review schedule
${result.gdprInterplay?.length ? "GDPR-AI INTERPLAY FLAGS:\n" + result.gdprInterplay.join("\n") : ""}`,

    TMPL_DEPLOYER_PROCEDURES: `
REQUIRED SECTIONS per Article 26:
1. Use strictly in accordance with instructions for use (Art 26(1)):
   - Link to provider's instructions for use document
   - Internal procedures ensuring adherence
   - Prohibited use cases clearly listed
2. Human oversight assignment (Art 26(2)):
   - Named roles with oversight responsibility
   - Competency requirements for assigned persons
   - Decision authority framework
3. Input data relevance (Art 26(4)):
   - Procedures to ensure input data is relevant and representative
   - Data quality checks before feeding to AI system
4. Monitoring obligations (Art 26(5)):
   - Ongoing monitoring based on instructions for use
   - Anomaly and incident detection procedures
   - Escalation to provider when serious incidents detected
5. Log keeping (Art 26(6)):
   - Automatic log preservation (minimum 6 months)
   - Access controls on logs
   - Retention policy
6. Worker information (Art 26(7) — if employer):
   - Worker representatives consulted
   - Information provided per applicable EU/national employment law
   - Directive 2002/14/EC compliance
7. Affected persons notification (Art 26(11)):
   - Decision communication procedures
   - Explanation of AI system's role in the decision
   - Human review/appeal rights
8. Cooperation with authorities (Art 26(12)):
   - Data preservation for regulatory requests
   - Contact points for market surveillance
`,

    TMPL_INFORM_AFFECTED: `
REQUIRED FORMAT per Article 26(11):
Generate a clear, plain-language notice template that:
1. Identifies the deployer organisation
2. States that a high-risk AI system is being used
3. Describes the AI system's function and its role in the decision
4. Explains what decision the AI system contributes to
5. States the specific class of decisions (e.g. creditworthiness, recruitment, benefit eligibility)
6. Provides the deployer's contact information for inquiries
7. Explains the right to request human review of the decision
8. Explains the right to receive an explanation of the decision
9. Provides information about complaint mechanisms

Draft TWO versions:
(A) Pre-decision notice (provided before/at point of decision)
(B) Post-decision notice (accompanying the decision outcome)

Keep language at 8th-grade reading level. Avoid legal jargon.`,

    TMPL_IMPORTER_CHECKLIST: `
REQUIRED SECTIONS per Article 28:
PRE-MARKET VERIFICATION CHECKLIST:
1. □ Conformity assessment completed by provider (Art 43)
2. □ Technical documentation available and accessible (Art 11)
3. □ Instructions for use provided in the language of the destination Member State(s)
4. □ CE marking affixed correctly (Art 48)
5. □ EU Declaration of Conformity available (Art 47)
6. □ Provider has appointed an authorised representative in the EU (Art 22) — OR importer must fulfil Art 22 obligations
7. □ Provider's name, trade name, contact details on system/packaging
8. □ Importer's own name, trade name, postal address on system/packaging (Art 28(2))
9. □ Storage/transport conditions do not jeopardise compliance (Art 28(3))

ONGOING OBLIGATIONS:
10. □ Market surveillance authority cooperation plan
11. □ Record of non-conformity/recall actions
12. □ Document retention plan (10 years — Art 28(5))
13. □ Provider failure contingency (what happens if provider becomes non-compliant?)

Include signature block for the responsible person confirming each check.`,

    TMPL_DISTRIBUTOR_CHECKLIST: `
REQUIRED SECTIONS per Article 29:
PRE-DISTRIBUTION VERIFICATION CHECKLIST:
1. □ CE marking present on the AI system (Art 48)
2. □ EU Declaration of Conformity accompanies the system (Art 47)
3. □ Instructions for use in appropriate language(s) (Art 13)
4. □ Provider's identification clearly marked
5. □ Importer's identification clearly marked (if applicable)
6. □ System appears to comply with Chapter III Section 2 requirements (visual/documentation check)

STORAGE AND TRANSPORT:
7. □ Conditions do not jeopardise compliance (Art 29(3))
8. □ Handling and storage procedures documented

NON-CONFORMITY PROCEDURES:
9. □ Non-conformity detection process (what triggers concern?)
10. □ Withdrawal/recall cooperation procedures with provider/importer
11. □ Authority notification procedures
12. □ Communication chain to other distributors in the value chain

RECORD-KEEPING:
13. □ Record retention plan (10 years — Art 29(5))
14. □ Document access plan for regulatory audits

IMPORTANT: If you put your own name/brand on the system or make a substantial modification, you BECOME a provider per Art 25 — flag this immediately.`,

    TMPL_AUTH_REP_MANDATE: `
REQUIRED SECTIONS per Article 22:
Generate a formal MANDATE AGREEMENT template with:

PARTIES:
1. Provider (mandatory appointer — non-EU entity details)
2. Authorised Representative (EU-based mandatory appointee)

SCOPE OF MANDATE (Art 22(4)):
3. Verify EU Declaration of Conformity exists (Art 47)
4. Verify Technical Documentation exists and is maintained (Art 11)
5. Keep copy of Declaration + Tech Doc available to authorities for 10 years
6. Provide competent authorities/notified bodies with all information to demonstrate conformity
7. Cooperate with competent authorities on any corrective action

MANDATE TERMS:
8. Duration and renewal conditions
9. Termination conditions (including what happens to documentation)
10. Liability and indemnification terms
11. Notification obligations between parties
12. Right to sub-delegate (if any)
13. Jurisdiction and governing law (EU Member State)

PROVIDER OBLIGATIONS:
14. Provide all necessary documentation to authorised representative
15. Notify authorised representative of any changes to the AI system
16. Maintain open communication channel

Include signature blocks, date fields, and jurisdiction selection.`,

    TMPL_SERIOUS_INCIDENT_REPORT: `
REQUIRED SECTIONS per Article 73:
Generate a structured SERIOUS INCIDENT REPORT TEMPLATE with:

INCIDENT IDENTIFICATION:
1. Report reference number and date
2. Reporter details (provider name, contact, authorised representative if applicable)
3. AI system identification (name, version, unique ID, EU database registration number)

INCIDENT DETAILS:
4. Date and time of incident
5. Location (Member State, specific location)
6. Description of the serious incident:
   - What happened (factual account)
   - Who was affected (number and categories of persons)
   - Nature of harm: death / serious damage to health / serious and irreversible disruption of critical infrastructure / serious breach of fundamental rights
7. AI system operating conditions at time of incident
8. Input data characteristics (if known)

CAUSAL ANALYSIS:
9. Preliminary root cause assessment
10. Was the system operating within intended use parameters?
11. Was human oversight in place and functioning?
12. Contributing factors identified

CORRECTIVE ACTIONS:
13. Immediate actions taken (system shutdown, rollback, etc.)
14. Planned corrective measures
15. Timeline for corrective measures

NOTIFICATION TIMELINE (Art 73(4)):
16. □ Initial notification: immediately after causal connection established
17. □ Detailed report: within 15 days (life/health) or 30 days (fundamental rights/critical infrastructure)
18. □ Final report: upon completion of investigation

AUTHORITY NOTIFICATION:
19. Competent authority of each Member State where incident occurred
20. Market surveillance authority notification
21. AI Office notification (for GPAI if applicable)`,

    TMPL_GPAI_SYSTEMIC_RISK: `
REQUIRED SECTIONS per Article 55:
1. SYSTEMIC RISK IDENTIFICATION:
   - Assessment of whether the model has high-impact capabilities per Art 51(1)(b)
   - Capability evaluation results (including emergent capabilities)
   - Compute threshold assessment (cumulative > 10^25 FLOP per Art 51(2))
   - Commission designation assessment (if not compute-based)

2. MODEL EVALUATION per Art 55(1)(a):
   - Standardised evaluation protocols applied
   - Adversarial testing methodology and results
   - Red-teaming scope and findings
   - Known vulnerability catalogue

3. SYSTEMIC RISK ASSESSMENT per Art 55(1)(b):
   - Risk sources at Union level
   - Risk propagation pathways
   - Cross-border impact potential
   - Critical infrastructure dependency risks
   - Dual-use concerns
   - Risk severity and likelihood matrix

4. MITIGATION MEASURES per Art 55(1)(c):
   - Technical safeguards implemented
   - Operational safeguards
   - Access control measures
   - Output filtering and monitoring
   - Downstream use restrictions

5. CYBERSECURITY per Art 55(1)(d):
   - Model weight protection
   - Infrastructure security
   - Supply chain security
   - Incident response plan

6. MONITORING AND REPORTING:
   - Serious incident tracking per Art 55(1)(e)
   - AI Office reporting schedule
   - Codes of practice adherence statement (Art 56 reference)
   - Review and update triggers`,

    TMPL_CODES_OF_PRACTICE: `
REQUIRED SECTIONS per Article 56:
Generate a STATEMENT OF ADHERENCE to GPAI codes of practice:

1. PROVIDER IDENTIFICATION:
   - Provider name and details
   - GPAI model(s) covered by this statement
   - Classification: general-purpose / systemic risk

2. CODES OF PRACTICE REFERENCE:
   - List of applicable codes of practice published by the AI Office
   - Version numbers and dates of the codes adhered to
   - Scope of each code (which obligations it covers)

3. COMPLIANCE DEMONSTRATION:
   - For each Art 53 obligation: which code of practice addresses it
   - Implementation evidence for each code requirement
   - Any obligations NOT covered by codes (alternative compliance measures used)

4. ART 56(6) — ALTERNATIVE COMPLIANCE (if codes are not followed):
   - Identification of which code is not followed
   - Alternative adequate means of compliance demonstrated
   - Documentation that alternative achieves equivalent compliance level

5. ONGOING COMMITMENTS:
   - Monitoring for code updates
   - Annual review of adherence
   - Contact point for AI Office inquiries
   - Commitment to participate in code development (if applicable)

NOTE: Codes of practice are a PRESUMPTION of compliance (Art 56(4)), not a guarantee. Compliance with the underlying obligations remains the provider's responsibility.`,

    TMPL_SUBSTANTIAL_MOD_ASSESSMENT: `
REQUIRED SECTIONS per Article 6(6):
Generate a SUBSTANTIAL MODIFICATION ASSESSMENT documenting:

1. SYSTEM IDENTIFICATION:
   - AI system name, version (before and after modification)
   - Original classification and conformity assessment reference
   - EU database registration number

2. MODIFICATION DESCRIPTION:
   - Detailed description of the change(s) made
   - Technical scope of the modification
   - Date(s) of modification

3. SUBSTANTIALITY ASSESSMENT:
   Evaluate against Art 6(6) criteria — a modification is "substantial" if it:
   (a) Was NOT foreseen/planned by the original provider, AND
   (b) Changes the compliance of the system with Art 8-15 requirements, OR
   (c) Modifies the intended purpose for which the system was assessed

   Assessment for each criterion:
   - □ Was this modification foreseen by the original provider? Evidence:
   - □ Does it affect compliance with Chapter III Section 2? Analysis:
   - □ Does it change the intended purpose? Analysis:

4. CONCLUSION:
   - □ SUBSTANTIAL: Re-assessment required — new provider obligations per Art 25(1)(b)
   - □ NOT SUBSTANTIAL: Original conformity assessment remains valid

5. IF SUBSTANTIAL — REQUIRED ACTIONS:
   - New conformity assessment (Art 43)
   - Updated technical documentation (Art 11)
   - Updated EU Declaration of Conformity (Art 47)
   - EU database update (Art 49)
   - Original provider notification
   - Updated instructions for use (Art 13)

6. SIGN-OFF:
   - Assessment performed by: [name, role]
   - Date:
   - Decision rationale:
   - Legal review confirmation:`,
  };

  // All 36 TEMPLATE_REGISTRY entries have matching instructions above;
  // the fallback is a safety net for future templates added to the registry.
  /* v8 ignore start */
  return instructions[templateId] ||
    `Generate a comprehensive compliance document based on the template description and applicable articles. Include all required regulatory elements and practical action items.`;
  /* v8 ignore stop */
}

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

const DISCLAIMER = `DISCLAIMER: This document was auto-generated using AI to assist with EU AI Act (Regulation (EU) 2024/1689) compliance. It does NOT constitute legal advice. Review by a qualified legal professional is strongly recommended before relying on this document for regulatory compliance. Generated by EU AI Compliance Autopilot.`;

/**
 * Generate a single compliance document.
 */
export async function generateDocument(
  templateId: string,
  result: ClassificationResult,
  companyName: string,
  systemDescription: string
): Promise<GeneratedDocument> {
  const tmpl = TEMPLATE_REGISTRY[templateId];
  /* v8 ignore start */
  if (!tmpl) throw new Error(`Unknown template: ${templateId}`);
  /* v8 ignore stop */

  const client = getClient();
  const prompt = buildTemplatePrompt(templateId, result, companyName, systemDescription);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n\n");

  const wordCount = content.split(/\s+/).length;

  return {
    templateId,
    templateName: tmpl.name,
    article: tmpl.articles.join(", "),
    content,
    generatedAt: new Date().toISOString(),
    wordCount,
    disclaimer: DISCLAIMER,
  };
}

/**
 * Generate all applicable documents for a classification result.
 * Yields progress callbacks for streaming UI updates.
 */
export async function generateAllDocuments(
  request: GenerationRequest,
  onProgress?: (progress: GenerationProgress) => void
): Promise<GeneratedDocument[]> {
  const templateIds =
    request.selectedTemplateIds ?? getApplicableTemplates(request.result);

  if (templateIds.length === 0) {
    return [];
  }

  const documents: GeneratedDocument[] = [];

  for (let i = 0; i < templateIds.length; i++) {
    const templateId = templateIds[i];
    const tmpl = TEMPLATE_REGISTRY[templateId];

    onProgress?.({
      total: templateIds.length,
      completed: i,
      current: tmpl?.name ?? templateId,
    });

    const doc = await generateDocument(
      templateId,
      request.result,
      request.companyName,
      request.systemDescription
    );

    documents.push(doc);
  }

  onProgress?.({
    total: templateIds.length,
    completed: templateIds.length,
    current: "Complete",
  });

  return documents;
}

/**
 * Generate a single-page executive summary of all obligations.
 */
export async function generateExecutiveSummary(
  result: ClassificationResult,
  companyName: string,
  systemDescription: string
): Promise<GeneratedDocument> {
  const client = getClient();

  const context = buildContextBlock(result, companyName, systemDescription);

  const prompt = `${context}

---

TASK: Generate a 1-page EXECUTIVE SUMMARY of this company's EU AI Act compliance status.

Include:
1. Classification result in plain English
2. Key obligations (bullet list, max 10)
3. Critical deadlines (with exact dates)
4. Fine exposure in plain language
5. Top 3 priority actions to take THIS WEEK
6. Estimated total compliance effort (person-hours)
7. SME advantages that apply (if any)

Keep it concise, actionable, and suitable for a CEO or CTO to read in 5 minutes.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n\n");

  return {
    templateId: "EXEC_SUMMARY",
    templateName: "Executive Summary",
    article: result.legalBasis.join(", "),
    content,
    generatedAt: new Date().toISOString(),
    wordCount: content.split(/\s+/).length,
    disclaimer: DISCLAIMER,
  };
}
