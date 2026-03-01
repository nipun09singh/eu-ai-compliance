/**
 * EU AI Act — Conversational Wizard v2
 * AUDITED & CORRECTED — 25 February 2026
 *
 * TurboTax-style Q&A interface that feeds answers to the classification engine.
 * v2 changes:
 *   - ADDED Step 2: Provider/Deployer role question (CRITICAL)
 *   - FIXED Art 5 questions with exception paths & harm thresholds
 *   - FIXED Art 6(3) with dual-condition logic
 *   - ADDED biometric verification exclusion question
 *   - ADDED Annex III Point 8 alternative dispute resolution
 *   - FIXED Annex III Point 5 essential services to match Act's 5 sub-types
 *   - Added Annex I product examples in safety component questions
 */

import type { WizardAnswers } from "./classification-engine";

// ============================================================================
// TYPES
// ============================================================================

export interface WizardQuestion {
  id: string;
  text: string;
  helpText?: string;
  type: "BOOLEAN" | "SINGLE_SELECT" | "TEXT" | "NUMBER";
  options?: { value: string; label: string; description?: string }[];
  /** Only show this question if condition returns true given current answers */
  showIf?: (answers: Partial<WizardAnswers>) => boolean;
  /** Map answer to WizardAnswers field(s) */
  mapToField: keyof WizardAnswers | ((value: any, answers: Partial<WizardAnswers>) => Partial<WizardAnswers>);
}

export interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  questions: WizardQuestion[];
  /** Only show this step if condition returns true */
  showIf?: (answers: Partial<WizardAnswers>) => boolean;
}

// ============================================================================
// WIZARD STEPS — 11 steps (v2: added Role step, expanded exception questions)
// ============================================================================

export const WIZARD_STEPS: WizardStep[] = [
  // ── STEP 1: Company info ────────────────────────────────────────────────
  {
    id: "company",
    title: "About Your Company",
    subtitle: "Basic info to determine which rules apply to you",
    icon: "🏢",
    questions: [
      {
        id: "companyName",
        text: "What is your company name?",
        type: "TEXT",
        mapToField: "companyName",
      },
      {
        id: "companySize",
        text: "What is your company size?",
        helpText:
          "This affects fine caps and compliance simplifications. EU definition: Micro (<10 staff, ≤€2M turnover), Small (<50 staff, ≤€10M), Medium (<250 staff, ≤€50M), Large (≥250).",
        type: "SINGLE_SELECT",
        options: [
          { value: "MICRO", label: "Micro", description: "< 10 employees, ≤ €2M turnover" },
          { value: "SMALL", label: "Small", description: "< 50 employees, ≤ €10M turnover" },
          { value: "MEDIUM", label: "Medium", description: "< 250 employees, ≤ €50M turnover" },
          { value: "LARGE", label: "Large", description: "≥ 250 employees or > €50M turnover" },
        ],
        mapToField: "companySize",
      },
      {
        id: "isEUBased",
        text: "Is your company based in the EU?",
        helpText:
          "The AI Act applies broadly — even non-EU companies must comply if their AI system's output is used within the EU (Art 2(1)).",
        type: "BOOLEAN",
        mapToField: "isEUBased",
      },
      {
        id: "outputUsedInEU",
        text: "Is the output of your AI system used in the EU?",
        helpText:
          "Even if your company is outside the EU, the Act applies if your system's output is used by people or organisations in the EU.",
        type: "BOOLEAN",
        showIf: (a) => a.isEUBased === false,
        mapToField: "outputUsedInEU",
      },
    ],
  },

  // ── STEP 2: YOUR ROLE (v2 CRITICAL ADDITION) ───────────────────────────
  {
    id: "role",
    title: "Your Role",
    subtitle: "Are you building AI or using AI built by someone else?",
    icon: "🎭",
    questions: [
      {
        id: "role",
        text: "What is your role in relation to the AI system?",
        helpText:
          "This is CRITICAL — the EU AI Act assigns fundamentally different obligations to providers (builders) vs deployers (users). Most SMBs are deployers. If you use AI from OpenAI, Google, Microsoft, etc. — you're a deployer. If you build your own AI — you're a provider.",
        type: "SINGLE_SELECT",
        options: [
          {
            value: "PROVIDER",
            label: "Provider (I build/develop AI)",
            description:
              "You develop an AI system or have it developed under your name/trademark. You place it on market or put it into service. (Art 3(3))",
          },
          {
            value: "DEPLOYER",
            label: "Deployer (I use AI built by others)",
            description:
              "You use an AI system under your authority, except for personal non-professional use. E.g., you use ChatGPT API, AWS AI services, an HR screening tool, etc. (Art 3(4))",
          },
          {
            value: "BOTH",
            label: "Both (I build AND use others' AI)",
            description:
              "You develop some AI systems and also deploy AI systems made by other providers. Full set of obligations applies.",
          },
        ],
        mapToField: "role",
      },
    ],
  },

  // ── STEP 3: System description ──────────────────────────────────────────
  {
    id: "system",
    title: "Your AI System",
    subtitle: "Describe what your AI system does",
    icon: "🤖",
    questions: [
      {
        id: "systemDescription",
        text: "In plain language, what does your AI system do?",
        helpText:
          "Describe the purpose, who it affects, and what decisions (if any) it supports. Examples: 'AI chatbot for customer service', 'Recommendation algorithm for online shop', 'Computer vision for manufacturing quality control'.",
        type: "TEXT",
        mapToField: "systemDescription",
      },
    ],
  },

  // ── STEP 4: Scope exclusions (Art 2) ────────────────────────────────────
  {
    id: "exclusions",
    title: "Scope Check",
    subtitle: "Some AI uses are outside the Act's scope entirely",
    icon: "🔍",
    questions: [
      {
        id: "militaryDefenceOnly",
        text: "Is this AI system developed or used EXCLUSIVELY for military, defence, or national security purposes?",
        helpText:
          "Art 2(3): Systems exclusively for military/defence/national security are fully outside scope. This does NOT cover dual-use systems (both military and civilian).",
        type: "BOOLEAN",
        mapToField: "militaryDefenceOnly",
      },
      {
        id: "scientificResearchOnly",
        text: "Is this AI system used ONLY for scientific research and development, and NOT placed on the market or put into service?",
        helpText:
          "Art 2(6): Scientific R&D is excluded. But if the AI is tested on people outside the lab or deployed in any real-world setting, this exclusion does NOT apply.",
        type: "BOOLEAN",
        mapToField: "scientificResearchOnly",
      },
      {
        id: "personalNonProfessional",
        text: "Is this AI system used ONLY for personal, non-professional purposes?",
        helpText:
          "Art 2(10): Personal AI use (like using ChatGPT for your own learning) is excluded. Does NOT apply if you use it in any professional or business context.",
        type: "BOOLEAN",
        mapToField: "personalNonProfessional",
      },
      {
        id: "openSourceNonHighRisk",
        text: "Is this an open-source AI system that is NOT used for any high-risk purpose (Annex III) and is not a GPAI model?",
        helpText:
          "Art 2(12): Open-source AI released under free/open-source licence is excluded, UNLESS it's high-risk (Annex III), prohibited (Art 5), or has transparency obligations (Art 50). Also does NOT exempt GPAI models (they have their own rules).",
        type: "BOOLEAN",
        mapToField: "openSourceNonHighRisk",
      },
    ],
  },

  // ── STEP 5: Prohibited practices (Art 5) ─────────────────────────────────
  // v2: Restructured with harm thresholds and exception questions
  {
    id: "prohibited",
    title: "Prohibited Practices Check",
    subtitle: "8 AI practices are BANNED. Let's make sure yours isn't one.",
    icon: "🚫",
    questions: [
      // Art 5(1)(a): Manipulation
      {
        id: "usesSubliminaManipulation",
        text: "Does your AI use subliminal techniques, manipulative or deceptive techniques to distort people's behaviour?",
        helpText:
          "Art 5(1)(a): This covers any AI that uses techniques beyond a person's consciousness OR purposefully manipulative/deceptive techniques. Examples: dark patterns that trick users, subliminal messaging, hidden persuasion techniques.",
        type: "BOOLEAN",
        mapToField: "usesSubliminaManipulation",
      },
      {
        id: "manipulationCausesSignificantHarm",
        text: "Could this manipulation reasonably cause SIGNIFICANT HARM — physical, psychological, or financial?",
        helpText:
          "Art 5(1)(a) requires that the manipulation 'materially distorts behaviour' causing/likely to cause 'significant harm.' Minor nudges that don't cause significant harm are NOT prohibited (though they may still be ethically questionable).",
        type: "BOOLEAN",
        showIf: (a) => a.usesSubliminaManipulation === true,
        mapToField: "manipulationCausesSignificantHarm",
      },

      // Art 5(1)(b): Exploiting vulnerabilities
      {
        id: "exploitsVulnerabilities",
        text: "Does your AI exploit the vulnerabilities of a specific group (due to age, disability, or socio-economic situation)?",
        helpText:
          "Art 5(1)(b): Covers AI that targets vulnerable groups to materially distort their behaviour in ways they wouldn't otherwise consent to. Examples: AI targeting children with addictive features, preying on elderly confusion, exploiting financial desperation.",
        type: "BOOLEAN",
        mapToField: "exploitsVulnerabilities",
      },
      {
        id: "exploitationCausesSignificantHarm",
        text: "Could this exploitation reasonably cause SIGNIFICANT HARM to anyone in the vulnerable group or others?",
        helpText:
          "Same 'significant harm' threshold as Art 5(1)(a). The harm can be to the targeted person OR another person.",
        type: "BOOLEAN",
        showIf: (a) => a.exploitsVulnerabilities === true,
        mapToField: "exploitationCausesSignificantHarm",
      },

      // Art 5(1)(c): Social scoring
      {
        id: "socialScoring",
        text: "Does your AI evaluate or classify people based on social behaviour, leading to detrimental treatment unrelated to the original context?",
        helpText:
          "Art 5(1)(c): Social scoring is prohibited for both public authorities AND private actors. Covers AI that: rates people based on social behaviour/personality, causes unjustified/disproportionate treatment of persons in unrelated social contexts. Think China-style 'social credit' systems.",
        type: "BOOLEAN",
        mapToField: "socialScoring",
      },

      // Art 5(1)(d): Criminal profiling
      {
        id: "criminalRiskProfiling",
        text: "Does your AI assess the risk of someone committing a criminal offence?",
        helpText:
          "Art 5(1)(d): Criminal risk prediction can be prohibited — but only when based SOLELY on profiling or personality traits. AI that supports law enforcement with factual, verifiable evidence is NOT prohibited.",
        type: "BOOLEAN",
        mapToField: "criminalRiskProfiling",
      },
      {
        id: "crimeProfilingBasedSolelyOnPersonality",
        text: "Is the criminal risk assessment based SOLELY on profiling or personality traits/characteristics (without relation to specific criminal activity)?",
        helpText:
          "The key word is 'solely.' If the AI ONLY uses personality/demographic profiling without linking to actual criminal activity evidence, it's prohibited. If it supplements human analysis of verifiable facts, it may be permitted.",
        type: "BOOLEAN",
        showIf: (a) => a.criminalRiskProfiling === true,
        mapToField: "crimeProfilingBasedSolelyOnPersonality",
      },
      {
        id: "crimeProfilingSupportingHumanAssessment",
        text: "Does the system support (not replace) human assessment based on objective, verifiable facts directly linked to criminal activity?",
        helpText:
          "Art 5(1)(d) exception: Systems that help humans assess facts linked to actual criminal activity are NOT prohibited. E.g., evidence analysis tools, pattern detection in reported crimes.",
        type: "BOOLEAN",
        showIf: (a) =>
          a.criminalRiskProfiling === true &&
          a.crimeProfilingBasedSolelyOnPersonality === true,
        mapToField: "crimeProfilingSupportingHumanAssessment",
      },

      // Art 5(1)(e): Facial scraping
      {
        id: "facialRecognitionScraping",
        text: "Does your AI create or expand facial recognition databases by untargeted scraping from the internet or CCTV?",
        helpText:
          "Art 5(1)(e): Creating facial recognition databases through untargeted scraping of facial images from the internet or CCTV footage is prohibited. No exceptions. This is always banned.",
        type: "BOOLEAN",
        mapToField: "facialRecognitionScraping",
      },

      // Art 5(1)(f): Workplace emotion detection
      {
        id: "workplaceEmotionDetection",
        text: "Does your AI infer emotions of people in workplaces or educational institutions?",
        helpText:
          "Art 5(1)(f): Emotion inference (from biometrics, voice, behaviour) in workplaces or schools is generally PROHIBITED. There is ONE exception: medical or safety reasons.",
        type: "BOOLEAN",
        mapToField: "workplaceEmotionDetection",
      },
      {
        id: "workplaceEmotionForMedicalSafety",
        text: "Is this emotion detection for MEDICAL or SAFETY purposes?",
        helpText:
          "Art 5(1)(f) exception: Emotion detection in workplaces/schools that is genuinely for medical purposes (e.g., monitoring worker fatigue for safety) or safety reasons (e.g., detecting distress in drivers) is NOT prohibited. The medical/safety purpose must be genuine and primary, not a pretext.",
        type: "BOOLEAN",
        showIf: (a) => a.workplaceEmotionDetection === true,
        mapToField: "workplaceEmotionForMedicalSafety",
      },

      // Art 5(1)(g): Biometric categorisation by sensitive attributes
      {
        id: "biometricCategorisationSensitive",
        text: "Does your AI categorise people using biometrics to deduce or infer sensitive attributes (race, political opinions, religion, sexual orientation)?",
        helpText:
          "Art 5(1)(g): Biometric categorisation that deduces/infers sensitive characteristics (race, politics, trade union membership, religion, sex life, sexual orientation) is prohibited. Exception: labelling/filtering of lawfully acquired biometric datasets for law enforcement.",
        type: "BOOLEAN",
        mapToField: "biometricCategorisationSensitive",
      },
      {
        id: "biometricCatForLawEnforcementLabelling",
        text: "Is this biometric categorisation specifically for labelling or filtering LAWFULLY acquired datasets in the area of law enforcement?",
        helpText:
          "Art 5(1)(g) exception: Law enforcement labelling/filtering of lawful datasets is NOT prohibited. The datasets must have been lawfully acquired. This is narrow — it doesn't cover general surveillance or categorisation of the public.",
        type: "BOOLEAN",
        showIf: (a) => a.biometricCategorisationSensitive === true,
        mapToField: "biometricCatForLawEnforcementLabelling",
      },

      // Art 5(1)(h): Real-time remote biometric ID
      {
        id: "realtimeBiometricPublicSpaces",
        text: "Does your AI perform REAL-TIME remote biometric identification of people in publicly accessible spaces for law enforcement?",
        helpText:
          "Art 5(1)(h): Real-time remote biometric identification in public spaces for law enforcement is generally PROHIBITED. There are narrow exceptions for specific, serious purposes WITH judicial authorization.",
        type: "BOOLEAN",
        mapToField: "realtimeBiometricPublicSpaces",
      },
      {
        id: "realtimeBiometricForLEException",
        text: "Is this real-time biometric ID strictly necessary for one of these purposes: (1) searching for specific victims/missing persons, (2) preventing an imminent threat to life/terrorist attack, or (3) locating suspects of specific serious crimes listed in Annex II?",
        helpText:
          "Art 5(2): Only these three strictly necessary purposes can qualify for an exception. The system must be deployed in a targeted manner, with temporal and geographic limitations, and subject to proportionality assessment.",
        type: "BOOLEAN",
        showIf: (a) => a.realtimeBiometricPublicSpaces === true,
        mapToField: "realtimeBiometricForLEException",
      },
      {
        id: "realtimeBiometricHasJudicialAuth",
        text: "Do you have PRIOR authorization from a judicial authority or independent administrative authority for this use?",
        helpText:
          "Art 5(3)-(4): Each individual use requires PRIOR authorization from a judicial or independent administrative authority. In genuinely urgent cases, use may begin without authorization, but it must be sought during/immediately after use. If refused, use must cease and all data/results must be deleted.",
        type: "BOOLEAN",
        showIf: (a) =>
          a.realtimeBiometricPublicSpaces === true &&
          a.realtimeBiometricForLEException === true,
        mapToField: "realtimeBiometricHasJudicialAuth",
      },
    ],
  },

  // ── STEP 6: High-risk — Safety component (Art 6(1)) ─────────────────────
  {
    id: "safetyComponent",
    title: "Product Safety Check",
    subtitle: "Is your AI a safety component of a regulated product?",
    icon: "⚙️",
    showIf: (a) => {
      // Skip if already prohibited
      return !(
        (a.usesSubliminaManipulation && a.manipulationCausesSignificantHarm) ||
        (a.exploitsVulnerabilities && a.exploitationCausesSignificantHarm) ||
        a.socialScoring ||
        a.facialRecognitionScraping ||
        (a.workplaceEmotionDetection && !a.workplaceEmotionForMedicalSafety) ||
        (a.biometricCategorisationSensitive && !a.biometricCatForLawEnforcementLabelling) ||
        (a.realtimeBiometricPublicSpaces && !a.realtimeBiometricForLEException)
      );
    },
    questions: [
      {
        id: "isSafetyComponent",
        text: "Is your AI system a safety component of a product, or IS the product itself?",
        helpText:
          "Art 6(1)(a): A 'safety component' is a component whose failure or malfunction endangers the health or safety of persons or property. Examples: autonomous braking AI, robotic surgery system, AI-controlled industrial machinery, drone navigation.",
        type: "BOOLEAN",
        mapToField: "isSafetyComponent",
      },
      {
        id: "productUnderAnnexI",
        text: "Is the product covered by EU harmonisation legislation listed in Annex I of the AI Act?",
        helpText:
          "Annex I includes: machinery (Regulation 2023/1230), toys (Directive 2009/48/EC), recreational craft, lifts, ATEX equipment, radio equipment (Directive 2014/53/EU), pressure equipment, cableway installations, personal protective equipment, gas appliances, medical devices (Regulation 2017/745), in vitro diagnostics (2017/746), civil aviation, motor vehicles, agricultural/forestry vehicles, marine equipment, rail interoperability.",
        type: "BOOLEAN",
        showIf: (a) => a.isSafetyComponent === true,
        mapToField: "productUnderAnnexI",
      },
      {
        id: "requiresThirdPartyConformity",
        text: "Does the product require a THIRD-PARTY conformity assessment under the relevant product legislation?",
        helpText:
          "Art 6(1)(b): Check the specific product directive/regulation. Not all Annex I products require third-party assessment — some allow self-certification. Only products that require involvement of a notified body for conformity assessment trigger this high-risk path.",
        type: "BOOLEAN",
        showIf: (a) => a.isSafetyComponent === true && a.productUnderAnnexI === true,
        mapToField: "requiresThirdPartyConformity",
      },
    ],
  },

  // ── STEP 7: High-risk — Annex III areas (Art 6(2)) ────────────────────
  {
    id: "annexIII",
    title: "High-Risk Area Check",
    subtitle: "The EU AI Act lists 8 high-risk areas in Annex III",
    icon: "⚠️",
    showIf: (a) => {
      // Skip if already classified as product safety high-risk
      if (a.isSafetyComponent && a.productUnderAnnexI && a.requiresThirdPartyConformity) {
        return false;
      }
      // Skip if prohibited
      return !(
        (a.usesSubliminaManipulation && a.manipulationCausesSignificantHarm) ||
        (a.exploitsVulnerabilities && a.exploitationCausesSignificantHarm) ||
        a.socialScoring ||
        a.facialRecognitionScraping ||
        (a.workplaceEmotionDetection && !a.workplaceEmotionForMedicalSafety) ||
        (a.biometricCategorisationSensitive && !a.biometricCatForLawEnforcementLabelling) ||
        (a.realtimeBiometricPublicSpaces && !a.realtimeBiometricForLEException)
      );
    },
    questions: [
      // Point 1: Biometrics
      {
        id: "usesBiometrics",
        text: "Does your AI system use biometrics (face, fingerprint, iris, voice, gait) to IDENTIFY or CATEGORISE people?",
        helpText:
          "Annex III point 1: Remote biometric identification (figuring out WHO someone is), biometric categorisation (assigning people to categories based on biometric data), and emotion recognition (inferring emotions from biometrics). NOTE: Biometric VERIFICATION (confirming you are who you claim to be, like Face ID) is explicitly NOT high-risk.",
        type: "BOOLEAN",
        mapToField: "usesBiometrics",
      },
      // v2 ADDITION: Biometric verification exclusion
      {
        id: "isBiometricVerificationOnly",
        text: "Is this ONLY biometric verification (confirming identity), NOT identification or categorisation?",
        helpText:
          "IMPORTANT: Biometric VERIFICATION (e.g., unlocking your phone with Face ID, confirming identity at a gate) is explicitly EXCLUDED from high-risk. Only biometric IDENTIFICATION (determining WHO someone is from a group) and CATEGORISATION (assigning to sensitive categories) are high-risk.",
        type: "BOOLEAN",
        showIf: (a) => a.usesBiometrics === true,
        mapToField: "isBiometricVerificationOnly",
      },
      {
        id: "biometricType",
        text: "What type of biometric processing does your system perform?",
        type: "SINGLE_SELECT",
        showIf: (a) => a.usesBiometrics === true && a.isBiometricVerificationOnly === false,
        options: [
          { value: "REMOTE_IDENTIFICATION", label: "Remote biometric identification", description: "Identifying WHO someone is (1-to-many matching)" },
          { value: "CATEGORISATION", label: "Biometric categorisation", description: "Assigning people to categories based on biometric data" },
          { value: "EMOTION_RECOGNITION", label: "Emotion recognition", description: "Inferring emotions from biometric data (non-workplace/school)" },
        ],
        mapToField: "biometricType",
      },

      // Point 2: Critical infrastructure
      {
        id: "criticalInfrastructure",
        text: "Is your AI system a safety component in critical infrastructure (road traffic, digital infrastructure, water/gas/electricity supply)?",
        helpText:
          "Annex III point 2: AI used as a safety component in the management or operation of critical digital infrastructure, road traffic, or supply of water, gas, heating, or electricity. The AI must be a safety component — general analytics or monitoring that doesn't affect safety may not qualify.",
        type: "BOOLEAN",
        mapToField: "criticalInfrastructure",
      },

      // Point 3: Education
      {
        id: "educationUseCase",
        text: "Does your AI system make or assist with decisions in education or vocational training?",
        helpText:
          "Annex III point 3: AI used to (a) determine access/admission, (b) evaluate learning outcomes, (c) assess appropriate education level, (d) monitor/detect prohibited behaviour during tests. This includes school admissions, exam grading, and cheating detection.",
        type: "BOOLEAN",
        mapToField: "educationUseCase",
      },
      {
        id: "educationType",
        text: "Which education use case applies?",
        type: "SINGLE_SELECT",
        showIf: (a) => a.educationUseCase === true,
        options: [
          { value: "ADMISSION_ACCESS", label: "Admission / access decisions", description: "Determining who gets admitted to educational institutions" },
          { value: "LEARNING_ASSESSMENT", label: "Learning outcome evaluation", description: "Assessing or grading student performance" },
          { value: "EDUCATION_LEVEL", label: "Education level assessment", description: "Determining appropriate level of education for individuals" },
          { value: "BEHAVIOUR_MONITORING", label: "Behaviour monitoring during tests", description: "Detecting prohibited behaviour (e.g., cheating) during exams" },
        ],
        mapToField: "educationType",
      },

      // Point 4: Employment
      {
        id: "employmentUseCase",
        text: "Does your AI system make or assist with decisions in employment, workers management, or recruitment?",
        helpText:
          "Annex III point 4: Full employment lifecycle — (a) recruitment/selection (ad targeting, CV screening, evaluation), (b) decisions on work conditions, promotion, termination, (c) task allocation based on individual behaviour/traits, (d) monitoring/evaluating performance of work. Very broad scope.",
        type: "BOOLEAN",
        mapToField: "employmentUseCase",
      },
      {
        id: "employmentType",
        text: "Which employment use case applies?",
        type: "SINGLE_SELECT",
        showIf: (a) => a.employmentUseCase === true,
        options: [
          { value: "RECRUITMENT_SELECTION", label: "Recruitment / selection", description: "Ad targeting, CV screening, interview scheduling, candidate evaluation" },
          { value: "WORK_CONDITIONS_PROMOTION_TERMINATION", label: "Work conditions / promotion / termination", description: "Decisions on contracts, promotions, termination, work allocation" },
          { value: "TASK_ALLOCATION", label: "Task allocation", description: "Allocating tasks based on individual behaviour, traits, or personal characteristics" },
          { value: "MONITORING_EVALUATION", label: "Monitoring / evaluation", description: "Monitoring performance, tracking productivity, evaluating work quality" },
        ],
        mapToField: "employmentType",
      },

      // Point 5: Essential services — v2 FIXED to match Act's 5 sub-types
      {
        id: "essentialServicesUseCase",
        text: "Does your AI system make or assist with decisions about access to essential services (credit, insurance, benefits, emergency services)?",
        helpText:
          "Annex III point 5: AI used for (a) evaluating creditworthiness of natural persons (except fraud detection), (b) risk assessment & pricing for life/health insurance, (c) evaluating eligibility for public benefits/services/social assistance, (d) prioritising emergency services dispatch, (e) credit scoring (except fraud detection). Note: fraud detection AI is explicitly EXCLUDED.",
        type: "BOOLEAN",
        mapToField: "essentialServicesUseCase",
      },
      {
        id: "essentialServiceType",
        text: "Which essential services use case applies?",
        type: "SINGLE_SELECT",
        showIf: (a) => a.essentialServicesUseCase === true,
        options: [
          { value: "CREDITWORTHINESS", label: "Creditworthiness evaluation", description: "Assessing whether someone qualifies for credit (NOT fraud detection)" },
          { value: "INSURANCE_RISK_PRICING", label: "Life/health insurance risk & pricing", description: "Risk assessment and pricing for life and health insurance" },
          { value: "PUBLIC_BENEFITS", label: "Public benefits eligibility", description: "Evaluating eligibility for public benefits, social services, essential social assistance" },
          { value: "EMERGENCY_DISPATCH", label: "Emergency dispatch prioritisation", description: "Prioritising emergency first response service dispatching" },
          { value: "CREDIT_SCORING", label: "Credit scoring", description: "Individual credit scoring (NOT fraud detection)" },
        ],
        mapToField: "essentialServiceType",
      },

      // Point 6: Law enforcement
      {
        id: "lawEnforcementUseCase",
        text: "Does your AI system assist with law enforcement activities?",
        helpText:
          "Annex III point 6: (a) polygraph-equivalent tools, (b) evidence reliability assessment, (c) re-offending/victimisation risk assessment, (d) crime analytics (profiling, pattern searching), (e) post-remote biometric identification. These systems are registered in a secure non-public database section.",
        type: "BOOLEAN",
        mapToField: "lawEnforcementUseCase",
      },
      {
        id: "lawEnforcementType",
        text: "Which law enforcement use case applies?",
        type: "SINGLE_SELECT",
        showIf: (a) => a.lawEnforcementUseCase === true,
        options: [
          { value: "POLYGRAPH", label: "Polygraph / credibility tools", description: "AI-based lie detection or credibility assessment" },
          { value: "EVIDENCE_RELIABILITY", label: "Evidence reliability assessment", description: "Evaluating the reliability of evidence" },
          { value: "RISK_ASSESSMENT", label: "Risk assessment", description: "Assessing risk of re-offending or victimisation" },
          { value: "CRIME_ANALYTICS", label: "Crime analytics", description: "Profiling, searching for crime patterns" },
          { value: "POST_BIOMETRIC_ID", label: "Post-remote biometric ID", description: "Non-real-time biometric identification after the fact" },
        ],
        mapToField: "lawEnforcementType",
      },

      // Point 7: Migration
      {
        id: "migrationUseCase",
        text: "Does your AI system relate to migration, asylum, or border control?",
        helpText:
          "Annex III point 7: (a) polygraph/similar for migration, (b) security/health/irregular migration risk assessment, (c) examining asylum/visa/residence applications, (d) detecting/recognising/identifying persons at borders.",
        type: "BOOLEAN",
        mapToField: "migrationUseCase",
      },
      {
        id: "migrationType",
        text: "Which migration/border use case applies?",
        type: "SINGLE_SELECT",
        showIf: (a) => a.migrationUseCase === true,
        options: [
          { value: "POLYGRAPH", label: "Polygraph / credibility tools", description: "AI-based credibility assessment for migration" },
          { value: "RISK_ASSESSMENT", label: "Risk assessment", description: "Security, health, or irregular migration risk assessment" },
          { value: "APPLICATION_EXAMINATION", label: "Application examination", description: "Processing asylum, visa, or residence permit applications" },
          { value: "BORDER_DETECTION", label: "Border detection / identification", description: "Detecting, recognising, or identifying persons at borders" },
        ],
        mapToField: "migrationType",
      },

      // Point 8: Justice & democracy — v2 ADDED alternative dispute resolution
      {
        id: "justiceUseCase",
        text: "Does your AI system assist with the administration of justice or democratic processes?",
        helpText:
          "Annex III point 8: (a) AI assisting courts in researching/interpreting facts and law and applying the law to a concrete set of facts, (b) alternative dispute resolution, (c) AI influencing the outcome of elections or voting behaviour (NOT internal campaign logistics tools). AI for simple case management or scheduling is NOT covered.",
        type: "BOOLEAN",
        mapToField: "justiceUseCase",
      },
      {
        id: "justiceType",
        text: "Which justice/democracy use case applies?",
        type: "SINGLE_SELECT",
        showIf: (a) => a.justiceUseCase === true,
        options: [
          { value: "COURT_RESEARCH_APPLICATION", label: "Court research & legal application", description: "Assisting judges in researching/interpreting facts and law" },
          { value: "ALTERNATIVE_DISPUTE_RESOLUTION", label: "Alternative dispute resolution", description: "AI used for mediation, arbitration, or other ADR" },
          { value: "ELECTION_INFLUENCE", label: "Election / voting influence", description: "AI intended to influence election outcomes or voting behaviour" },
        ],
        mapToField: "justiceType",
      },
    ],
  },

  // ── STEP 8: Exception check (Art 6(3)) ──────────────────────────────────
  // v2: Now requires BOTH conditions: no significant risk AND one of (a)-(d)
  {
    id: "exception",
    title: "High-Risk Exception Check",
    subtitle: "Some Annex III systems can claim an exception if two conditions are met",
    icon: "🛡️",
    showIf: (a) =>
      a.usesBiometrics === true ||
      a.criticalInfrastructure === true ||
      a.educationUseCase === true ||
      a.employmentUseCase === true ||
      a.essentialServicesUseCase === true ||
      a.lawEnforcementUseCase === true ||
      a.migrationUseCase === true ||
      a.justiceUseCase === true,
    questions: [
      // v2 ADDITION: First prerequisite — significant risk question
      {
        id: "posesSignificantRiskOfHarm",
        text: "Does your AI system pose a SIGNIFICANT risk of harm to health, safety, or fundamental rights?",
        helpText:
          "Art 6(3) FIRST CONDITION: The exception can ONLY apply if the system does NOT pose a significant risk of harm. A system that 'materially influences the outcome of decision making' typically poses significant risk. Consider: severity of potential harm, probability, number of affected persons, reversibility.",
        type: "BOOLEAN",
        mapToField: "posesSignificantRiskOfHarm",
      },
      {
        id: "performsProfiling",
        text: "Does your AI system perform profiling of natural persons (as defined in Art 4(4) GDPR)?",
        helpText:
          "OVERRIDE: Art 6(3) last paragraph — an AI system that performs profiling of natural persons is ALWAYS high-risk. No exception possible. GDPR defines profiling as: any form of automated processing of personal data to evaluate personal aspects (work performance, economic situation, health, personal preferences, interests, reliability, behaviour, location, movements).",
        type: "BOOLEAN",
        mapToField: "performsProfiling",
      },
      // These four only shown if no significant risk AND no profiling
      {
        id: "narrowProceduralTask",
        text: "Does your AI system perform a narrow procedural task?",
        helpText:
          "Art 6(3)(a): The system is intended to perform a narrow procedural task. Example: sorting documents by format, organising files, doing automated spell-check. The task must be genuinely narrow — making substantive decisions doesn't count.",
        type: "BOOLEAN",
        showIf: (a) => a.posesSignificantRiskOfHarm === false && a.performsProfiling !== true,
        mapToField: "narrowProceduralTask",
      },
      {
        id: "improvesHumanActivity",
        text: "Does your AI system improve the result of a previously completed human activity?",
        helpText:
          "Art 6(3)(b): The system only improves/enhances something a human has already done. Example: grammar/style checker for a text already written by a human. The human activity must be COMPLETED — the AI refines, not decides.",
        type: "BOOLEAN",
        showIf: (a) =>
          a.posesSignificantRiskOfHarm === false &&
          a.performsProfiling !== true &&
          a.narrowProceduralTask !== true,
        mapToField: "improvesHumanActivity",
      },
      {
        id: "detectsPatterns",
        text: "Does your AI system only detect decision-making patterns or deviations, WITHOUT replacing or influencing human assessment?",
        helpText:
          "Art 6(3)(c): Pattern/deviation detection that doesn't replace or influence human assessment. Example: anomaly detection flagging unusual transactions for human review — but the human makes all decisions. If the system auto-blocks, auto-approves, or strongly steers the human, this doesn't apply.",
        type: "BOOLEAN",
        showIf: (a) =>
          a.posesSignificantRiskOfHarm === false &&
          a.performsProfiling !== true &&
          a.narrowProceduralTask !== true &&
          a.improvesHumanActivity !== true,
        mapToField: "detectsPatterns",
      },
      {
        id: "preparatoryTask",
        text: "Does your AI system perform only a preparatory task to an assessment that is relevant to one of the Annex III use cases?",
        helpText:
          "Art 6(3)(d): The AI does preparatory work, but the actual assessment/decision remains fully human. Example: AI pre-sorts job applications into categories, but a human reviews all categories and makes all shortlisting decisions. The assessment itself must remain human-driven.",
        type: "BOOLEAN",
        showIf: (a) =>
          a.posesSignificantRiskOfHarm === false &&
          a.performsProfiling !== true &&
          a.narrowProceduralTask !== true &&
          a.improvesHumanActivity !== true &&
          a.detectsPatterns !== true,
        mapToField: "preparatoryTask",
      },
    ],
  },

  // ── STEP 9: Transparency (Art 50) ───────────────────────────────────────
  {
    id: "transparency",
    title: "Transparency Obligations",
    subtitle: "Some AI systems must inform users about what they're interacting with",
    icon: "👁️",
    questions: [
      {
        id: "interactsWithHumans",
        text: "Does your AI system directly interact with natural persons (e.g., chatbot, virtual assistant, phone bot)?",
        helpText:
          "Art 50(1): Persons must be informed they are interacting with AI, UNLESS it's obvious from context (e.g., a clearly marked chatbot widget). When in doubt, inform.",
        type: "BOOLEAN",
        mapToField: "interactsWithHumans",
      },
      {
        id: "generatesMedia",
        text: "Does your AI generate synthetic audio, images, or video?",
        helpText:
          "Art 50(2): Providers must technically mark AI-generated media in a machine-readable format that is detectable as AI-generated. Art 50(4): Deployers must visibly disclose deepfakes (AI content resembling real persons/places/events that appears authentic).",
        type: "BOOLEAN",
        mapToField: "generatesMedia",
      },
      {
        id: "generatesDeepfakes",
        text: "Can your AI generate or manipulate content that resembles real existing persons, places, or events and could appear authentic (deepfakes)?",
        helpText:
          "Art 50(4): Deepfakes (image, audio, video resembling real persons/events) must be disclosed. Exception: law enforcement, obviously creative/artistic/satirical/fictional works, and content where editorial responsibility is held by a natural person.",
        type: "BOOLEAN",
        showIf: (a) => a.generatesMedia === true,
        mapToField: "generatesDeepfakes",
      },
      {
        id: "generatesText",
        text: "Does your AI system generate text that is published to inform the public on matters of public interest?",
        helpText:
          "Art 50(4): AI-generated text on public interest matters must be labelled as AI-generated, UNLESS a natural person has editorial responsibility and has reviewed the content before publication.",
        type: "BOOLEAN",
        mapToField: "generatesText",
      },
      {
        id: "usesEmotionRecognition",
        text: "Does your AI system use emotion recognition (outside of a workplace or school setting)?",
        helpText:
          "Art 50(3): If your system recognises emotions, exposed persons must be informed. In workplace/education settings, this would be prohibited (Art 5(1)(f)) unless for medical/safety — this question covers other contexts (e.g., retail, entertainment, customer service).",
        type: "BOOLEAN",
        mapToField: "usesEmotionRecognition",
      },
      {
        id: "usesBiometricCategorisation",
        text: "Does your AI system categorise natural persons based on biometric data (outside of sensitive attributes like race/religion — those would be prohibited)?",
        helpText:
          "Art 50(3): Biometric categorisation that doesn't target prohibited sensitive attributes still has a transparency obligation — you must inform exposed persons. Law enforcement context is exempt. This covers non-sensitive categorisation (e.g., age range, gender).",
        type: "BOOLEAN",
        mapToField: "usesBiometricCategorisation",
      },
    ],
  },

  // ── STEP 10: GPAI Model (Art 51-56) ─────────────────────────────────────
  {
    id: "gpai",
    title: "General-Purpose AI Model",
    subtitle: "Special rules for foundation models and general-purpose AI",
    icon: "🧠",
    questions: [
      {
        id: "isGeneralPurposeModel",
        text: "Are you the provider of a general-purpose AI MODEL (a foundation model that can be adapted for many tasks)?",
        helpText:
          "Art 3(63): A GPAI model is an AI model trained with a large amount of data using self-supervision at scale, that displays significant generality and is capable of competently performing a wide range of distinct tasks. Examples: GPT-4, Claude, Llama, Mistral, Gemini. This does NOT cover you if you're just USING such a model (deployer). GPAI rules apply to model PROVIDERS.",
        type: "BOOLEAN",
        mapToField: "isGeneralPurposeModel",
      },
      {
        id: "gpaiOpenSource",
        text: "Is your GPAI model released under a free and open-source licence?",
        helpText:
          "Art 53(2): Open-source GPAI models (with publicly available parameters, architecture, weights, usage info) are partially exempt. They DON'T need to produce technical documentation (Art 53(1)(a)) or downstream info (Art 53(1)(b)). They STILL must comply with copyright policy (Art 53(1)(c)) and training data summary (Art 53(1)(d)). This exemption does NOT apply if the model has systemic risk.",
        type: "BOOLEAN",
        showIf: (a) => a.isGeneralPurposeModel === true,
        mapToField: "gpaiOpenSource",
      },
      {
        id: "gpaiTrainingCompute",
        text: "What was the cumulative amount of computation used to train the model (in FLOPs)?",
        helpText:
          "Art 51(2): GPAI models trained with more than 10^25 FLOPs are presumed to have systemic risk. If unknown, estimate based on model size. For reference: GPT-4 is estimated at ~10^25 FLOPs. Most models below 20B parameters are well under this threshold.",
        type: "NUMBER",
        showIf: (a) => a.isGeneralPurposeModel === true,
        mapToField: "gpaiTrainingCompute",
      },
      {
        id: "gpaiHighImpactCapabilities",
        text: "Has the Commission designated your model as having high-impact capabilities, or does it have capabilities equivalent to the most advanced models?",
        helpText:
          "Art 51(1): Beyond the compute threshold, the Commission can designate GPAI models with systemic risk based on evaluation criteria. You may also self-assess. A model has systemic risk if it has 'high impact capabilities' that could have significant effect on the internal market due to reach or foreseeable negative effects on public health, safety, security, fundamental rights, or society.",
        type: "BOOLEAN",
        showIf: (a) => a.isGeneralPurposeModel === true,
        mapToField: "gpaiHighImpactCapabilities",
      },
    ],
  },

  // ── STEP 11: Supply chain & role expansion ───────────────────────────────
  // Shown only if user selected DEPLOYER or BOTH (they may have additional roles)
  // or if they selected PROVIDER and might have third-party components
  {
    id: "supplyChain",
    title: "Supply Chain & Your Role",
    subtitle: "Let's check if you have additional obligations in the AI value chain",
    icon: "🔗",
    showIf: (a) => {
      // Skip if excluded from scope
      if (a.militaryDefenceOnly || a.scientificResearchOnly || a.personalNonProfessional || a.openSourceNonHighRisk) return false;
      // Skip if all prohibited triggers are set (will be PROHIBITED anyway)
      return true;
    },
    questions: [
      {
        id: "putOwnNameOrBrandOnSystem",
        text: "Have you put your own name, brand, or trademark on an AI system built by someone else?",
        helpText:
          "Art 25(1)(a): If you place your name or trademark on a high-risk AI system made by another provider, you BECOME a provider yourself and must meet ALL provider obligations. This is a common trap for companies that white-label AI solutions.",
        type: "BOOLEAN",
        showIf: (a) => a.role === "DEPLOYER" || a.role === "BOTH",
        mapToField: "putOwnNameOrBrandOnSystem",
      },
      {
        id: "madeSubstantialModification",
        text: "Have you made a substantial modification to a high-risk AI system (beyond what the original provider intended)?",
        helpText:
          "Art 6(6) + Art 25(1)(b): A 'substantial modification' is a change to an AI system that was NOT foreseen by the original provider AND affects the system's compliance with requirements (accuracy, safety, etc.) OR changes its intended purpose. Example: retraining a model on new data for a different domain, or significantly changing the decision logic.",
        type: "BOOLEAN",
        mapToField: "madeSubstantialModification",
      },
      {
        id: "changedPurposeToHighRisk",
        text: "Have you changed the intended purpose of an AI system so that it now falls into a high-risk category?",
        helpText:
          "Art 25(1)(c): If you take an AI system designed for one purpose and repurpose it for a high-risk use case (e.g., taking a general chatbot and using it for medical triage), you become the provider for that high-risk use case. You must complete a full conformity assessment.",
        type: "BOOLEAN",
        showIf: (a) => a.role === "DEPLOYER" || a.role === "BOTH",
        mapToField: "changedPurposeToHighRisk",
      },
      {
        id: "broughtSystemFromOutsideEU",
        text: "Did you import this AI system from a provider outside the EU?",
        helpText:
          "Art 28: Importers who place a non-EU provider's high-risk AI system on the EU market have specific obligations — verifying conformity assessments, CE marking, storage conditions, and 10-year documentation retention. This applies to the first entity bringing the product into the EU market.",
        type: "BOOLEAN",
        showIf: (a) => a.role === "DEPLOYER" || a.role === "BOTH",
        mapToField: "broughtSystemFromOutsideEU",
      },
      {
        id: "resellsOrDistributesSystem",
        text: "Do you resell, redistribute, or make an AI system available to others in the supply chain (without being the original provider or importer)?",
        helpText:
          "Art 29: Distributors are entities in the supply chain (other than the provider or importer) who make AI systems available on the EU market. They must verify CE marking, documentation, and proper storage. If you merely deploy the system for your own use, you are NOT a distributor.",
        type: "BOOLEAN",
        showIf: (a) => a.role === "DEPLOYER" || a.role === "BOTH",
        mapToField: "resellsOrDistributesSystem",
      },
      {
        id: "appointedAsAuthorisedRep",
        text: "Have you been formally appointed as an authorised representative in the EU by a non-EU AI provider?",
        helpText:
          "Art 22: Non-EU AI providers must appoint an authorised representative established in the EU. If you've been appointed as one, you take on specific obligations — keeping documentation for 10 years, cooperating with authorities, and verifying the provider's compliance.",
        type: "BOOLEAN",
        showIf: (a) => a.isEUBased === true,
        mapToField: "appointedAsAuthorisedRep",
      },
      {
        id: "usesThirdPartyAIComponents",
        text: "Does your AI system incorporate third-party AI components, models, or tools?",
        helpText:
          "Art 25(2)-(5): If your high-risk AI system uses components from third-party providers (e.g., a third-party NLP model, computer vision API, or foundation model), you have value chain obligations — you must ensure contractual agreements cover compliance responsibilities, and you can't disclaim obligations for the integrated system.",
        type: "BOOLEAN",
        mapToField: "usesThirdPartyAIComponents",
      },
    ],
  },

  // ── STEP 12: Sector-specific legislation ────────────────────────────────
  // Only shown if user reached a likely high-risk classification path
  {
    id: "sectorSpecific",
    title: "Sector-Specific Legislation",
    subtitle: "Some regulated products have special AI rules",
    icon: "🏥",
    showIf: (a) => {
      // Only relevant if the system falls under a product-safety or high-risk path
      return (
        a.isSafetyComponent === true ||
        a.usesBiometrics === true ||
        a.criticalInfrastructure === true ||
        a.educationUseCase === true ||
        a.employmentUseCase === true ||
        a.essentialServicesUseCase === true ||
        a.lawEnforcementUseCase === true ||
        a.migrationUseCase === true ||
        a.justiceUseCase === true
      );
    },
    questions: [
      {
        id: "sectorSpecificLegislation",
        text: "Is your AI system part of a product regulated under any of these EU product safety laws?",
        helpText:
          "Art 2(5)-(8) + Art 43(3): If your AI is embedded in a product covered by existing EU safety legislation (listed in Annex I of the AI Act), the conformity assessment may follow that sector's existing procedures rather than the standalone AI Act procedure. This affects which notified body you use and what conformity assessment route applies.",
        type: "SINGLE_SELECT",
        options: [
          { value: "MEDICAL_DEVICE", label: "Medical device (MDR 2017/745)", description: "Clinical AI, diagnostic tools, treatment recommendation systems" },
          { value: "IVDR", label: "In-vitro diagnostic (IVDR 2017/746)", description: "AI for lab diagnostics, pathology analysis" },
          { value: "AUTOMOTIVE", label: "Automotive (Regulation 2019/2144)", description: "ADAS, autonomous driving, vehicle safety AI" },
          { value: "AVIATION", label: "Aviation (Regulation 2018/1139)", description: "Air traffic management, drone AI, flight systems" },
          { value: "MARINE", label: "Marine equipment (Directive 2014/90)", description: "Ship navigation, maritime safety AI" },
          { value: "RAILWAY", label: "Railway (Directive 2016/797)", description: "Rail signalling, train control AI" },
          { value: "MACHINERY", label: "Machinery (Regulation 2023/1230)", description: "Industrial machinery with AI safety components" },
          { value: "TOYS", label: "Toys (Directive 2009/48)", description: "AI-enabled toys for children" },
          { value: "LIFTS", label: "Lifts (Directive 2014/33)", description: "Elevator/escalator control systems" },
          { value: "RADIO_EQUIPMENT", label: "Radio equipment (Directive 2014/53)", description: "IoT, wireless devices with AI" },
          { value: "NONE", label: "None of the above", description: "Standard AI Act conformity assessment applies" },
        ],
        mapToField: "sectorSpecificLegislation",
      },
    ],
  },

  // ── STEP 13: GDPR & data ───────────────────────────────────────────────
  {
    id: "gdprData",
    title: "Data & Privacy",
    subtitle: "How your AI system handles personal data affects compliance",
    icon: "🔒",
    showIf: (a) => {
      if (a.militaryDefenceOnly || a.scientificResearchOnly || a.personalNonProfessional || a.openSourceNonHighRisk) return false;
      return true;
    },
    questions: [
      {
        id: "processesPersonalData",
        text: "Does your AI system process personal data (any information relating to an identified or identifiable person)?",
        helpText:
          "Recital 69 + GDPR: The AI Act and GDPR apply in parallel. If your AI processes personal data (names, faces, IP addresses, location, behaviour, health data, etc.), you need a GDPR legal basis AND must comply with AI Act requirements. This includes training data, not just deployment.",
        type: "BOOLEAN",
        mapToField: "processesPersonalData",
      },
      {
        id: "processesSpecialCategoryData",
        text: "Does your AI process 'special category' personal data (race, ethnicity, political opinions, religion, health, sexual orientation, biometrics for identification, trade union membership)?",
        helpText:
          "Art 10(5): GDPR normally prohibits processing special category data (Art 9). However, the AI Act provides a DEROGATION — you MAY process special category data STRICTLY for bias detection and correction, subject to safeguards (anonymisation, access controls, deletion after use). This is important for fairness testing.",
        type: "BOOLEAN",
        showIf: (a) => a.processesPersonalData === true,
        mapToField: "processesSpecialCategoryData",
      },
      {
        id: "processesChildrenData",
        text: "Does your AI system process data about children (under 18)?",
        helpText:
          "GDPR Art 8 + AI Act Recital 28: Children's data has heightened protection. AI systems affecting children require extra safeguards, child-friendly transparency, and parental consent mechanisms. Particularly relevant in education, social media, and gaming contexts.",
        type: "BOOLEAN",
        showIf: (a) => a.processesPersonalData === true,
        mapToField: "processesChildrenData",
      },
    ],
  },

  // ── STEP 14: Extraterritorial & auth rep ────────────────────────────────
  // Only shown if non-EU based
  {
    id: "extraterritorial",
    title: "EU Representation",
    subtitle: "Non-EU providers need an EU representative",
    icon: "🌍",
    showIf: (a) => a.isEUBased === false && a.outputUsedInEU === true,
    questions: [
      {
        id: "hasAuthorisedRepInEU",
        text: "Have you already appointed an authorised representative in the EU?",
        helpText:
          "Art 22: If you are a non-EU provider placing a high-risk AI system on the EU market, you MUST appoint an authorised representative established in the EU BEFORE placing the system on the market. Without one, you cannot legally place high-risk AI on the EU market. The representative must be named in the EU Declaration of Conformity.",
        type: "BOOLEAN",
        mapToField: "hasAuthorisedRepInEU",
      },
    ],
  },

  // ── STEP 15: Transitional provisions ────────────────────────────────────
  {
    id: "transitional",
    title: "Existing Systems & Timelines",
    subtitle: "Grace periods may apply to systems already on the market",
    icon: "⏳",
    showIf: (a) => {
      if (a.militaryDefenceOnly || a.scientificResearchOnly || a.personalNonProfessional || a.openSourceNonHighRisk) return false;
      return true;
    },
    questions: [
      {
        id: "systemAlreadyOnMarketBeforeAug2026",
        text: "Was your AI system already on the EU market or in service BEFORE 2 August 2026?",
        helpText:
          "Art 111(1): High-risk AI systems already on the market before 2 August 2026 don't need to comply with the new requirements UNLESS they undergo 'significant changes' after that date. This gives you time to adapt — but doesn't exempt you from the prohibited practices ban (which applied since February 2025).",
        type: "BOOLEAN",
        mapToField: "systemAlreadyOnMarketBeforeAug2026",
      },
      {
        id: "gpaiAlreadyOnMarketBeforeAug2025",
        text: "Is your GPAI model already on the market before 2 August 2025?",
        helpText:
          "Art 111(3): GPAI models already on the market before 2 August 2025 have until 2 August 2027 to comply with Chapter V GPAI requirements. After that date, full compliance is mandatory regardless of when the model was first released.",
        type: "BOOLEAN",
        showIf: (a) => a.isGeneralPurposeModel === true,
        mapToField: "gpaiAlreadyOnMarketBeforeAug2025",
      },
      {
        id: "usedByPublicAuthority",
        text: "Is your high-risk AI system used by or on behalf of a public authority or EU institution?",
        helpText:
          "Art 111(2): High-risk AI systems used by public authorities have a longer grace period — until 2 August 2030 for compliance. This applies to the deployer obligations, not the provider obligations.",
        type: "BOOLEAN",
        showIf: (a) => a.role === "DEPLOYER" || a.role === "BOTH",
        mapToField: "usedByPublicAuthority",
      },
      {
        id: "isLargeScaleITSystem",
        text: "Is your AI system a component of a large-scale EU IT system listed in Annex X (e.g., SIS II, VIS, EES, ETIAS, ECRIS-TCN)?",
        helpText:
          "Art 111(4) + Annex X: AI components of these EU-wide IT systems for border control, immigration, and law enforcement have until 31 December 2030 to comply. This only applies to systems explicitly listed in Annex X of the AI Act.",
        type: "BOOLEAN",
        showIf: (a) => a.lawEnforcementUseCase === true || a.migrationUseCase === true,
        mapToField: "isLargeScaleITSystem",
      },
      {
        id: "isPublicBodyOrPublicService",
        text: "Are you a public body or a private entity providing public services (e.g., healthcare, education, housing, social benefits)?",
        helpText:
          "Art 27: Deployers who are public bodies OR private entities providing essential public services must perform a Fundamental Rights Impact Assessment (FRIA) before deploying high-risk AI. This requirement also affects transitional deadlines and registration requirements.",
        type: "BOOLEAN",
        showIf: (a) => a.role === "DEPLOYER" || a.role === "BOTH",
        mapToField: "isPublicBodyOrPublicService",
      },
    ],
  },

  // ── STEP 16: GPAI supply chain ──────────────────────────────────────────
  // Only for GPAI providers
  {
    id: "gpaiSupplyChain",
    title: "GPAI Downstream Use",
    subtitle: "How your AI model is used by others affects your obligations",
    icon: "🏗️",
    showIf: (a) => a.isGeneralPurposeModel === true,
    questions: [
      {
        id: "gpaiUsedAsHighRiskComponent",
        text: "Is your GPAI model used (or intended to be used) as a component in someone else's HIGH-RISK AI system?",
        helpText:
          "Art 53(3): If your GPAI model is integrated into a downstream provider's high-risk AI system, you must cooperate with them — providing technical documentation, information, and support so they can comply WITH their Chapter III obligations. This doesn't make your model 'high-risk' itself, but it creates cooperation obligations.",
        type: "BOOLEAN",
        mapToField: "gpaiUsedAsHighRiskComponent",
      },
    ],
  },

  // ── STEP 17: Summary / confirmation ─────────────────────────────────────
  {
    id: "summary",
    title: "Summary & Results",
    subtitle: "Review your answers and get your classification",
    icon: "📋",
    questions: [],
  },
];

// ============================================================================
// FLOW CONTROL FUNCTIONS
// ============================================================================

/**
 * Get the next visible step given current answers
 */
export function getNextStep(
  currentStepId: string,
  answers: Partial<WizardAnswers>
): WizardStep | null {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStepId);
  for (let i = currentIndex + 1; i < WIZARD_STEPS.length; i++) {
    const step = WIZARD_STEPS[i];
    if (!step.showIf || step.showIf(answers)) {
      return step;
    }
  }
  return null;
}

/**
 * Get the previous visible step given current answers
 */
export function getPreviousStep(
  currentStepId: string,
  answers: Partial<WizardAnswers>
): WizardStep | null {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStepId);
  for (let i = currentIndex - 1; i >= 0; i--) {
    const step = WIZARD_STEPS[i];
    if (!step.showIf || step.showIf(answers)) {
      return step;
    }
  }
  return null;
}

/**
 * Get all visible questions for the current step
 */
export function getVisibleQuestions(
  step: WizardStep,
  answers: Partial<WizardAnswers>
): WizardQuestion[] {
  return step.questions.filter((q) => !q.showIf || q.showIf(answers));
}

/**
 * Calculate progress percentage
 */
export function getProgressPercent(
  currentStepId: string,
  answers: Partial<WizardAnswers>
): number {
  const visibleSteps = WIZARD_STEPS.filter((s) => !s.showIf || s.showIf(answers));
  const currentIndex = visibleSteps.findIndex((s) => s.id === currentStepId);
  if (currentIndex === -1) return 0;
  return Math.round(((currentIndex + 1) / visibleSteps.length) * 100);
}

/**
 * Get all visible steps for navigation sidebar
 */
export function getVisibleSteps(answers: Partial<WizardAnswers>): WizardStep[] {
  return WIZARD_STEPS.filter((s) => !s.showIf || s.showIf(answers));
}
