# EU AI Act Classification Engine — Regulatory Audit Log
## Audit Date: 25 February 2026
## Auditor: Self-audit (AI-assisted, cross-referenced against EUR-Lex full text)

---

## Audit Summary

| Metric | Value |
|--------|-------|
| **Total issues found** | 15 |
| **CRITICAL** | 4 |
| **HIGH** | 4 |
| **MEDIUM** | 4 |
| **LOW** | 3 |
| **Status** | ALL 15 FIXED in v2 |

---

## Issues

### CRITICAL — Would cause WRONG classification in production

#### Issue #1: Missing Provider vs Deployer Role Distinction
- **Severity**: CRITICAL
- **Location**: `WizardAnswers` type + `getHighRiskObligations()`
- **Problem**: v1 treated all users as providers. The EU AI Act assigns fundamentally different obligations to providers (Art 16-21) vs deployers (Art 26). Most SMB customers are DEPLOYERS (they use AI built by others), not providers.
- **Impact**: A deployer would receive 16 provider obligations they don't need, while missing their actual deployer obligations.
- **Fix**: Added `role: "PROVIDER" | "DEPLOYER" | "BOTH"` to WizardAnswers. Split `getHighRiskObligations()` into provider vs deployer tracks. Added 8 deployer obligations from Art 26. Added FRIA (Art 27).
- **Articles**: Art 3(3), Art 3(4), Art 16-21, Art 26, Art 27

#### Issue #2: Art 5(1)(f) Missing Medical/Safety Exception
- **Severity**: CRITICAL
- **Location**: `checkProhibitedPractices()` — workplace emotion detection
- **Problem**: v1 classified ALL workplace emotion AI as prohibited. The Act explicitly allows emotion detection for medical or safety purposes (Art 5(1)(f)).
- **Impact**: A company using fatigue detection for driver safety would be told their system is PROHIBITED when it's actually PERMITTED.
- **Fix**: Added `workplaceEmotionForMedicalSafety` boolean. Only classify as prohibited when medical/safety exception does NOT apply.
- **Articles**: Art 5(1)(f)

#### Issue #3: Art 5(1)(h) Missing Law Enforcement Exceptions
- **Severity**: CRITICAL
- **Location**: `checkProhibitedPractices()` — real-time biometric ID
- **Problem**: v1 classified ALL real-time remote biometric ID as prohibited. The Act allows it for specific LE purposes WITH judicial authorization (Art 5(2)-(4)): searching for victims/missing persons, preventing imminent threats, locating suspects of serious crimes.
- **Impact**: A legitimate law enforcement use with proper judicial authorization would be wrongly classified as prohibited.
- **Fix**: Added `realtimeBiometricForLEException` and `realtimeBiometricHasJudicialAuth` checks.
- **Articles**: Art 5(1)(h), Art 5(2), Art 5(3), Art 5(4)

#### Issue #4: Art 5(1)(a)/(b) Missing "Significant Harm" Threshold
- **Severity**: CRITICAL
- **Location**: `checkProhibitedPractices()` — manipulation and vulnerability exploitation
- **Problem**: v1 banned ANY AI that uses manipulative techniques or exploits vulnerabilities. The Act requires that the manipulation/exploitation must "materially distort behaviour" causing or likely to cause "significant harm."
- **Impact**: Minor nudge techniques (e.g., gentle reminders, engagement features) would be wrongly classified as prohibited.
- **Fix**: Added `manipulationCausesSignificantHarm` and `exploitationCausesSignificantHarm` qualifiers.
- **Articles**: Art 5(1)(a), Art 5(1)(b)

---

### HIGH — Could lead to incomplete obligations or missed requirements

#### Issue #5: Art 6(3) Exception Missing "Significant Risk" Prerequisite
- **Severity**: HIGH
- **Location**: `checkHighRiskAnnexIII()` — exception logic
- **Problem**: v1 allowed the Art 6(3) exception if ANY of conditions (a)-(d) was met. The Act requires TWO conditions: (1) the system does NOT pose significant risk of harm, AND (2) at least one of (a)-(d) is met.
- **Impact**: A system that poses significant risk but performs a "narrow procedural task" would wrongly get the exception.
- **Fix**: Added `posesSignificantRiskOfHarm` as prerequisite. Exception only applies when BOTH conditions are satisfied.
- **Articles**: Art 6(3)

#### Issue #6: Art 4 AI Literacy Applied Only to Minimal Risk
- **Severity**: HIGH
- **Location**: `buildMinimalRiskResult()` only
- **Problem**: AI Literacy (Art 4) is a GENERAL PROVISION that applies to ALL providers and deployers, regardless of risk classification. v1 only included it in the minimal risk result.
- **Impact**: High-risk, limited-risk, and GPAI users would not be told about their AI literacy obligation, which has been enforceable since 2 February 2025.
- **Fix**: Created `getUniversalObligations()` function that returns AI Literacy. Called from ALL classification results.
- **Articles**: Art 4

#### Issue #7: Missing Deployer Obligations (Art 26) and FRIA (Art 27)
- **Severity**: HIGH
- **Location**: `getHighRiskObligations()` — only had provider obligations
- **Problem**: v1 only listed provider obligations (Art 8-21). Deployer obligations (Art 26) were completely missing: use per instructions, assign human oversight, monitor operations, keep logs, inform workers, inform affected persons, DPIA. Also missing: Fundamental Rights Impact Assessment (Art 27).
- **Impact**: Deployers (majority of SMB customers) would get no guidance on their actual obligations.
- **Fix**: Added 8 deployer obligations from Art 26. Added FRIA obligation from Art 27 for applicable deployers.
- **Articles**: Art 26, Art 27

#### Issue #8: Annex III Point 5 Essential Services — Wrong Sub-types
- **Severity**: HIGH
- **Location**: `WizardAnswers.essentialServiceType` and wizard questions
- **Problem**: v1 had 8 sub-types for essential services. The Act's Annex III point 5 has exactly 5 sub-types: (a) creditworthiness, (b) insurance risk/pricing, (c) public benefits, (d) emergency dispatch, (e) credit scoring.
- **Impact**: Users would see options that don't exist in the Act, potentially misclassifying their system.
- **Fix**: Corrected to exactly 5 sub-types matching the Act: CREDITWORTHINESS, INSURANCE_RISK_PRICING, PUBLIC_BENEFITS, EMERGENCY_DISPATCH, CREDIT_SCORING.
- **Articles**: Annex III, point 5

---

### MEDIUM — Could cause confusion or incomplete guidance

#### Issue #9: Annex III Point 8 Missing Alternative Dispute Resolution
- **Severity**: MEDIUM
- **Location**: `WizardAnswers.justiceType` and wizard questions
- **Problem**: v1 only had court research and election influence. Point 8(b) — AI used for alternative dispute resolution — was missing.
- **Fix**: Added `ALTERNATIVE_DISPUTE_RESOLUTION` to justiceType options.
- **Articles**: Annex III, point 8(b)

#### Issue #10: Biometric Verification Not Clearly Excluded
- **Severity**: MEDIUM
- **Location**: `checkHighRiskAnnexIII()` — biometrics section
- **Problem**: v1 didn't distinguish between biometric verification (confirming identity, like Face ID) and biometric identification (determining WHO someone is). Verification is explicitly NOT high-risk per the Act.
- **Fix**: Added `isBiometricVerificationOnly` question and exclusion check.
- **Articles**: Annex III, point 1 (read with Recital 54)

#### Issue #11: No SME Simplifications or Fine Advantages
- **Severity**: MEDIUM
- **Location**: Fine calculator and classification results
- **Problem**: v1 showed the same maximum fines regardless of company size. The Act explicitly caps SME fines at the LOWER of the fixed amount and the percentage of turnover (Art 99(4)). Also missed: SME sandbox priority (Art 62), micro-enterprise QMS simplification (Art 63).
- **Fix**: Added SME-aware `buildFineRisk()` with worked examples. Added `getSMESimplifications()` function.
- **Articles**: Art 62, Art 63, Art 99(4)

#### Issue #12: Art 5(1)(g) Missing LE Labelling Exception
- **Severity**: MEDIUM
- **Location**: `checkProhibitedPractices()` — biometric categorisation
- **Problem**: v1 banned all biometric categorisation by sensitive attributes. The Act allows labelling/filtering of lawfully acquired biometric datasets for law enforcement purposes.
- **Fix**: Added `biometricCatForLawEnforcementLabelling` exception check.
- **Articles**: Art 5(1)(g)

---

### LOW — Minor improvements for accuracy and user experience

#### Issue #13: Missing Annex I Product List Reference
- **Severity**: LOW
- **Location**: Wizard questions for safety component check
- **Problem**: v1 asked "is your product under Annex I?" without listing what Annex I covers.
- **Fix**: Added comprehensive product list in wizard help text.
- **Articles**: Art 6(1), Annex I

#### Issue #14: Enforcement Timeline Was Static
- **Severity**: LOW
- **Location**: Timeline constants
- **Problem**: v1 had hardcoded timeline with no indication of which milestones had passed.
- **Fix**: Changed to dynamic `getEnforcementTimeline(currentDate)` function that returns ENFORCED/UPCOMING status and days-until countdown.
- **Articles**: Art 113

#### Issue #15: Art 5(1)(d) "Solely" Qualifier Needs Emphasis
- **Severity**: LOW
- **Location**: `checkProhibitedPractices()` — criminal risk profiling
- **Problem**: v1 didn't emphasize that criminal risk profiling is only prohibited when based SOLELY on profiling/personality — and that systems supporting human assessment of factual evidence are NOT prohibited.
- **Fix**: Added `crimeProfilingSupportingHumanAssessment` exception check with clear guidance.
- **Articles**: Art 5(1)(d)

---

## Verification Matrix

| Article | v1 Status | v2 Status | Test Case |
|---------|-----------|-----------|-----------|
| Art 2 (Scope) | ✅ Correct | ✅ Maintained | Military-only system → OUT OF SCOPE |
| Art 4 (AI Literacy) | ❌ Minimal only | ✅ All classifications | High-risk deployer → includes AI literacy |
| Art 5(1)(a) (Manipulation) | ❌ No harm check | ✅ With harm threshold | Minor nudge → NOT prohibited |
| Art 5(1)(b) (Vulnerability) | ❌ No harm check | ✅ With harm threshold | Child engagement feature → warning, not banned |
| Art 5(1)(d) (Criminal) | ⚠️ Missing "solely" | ✅ With sole/support check | Evidence analysis tool → NOT prohibited |
| Art 5(1)(f) (Workplace emotion) | ❌ No exception | ✅ Medical/safety exception | Driver fatigue monitor → NOT prohibited |
| Art 5(1)(g) (Biometric cat.) | ❌ No exception | ✅ LE labelling exception | LE dataset filtering → NOT prohibited |
| Art 5(1)(h) (Real-time bio) | ❌ No exceptions | ✅ LE + judicial auth | Missing persons search with warrant → NOT prohibited |
| Art 6(1) (Product safety) | ✅ Correct | ✅ With Annex I examples | Medical device AI → HIGH-RISK |
| Art 6(2) (Annex III) | ⚠️ Wrong subtypes | ✅ Exact Act subtypes | Credit scoring → ESSENTIAL_SERVICES |
| Art 6(3) (Exception) | ❌ Missing prerequisite | ✅ Dual condition | Risky narrow task → NO exception (significant risk) |
| Art 26 (Deployer) | ❌ Missing entirely | ✅ 8 obligations | SMB using HR AI → deployer obligations |
| Art 27 (FRIA) | ❌ Missing entirely | ✅ Where applicable | Public body deployer → FRIA required |
| Art 50 (Transparency) | ✅ Correct | ✅ Maintained | Chatbot → HUMAN_INTERACTION disclosure |
| Art 51-56 (GPAI) | ✅ Correct | ✅ Maintained | >10²⁵ FLOPs → GPAI_SYSTEMIC |
| Art 99 (Fines) | ⚠️ Not SME-aware | ✅ SME-adjusted | €2M turnover → max €60K (not €15M) |
| Annex III Pt 5 | ❌ 8 subtypes (wrong) | ✅ 5 subtypes (correct) | Emergency dispatch → ESSENTIAL_SERVICES |
| Annex III Pt 8 | ❌ Missing ADR | ✅ With ADR | Mediation AI → JUSTICE_DEMOCRACY |

---

*All 15 issues have been fixed in v2 of the classification engine and wizard.*
*Source: Regulation (EU) 2024/1689 — https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689*
