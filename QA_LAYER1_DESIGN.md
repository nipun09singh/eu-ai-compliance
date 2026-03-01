# QA Layer 1: Classification Engine — Exhaustive Test Design

**Document Version:** 1.0  
**Date:** 27 February 2026  
**Engine Version:** v2 (classification-engine.ts, 1,722 lines)  
**Existing Tests:** 166 passing (classification-engine.test.ts, 2,007 lines)  
**Regulation:** EU AI Act — Regulation (EU) 2024/1689  
**Source:** https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Pre-QA Audit: Engine Bugs Found During Research](#2-pre-qa-audit-engine-bugs-found-during-research)
3. [Gap 1: Adversarial & Boundary Input Testing](#3-gap-1-adversarial--boundary-input-testing)
4. [Gap 2: Legal Validation Against Regulation Text](#4-gap-2-legal-validation-against-regulation-text)
5. [Gap 3: Real-World Company Scenarios](#5-gap-3-real-world-company-scenarios)
6. [Test Inventory Summary](#6-test-inventory-summary)
7. [Implementation Notes](#7-implementation-notes)

---

## 1. EXECUTIVE SUMMARY

### Methodology
1. Read all 1,722 lines of `classification-engine.ts` — mapped every branch, condition, and helper function
2. Read all 2,007 lines of existing tests (166 tests) — catalogued every path already covered
3. Fetched and analyzed the full EU AI Act text from EUR-Lex (Regulation 2024/1689)
4. Cross-referenced every Article cited in our engine against the actual regulation text
5. Identified 15 discrepancies between engine logic and regulation text (5 CRITICAL, 5 HIGH, 5 MEDIUM)
6. Designed 400+ new tests across three gap categories

### What The Existing 166 Tests Cover Well
- ✅ Basic happy-path for all 6 classifications (PROHIBITED, HIGH_RISK, LIMITED_RISK, GPAI, GPAI_SYSTEMIC, MINIMAL_RISK)
- ✅ Each of the 8 prohibited practices with their primary exception paths
- ✅ Each of the 8 Annex III high-risk areas (basic trigger)
- ✅ Sub-type acceptance for each Annex III area
- ✅ Art 6(3) exception (4 conditions + profiling override + significant risk)
- ✅ GPAI compute threshold boundary (1e25 exactly vs. 1.01e25)
- ✅ Open-source exemptions (standard GPAI vs. systemic)
- ✅ Role-based obligation filtering (PROVIDER vs DEPLOYER vs BOTH)
- ✅ SME fine cap calculations (all 4 sizes × 3 tiers)
- ✅ Classification priority order (6 tests)
- ✅ 15 real-world scenarios
- ✅ Output structure validation

### What The Existing Tests DON'T Cover (The Three Gaps)
- ❌ **Adversarial inputs:** Contradictory booleans, impossible combinations, missing optional fields, type coercion
- ❌ **Legal accuracy:** Article text validation, exact sub-point citations, obligation-to-article mapping, cross-reference correctness
- ❌ **Real-world depth:** Only 15 scenarios for a regulation that covers hundreds of possible use cases; no industry-specific edge cases; no ambiguous "grey area" scenarios; no multi-jurisdiction cases

---

## 2. PRE-QA AUDIT: ENGINE BUGS FOUND DURING RESEARCH

Before designing tests, the research phase uncovered **15 discrepancies** between the engine and the regulation. These are not just "missing tests" — they are potential bugs in the engine itself. The QA test suite MUST include regression tests for each.

### CRITICAL (5 issues — incorrect legal output)

| ID | Issue | Engine Behavior | Regulation Text | Impact |
|----|-------|----------------|-----------------|--------|
| **BUG-C1** | Annex III Point 5 has 4 sub-types, not 5 | Engine defines 5 types: `CREDITWORTHINESS` (5a), `INSURANCE_RISK_PRICING` (5b), `PUBLIC_BENEFITS` (5c), `EMERGENCY_DISPATCH` (5d), `CREDIT_SCORING` (5e) | Actual structure: (a) public benefits, (b) creditworthiness + credit scoring (same sub-point), (c) insurance risk/pricing, (d) emergency dispatch | **Wrong article citations** in output. User would get incorrect legal references. |
| **BUG-C2** | Art 5(1)(a) only covers "subliminal manipulation" | Field is `usesSubliminaManipulation` (also typo: "Sublimina"). Type is `SUBLIMINAL_MANIPULATION` | Act covers THREE types: subliminal techniques, purposefully manipulative techniques, AND deceptive techniques (disjunctive "or") | **Under-inclusive** — systems using manipulative/deceptive (but non-subliminal) techniques would escape detection |
| **BUG-C3** | GPAI fines incorrectly apply SME "lower of" cap | `buildFineRisk("GPAI", ...)` applies SME cap language for non-LARGE companies | Art 101 (GPAI fines) does NOT include the Art 99(6) SME "whichever is lower" protection. SMEs get no special treatment for GPAI fines. | **Legally incorrect** — could lead SME GPAI providers to believe they have a lower fine cap when they don't |
| **BUG-C4** | Art 5(1)(a)/(b) harm threshold description may mislead | Binary field: `manipulationCausesSignificantHarm` | Act says "causes or is **reasonably likely to cause**" — a probabilistic standard, not just actual harm | Wizard question may lead users to answer "no" for a system that is "reasonably likely" to cause harm (which IS prohibited) |
| **BUG-C5** | Open-source exclusion (Art 2(12)) doesn't check Art 50 | Engine field `openSourceNonHighRisk` only checks for non-high-risk. The Art 2(12) exclusion grants MINIMAL_RISK | Art 2(12): exclusion does NOT apply if system falls under Art 5 (prohibited), Art 50 (transparency), OR is high-risk | Open-source chatbot interacting with humans should NOT be excluded (Art 50 applies) but engine would exclude it |

### HIGH (5 issues — missing nuance)

| ID | Issue | Details |
|----|-------|---------|
| **BUG-H1** | Art 6(3) prefatory test incomplete | Act says "does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons, **including by not materially influencing the outcome of decision making**." Our `posesSignificantRiskOfHarm` boolean doesn't explicitly capture the "not materially influencing" clause. The wizard question must make this component clear. |
| **BUG-H2** | GPAI + High-Risk dual classification not supported | Act operates on two layers: model provider → GPAI (Ch V), system integrator → HIGH_RISK (Ch III). Engine returns only ONE classification. A downstream provider integrating GPT into a hiring tool should get BOTH sets of obligations. |
| **BUG-H3** | Art 50(2) exception for "assistive editing" missing | Act exempts AI systems that "perform an assistive function for standard editing" or "do not substantially alter the input data." Engine treats any `generatesMedia: true` as triggering Art 50(2). A spell-checker, auto-formatter, or brightness adjustor shouldn't trigger this. |
| **BUG-H4** | Art 50(4) "editorial responsibility" exception missing | Act exempts AI-generated text from the public interest disclosure requirement when "content has undergone human review or editorial control and a natural person holds editorial responsibility." Engine doesn't capture this. |
| **BUG-H5** | Annex III points 1, 6, 7 qualifier missing | These points include "in so far as their use is permitted under relevant Union or national law." Engine doesn't warn about this qualifier — if the use is illegal under other law, the system may be outright illegal rather than just high-risk. |

### MEDIUM (5 issues — incomplete warnings/documentation)

| ID | Issue | Details |
|----|-------|---------|
| **BUG-M1** | Art 5(1)(g) sensitive attributes not enumerated | Engine doesn't list the 6 specific sensitive attributes (race, political opinions, trade union membership, religious/philosophical beliefs, sex life, sexual orientation) in warnings or next steps. |
| **BUG-M2** | Art 5(1)(h) Member State opt-in not mentioned | Art 5(5): Member States must opt in to the LE exception for real-time biometric ID. Engine warns about judicial authorization but not about Member State opt-in requirement. |
| **BUG-M3** | Art 5(1)(b) vulnerability groups not specified | Act specifies exploitation targets: age, disability, or specific social/economic situation. Engine uses generic `exploitsVulnerabilities` without specifying which groups. |
| **BUG-M4** | Art 99(6) SME fine rule wording imprecise | Engine says "the LOWER of €35M or 7% of global turnover" but the Act says "whichever thereof is lower" (applies to SMEs, inverted from the general "whichever is higher" rule). The current wording is directionally correct but could be clearer. |
| **BUG-M5** | Art 50(3) law enforcement exception for emotion recognition/biometric categorisation not captured | Art 50(3) exempts systems "permitted by law to detect, prevent or investigate criminal offences" from the notification requirement. Engine doesn't capture this exception. |

---

## 3. GAP 1: ADVERSARIAL & BOUNDARY INPUT TESTING

**Goal:** Ensure the engine handles every abnormal, contradictory, boundary, and stress-test input without crashing, producing incorrect results, or exposing logical inconsistencies.

**Total new tests in this gap: ~130**

---

### 3.1 Contradictory Boolean Combinations (~35 tests)

These test inputs where the user provides logically inconsistent answers (which WILL happen in production — users make mistakes).

#### 3.1.1 Scope Exclusion Contradictions

```
TEST-ADV-001: militaryDefenceOnly=true AND socialScoring=true
  Expected: MINIMAL_RISK (scope exclusion wins)
  Rationale: Already tested (test exists), but keep as regression
  Status: ALREADY COVERED (priority test #1 in section 12)

TEST-ADV-002: militaryDefenceOnly=true AND ALL prohibited practices=true
  Expected: MINIMAL_RISK (scope exclusion wins over ALL prohibitions)
  Rationale: Extreme version of the priority test — all 8 prohibited flags set

TEST-ADV-003: personalNonProfessional=true AND employmentUseCase=true
  Expected: MINIMAL_RISK (scope exclusion)
  Rationale: Contradictory — personal use can't involve employment AI.
  But engine should still prioritize scope exclusion. Add WARNING that these are contradictory.

TEST-ADV-004: scientificResearchOnly=true AND isSafetyComponent=true AND productUnderAnnexI=true
  Expected: MINIMAL_RISK (R&D exclusion wins)
  Rationale: A safety component for a product can't be "R&D only" if it's a product — contradictory

TEST-ADV-005: openSourceNonHighRisk=true AND educationUseCase=true
  Expected: CURRENTLY returns MINIMAL_RISK (scope exclusion), BUT per Art 2(12), open-source
  exclusion does NOT apply to high-risk systems. This is BUG-C5.
  Expected AFTER FIX: HIGH_RISK (open-source exclusion should NOT apply)

TEST-ADV-006: openSourceNonHighRisk=true AND interactsWithHumans=true
  Expected: CURRENTLY returns MINIMAL_RISK, BUT per Art 2(12), open-source exclusion
  does NOT apply to Art 50 transparency obligations. This is BUG-C5.
  Expected AFTER FIX: LIMITED_RISK

TEST-ADV-007: isEUBased=true AND outputUsedInEU=true AND militaryDefenceOnly=true
  Expected: MINIMAL_RISK (military exclusion regardless of EU nexus)

TEST-ADV-008: isEUBased=false AND outputUsedInEU=false AND militaryDefenceOnly=false
  AND scientificResearchOnly=false AND personalNonProfessional=false AND openSourceNonHighRisk=false
  Expected: MINIMAL_RISK (no EU nexus exclusion)
  Verify: legalBasis contains "Article 2", nextSteps mentions "No EU nexus"

TEST-ADV-009: ALL five scope exclusions=true simultaneously
  Expected: MINIMAL_RISK, all 5 exclusion reasons listed
  Verify: nextSteps contains all 5 exclusion texts

TEST-ADV-010: No scope exclusions AND no triggers → MINIMAL_RISK
  Expected: MINIMAL_RISK with DEFINITIVE confidence
  Status: ALREADY COVERED (test exists)
```

#### 3.1.2 Prohibited Practice Contradictions

```
TEST-ADV-011: usesSubliminaManipulation=false AND manipulationCausesSignificantHarm=true
  Expected: NOT PROHIBITED (manipulation flag is false, so harm flag is irrelevant)
  Rationale: Harm qualifier without the base practice — should be ignored
  Status: ALREADY COVERED (test exists)

TEST-ADV-012: exploitsVulnerabilities=false AND exploitationCausesSignificantHarm=true
  Expected: NOT PROHIBITED
  Rationale: Same pattern — qualifier without base practice

TEST-ADV-013: criminalRiskProfiling=false AND crimeProfilingBasedSolelyOnPersonality=true
  AND crimeProfilingSupportingHumanAssessment=false
  Expected: NOT PROHIBITED (base practice is false)
  Status: ALREADY COVERED (test exists)

TEST-ADV-014: criminalRiskProfiling=true AND crimeProfilingBasedSolelyOnPersonality=false
  AND crimeProfilingSupportingHumanAssessment=true
  Expected: NOT PROHIBITED (not solely based on personality)
  Rationale: Exception flag set but base condition not met — should pass cleanly

TEST-ADV-015: workplaceEmotionDetection=false AND workplaceEmotionForMedicalSafety=true
  Expected: NOT PROHIBITED
  Rationale: Medical exception flag without the base practice

TEST-ADV-016: biometricCategorisationSensitive=false AND biometricCatForLawEnforcementLabelling=true
  Expected: NOT PROHIBITED
  Rationale: LE exception flag without the base practice

TEST-ADV-017: realtimeBiometricPublicSpaces=false AND realtimeBiometricForLEException=true
  AND realtimeBiometricHasJudicialAuth=true
  Expected: NOT PROHIBITED
  Rationale: Full exception chain but base practice is false

TEST-ADV-018: ALL prohibited practices=true AND ALL exceptions=true (maximum exception coverage)
  Expected: PROHIBITED for socialScoring and facialRecognitionScraping (no exceptions exist)
  Verify: Only 2 violations (SOCIAL_SCORING + UNTARGETED_FACIAL_SCRAPING)
  Rationale: The others should all be saved by their exceptions, but social scoring
  and facial scraping have NO exceptions in the Act

TEST-ADV-019: socialScoring=true AND facialRecognitionScraping=true (the two absolute prohibitions)
  Expected: PROHIBITED with exactly 2 practices listed
  Verify: No warnings about exceptions (none exist for these)

TEST-ADV-020: All prohibited practices true, harm flags false, exceptions true
  Specifically:
    usesSubliminaManipulation=true, manipulationCausesSignificantHarm=false
    exploitsVulnerabilities=true, exploitationCausesSignificantHarm=false
    socialScoring=false (skip this one, no exception)
    criminalRiskProfiling=true, crimeProfilingBasedSolelyOnPersonality=true,
    crimeProfilingSupportingHumanAssessment=true
    facialRecognitionScraping=false (skip this one, no exception)
    workplaceEmotionDetection=true, workplaceEmotionForMedicalSafety=true
    biometricCategorisationSensitive=true, biometricCatForLawEnforcementLabelling=true
    realtimeBiometricPublicSpaces=true, realtimeBiometricForLEException=true,
    realtimeBiometricHasJudicialAuth=true
  Expected: NOT PROHIBITED (all with exceptions active, no-exception ones skipped)
  Status: ALREADY COVERED (similar test exists in edge cases section)
```

#### 3.1.3 High-Risk Contradictions

```
TEST-ADV-021: isSafetyComponent=true AND productUnderAnnexI=false AND requiresThirdPartyConformity=true
  Expected: NOT HIGH_RISK via Art 6(1) — missing Annex I condition
  Status: ALREADY COVERED

TEST-ADV-022: isSafetyComponent=true AND productUnderAnnexI=true AND requiresThirdPartyConformity=false
  Expected: NOT HIGH_RISK via Art 6(1) — missing third-party assessment
  Status: ALREADY COVERED

TEST-ADV-023: isSafetyComponent=false AND productUnderAnnexI=true AND requiresThirdPartyConformity=true
  Expected: NOT HIGH_RISK via Art 6(1) — not a safety component
  Rationale: The product is under Annex I and needs third-party assessment, but the AI itself
  isn't a safety component

TEST-ADV-024: Multiple Annex III areas true simultaneously
  usesBiometrics=true AND criticalInfrastructure=true AND educationUseCase=true
  AND employmentUseCase=true AND essentialServicesUseCase=true AND lawEnforcementUseCase=true
  AND migrationUseCase=true AND justiceUseCase=true
  Expected: HIGH_RISK, highRiskArea=JUSTICE_DEMOCRACY (last one wins)
  Verify: legalBasis contains all 8 Annex III point references
  Status: ALREADY COVERED (edge case test exists)

TEST-ADV-025: usesBiometrics=true AND isBiometricVerificationOnly=true AND biometricType undefined
  Expected: NOT HIGH_RISK (verification exclusion takes priority even without type specified)
  Rationale: If it's verification-only, the type shouldn't matter

TEST-ADV-026: usesBiometrics=true AND isBiometricVerificationOnly=true AND biometricType="REMOTE_IDENTIFICATION"
  Expected: NOT HIGH_RISK (verification exclusion should override type)
  Rationale: Contradictory — verification AND remote identification. Verification exclusion should win.
  Status: ALREADY COVERED

TEST-ADV-027: usesBiometrics=false AND biometricType="REMOTE_IDENTIFICATION"
  Expected: NOT HIGH_RISK via biometrics (base flag is false)
  Rationale: Sub-type set but parent flag is false

TEST-ADV-028: educationUseCase=false AND educationType="ADMISSION_ACCESS"
  Expected: NOT HIGH_RISK via education (base flag is false)
  Rationale: Sub-type set but parent flag is false — should be ignored

TEST-ADV-029: employmentUseCase=false AND employmentType="RECRUITMENT_SELECTION"
  Expected: NOT HIGH_RISK via employment (base flag is false)

TEST-ADV-030: essentialServicesUseCase=false AND essentialServiceType="CREDITWORTHINESS"
  Expected: NOT HIGH_RISK via essential services (base flag is false)

TEST-ADV-031: lawEnforcementUseCase=false AND lawEnforcementType="POLYGRAPH"
  Expected: NOT HIGH_RISK via law enforcement (base flag is false)

TEST-ADV-032: migrationUseCase=false AND migrationType="RISK_ASSESSMENT"
  Expected: NOT HIGH_RISK via migration (base flag is false)

TEST-ADV-033: justiceUseCase=false AND justiceType="COURT_RESEARCH_APPLICATION"
  Expected: NOT HIGH_RISK via justice (base flag is false)
```

#### 3.1.4 Art 6(3) Exception Contradictions

```
TEST-ADV-034: educationUseCase=true AND posesSignificantRiskOfHarm=true AND ALL conditions (a)-(d)=true
  Expected: HIGH_RISK (significant risk blocks exception regardless of conditions met)

TEST-ADV-035: educationUseCase=true AND posesSignificantRiskOfHarm=false AND ALL conditions (a)-(d)=true
  AND performsProfiling=true
  Expected: HIGH_RISK (profiling override defeats ALL conditions)

TEST-ADV-036: educationUseCase=true AND posesSignificantRiskOfHarm=false AND ALL conditions (a)-(d)=false
  AND performsProfiling=false
  Expected: HIGH_RISK (no condition met, so no exception)
  Status: ALREADY COVERED

TEST-ADV-037: educationUseCase=true AND posesSignificantRiskOfHarm=true AND performsProfiling=true
  AND ALL conditions=true
  Expected: HIGH_RISK (both blockers active)

TEST-ADV-038: No Annex III area=true AND posesSignificantRiskOfHarm=false AND narrowProceduralTask=true
  Expected: MINIMAL_RISK (default) — Art 6(3) is irrelevant without an Annex III trigger
  Verify: No Art 6(3) reference in result

TEST-ADV-039: educationUseCase=true AND posesSignificantRiskOfHarm=false AND narrowProceduralTask=true
  Verify: obligations include DOCUMENT_NON_HIGH_RISK and REGISTER_NON_HIGH_RISK
  Verify: warnings mention "narrowly interpreted" and "market surveillance"
  Verify: fineRisk is HIGH_RISK tier (even for the exception — Art 6(4) failure = HIGH_RISK fines)
  Status: ALREADY COVERED (multiple existing tests)
```

#### 3.1.5 GPAI Contradictions

```
TEST-ADV-040: isGeneralPurposeModel=false AND gpaiTrainingCompute=1e30
  Expected: NOT GPAI (base flag is false, compute is irrelevant)

TEST-ADV-041: isGeneralPurposeModel=false AND gpaiHighImpactCapabilities=true
  Expected: NOT GPAI (base flag is false)

TEST-ADV-042: isGeneralPurposeModel=false AND gpaiOpenSource=true
  Expected: NOT GPAI (base flag is false)

TEST-ADV-043: isGeneralPurposeModel=true AND gpaiTrainingCompute=undefined AND gpaiHighImpactCapabilities=false
  Expected: GPAI (standard, not systemic)
  Rationale: Undefined compute should not trigger systemic risk

TEST-ADV-044: isGeneralPurposeModel=true AND gpaiTrainingCompute=0 AND gpaiHighImpactCapabilities=false
  Expected: GPAI (standard) — zero compute is not > 1e25

TEST-ADV-045: isGeneralPurposeModel=true AND gpaiTrainingCompute=-1 AND gpaiHighImpactCapabilities=false
  Expected: GPAI (standard) — negative compute is nonsensical but should not crash
```

---

### 3.2 Boundary Value Tests (~25 tests)

#### 3.2.1 GPAI Compute Threshold (10^25 FLOPs boundary — Art 51(2))

The regulation says "**greater than** 10^25" (strictly >), NOT >= 10^25.

```
TEST-BND-001: gpaiTrainingCompute = 1e25 (exactly 10^25)
  Expected: GPAI (standard, NOT systemic)
  Rationale: > 1e25 required, exactly 1e25 does not qualify
  Status: ALREADY COVERED

TEST-BND-002: gpaiTrainingCompute = 1e25 + 1 (one FLOP above threshold)
  Expected: GPAI_SYSTEMIC
  Rationale: Strictly greater than 1e25

TEST-BND-003: gpaiTrainingCompute = 9.999999999999e24 (just below 1e25)
  Expected: GPAI (standard)
  Rationale: Below threshold

TEST-BND-004: gpaiTrainingCompute = 1.000000000001e25 (just above 1e25)
  Expected: GPAI_SYSTEMIC
  Rationale: Above threshold

TEST-BND-005: gpaiTrainingCompute = 0
  Expected: GPAI (standard)
  Rationale: Zero is not > 1e25

TEST-BND-006: gpaiTrainingCompute = Number.MAX_SAFE_INTEGER
  Expected: GPAI_SYSTEMIC
  Rationale: Very large number, well above threshold

TEST-BND-007: gpaiTrainingCompute = Number.POSITIVE_INFINITY
  Expected: GPAI_SYSTEMIC or error handling
  Rationale: Edge case — Infinity > 1e25 is true in JS

TEST-BND-008: gpaiTrainingCompute = NaN
  Expected: GPAI (standard) — NaN > 1e25 is false in JS
  Rationale: NaN should not trigger systemic risk

TEST-BND-009: gpaiTrainingCompute = Number.NEGATIVE_INFINITY
  Expected: GPAI (standard) — negative infinity is not > 1e25

TEST-BND-010: gpaiTrainingCompute = -1e25
  Expected: GPAI (standard) — negative is not > 1e25
```

#### 3.2.2 Company Size Boundaries

```
TEST-BND-011: companySize="MICRO" → verify SME simplifications length > 0
TEST-BND-012: companySize="SMALL" → verify SME simplifications contain "regulatory sandbox"
TEST-BND-013: companySize="MEDIUM" → verify SME simplifications contain "regulatory sandbox"
TEST-BND-014: companySize="LARGE" → verify SME simplifications length = 0
TEST-BND-015: companySize="MICRO" → verify fine note mentions specific example amount
TEST-BND-016: companySize="LARGE" → verify fine maxAmountSME equals maxAmountGeneral
```

#### 3.2.3 Enforcement Timeline Boundaries

```
TEST-BND-017: getEnforcementTimeline(new Date("2025-02-01")) → prohibited milestone is UPCOMING
TEST-BND-018: getEnforcementTimeline(new Date("2025-02-02")) → prohibited milestone is ENFORCED
  Verify: daysUntil = 0
TEST-BND-019: getEnforcementTimeline(new Date("2025-02-03")) → prohibited milestone is ENFORCED
  Verify: daysUntil = 0

TEST-BND-020: getEnforcementTimeline(new Date("2025-08-01")) → GPAI milestone is UPCOMING
TEST-BND-021: getEnforcementTimeline(new Date("2025-08-02")) → GPAI milestone is ENFORCED
TEST-BND-022: getEnforcementTimeline(new Date("2026-08-01")) → HIGH_RISK milestone is UPCOMING
TEST-BND-023: getEnforcementTimeline(new Date("2026-08-02")) → HIGH_RISK milestone is ENFORCED
TEST-BND-024: getEnforcementTimeline(new Date("2030-12-31")) → ALL milestones ENFORCED
TEST-BND-025: getEnforcementTimeline(new Date("2024-01-01")) → ALL milestones UPCOMING
  Status: ALREADY COVERED
```

---

### 3.3 Maximum Simultaneous Trigger Tests (~15 tests)

Test the engine under maximum load — every possible trigger active at once.

```
TEST-MAX-001: ALL scope exclusions + ALL prohibited + ALL Annex III + ALL transparency + GPAI systemic
  Expected: MINIMAL_RISK (scope exclusion wins over everything)
  Verify: Engine doesn't crash, returns valid result

TEST-MAX-002: ALL prohibited (no exceptions) + ALL Annex III + ALL transparency + GPAI systemic
  Expected: PROHIBITED with 8 practices (after removing scope exclusions)
  Verify: All prohibited practices listed, all legal bases present

TEST-MAX-003: ALL Annex III areas + ALL transparency + GPAI systemic (no scope/prohibited)
  Expected: GPAI_SYSTEMIC (GPAI checked before Annex III)
  Verify: GPAI classification with systemic risk obligations

TEST-MAX-004: ALL Annex III areas + ALL transparency (no GPAI, no scope, no prohibited)
  Expected: HIGH_RISK with highRiskArea=JUSTICE_DEMOCRACY (last area checked)

TEST-MAX-005: ALL transparency obligations, no other triggers
  Expected: LIMITED_RISK with 6 transparency obligations listed
  Status: ALREADY COVERED

TEST-MAX-006: ALL transparency obligations + ALL Art 6(3) exception conditions active
  (with Annex III area) + no significant risk + no profiling
  Expected: MINIMAL_RISK (Art 6(3) exception) with documentation obligations
  Rationale: Even with all transparency flags, Art 6(3) routes to MINIMAL_RISK before
  transparency check is reached

TEST-MAX-007: Single SME (MICRO) company with ALL possible HIGH_RISK obligations (BOTH role)
  Expected: HIGH_RISK
  Verify: obligations array is very long (provider + deployer + FRIA + AI literacy)
  Verify: SME simplifications include micro-enterprise QMS simplification

TEST-MAX-008: LARGE company as BOTH role with BIOMETRICS high-risk area
  Expected: HIGH_RISK
  Verify: obligations include BOTH provider and deployer obligations
  Verify: conformity assessment mentions "notified body" (biometrics special rule)
  Verify: SME simplifications is empty array

TEST-MAX-009: All prohibited flags TRUE, all harm flags TRUE, all exceptions FALSE
  Expected: PROHIBITED with all 8 practices
  Status: ALREADY COVERED (edge case test)

TEST-MAX-010: All prohibited flags TRUE, all harm flags TRUE, all exceptions TRUE
  Expected: PROHIBITED for at least SOCIAL_SCORING and UNTARGETED_FACIAL_SCRAPING
  (the two practices with no exceptions at all)

TEST-MAX-011: Minimum possible input (all booleans false, empty strings, no optionals)
  Expected: MINIMAL_RISK, role preserved, no crash

TEST-MAX-012: Role=BOTH with every possible trigger that could add obligations
  Verify: No duplicate obligation IDs in the result

TEST-MAX-013: GPAI systemic + open source → verify open-source exemption does NOT apply
  Verify: All GPAI + systemic obligations present (tech doc, downstream info, copyright, training summary, 
  model evaluation, systemic risk mitigation, serious incident tracking, cybersecurity)
  Status: PARTIALLY COVERED

TEST-MAX-014: All Art 6(3) conditions true + profiling true + significant risk false
  Expected: HIGH_RISK (profiling override wins)
  Status: ALREADY COVERED

TEST-MAX-015: All Art 6(3) conditions true + profiling false + significant risk true
  Expected: HIGH_RISK (significant risk blocks exception)
  Status: ALREADY COVERED
```

---

### 3.4 Optional/Undefined Field Handling (~20 tests)

Test what happens when optional fields are missing or undefined.

```
TEST-OPT-001: biometricType is undefined, usesBiometrics=true, isBiometricVerificationOnly=false
  Expected: NOT HIGH_RISK via biometrics
  Rationale: Engine checks biometricType for specific values; undefined should not match

TEST-OPT-002: educationType is undefined, educationUseCase=true
  Expected: HIGH_RISK (education area doesn't require sub-type to be set)
  Verify: Sub-type is just informational, not a gate

TEST-OPT-003: employmentType is undefined, employmentUseCase=true
  Expected: HIGH_RISK

TEST-OPT-004: essentialServiceType is undefined, essentialServicesUseCase=true
  Expected: HIGH_RISK

TEST-OPT-005: lawEnforcementType is undefined, lawEnforcementUseCase=true
  Expected: HIGH_RISK

TEST-OPT-006: migrationType is undefined, migrationUseCase=true
  Expected: HIGH_RISK

TEST-OPT-007: justiceType is undefined, justiceUseCase=true
  Expected: HIGH_RISK

TEST-OPT-008: gpaiTrainingCompute is undefined, isGeneralPurposeModel=true,
  gpaiHighImpactCapabilities=false
  Expected: GPAI (standard, not systemic)
  Rationale: Undefined compute means no basis for systemic risk via compute
  Status: IMPLICITLY COVERED (default baseAnswers has no compute value)

TEST-OPT-009: companyName="" (empty string)
  Expected: Valid result, no crash
  Rationale: Company name doesn't affect classification

TEST-OPT-010: systemDescription="" (empty string)
  Expected: Valid result, no crash
  Rationale: System description doesn't affect classification (it's for context only)

TEST-OPT-011: All optional sub-type fields set to values from WRONG parent category
  e.g., educationUseCase=true but educationType is a value that doesn't match any education type
  Expected: Still HIGH_RISK for education (sub-type is informational)

TEST-OPT-012: biometricType set to an invalid/unexpected string (TypeScript string union bypass)
  Expected: NOT HIGH_RISK via biometrics (doesn't match any valid type)
  Rationale: Runtime type safety check

TEST-OPT-013: role is "PROVIDER" → verify no deployer obligations in high-risk result
  Status: ALREADY COVERED

TEST-OPT-014: role is "DEPLOYER" → verify no provider obligations in high-risk result
  Status: ALREADY COVERED

TEST-OPT-015: role is "BOTH" → verify both sets of obligations present
  Status: ALREADY COVERED

TEST-OPT-016: Negative scenario — ensure engine handles undefined WizardAnswers fields
  by testing with Object.assign({}, baseAnswers(), { educationUseCase: undefined })
  Expected: NOT HIGH_RISK (undefined is falsy in JavaScript)

TEST-OPT-017: Ensure engine handles null values gracefully
  e.g., gpaiTrainingCompute: null
  Expected: Standard GPAI, not systemic (null > 1e25 is false in JS)

TEST-OPT-018: Boolean coercion edge cases
  socialScoring: 0 (falsy but type mismatch)
  Expected: NOT PROHIBITED (0 is falsy in JS)

TEST-OPT-019: Boolean coercion edge cases
  socialScoring: "" (falsy but type mismatch)
  Expected: NOT PROHIBITED

TEST-OPT-020: Boolean coercion edge cases
  socialScoring: 1 (truthy but type mismatch)
  Expected: PROHIBITED (1 is truthy in JS) — a runtime safety concern
```

---

### 3.5 Priority Order Stress Tests (~15 tests)

Test every possible pair of classification levels to confirm correct priority ordering.

The engine's priority order (verified from code): Scope Exclusion → Prohibited → GPAI → Safety Component → Annex III → Transparency → Minimal Risk

```
TEST-PRI-001: scope exclusion > prohibited (exists, regression keep)
TEST-PRI-002: scope exclusion > GPAI
  militaryDefenceOnly=true AND isGeneralPurposeModel=true
  Expected: MINIMAL_RISK (excluded)

TEST-PRI-003: scope exclusion > safety component high-risk
  personalNonProfessional=true AND isSafetyComponent=true AND productUnderAnnexI=true
  AND requiresThirdPartyConformity=true
  Expected: MINIMAL_RISK (excluded)

TEST-PRI-004: scope exclusion > Annex III high-risk
  scientificResearchOnly=true AND educationUseCase=true
  Expected: MINIMAL_RISK (excluded)

TEST-PRI-005: scope exclusion > transparency
  openSourceNonHighRisk=true AND interactsWithHumans=true
  Expected: CURRENTLY MINIMAL_RISK (BUG-C5: should be LIMITED_RISK per Art 2(12))

TEST-PRI-006: prohibited > GPAI (exists, regression keep)
TEST-PRI-007: prohibited > safety component high-risk
  socialScoring=true AND isSafetyComponent=true AND productUnderAnnexI=true
  AND requiresThirdPartyConformity=true
  Expected: PROHIBITED

TEST-PRI-008: prohibited > Annex III high-risk (exists, regression keep)
TEST-PRI-009: prohibited > transparency
  socialScoring=true AND interactsWithHumans=true
  Expected: PROHIBITED

TEST-PRI-010: GPAI > safety component (exists, regression keep)
TEST-PRI-011: GPAI > Annex III (exists, regression keep)
TEST-PRI-012: GPAI > transparency
  isGeneralPurposeModel=true AND interactsWithHumans=true
  Expected: GPAI

TEST-PRI-013: safety component > Annex III (exists, regression keep)
TEST-PRI-014: safety component > transparency
  isSafetyComponent=true AND productUnderAnnexI=true AND requiresThirdPartyConformity=true
  AND interactsWithHumans=true
  Expected: HIGH_RISK (safety component)

TEST-PRI-015: Annex III > transparency
  educationUseCase=true AND interactsWithHumans=true
  Expected: HIGH_RISK (Annex III)
  Status: ALREADY COVERED
```

---

### 3.6 Return Value Integrity Tests (~20 tests)

Ensure every output field is correctly typed and populated for each classification level.

```
For EACH classification (PROHIBITED, HIGH_RISK, LIMITED_RISK, GPAI, GPAI_SYSTEMIC, MINIMAL_RISK,
scope-excluded MINIMAL_RISK, Art 6(3) exception MINIMAL_RISK):

TEST-RVI-001 through TEST-RVI-008: Verify for each:
  - classification: matches expected RiskClassification enum value
  - role: matches input role exactly
  - confidence: is one of "DEFINITIVE" | "LIKELY" | "NEEDS_LEGAL_REVIEW"
  - legalBasis: is non-empty string array
  - obligations: is non-empty array (AI literacy always present)
  - enforcementDeadline: is valid ISO date string matching EnforcementTimeline type
  - fineRisk: has all 4 required fields (maxAmountGeneral, maxAmountSME, maxPercentTurnover, article)
  - nextSteps: is non-empty string array
  - warnings: is string array (may be empty)
  - smeSimplifications: is string array (may be empty)

TEST-RVI-009: PROHIBITED result must have prohibitedPractices (non-empty array)
TEST-RVI-010: HIGH_RISK Annex III result must have highRiskArea defined
TEST-RVI-011: LIMITED_RISK result must have transparencyObligations (non-empty array)
TEST-RVI-012: GPAI/GPAI_SYSTEMIC results should NOT have highRiskArea
TEST-RVI-013: MINIMAL_RISK (default) should NOT have prohibitedPractices or transparencyObligations
TEST-RVI-014: Scope-excluded MINIMAL_RISK should have LIKELY confidence
TEST-RVI-015: Art 6(3) exception result should have LIKELY confidence + both Art 6(3) references
TEST-RVI-016: All obligations must have: id, article, title, description, appliesToRole, priority, deadline
TEST-RVI-017: No obligation should have empty string for any required field
TEST-RVI-018: fineRisk.maxPercentTurnover must be a non-negative number
TEST-RVI-019: enforcementDeadline must parse to a valid Date
TEST-RVI-020: Warnings array must not contain empty strings
  (Engine currently has a .filter(Boolean) call — verify it works for all paths)
```

---

## 4. GAP 2: LEGAL VALIDATION AGAINST REGULATION TEXT

**Goal:** Validate that every article reference, obligation description, fine amount, deadline, and legal citation in the engine output exactly matches the EU AI Act regulation text.

**Total new tests in this gap: ~170**

---

### 4.1 Article Reference Accuracy (~40 tests)

For each prohibited practice, verify the exact article cited matches the regulation.

#### 4.1.1 Prohibited Practice Article References

```
TEST-LAW-001: Art 5(1)(a) SUBLIMINAL_MANIPULATION
  Verify: legalBasis contains "Article 5(1)(a)"
  Verify: Does NOT contain Article 5(1)(b), (c), etc.
  Status: ALREADY COVERED

TEST-LAW-002: Art 5(1)(b) VULNERABILITY_EXPLOITATION
  Verify: legalBasis contains "Article 5(1)(b)"
  Status: ALREADY COVERED

TEST-LAW-003: Art 5(1)(c) SOCIAL_SCORING
  Verify: legalBasis contains "Article 5(1)(c)"
  Status: ALREADY COVERED

TEST-LAW-004: Art 5(1)(d) CRIMINAL_RISK_PROFILING_SOLELY
  Verify: legalBasis contains "Article 5(1)(d)"
  Status: ALREADY COVERED

TEST-LAW-005: Art 5(1)(e) UNTARGETED_FACIAL_SCRAPING
  Verify: legalBasis contains "Article 5(1)(e)"
  Status: ALREADY COVERED

TEST-LAW-006: Art 5(1)(f) WORKPLACE_EMOTION_DETECTION
  Verify: legalBasis contains "Article 5(1)(f)"

TEST-LAW-007: Art 5(1)(g) BIOMETRIC_CATEGORISATION_SENSITIVE
  Verify: legalBasis contains "Article 5(1)(g)"

TEST-LAW-008: Art 5(1)(h) REALTIME_BIOMETRIC_LAW_ENFORCEMENT
  Verify: legalBasis contains "Article 5(1)(h)"
```

#### 4.1.2 Annex III Point References

```
TEST-LAW-009: BIOMETRICS → legalBasis contains "Annex III, point 1"
TEST-LAW-010: CRITICAL_INFRASTRUCTURE → legalBasis contains "Annex III, point 2"
TEST-LAW-011: EDUCATION → legalBasis contains "Annex III, point 3"
TEST-LAW-012: EMPLOYMENT → legalBasis contains "Annex III, point 4"
TEST-LAW-013: ESSENTIAL_SERVICES → legalBasis contains "Annex III, point 5"
TEST-LAW-014: LAW_ENFORCEMENT → legalBasis contains "Annex III, point 6"
TEST-LAW-015: MIGRATION_ASYLUM_BORDER → legalBasis contains "Annex III, point 7"
TEST-LAW-016: JUSTICE_DEMOCRACY → legalBasis contains "Annex III, point 8"
  (All 8 above confirm Annex III point numbering is correct)

TEST-LAW-017: HIGH_RISK via Annex III always includes "Article 6(2)" in legalBasis
TEST-LAW-018: HIGH_RISK via safety component includes "Article 6(1)" AND "Annex I"
TEST-LAW-019: Art 6(3) exception includes "Article 6(3)" in legalBasis
```

#### 4.1.3 GPAI Article References

```
TEST-LAW-020: Standard GPAI → legalBasis contains "Article 53"
TEST-LAW-021: GPAI_SYSTEMIC → legalBasis contains "Article 51" AND "Article 55"
TEST-LAW-022: GPAI base obligations reference correct articles
  GPAI_TECHNICAL_DOC → "Article 53(1)(a), Annex XI"
  GPAI_DOWNSTREAM_INFO → "Article 53(1)(b), Annex XII"
  GPAI_COPYRIGHT_POLICY → "Article 53(1)(c)"
  GPAI_TRAINING_SUMMARY → "Article 53(1)(d)"
TEST-LAW-023: GPAI systemic risk obligations reference correct articles
  MODEL_EVALUATION → "Article 55(1)(a)"
  SYSTEMIC_RISK_MITIGATION → "Article 55(1)(b)"
  SERIOUS_INCIDENT_TRACKING → "Article 55(1)(c)"
  CYBERSECURITY_GPAI → "Article 55(1)(d)"
```

#### 4.1.4 Transparency Article References

```
TEST-LAW-024: HUMAN_INTERACTION → obligation article = "Article 50(1)"
TEST-LAW-025: EMOTION_RECOGNITION → obligation article = "Article 50(3)"
TEST-LAW-026: BIOMETRIC_CATEGORISATION → obligation article = "Article 50(3)"
TEST-LAW-027: DEEPFAKE_CONTENT → obligation article = "Article 50(4)"
TEST-LAW-028: AI_GENERATED_TEXT → obligation article = "Article 50(4)"
TEST-LAW-029: AI_GENERATED_MEDIA → obligation article = "Article 50(2)"
```

#### 4.1.5 High-Risk Obligation Article References (Provider)

```
TEST-LAW-030: RISK_MANAGEMENT_SYSTEM → "Article 9"
TEST-LAW-031: DATA_GOVERNANCE → "Article 10"
TEST-LAW-032: TECHNICAL_DOCUMENTATION → "Article 11, Annex IV"
TEST-LAW-033: RECORD_KEEPING → "Article 12"
TEST-LAW-034: TRANSPARENCY_TO_DEPLOYERS → "Article 13"
TEST-LAW-035: HUMAN_OVERSIGHT → "Article 14"
TEST-LAW-036: ACCURACY_ROBUSTNESS_CYBERSEC → "Article 15"
TEST-LAW-037: QUALITY_MANAGEMENT_SYSTEM → "Article 17"
TEST-LAW-038: DOCUMENTATION_KEEPING_10YR → "Article 18"
TEST-LAW-039: AUTO_LOG_RETENTION → "Article 19"
TEST-LAW-040: CORRECTIVE_ACTIONS → "Article 20"
TEST-LAW-041: CONFORMITY_ASSESSMENT → "Article 43"
TEST-LAW-042: EU_DECLARATION → "Article 47, Annex V"
TEST-LAW-043: CE_MARKING → "Article 48"
TEST-LAW-044: EU_DATABASE_REGISTRATION → "Article 49(1), Annex VIII Section A"
TEST-LAW-045: POST_MARKET_MONITORING → "Article 72"
TEST-LAW-046: SERIOUS_INCIDENT_REPORTING → "Article 73"
```

#### 4.1.6 Deployer Obligation Article References

```
TEST-LAW-047: DEPLOY_PER_INSTRUCTIONS → "Article 26(1)"
TEST-LAW-048: ASSIGN_HUMAN_OVERSIGHT → "Article 26(2)"
TEST-LAW-049: MONITOR_OPERATIONS → "Article 26(5)"
TEST-LAW-050: KEEP_DEPLOYER_LOGS → "Article 26(6)"
TEST-LAW-051: INFORM_WORKERS → "Article 26(7)"
TEST-LAW-052: INFORM_AFFECTED_PERSONS → "Article 26(11)"
TEST-LAW-053: DPIA_IF_APPLICABLE → "Article 26(9)"
TEST-LAW-054: DEPLOYER_REGISTRATION → "Article 49(3)"
TEST-LAW-055: FUNDAMENTAL_RIGHTS_IMPACT → "Article 27"
```

---

### 4.2 Fine Calculation Accuracy (~30 tests)

Verify every fine tier exactly matches Articles 99 and 101.

```
TEST-FIN-001: PROHIBITED + LARGE → maxAmountGeneral = "€35,000,000", maxPercentTurnover = 7, article = "Article 99(3)"
TEST-FIN-002: PROHIBITED + SMALL → maxAmountSME contains "LOWER", maxPercentTurnover = 7
  Verify: Reflects Art 99(6) "whichever thereof is lower"
TEST-FIN-003: PROHIBITED + MICRO → same SME rule as SMALL
TEST-FIN-004: PROHIBITED + MEDIUM → same SME rule
TEST-FIN-005: HIGH_RISK + LARGE → maxAmountGeneral = "€15,000,000", maxPercentTurnover = 3, article = "Article 99(4)"
TEST-FIN-006: HIGH_RISK + SMALL → maxAmountSME contains "LOWER"
TEST-FIN-007: HIGH_RISK + MICRO → SME lower cap
TEST-FIN-008: HIGH_RISK + MEDIUM → SME lower cap

TEST-FIN-009: GPAI + LARGE → maxAmountGeneral = "€15,000,000", maxPercentTurnover = 3, article = "Article 101(1)"
TEST-FIN-010: GPAI + SMALL → CURRENTLY applies SME cap. THIS IS BUG-C3.
  Expected AFTER FIX: No SME protection (Art 101 doesn't include Art 99(6) SME rule)
  The maxAmountSME should equal maxAmountGeneral (or state that Art 101 doesn't
  include SME protection)

TEST-FIN-011: GPAI_SYSTEMIC + LARGE → same as GPAI fine tier
TEST-FIN-012: GPAI_SYSTEMIC + MICRO → SAME BUG-C3 applies

TEST-FIN-013: NONE (minimal risk, no violations) → maxAmountGeneral = "N/A", maxPercentTurnover = 0
TEST-FIN-014: Scope-excluded → fine category = "NONE"

TEST-FIN-015: Art 6(3) exception MINIMAL_RISK → fine risk should be HIGH_RISK tier
  Rationale: Art 6(4) violation (failure to document exception) = Art 99(4) fines
  Verify: fineRisk.article = "Article 99(4)" and fineRisk.maxPercentTurnover = 3

TEST-FIN-016: LIMITED_RISK → verify fine tier
  Engine currently uses buildFineRisk("HIGH_RISK", ...) for limited risk
  Verify: This is correct — Art 50 violations fall under Art 99(4) (€15M/3%)

TEST-FIN-017: Verify fine note for MICRO with PROHIBITED:
  Should mention concrete example (e.g., "For a company with €5M turnover, max €350K")

TEST-FIN-018: Verify fine note for LARGE with PROHIBITED:
  Should NOT have a note (or note should be undefined)

For all company sizes × all fine tiers (4 × 5 = 20 combinations):
TEST-FIN-019 through TEST-FIN-030: Matrix test — verify correct fine amounts for:
  - MICRO × {PROHIBITED, HIGH_RISK, GPAI, INCORRECT_INFO, NONE}
  - SMALL × {PROHIBITED, HIGH_RISK, GPAI, INCORRECT_INFO, NONE}
  - MEDIUM × {PROHIBITED, HIGH_RISK, GPAI, INCORRECT_INFO, NONE}
  - LARGE × {PROHIBITED, HIGH_RISK, GPAI, INCORRECT_INFO, NONE}
  (Note: INCORRECT_INFO category exists in buildFineRisk but is never triggered
  by classifyAISystem — it's a latent path. Test it directly.)
```

---

### 4.3 Enforcement Deadline Accuracy (~20 tests)

Verify every deadline matches the regulation's phased enforcement timeline.

```
TEST-DL-001: PROHIBITED classification → enforcementDeadline = "2025-02-02"
  Regulation: Art 5 entered application 2 February 2025

TEST-DL-002: HIGH_RISK via Annex III → enforcementDeadline = "2026-08-02"
  Regulation: Art 6-49 enter application 2 August 2026

TEST-DL-003: HIGH_RISK via safety component (Art 6(1)) → enforcementDeadline = "2027-08-02"
  Regulation: Annex I, Section A products get extra year (Art 113(3)(b))

TEST-DL-004: LIMITED_RISK (Art 50) → enforcementDeadline = "2026-08-02"

TEST-DL-005: GPAI → enforcementDeadline = "2025-08-02"
  Regulation: GPAI obligations entered application 2 August 2025

TEST-DL-006: GPAI_SYSTEMIC → enforcementDeadline = "2025-08-02"

TEST-DL-007: MINIMAL_RISK → enforcementDeadline = "2026-08-02"

TEST-DL-008: Art 6(3) exception → enforcementDeadline = "2026-08-02"

TEST-DL-009: AI_LITERACY obligation always has deadline = "2025-02-02"
  Regulation: Art 4 entered application 2 February 2025

TEST-DL-010: CEASE_AND_DESIST obligation deadline = "2025-02-02"

TEST-DL-011: Provider high-risk obligations (Annex III) → all deadlines = "2026-08-02"
TEST-DL-012: Provider high-risk obligations (safety component) → all deadlines = "2027-08-02"
TEST-DL-013: Deployer high-risk obligations (Annex III) → all deadlines = "2026-08-02"

TEST-DL-014: GPAI base obligations → all deadlines = "2025-08-02"
TEST-DL-015: GPAI systemic obligations → all deadlines = "2025-08-02"

TEST-DL-016: Art 6(3) exception obligations (DOCUMENT_NON_HIGH_RISK, REGISTER_NON_HIGH_RISK)
  → deadline = "2026-08-02"

TEST-DL-017: getEnforcementTimeline() milestones match these exact dates:
  "2025-02-02", "2025-05-02", "2025-08-02", "2026-08-02", "2027-08-02", "2030-08-02"

TEST-DL-018: Verify the "Codes of practice" milestone (2025-05-02) exists
  Regulation: Art 56 — codes of practice ready by 2 May 2025

TEST-DL-019: Verify the 2030-08-02 milestone mentions "public authorities"
  Regulation: Art 111(1)-(2) — public authority deployers until 31 Dec 2030

TEST-DL-020: Verify all 6 milestones have distinct dates in chronological order
  Status: ALREADY COVERED
```

---

### 4.4 Obligation Completeness Validation (~40 tests)

For each classification, verify the complete set of obligations matches what the regulation requires.

#### 4.4.1 Provider High-Risk Obligations (Art 6-49, Art 72-73)

```
TEST-OBL-001: Provider HIGH_RISK (Annex III) must include ALL of:
  - RISK_MANAGEMENT_SYSTEM (Art 9)
  - DATA_GOVERNANCE (Art 10)
  - TECHNICAL_DOCUMENTATION (Art 11)
  - RECORD_KEEPING (Art 12)
  - TRANSPARENCY_TO_DEPLOYERS (Art 13)
  - HUMAN_OVERSIGHT (Art 14)
  - ACCURACY_ROBUSTNESS_CYBERSEC (Art 15)
  - QUALITY_MANAGEMENT_SYSTEM (Art 17)
  - DOCUMENTATION_KEEPING_10YR (Art 18)
  - AUTO_LOG_RETENTION (Art 19)
  - CORRECTIVE_ACTIONS (Art 20)
  - CONFORMITY_ASSESSMENT (Art 43)
  - EU_DECLARATION (Art 47)
  - CE_MARKING (Art 48)
  - EU_DATABASE_REGISTRATION (Art 49)
  - POST_MARKET_MONITORING (Art 72)
  - SERIOUS_INCIDENT_REPORTING (Art 73)
  - AI_LITERACY (Art 4)
  Total: 18 obligations

TEST-OBL-002: Provider HIGH_RISK obligations must NOT include any deployer-specific obligations
  (DEPLOY_PER_INSTRUCTIONS, ASSIGN_HUMAN_OVERSIGHT, MONITOR_OPERATIONS, etc.)
  Status: ALREADY COVERED

TEST-OBL-003: Provider HIGH_RISK (safety component) — same obligations as Annex III
  but all deadlines = "2027-08-02" instead of "2026-08-02"
```

#### 4.4.2 Deployer High-Risk Obligations (Art 26, Art 27)

```
TEST-OBL-004: Deployer HIGH_RISK (Annex III) must include ALL of:
  - DEPLOY_PER_INSTRUCTIONS (Art 26(1))
  - ASSIGN_HUMAN_OVERSIGHT (Art 26(2))
  - MONITOR_OPERATIONS (Art 26(5))
  - KEEP_DEPLOYER_LOGS (Art 26(6))
  - INFORM_WORKERS (Art 26(7))
  - INFORM_AFFECTED_PERSONS (Art 26(11))
  - DPIA_IF_APPLICABLE (Art 26(9))
  - DEPLOYER_REGISTRATION (Art 49(3))
  - AI_LITERACY (Art 4)
  Total: 9 obligations (for areas WITHOUT FRIA)

TEST-OBL-005: Deployer HIGH_RISK for areas WITH FRIA must additionally include:
  - FUNDAMENTAL_RIGHTS_IMPACT (Art 27)
  FRIA-required areas: ESSENTIAL_SERVICES, EDUCATION, EMPLOYMENT,
  LAW_ENFORCEMENT, MIGRATION_ASYLUM_BORDER, JUSTICE_DEMOCRACY
  Total: 10 obligations
  Status: PARTIALLY COVERED (FRIA area check exists)

TEST-OBL-006: Deployer HIGH_RISK for areas WITHOUT FRIA must NOT include FRIA
  Non-FRIA areas: BIOMETRICS, CRITICAL_INFRASTRUCTURE
  Verify: FUNDAMENTAL_RIGHTS_IMPACT is absent
  *** POTENTIAL BUG: Need to check engine code — is BIOMETRICS excluded from FRIA? ***
  Looking at engine: FRIA applied to ESSENTIAL_SERVICES, EDUCATION, EMPLOYMENT,
  LAW_ENFORCEMENT, MIGRATION_ASYLUM_BORDER, JUSTICE_DEMOCRACY
  BIOMETRICS and CRITICAL_INFRASTRUCTURE are NOT listed → FRIA correctly excluded

TEST-OBL-007: BOTH role → all 18 provider + 9+ deployer + FRIA = 28+ obligations
  Verify: No duplicate obligation IDs
```

#### 4.4.3 GPAI Obligations

```
TEST-OBL-008: Standard GPAI (non-open-source) → 4 base obligations + AI literacy
  GPAI_TECHNICAL_DOC, GPAI_DOWNSTREAM_INFO, GPAI_COPYRIGHT_POLICY, GPAI_TRAINING_SUMMARY, AI_LITERACY

TEST-OBL-009: Standard GPAI (open-source) → 2 base obligations + AI literacy
  GPAI_COPYRIGHT_POLICY, GPAI_TRAINING_SUMMARY, AI_LITERACY
  (Tech doc and downstream info exempt per Art 53(2))
  Status: ALREADY COVERED

TEST-OBL-010: GPAI systemic (non-open-source) → 4 base + 4 systemic + AI literacy
  Base: GPAI_TECHNICAL_DOC, GPAI_DOWNSTREAM_INFO, GPAI_COPYRIGHT_POLICY, GPAI_TRAINING_SUMMARY
  Systemic: MODEL_EVALUATION, SYSTEMIC_RISK_MITIGATION, SERIOUS_INCIDENT_TRACKING, CYBERSECURITY_GPAI
  + AI_LITERACY
  Total: 9 obligations

TEST-OBL-011: GPAI systemic (open-source) → ALL 9 obligations (no exemption)
  Verify: Open-source flag does NOT reduce obligations for systemic models
  Status: ALREADY COVERED
```

#### 4.4.4 Transparency Obligations

```
TEST-OBL-012: Each transparency trigger maps to exactly one obligation:
  interactsWithHumans → TRANSPARENCY_INTERACTION
  usesEmotionRecognition → TRANSPARENCY_EMOTION
  usesBiometricCategorisation → TRANSPARENCY_BIOMETRIC_CAT
  generatesDeepfakes → TRANSPARENCY_DEEPFAKE
  generatesText → TRANSPARENCY_TEXT
  generatesMedia → TRANSPARENCY_MEDIA

TEST-OBL-013: Verify appliesToRole for each transparency obligation:
  TRANSPARENCY_INTERACTION → "PROVIDER" (Art 50(1) = provider obligation)
  TRANSPARENCY_EMOTION → "DEPLOYER" (Art 50(3) = deployer obligation)
  TRANSPARENCY_BIOMETRIC_CAT → "DEPLOYER" (Art 50(3) = deployer obligation)
  TRANSPARENCY_DEEPFAKE → "DEPLOYER" (Art 50(4) = deployer obligation)
  TRANSPARENCY_TEXT → "BOTH" (Art 50(4) = both)
  TRANSPARENCY_MEDIA → "PROVIDER" (Art 50(2) = provider obligation)

TEST-OBL-014: Verify priority levels:
  TRANSPARENCY_DEEPFAKE → "CRITICAL" (deepfakes are higher risk)
  All others → "HIGH"
```

#### 4.4.5 Art 6(3) Exception Obligations

```
TEST-OBL-015: Art 6(3) exception must include:
  - DOCUMENT_NON_HIGH_RISK (Art 6(4)) — priority CRITICAL
  - REGISTER_NON_HIGH_RISK (Art 49(2)) — priority CRITICAL
  - AI_LITERACY (Art 4)
  Total: 3 obligations

TEST-OBL-016: DOCUMENT_NON_HIGH_RISK must reference Art 6(4) and templateId TMPL_NON_HIGH_RISK_ASSESSMENT
TEST-OBL-017: REGISTER_NON_HIGH_RISK must reference Art 49(2) and Annex VIII Section B
```

#### 4.4.6 Universal Obligations

```
TEST-OBL-018: AI_LITERACY must appear in EVERY classification:
  - MINIMAL_RISK (default)
  - MINIMAL_RISK (scope excluded)
  - MINIMAL_RISK (Art 6(3) exception)
  - PROHIBITED
  - HIGH_RISK (safety component)
  - HIGH_RISK (Annex III)
  - LIMITED_RISK
  - GPAI
  - GPAI_SYSTEMIC
  Verify across all 9 paths

TEST-OBL-019: AI_LITERACY details:
  article = "Article 4"
  appliesToRole = "BOTH"
  priority = "MEDIUM"
  deadline = "2025-02-02"
  description must mention "staff" and "operation and use"
```

---

### 4.5 Annex III Sub-Type Legal Accuracy (~25 tests)

This is where BUG-C1 was found. Verify ALL sub-types match the regulation exactly.

#### 4.5.1 Annex III Point 5 — Essential Services (BUG-C1 regression tests)

```
TEST-AX3-001: Verify engine's Annex III Point 5 sub-types match the regulation:
  Regulation has 4 sub-types:
    5(a) = Public benefits (by public authorities)
    5(b) = Creditworthiness + Credit scoring (combined, with fraud detection exception)
    5(c) = Insurance risk/pricing (life and health only)
    5(d) = Emergency dispatch + patient triage

  Engine has 5 sub-types:
    CREDITWORTHINESS = described as "5(a)"
    INSURANCE_RISK_PRICING = described as "5(b)"
    PUBLIC_BENEFITS = described as "5(c)"
    EMERGENCY_DISPATCH = described as "5(d)"
    CREDIT_SCORING = described as "5(e)"

  *** AFTER BUG-C1 FIX, verify: ***
    PUBLIC_BENEFITS should map to 5(a)
    CREDITWORTHINESS should map to 5(b)
    CREDIT_SCORING should map to 5(b) (same sub-point)
    INSURANCE_RISK_PRICING should map to 5(c)
    EMERGENCY_DISPATCH should map to 5(d)

TEST-AX3-002: Verify fraud detection exception is noted for CREDITWORTHINESS
  The warning text should mention "with the exception of AI systems used for
  the purpose of detecting financial fraud"
  Status: PARTIALLY COVERED (warning exists for ESSENTIAL_SERVICES area)

TEST-AX3-003: Verify insurance type is limited to "life and health"
  The description or warning should note that property/casualty/auto insurance
  AI is NOT covered by Annex III point 5(c)

TEST-AX3-004: Verify PUBLIC_BENEFITS notes the "public authorities" qualifier
  Only systems used by public authorities or on their behalf trigger Point 5(a)
```

#### 4.5.2 Annex III Point 1 — Biometrics

```
TEST-AX3-005: Biometrics has 3 sub-types in engine:
  REMOTE_IDENTIFICATION, CATEGORISATION, EMOTION_RECOGNITION
  Verify: These map to Point 1(a), 1(b), 1(c) of Annex III

TEST-AX3-006: Verify "authentication" and "verification" are synonymous per Art 3(36)
  The verification exclusion should apply equally to both terms

TEST-AX3-007: Biometric VERIFICATION exclusion — verify it covers one-to-one matching
  only, NOT one-to-many matching (identification)
```

#### 4.5.3 Annex III Point 6 — Law Enforcement

```
TEST-AX3-008: Engine has 5 LE sub-types:
  POLYGRAPH, EVIDENCE_RELIABILITY, RISK_ASSESSMENT, CRIME_ANALYTICS, POST_BIOMETRIC_ID
  Verify: These match the regulation's sub-points

TEST-AX3-009: Verify the "permitted under Union or national law" qualifier is noted
  in warnings for LAW_ENFORCEMENT area
```

#### 4.5.4 Annex III Point 7 — Migration

```
TEST-AX3-010: Engine has 4 migration sub-types:
  POLYGRAPH, RISK_ASSESSMENT, APPLICATION_EXAMINATION, BORDER_DETECTION
  Verify: These match the regulation's sub-points

TEST-AX3-011: Verify travel document verification is excluded from BORDER_DETECTION
  Regulation: Point 7(d) excludes "verification of travel documents"
```

#### 4.5.5 Annex III Point 8 — Justice & Democracy

```
TEST-AX3-012: Engine has 3 justice sub-types:
  COURT_RESEARCH_APPLICATION, ALTERNATIVE_DISPUTE_RESOLUTION, ELECTION_INFLUENCE
  Regulation has 2 sub-types: (a) judicial authority + ADR, (b) elections + referendums
  
  Verify: COURT_RESEARCH_APPLICATION and ALTERNATIVE_DISPUTE_RESOLUTION are both
  under Point 8(a) in the regulation

TEST-AX3-013: Verify ELECTION_INFLUENCE exception for "administrative or logistical"
  campaign tools exists in next steps or warnings
```

#### 4.5.6 Conformity Assessment Routing

```
TEST-AX3-014: BIOMETRICS → conformity assessment mentions "notified body" option (Annex VII)
  Status: ALREADY COVERED

TEST-AX3-015: Non-biometric Annex III areas (points 2-8) → "Internal control" (Annex VI)
  Status: ALREADY COVERED

TEST-AX3-016: PRODUCT_SAFETY → "product legislation" reference
  Status: ALREADY COVERED

TEST-AX3-017: BIOMETRICS conformity text mentions BOTH Annex VI (internal) and Annex VII (notified body)
  Regulation: If harmonised standards applied → internal control OK; if not → notified body required

TEST-AX3-018: For EACH non-biometric area, verify conformity text says "Internal control procedure
  (Annex VI)" and "No notified body involvement required"
  Test for: CRITICAL_INFRASTRUCTURE, EDUCATION, EMPLOYMENT, ESSENTIAL_SERVICES,
  LAW_ENFORCEMENT, MIGRATION_ASYLUM_BORDER, JUSTICE_DEMOCRACY (7 tests)
```

---

### 4.6 Warning Text Accuracy (~15 tests)

Verify warning messages contain legally accurate information.

```
TEST-WRN-001: LAW_ENFORCEMENT and MIGRATION → "SECURE NON-PUBLIC section" warning
  Regulation: Art 49(4)
  Status: ALREADY COVERED

TEST-WRN-002: EMPLOYMENT → "Data Protection Impact Assessment" warning
  Regulation: Art 35 GDPR
  Status: ALREADY COVERED

TEST-WRN-003: ESSENTIAL_SERVICES → "fraud detection" exception warning
  Status: ALREADY COVERED

TEST-WRN-004: BIOMETRICS → "VERIFICATION" exclusion warning
  Status: ALREADY COVERED

TEST-WRN-005: Open-source scope exclusion → "does NOT apply if high-risk/prohibited/Art 50" warning
  Status: ALREADY COVERED

TEST-WRN-006: Art 5(1)(a) grey area → "grey area" warning when manipulation=true but harm=false
  Verify: Warning mentions "reasonably likely to occur"
  Regulation: Act says "causes or is reasonably likely to cause" significant harm

TEST-WRN-007: Art 5(1)(b) grey area → vulnerability exploitation warning when harm=false
  Verify: Warning mentions "physical/psychological health or financial interests"

TEST-WRN-008: Art 5(1)(d) exception → warning when supporting human assessment
  Verify: "objective, verifiable facts directly linked to criminal activity"

TEST-WRN-009: Art 5(1)(f) medical/safety exception → warning when exception applies
  Verify: "genuinely and exclusively for medical/safety use"

TEST-WRN-010: Art 5(1)(g) LE labelling exception → warning when exception applies
  Verify: "lawfully acquired"

TEST-WRN-011: Art 5(1)(h) missing judicial auth → warning
  Verify: Mentions "prior judicial or independent administrative authority authorization"

TEST-WRN-012: Art 5(1)(h) full LE exception → warning about strict limitations
  Verify: Mentions victim search, terrorist threat, and serious crimes
  Verify: Mentions "annual reporting"

TEST-WRN-013: Art 6(3) exception → warnings include:
  - "narrowly interpreted"
  - "market surveillance" / "Art 80"
  - "deliberately misclassified" / "Art 99"
  Status: PARTIALLY COVERED

TEST-WRN-014: GPAI_SYSTEMIC with open-source → warning "Open-source exception does NOT apply"
  Status: ALREADY COVERED

TEST-WRN-015: Safety component HIGH_RISK → warning about Annex I product categories
  Verify: Mentions "machinery, toys, lifts, pressure equipment, radio equipment,
  medical devices, in vitro diagnostics, automotive, aviation"
```

---

### 4.7 Template Registry Validation (~25 tests)

Verify all 25 templates in the TEMPLATE_REGISTRY are correctly configured.

```
For EACH of the 25 templates, verify:

TEST-TPL-001 through TEST-TPL-025:
  - name: non-empty string
  - description: non-empty string
  - appliesToRole: valid Role | "BOTH"
  - requiredFor: valid RiskClassification array
  - articles: non-empty string array with valid article references
  - estimatedMinutes: positive number

Specific template validation:

TEST-TPL-026: TMPL_RISK_MANAGEMENT → requiredFor = ["HIGH_RISK"], articles includes "Article 9"
TEST-TPL-027: TMPL_DATA_GOVERNANCE → requiredFor = ["HIGH_RISK"], articles includes "Article 10"
TEST-TPL-028: TMPL_TECHNICAL_DOC → articles includes "Article 11" AND "Annex IV"
TEST-TPL-029: TMPL_NON_HIGH_RISK_ASSESSMENT → requiredFor includes "MINIMAL_RISK"
  articles includes "Article 6(3)" AND "Article 6(4)"
TEST-TPL-030: TMPL_EU_DB_REGISTRATION → requiredFor includes BOTH "HIGH_RISK" and "MINIMAL_RISK"
  (needed for both regular registration AND Art 6(3) exception registration)
TEST-TPL-031: TMPL_GPAI_TECH_DOC → requiredFor includes "GPAI" AND "GPAI_SYSTEMIC"
TEST-TPL-032: GPAI templates (TMPL_GPAI_*) → appliesToRole = "PROVIDER"
TEST-TPL-033: Transparency templates → match correct roles:
  TMPL_AI_INTERACTION_NOTICE → PROVIDER
  TMPL_DEEPFAKE_DISCLOSURE → DEPLOYER
  TMPL_AI_TEXT_LABEL → BOTH
  TMPL_AI_MEDIA_MARKING → PROVIDER
  TMPL_EMOTION_NOTICE → DEPLOYER
  TMPL_BIOMETRIC_CAT_NOTICE → DEPLOYER

TEST-TPL-034: Every obligation with a templateId must have a corresponding entry in TEMPLATE_REGISTRY
TEST-TPL-035: Every template in TEMPLATE_REGISTRY should be referenced by at least one obligation
```

---

## 5. GAP 3: REAL-WORLD COMPANY SCENARIOS

**Goal:** Test the engine with realistic, detailed scenarios based on actual companies, industries, and AI use cases that exist in the EU market today. Each scenario should be a complete set of WizardAnswers that tests a specific classification pathway with real-world context.

**Total new tests in this gap: ~100**

---

### 5.1 By Industry — Comprehensive Coverage (~50 tests)

#### 5.1.1 Financial Services

```
SCENARIO-FIN-001: Bank AI credit scoring tool (e.g., Klarna, N26)
  Classification: HIGH_RISK (Annex III, Point 5)
  Role: DEPLOYER
  essentialServicesUseCase=true, essentialServiceType="CREDIT_SCORING"
  companySize="LARGE"
  Verify: HIGH_RISK, ESSENTIAL_SERVICES area, deployer obligations

SCENARIO-FIN-002: Fintech startup building credit assessment API
  Classification: HIGH_RISK
  Role: PROVIDER
  essentialServicesUseCase=true, essentialServiceType="CREDITWORTHINESS"
  companySize="SMALL"
  Verify: HIGH_RISK, provider obligations (18), SME simplifications present

SCENARIO-FIN-003: Fraud detection AI at a payment processor (e.g., Stripe, Adyen)
  Classification: NOT HIGH_RISK (fraud detection explicitly excluded from Point 5)
  Role: PROVIDER
  essentialServicesUseCase=false (it's fraud detection, not creditworthiness)
  Verify: MINIMAL_RISK (or LIMITED_RISK if transparency triggers active)

SCENARIO-FIN-004: Insurance company AI for life insurance risk assessment
  Classification: HIGH_RISK (Annex III, Point 5)
  Role: DEPLOYER
  essentialServicesUseCase=true, essentialServiceType="INSURANCE_RISK_PRICING"
  Verify: HIGH_RISK, ESSENTIAL_SERVICES

SCENARIO-FIN-005: Insurance AI for car/property insurance (NOT life/health)
  Classification: NOT automatically HIGH_RISK under Point 5
  Role: DEPLOYER
  essentialServicesUseCase=false
  Verify: MINIMAL_RISK (auto/property insurance NOT covered by Point 5(c))
  Note: This tests the engine's handling of a common misconception

SCENARIO-FIN-006: Robo-advisor for investment recommendations
  Classification: MINIMAL_RISK (investment != creditworthiness/credit scoring)
  Role: PROVIDER
  essentialServicesUseCase=false
  interactsWithHumans=true → LIMITED_RISK
  Verify: LIMITED_RISK with HUMAN_INTERACTION transparency obligation

SCENARIO-FIN-007: Anti-money laundering AI
  Classification: MINIMAL_RISK (AML != credit scoring/creditworthiness)
  Not a law enforcement tool UNLESS used by law enforcement
  lawEnforcementUseCase=false (used by private bank)
  Verify: MINIMAL_RISK or LIMITED_RISK depending on transparency triggers
```

#### 5.1.2 Healthcare

```
SCENARIO-HC-001: AI diagnostic tool embedded in medical device (e.g., AI radiology)
  Classification: HIGH_RISK via safety component (Art 6(1))
  isSafetyComponent=true, productUnderAnnexI=true (Medical devices Reg 2017/745),
  requiresThirdPartyConformity=true
  Verify: HIGH_RISK, Art 6(1), Annex I, deadline 2027-08-02

SCENARIO-HC-002: AI triage chatbot for hospital emergency department
  Classification: HIGH_RISK (Annex III, Point 5(d): emergency patient triage)
  essentialServicesUseCase=true, essentialServiceType="EMERGENCY_DISPATCH"
  interactsWithHumans=true
  Verify: HIGH_RISK (Annex III wins over Art 50)

SCENARIO-HC-003: Mental health chatbot (e.g., Woebot, Wysa)
  Classification: LIMITED_RISK (not a medical device, not in Annex III)
  interactsWithHumans=true, generatesText=true
  Verify: LIMITED_RISK with HUMAN_INTERACTION + AI_GENERATED_TEXT

SCENARIO-HC-004: AI for drug discovery (R&D only, not on market)
  Classification: MINIMAL_RISK (scope exclusion, Art 2(6))
  scientificResearchOnly=true
  Verify: Scope exclusion

SCENARIO-HC-005: Workplace emotion detection for pilot fatigue (safety exception)
  Classification: NOT PROHIBITED (medical/safety exception applies)
  workplaceEmotionDetection=true, workplaceEmotionForMedicalSafety=true
  Verify: Not prohibited, warning about exception
```

#### 5.1.3 Education

```
SCENARIO-ED-001: Online exam proctoring tool (e.g., Proctorio, ExamSoft)
  Classification: HIGH_RISK (Annex III, Point 3: BEHAVIOUR_MONITORING)
  educationUseCase=true, educationType="BEHAVIOUR_MONITORING"
  Verify: HIGH_RISK, EDUCATION area

SCENARIO-ED-002: University admissions AI (screening applications)
  Classification: HIGH_RISK (Annex III, Point 3: ADMISSION_ACCESS)
  educationUseCase=true, educationType="ADMISSION_ACCESS"
  Verify: HIGH_RISK

SCENARIO-ED-003: AI essay grading tool
  Classification: HIGH_RISK (Annex III, Point 3: LEARNING_ASSESSMENT)
  educationUseCase=true, educationType="LEARNING_ASSESSMENT"
  Verify: HIGH_RISK

SCENARIO-ED-004: AI tutoring chatbot (e.g., Khan Academy's Khanmigo)
  Classification: Could be MINIMAL/LIMITED_RISK depending on whether it assesses learning
  If it only tutors (no assessment): interactsWithHumans=true → LIMITED_RISK
  If it assesses performance: educationUseCase=true → HIGH_RISK
  Test BOTH paths

SCENARIO-ED-005: School emotion monitoring AI (e.g., cameras detecting student engagement)
  Classification: PROHIBITED (Art 5(1)(f) — emotion detection in education)
  workplaceEmotionDetection=true, workplaceEmotionForMedicalSafety=false
  Verify: PROHIBITED, Art 5(1)(f)
  Status: ALREADY COVERED (similar scenario exists)

SCENARIO-ED-006: AI-powered language learning app (e.g., Duolingo)
  Classification: LIMITED_RISK (not LEARNING_ASSESSMENT — doesn't determine academic standing)
  educationUseCase=false (Duolingo-style gamified learning ≠ formal assessment)
  interactsWithHumans=true → LIMITED_RISK
  Verify: LIMITED_RISK
```

#### 5.1.4 Employment & HR

```
SCENARIO-HR-001: CV/resume screening tool (e.g., HireVue, Pymetrics)
  Classification: HIGH_RISK (Annex III, Point 4: RECRUITMENT_SELECTION)
  employmentUseCase=true, employmentType="RECRUITMENT_SELECTION"
  Verify: HIGH_RISK, EMPLOYMENT area, warning about GDPR DPIA
  Status: ALREADY COVERED (similar scenario)

SCENARIO-HR-002: Employee performance monitoring AI
  Classification: HIGH_RISK (Annex III, Point 4: MONITORING_EVALUATION)
  employmentUseCase=true, employmentType="MONITORING_EVALUATION"
  Verify: HIGH_RISK

SCENARIO-HR-003: AI scheduling tool that assigns shifts based on employee traits
  Classification: HIGH_RISK (Annex III, Point 4: TASK_ALLOCATION)
  employmentUseCase=true, employmentType="TASK_ALLOCATION"
  Verify: HIGH_RISK

SCENARIO-HR-004: AI termination/layoff recommendation tool
  Classification: HIGH_RISK (Annex III, Point 4: WORK_CONDITIONS_PROMOTION_TERMINATION)
  employmentUseCase=true, employmentType="WORK_CONDITIONS_PROMOTION_TERMINATION"
  Verify: HIGH_RISK

SCENARIO-HR-005: Employee workplace emotion AI (not for safety/medical)
  Classification: PROHIBITED (Art 5(1)(f))
  workplaceEmotionDetection=true, workplaceEmotionForMedicalSafety=false
  Verify: PROHIBITED

SCENARIO-HR-006: Driver drowsiness detection in company fleet
  Classification: NOT PROHIBITED (safety exception)
  workplaceEmotionDetection=true, workplaceEmotionForMedicalSafety=true
  + may be safety component if embedded in vehicle → HIGH_RISK via Art 6(1)
  Test as: safety exception only → NOT PROHIBITED, fallthrough to minimal/limited

SCENARIO-HR-007: LinkedIn-style AI job recommendation (ad targeting)
  Classification: HIGH_RISK (Annex III, Point 4(a): recruitment including ad targeting)
  employmentUseCase=true, employmentType="RECRUITMENT_SELECTION"
  role="PROVIDER"
  Verify: HIGH_RISK with provider obligations
```

#### 5.1.5 Law Enforcement & Public Safety

```
SCENARIO-LE-001: Predictive policing software (e.g., PredPol)
  Classification: HIGH_RISK (Annex III, Point 6: CRIME_ANALYTICS)
  lawEnforcementUseCase=true, lawEnforcementType="CRIME_ANALYTICS"
  Verify: HIGH_RISK, LAW_ENFORCEMENT area, secure DB warning

SCENARIO-LE-002: Lie detector AI for police interviews
  Classification: HIGH_RISK (Annex III, Point 6: POLYGRAPH)
  lawEnforcementUseCase=true, lawEnforcementType="POLYGRAPH"
  Verify: HIGH_RISK

SCENARIO-LE-003: Clearview AI-style facial scraping database
  Classification: PROHIBITED (Art 5(1)(e): untargeted facial scraping)
  facialRecognitionScraping=true
  Verify: PROHIBITED

SCENARIO-LE-004: Real-time facial recognition in a city center (privately operated)
  Classification: PROHIBITED (Art 5(1)(h), not LE so no exception)
  realtimeBiometricPublicSpaces=true
  realtimeBiometricForLEException=false
  Verify: PROHIBITED

SCENARIO-LE-005: Real-time biometric ID for finding kidnapping victim (with judicial auth)
  Classification: NOT PROHIBITED (LE exception with authorization)
  realtimeBiometricPublicSpaces=true
  realtimeBiometricForLEException=true
  realtimeBiometricHasJudicialAuth=true
  Verify: NOT PROHIBITED, warning mentions victim search

SCENARIO-LE-006: Emergency dispatch prioritization AI (e.g., 112 call center)
  Classification: HIGH_RISK (Annex III, Point 5(d))
  essentialServicesUseCase=true, essentialServiceType="EMERGENCY_DISPATCH"
  Verify: HIGH_RISK

SCENARIO-LE-007: Criminal risk assessment AI (NOT solely profiling-based)
  Classification: HIGH_RISK but NOT PROHIBITED
  criminalRiskProfiling=true, crimeProfilingBasedSolelyOnPersonality=false
  lawEnforcementUseCase=true, lawEnforcementType="RISK_ASSESSMENT"
  Verify: HIGH_RISK (via Annex III), NOT PROHIBITED (not solely profiling)
```

#### 5.1.6 AI/Tech Companies — Generative AI

```
SCENARIO-AI-001: Foundation model provider (e.g., Mistral, Aleph Alpha)
  Classification: GPAI
  isGeneralPurposeModel=true, gpaiTrainingCompute=1e23, gpaiOpenSource=false
  role="PROVIDER", companySize="MEDIUM"
  Verify: GPAI, all 4 base obligations

SCENARIO-AI-002: OpenAI GPT-class model (high compute)
  Classification: GPAI_SYSTEMIC
  isGeneralPurposeModel=true, gpaiTrainingCompute=1e26
  role="PROVIDER", companySize="LARGE"
  Verify: GPAI_SYSTEMIC, systemic risk obligations
  Status: ALREADY COVERED (similar scenario)

SCENARIO-AI-003: Llama/Mistral open-source model (no systemic risk)
  Classification: GPAI with partial exemption
  isGeneralPurposeModel=true, gpaiOpenSource=true, gpaiHighImpactCapabilities=false
  Verify: GPAI, only copyright + training summary obligations
  Status: ALREADY COVERED

SCENARIO-AI-004: Open-source model WITH systemic risk (hypothetical)
  Classification: GPAI_SYSTEMIC (no exemption)
  isGeneralPurposeModel=true, gpaiOpenSource=true, gpaiHighImpactCapabilities=true
  Verify: GPAI_SYSTEMIC, ALL obligations (open-source doesn't help)
  Status: ALREADY COVERED

SCENARIO-AI-005: Customer service chatbot using ChatGPT API
  Classification: LIMITED_RISK (the deployer is NOT a GPAI provider)
  isGeneralPurposeModel=false (deployer, not model provider)
  role="DEPLOYER", interactsWithHumans=true, generatesText=true
  Verify: LIMITED_RISK (not GPAI — you're using it, not providing the model)
  Status: ALREADY COVERED (similar scenario)

SCENARIO-AI-006: AI content generation platform (e.g., Jasper, Copy.ai)
  Classification: LIMITED_RISK
  generatesText=true, interactsWithHumans=true
  Verify: LIMITED_RISK with AI_GENERATED_TEXT + HUMAN_INTERACTION

SCENARIO-AI-007: Deepfake video creation tool (e.g., Synthesia)
  Classification: LIMITED_RISK
  generatesDeepfakes=true, generatesMedia=true
  Verify: LIMITED_RISK with DEEPFAKE_CONTENT + AI_GENERATED_MEDIA
  Status: ALREADY COVERED

SCENARIO-AI-008: AI music generator (e.g., Suno, Udio)
  Classification: LIMITED_RISK
  generatesMedia=true
  Verify: LIMITED_RISK with AI_GENERATED_MEDIA

SCENARIO-AI-009: AI image generator (e.g., Midjourney, DALL-E)
  Classification: LIMITED_RISK
  generatesMedia=true, generatesDeepfakes=false (unless creating deepfakes of real people)
  Verify: LIMITED_RISK

SCENARIO-AI-010: AI code assistant (e.g., GitHub Copilot)
  Classification: MINIMAL_RISK or LIMITED_RISK
  generatesText=true (if considered "text on matters of public interest" — likely not)
  interactsWithHumans=true
  Verify: LIMITED_RISK (human interaction) but not AI_GENERATED_TEXT unless public interest
```

#### 5.1.7 Transportation & Autonomous Vehicles

```
SCENARIO-TR-001: Self-driving car AI (Tesla Autopilot, Waymo)
  Classification: HIGH_RISK via safety component (Art 6(1))
  isSafetyComponent=true (safety component of motor vehicle)
  productUnderAnnexI=true (Reg 2019/2144 — motor vehicle general safety)
  requiresThirdPartyConformity=true
  role="PROVIDER"
  Verify: HIGH_RISK, Art 6(1), Annex I, deadline 2027-08-02

SCENARIO-TR-002: Traffic management AI for smart city
  Classification: HIGH_RISK (Annex III, Point 2: CRITICAL_INFRASTRUCTURE)
  criticalInfrastructure=true
  Verify: HIGH_RISK, CRITICAL_INFRASTRUCTURE area

SCENARIO-TR-003: Drone AI for delivery (e.g., Wing, Amazon Prime Air)
  Classification: HIGH_RISK via safety component
  isSafetyComponent=true, productUnderAnnexI=true (Reg 2018/1139 — unmanned aircraft)
  requiresThirdPartyConformity=true
  Verify: HIGH_RISK, Art 6(1)

SCENARIO-TR-004: Fleet routing optimization AI (no safety component)
  Classification: MINIMAL_RISK (logistics optimization, not safety-critical)
  isSafetyComponent=false
  Verify: MINIMAL_RISK (or LIMITED_RISK if interacts with humans)
```

#### 5.1.8 Government & Public Sector

```
SCENARIO-GOV-001: Welfare benefit eligibility AI
  Classification: HIGH_RISK (Annex III, Point 5(a): PUBLIC_BENEFITS)
  essentialServicesUseCase=true, essentialServiceType="PUBLIC_BENEFITS"
  role="DEPLOYER" (government deploying a vendor's AI)
  Verify: HIGH_RISK, ESSENTIAL_SERVICES area, FRIA required, GDPR DPIA likely

SCENARIO-GOV-002: Immigration visa processing AI
  Classification: HIGH_RISK (Annex III, Point 7: APPLICATION_EXAMINATION)
  migrationUseCase=true, migrationType="APPLICATION_EXAMINATION"
  Verify: HIGH_RISK, MIGRATION_ASYLUM_BORDER, secure non-public DB warning

SCENARIO-GOV-003: Border surveillance AI (detecting unauthorized crossings)
  Classification: HIGH_RISK (Annex III, Point 7: BORDER_DETECTION)
  migrationUseCase=true, migrationType="BORDER_DETECTION"
  Verify: HIGH_RISK

SCENARIO-GOV-004: AI judge/sentencing assistant
  Classification: HIGH_RISK (Annex III, Point 8: COURT_RESEARCH_APPLICATION)
  justiceUseCase=true, justiceType="COURT_RESEARCH_APPLICATION"
  Verify: HIGH_RISK, JUSTICE_DEMOCRACY
  Status: ALREADY COVERED (similar scenario)

SCENARIO-GOV-005: AI-powered voting machine or electoral influence system
  Classification: HIGH_RISK (Annex III, Point 8: ELECTION_INFLUENCE)
  justiceUseCase=true, justiceType="ELECTION_INFLUENCE"
  Verify: HIGH_RISK, JUSTICE_DEMOCRACY

SCENARIO-GOV-006: Online dispute resolution platform with AI (e.g., EU ODR)
  Classification: HIGH_RISK (Annex III, Point 8: ALTERNATIVE_DISPUTE_RESOLUTION)
  justiceUseCase=true, justiceType="ALTERNATIVE_DISPUTE_RESOLUTION"
  Verify: HIGH_RISK

SCENARIO-GOV-007: Social credit system by local government
  Classification: PROHIBITED (Art 5(1)(c): social scoring)
  socialScoring=true
  Verify: PROHIBITED
  Note: Both public and private social scoring is prohibited (no "public authority" qualifier)
```

#### 5.1.9 Retail & E-commerce

```
SCENARIO-RET-001: Product recommendation engine (e.g., Amazon recommendations)
  Classification: MINIMAL_RISK
  Verify: MINIMAL_RISK — product recommendations are not in any Annex III area

SCENARIO-RET-002: AI dynamic pricing system
  Classification: MINIMAL_RISK (dynamic pricing ≠ credit scoring)
  Verify: MINIMAL_RISK

SCENARIO-RET-003: In-store emotion detection for marketing
  Classification: NOT PROHIBITED (Art 5(1)(f) only covers workplace/education, NOT retail)
  BUT Art 50(3) transparency applies for non-prohibited emotion recognition
  usesEmotionRecognition=true (Art 50(3) trigger)
  workplaceEmotionDetection=false (not workplace)
  Verify: LIMITED_RISK with EMOTION_RECOGNITION transparency obligation

SCENARIO-RET-004: AI chatbot customer support (e.g., Zendesk AI)
  Classification: LIMITED_RISK
  interactsWithHumans=true
  Verify: LIMITED_RISK with HUMAN_INTERACTION

SCENARIO-RET-005: AI-powered counterfeit detection
  Classification: MINIMAL_RISK (not in any risk category)
  Verify: MINIMAL_RISK
```

#### 5.1.10 Biometric Systems

```
SCENARIO-BIO-001: Airport face-check boarding (1:1 verification against passport photo)
  Classification: NOT HIGH_RISK (biometric verification explicitly excluded)
  usesBiometrics=true, biometricType="REMOTE_IDENTIFICATION", isBiometricVerificationOnly=true
  Verify: NOT HIGH_RISK

SCENARIO-BIO-002: Smart building facial recognition for access control (1:many identification)
  Classification: HIGH_RISK (Annex III, Point 1: REMOTE_IDENTIFICATION)
  usesBiometrics=true, biometricType="REMOTE_IDENTIFICATION", isBiometricVerificationOnly=false
  Verify: HIGH_RISK, BIOMETRICS area

SCENARIO-BIO-003: Phone face unlock (e.g., Face ID, Android face unlock)
  Classification: NOT HIGH_RISK (biometric verification)
  usesBiometrics=true, isBiometricVerificationOnly=true
  Verify: MINIMAL_RISK
  Status: ALREADY COVERED

SCENARIO-BIO-004: Crowd monitoring with demographic categorization (age/gender estimation)
  Note: If categorizing by sensitive attributes (race, political opinion, etc.) → PROHIBITED
  If categorizing by non-sensitive attributes (age, gender) → HIGH_RISK under Point 1(b) if biometric
  Test path 1: biometricCategorisationSensitive=true → PROHIBITED
  Test path 2: usesBiometrics=true, biometricType="CATEGORISATION" → HIGH_RISK

SCENARIO-BIO-005: Retail emotion recognition system (not workplace/education)
  Classification: HIGH_RISK if biometric (Annex III Point 1(c)) or LIMITED_RISK (Art 50(3))
  Test with usesBiometrics=true, biometricType="EMOTION_RECOGNITION" → HIGH_RISK
  Test with usesEmotionRecognition=true (Art 50) only → LIMITED_RISK
```

---

### 5.2 By Company Size — SME Scenarios (~12 tests)

```
SCENARIO-SME-001: MICRO enterprise (1-9 employees) deploying HIGH_RISK employment AI
  companySize="MICRO", role="DEPLOYER", employmentUseCase=true
  Verify: SME simplifications include "regulatory sandbox" AND "Microenterprise... simplified"
  Verify: Fine cap uses "LOWER of" language

SCENARIO-SME-002: MICRO enterprise as GPAI provider
  companySize="MICRO", isGeneralPurposeModel=true
  Verify: After BUG-C3 fix, GPAI fine should NOT have SME protection

SCENARIO-SME-003: SMALL company (10-49 employees) as HIGH_RISK provider
  companySize="SMALL", role="PROVIDER", educationUseCase=true
  Verify: SME simplifications present but NO micro-enterprise QMS simplification
  Verify: Fine note mentions specific turnover-based example

SCENARIO-SME-004: MEDIUM company (50-249 employees) as DEPLOYER
  companySize="MEDIUM", role="DEPLOYER", essentialServicesUseCase=true
  Verify: SME simplifications include "regulatory sandbox"
  Verify: NO micro-enterprise QMS simplification

SCENARIO-SME-005: LARGE company as PROVIDER
  companySize="LARGE", role="PROVIDER", educationUseCase=true
  Verify: SME simplifications array is EMPTY
  Verify: Fine maxAmountSME = maxAmountGeneral

SCENARIO-SME-006: MICRO enterprise doing prohibited practice
  companySize="MICRO", socialScoring=true
  Verify: Fine is still €35M/7% (prohibited fines have no SME reduction?)
  Actually: Art 99(6) DOES apply to prohibited tier → SME gets "LOWER of" even for prohibited
  Verify: maxAmountSME contains "LOWER"

SCENARIO-SME-007: Each company size × PROHIBITED
  All 4 sizes getting PROHIBITED classification
  Verify fine calculations are correct for each

SCENARIO-SME-008: Each company size × HIGH_RISK
  All 4 sizes getting HIGH_RISK classification

SCENARIO-SME-009: Each company size × GPAI
  All 4 sizes getting GPAI classification
  After BUG-C3 fix: MICRO/SMALL/MEDIUM should NOT show SME protection for GPAI

SCENARIO-SME-010: Each company size × LIMITED_RISK
  Verify fine tier is correct (€15M/3%)

SCENARIO-SME-011: Each company size × MINIMAL_RISK
  Verify fine is "N/A"

SCENARIO-SME-012: Each company size × scope excluded
  Verify fine is "N/A" for all sizes
```

---

### 5.3 Cross-Border & Jurisdiction Edge Cases (~10 tests)

```
SCENARIO-JUR-001: US company, AI output used in EU
  isEUBased=false, outputUsedInEU=true
  Verify: IN SCOPE (Art 2(1)(c)), not excluded

SCENARIO-JUR-002: US company, AI output NOT used in EU
  isEUBased=false, outputUsedInEU=false
  Verify: OUT OF SCOPE

SCENARIO-JUR-003: EU-based company, output not used in EU
  isEUBased=true, outputUsedInEU=false
  Verify: IN SCOPE (EU-based is sufficient)

SCENARIO-JUR-004: EU-based company, output used in EU
  isEUBased=true, outputUsedInEU=true
  Verify: IN SCOPE (both conditions met)

SCENARIO-JUR-005: UK company (post-Brexit) with AI used by EU customers
  isEUBased=false (UK is not EU), outputUsedInEU=true
  Verify: IN SCOPE (output used in EU)

SCENARIO-JUR-006: China-based AI company (e.g., SenseTime) deploying in EU
  isEUBased=false, outputUsedInEU=true, realtimeBiometricPublicSpaces=true
  Verify: PROHIBITED (in scope because output used in EU + prohibited practice)

SCENARIO-JUR-007: Israeli company building open-source AI, not deployed in EU
  isEUBased=false, outputUsedInEU=false, openSourceNonHighRisk=true
  Verify: OUT OF SCOPE (two exclusions: no EU nexus + open source)

SCENARIO-JUR-008: Swiss company with EU subsidiary deploying employment AI
  isEUBased=true (has EU subsidiary), employmentUseCase=true
  Verify: IN SCOPE, HIGH_RISK

SCENARIO-JUR-009: Indian outsourcing firm building AI for EU bank (creditworthiness)
  isEUBased=false, outputUsedInEU=true (bank uses output in EU)
  essentialServicesUseCase=true, essentialServiceType="CREDITWORTHINESS"
  role="PROVIDER"
  Verify: IN SCOPE, HIGH_RISK

SCENARIO-JUR-010: Military contractor (EU-based) building dual-use AI
  If exclusively military: militaryDefenceOnly=true → EXCLUDED
  If also civilian use: militaryDefenceOnly=false → IN SCOPE
  Test both paths
```

---

### 5.4 Ambiguous "Grey Area" Scenarios (~15 tests)

These are intentionally hard to classify. They test whether the engine handles ambiguity properly and produces appropriate warnings.

```
SCENARIO-GREY-001: AI wellness app that monitors employee mood (workplace emotional AI)
  Is it "emotion detection in the workplace" (PROHIBITED)?
  Or is it a voluntary wellness tool (not AI Act scope)?
  If the employer mandates it → workplace emotion detection → PROHIBITED
  Our engine: workplaceEmotionDetection=true → PROHIBITED (correct for mandatory use)
  Test: workplaceEmotionDetection=true, workplaceEmotionForMedicalSafety=false → PROHIBITED

SCENARIO-GREY-002: AI that "nudges" purchasing decisions (dark patterns)
  Is it "subliminal/manipulative techniques" (Art 5(1)(a) PROHIBITED)?
  If it doesn't cause "significant harm" → grey area warning
  usesSubliminaManipulation=true, manipulationCausesSignificantHarm=false
  Verify: NOT PROHIBITED but warning present about grey area

SCENARIO-GREY-003: Social media content ranking algorithm
  Is it "social scoring" (Art 5(1)(c) PROHIBITED)?
  Generally no — content ranking ≠ scoring natural persons for detrimental treatment
  Unless: ranking leads to reduced access to information/services → possibly social scoring
  socialScoring=false for typical feed ranking
  Verify: MINIMAL_RISK (content ranking alone isn't social scoring)

SCENARIO-GREY-004: AI loyalty program that reduces benefits based on return behavior
  Is it "social scoring" if it uses behavior across disparate contexts? Possibly.
  If scoring uses behavior from unrelated context to harm in another → PROHIBITED
  socialScoring=true → PROHIBITED
  Verify: PROHIBITED, warning about disparate context treatment

SCENARIO-GREY-005: AI-powered resume beautifier/optimizer (not screening)
  Employment AI? If it's a tool FOR candidates, not for employers → NOT Point 4
  employmentUseCase=false (tool for candidates, not employer decision-making)
  generatesText=true → LIMITED_RISK
  Verify: LIMITED_RISK (not employment high-risk)

SCENARIO-GREY-006: AI meeting transcription tool that detects speaker sentiment
  Emotion detection in workplace? Possibly, if it infers emotions from voice
  usesEmotionRecognition=true (Art 50(3) transparency trigger)
  workplaceEmotionDetection=true (if inferring emotions from voice in workplace → PROHIBITED)
  Test both paths: if employer deploys for sentiment analysis → PROHIBITED
  If just transcription with speech-to-text → NOT emotion detection

SCENARIO-GREY-007: University AI that personalizes study materials (not assessing)
  Art 6(3) exception candidate: "improves result of previously completed human activity"
  educationUseCase=true, posesSignificantRiskOfHarm=false, improvesHumanActivity=true
  Verify: MINIMAL_RISK via Art 6(3) exception

SCENARIO-GREY-008: AI spelling/grammar checker (e.g., Grammarly)
  generatesMedia=false (text editing, not media generation)
  interactsWithHumans=true → LIMITED_RISK at most
  Regulation: Art 50(2) excludes "assistive function for standard editing"
  Verify: LIMITED_RISK (because of human interaction), but NOT triggering Art 50(2) media marking

SCENARIO-GREY-009: AI-generated political ad
  generatesDeepfakes=false (text ad, not video deepfake), generatesText=true
  justiceUseCase=false (it's a campaign tool, not judicial/electoral system)
  Verify: LIMITED_RISK with AI_GENERATED_TEXT obligation
  Note: If AI-generated text is for "informing the public on matters of public interest"
  → Art 50(4) disclosure required

SCENARIO-GREY-010: Social media bot that pretends to be human
  Classification: LIMITED_RISK (Art 50(1) — must inform of AI interaction)
  interactsWithHumans=true
  Verify: obligation mentions "inform they are interacting with an AI system"

SCENARIO-GREY-011: AI criminal risk assessment that uses location + demographics + profiling
  Is it "solely based on profiling"? No — it uses location and other factors
  criminalRiskProfiling=true, crimeProfilingBasedSolelyOnPersonality=false → NOT PROHIBITED
  But still may be HIGH_RISK under Annex III Point 6 (LE risk assessment)
  lawEnforcementUseCase=true, lawEnforcementType="RISK_ASSESSMENT"
  Verify: HIGH_RISK (not prohibited, but high-risk via Annex III)

SCENARIO-GREY-012: Chatbot giving legal advice to consumers (not used by/for court)
  Is it "justice" under Annex III Point 8? NO — Point 8(a) requires "by a judicial authority
  or on their behalf." A consumer chatbot is neither.
  justiceUseCase=false, interactsWithHumans=true, generatesText=true
  Verify: LIMITED_RISK (not high-risk)

SCENARIO-GREY-013: AI art generator creating photorealistic images of real people
  Is it a "deepfake"? Yes, if it creates realistic representations of real people
  generatesDeepfakes=true, generatesMedia=true
  Verify: LIMITED_RISK with both DEEPFAKE_CONTENT and AI_GENERATED_MEDIA

SCENARIO-GREY-014: HR AI that narrows candidates but doesn't make final decision
  Art 6(3) exception possible: "preparatory task to an assessment"
  employmentUseCase=true, posesSignificantRiskOfHarm=false, preparatoryTask=true,
  performsProfiling=true (it profiles candidates)
  Verify: HIGH_RISK (profiling override defeats Art 6(3) exception)

SCENARIO-GREY-015: GPAI model that is also deployed as an education assessment tool
  Dual classification scenario (BUG-H2)
  isGeneralPurposeModel=true, educationUseCase=true
  Verify: Currently returns GPAI (because GPAI is checked before Annex III)
  KNOWN LIMITATION: Should ideally warn about the dual classification issue
```

---

### 5.5 Multi-Layer Classification Scenarios (~13 tests)

These test combinations where multiple classification levels could apply. The engine should apply the correct priority order and ideally warn about secondary classifications.

```
SCENARIO-ML-001: Prohibited + GPAI (GPAI model used for social scoring)
  socialScoring=true, isGeneralPurposeModel=true
  Expected: PROHIBITED (Art 5 > GPAI in priority)
  Status: ALREADY COVERED

SCENARIO-ML-002: Prohibited + HIGH_RISK (emotion detection in employment)
  workplaceEmotionDetection=true (prohibited), employmentUseCase=true (high-risk)
  Expected: PROHIBITED (Art 5 > Annex III)

SCENARIO-ML-003: GPAI + Annex III HIGH_RISK
  isGeneralPurposeModel=true, educationUseCase=true
  Expected: GPAI (GPAI > Annex III in priority)
  Status: ALREADY COVERED

SCENARIO-ML-004: Safety component + Annex III HIGH_RISK
  isSafetyComponent=true, productUnderAnnexI=true, requiresThirdPartyConformity=true,
  educationUseCase=true
  Expected: HIGH_RISK via Art 6(1) — safety component checked before Annex III
  Status: ALREADY COVERED

SCENARIO-ML-005: Annex III HIGH_RISK + all transparency triggers
  educationUseCase=true, interactsWithHumans=true, generatesText=true,
  generatesDeepfakes=true, generatesMedia=true
  Expected: HIGH_RISK (Annex III wins over Art 50)
  Note: Transparency obligations still apply concurrently in reality, but engine
  only returns one classification

SCENARIO-ML-006: Art 6(3) exception + transparency
  educationUseCase=true, posesSignificantRiskOfHarm=false, narrowProceduralTask=true,
  interactsWithHumans=true
  Expected: MINIMAL_RISK (Art 6(3) exception) — NOT LIMITED_RISK
  Rationale: Art 6(3) routes to MINIMAL_RISK before transparency step is reached.
  This is a KNOWN LIMITATION — the system should arguably also flag transparency obligations.

SCENARIO-ML-007: Scope excluded + everything else
  militaryDefenceOnly=true, socialScoring=true, isGeneralPurposeModel=true,
  educationUseCase=true, interactsWithHumans=true
  Expected: MINIMAL_RISK (scope exclusion wins over everything)

SCENARIO-ML-008: Multiple prohibited practices + HIGH_RISK + GPAI
  socialScoring=true, facialRecognitionScraping=true (prohibited),
  isGeneralPurposeModel=true (GPAI), educationUseCase=true (Annex III)
  Expected: PROHIBITED with 2 prohibited practices

SCENARIO-ML-009: GPAI systemic + safety component
  isGeneralPurposeModel=true, gpaiHighImpactCapabilities=true,
  isSafetyComponent=true, productUnderAnnexI=true, requiresThirdPartyConformity=true
  Expected: GPAI_SYSTEMIC (GPAI > safety component in priority)

SCENARIO-ML-010: Art 6(3) exception + profiling + all conditions met
  educationUseCase=true, posesSignificantRiskOfHarm=false,
  narrowProceduralTask=true, improvesHumanActivity=true,
  detectsPatterns=true, preparatoryTask=true,
  performsProfiling=true
  Expected: HIGH_RISK (profiling override is ABSOLUTE)

SCENARIO-ML-011: Two Annex III areas — provider obligation set for first area
  usesBiometrics=true, biometricType="REMOTE_IDENTIFICATION" (Point 1 — notified body CA),
  educationUseCase=true (Point 3 — internal control CA)
  Expected: HIGH_RISK, highRiskArea depends on order of checks
  Engine behavior: educationUseCase is checked after biometrics, so EDUCATION overwrites BIOMETRICS
  Verify: Which area wins? (Tests engine's override behavior with multiple areas)

SCENARIO-ML-012: DEPLOYER with multiple Annex III areas active
  role="DEPLOYER", employmentUseCase=true, essentialServicesUseCase=true, justiceUseCase=true
  Expected: HIGH_RISK with JUSTICE_DEMOCRACY (last area wins)
  Verify: FRIA still required (applicable for all these areas)

SCENARIO-ML-013: Provider + Deployer (BOTH) with BIOMETRICS area
  role="BOTH", usesBiometrics=true, biometricType="REMOTE_IDENTIFICATION"
  Expected: HIGH_RISK with both provider (incl. notified body CA) and deployer obligations
  Verify: Conformity assessment mentions "notified body" (biometrics special rule)
```

---

## 6. TEST INVENTORY SUMMARY

### New Tests by Gap

| Gap | Category | New Tests | Already Covered |
|-----|----------|-----------|-----------------|
| **Gap 1** | 3.1 Contradictory Booleans | ~25 | ~10 |
| **Gap 1** | 3.2 Boundary Values | ~18 | ~7 |
| **Gap 1** | 3.3 Maximum Triggers | ~12 | ~3 |
| **Gap 1** | 3.4 Optional/Undefined Fields | ~17 | ~3 |
| **Gap 1** | 3.5 Priority Order Stress | ~10 | ~5 |
| **Gap 1** | 3.6 Return Value Integrity | ~15 | ~5 |
| **Gap 2** | 4.1 Article References | ~30 | ~25 |
| **Gap 2** | 4.2 Fine Calculations | ~25 | ~5 |
| **Gap 2** | 4.3 Enforcement Deadlines | ~15 | ~5 |
| **Gap 2** | 4.4 Obligation Completeness | ~15 | ~5 |
| **Gap 2** | 4.5 Annex III Sub-Types | ~18 | ~0 |
| **Gap 2** | 4.6 Warning Text Accuracy | ~10 | ~5 |
| **Gap 2** | 4.7 Template Registry | ~35 | ~0 |
| **Gap 3** | 5.1 Industry Scenarios | ~40 | ~10 |
| **Gap 3** | 5.2 SME Scenarios | ~10 | ~2 |
| **Gap 3** | 5.3 Cross-Border | ~10 | ~0 |
| **Gap 3** | 5.4 Grey Area Scenarios | ~15 | ~0 |
| **Gap 3** | 5.5 Multi-Layer Scenarios | ~10 | ~3 |
| **TOTAL** | | **~330 NEW** | **~93 existing** |

### Combined Test Count: **~496 tests** (166 existing + 330 new)

### Coverage Matrix After Full Implementation

| Classification | Existing | New | Total |
|---------------|----------|-----|-------|
| MINIMAL_RISK (default) | 4 | 8 | 12 |
| MINIMAL_RISK (scope excluded) | 9 | 12 | 21 |
| MINIMAL_RISK (Art 6(3) exception) | 8 | 6 | 14 |
| PROHIBITED | 24 | 35 | 59 |
| HIGH_RISK (safety component) | 4 | 8 | 12 |
| HIGH_RISK (Annex III, 8 areas × sub-types) | 30 | 45 | 75 |
| LIMITED_RISK (6 transparency types) | 9 | 20 | 29 |
| GPAI (standard) | 5 | 10 | 15 |
| GPAI_SYSTEMIC | 5 | 8 | 13 |
| Enforcement Timeline | 5 | 10 | 15 |
| Priority Order | 6 | 10 | 16 |
| Role-Based Obligations | 6 | 12 | 18 |
| Fine Calculations | 7 | 25 | 32 |
| Template Registry | 0 | 35 | 35 |
| Output Structure | 3 | 15 | 18 |
| Edge Cases/Boundary | 6 | 25 | 31 |
| Real-World Scenarios | 15 | 65 | 80 |
| **TOTAL** | **166** | **~330** | **~496** |

---

## 7. IMPLEMENTATION NOTES

### 7.1 Bug Fixes Required Before or During QA Implementation

The following engine bugs MUST be fixed before the corresponding tests are implemented. Without fixes, these tests will intentionally fail.

| Bug ID | Severity | Fix Description | Files Affected |
|--------|----------|----------------|----------------|
| **BUG-C1** | CRITICAL | Fix Annex III Point 5 sub-type references to match regulation (4 sub-types, not 5) | `classification-engine.ts` (type definitions + comments) |
| **BUG-C2** | CRITICAL | Expand Art 5(1)(a) to cover manipulative AND deceptive techniques (not just subliminal). Fix typo "usesSubliminaManipulation" → at minimum, add wider coverage. Consider renaming type. | `classification-engine.ts`, `wizard-questions.ts` |
| **BUG-C3** | CRITICAL | Remove SME "lower of" cap from GPAI fine calculations. Art 101 doesn't include Art 99(6) SME protection. | `classification-engine.ts` (`buildFineRisk`) |
| **BUG-C4** | CRITICAL | Update wizard question wording for harm threshold to include "reasonably likely to cause" standard | `wizard-questions.ts` (question text, not engine logic — engine is functionally correct) |
| **BUG-C5** | CRITICAL | Fix open-source scope exclusion to NOT apply when Art 50 (transparency) obligations trigger. Must check for prohibited AND high-risk AND transparency triggers before granting exclusion. | `classification-engine.ts` (`checkScopeExclusions`) |
| **BUG-H1** | HIGH | Add "not materially influencing decision making" to Art 6(3) assessment. Can be addressed via wizard question wording or by adding a separate boolean field. | `wizard-questions.ts` and/or `classification-engine.ts` |
| **BUG-H2** | HIGH | Add warning when GPAI classification may also be HIGH_RISK at the system level. Don't change priority order — just add a warning to GPAI results when Annex III areas are also flagged. | `classification-engine.ts` (`checkGPAI`) |
| **BUG-H3** | HIGH | Exclude "assistive editing" from Art 50(2) obligation OR add warning about the exception. | `classification-engine.ts` or `wizard-questions.ts` |
| **BUG-H4** | HIGH | Add editorial responsibility exception for AI-generated text. | `classification-engine.ts` (`checkLimitedRisk`) or capture via wizard question |
| **BUG-H5** | HIGH | Add "permitted under Union or national law" qualifier warnings for Annex III points 1, 6, 7. | `classification-engine.ts` (`getHighRiskWarnings`) |

### 7.2 Test File Organization

Recommended file structure:
```
src/lib/__tests__/
├── classification-engine.test.ts          (existing 166 tests — DO NOT MODIFY)
├── gap1-adversarial.test.ts               (~130 tests)
├── gap2-legal-validation.test.ts          (~170 tests)
├── gap3-real-world-scenarios.test.ts      (~100 tests)
└── bug-regression.test.ts                 (15 regression tests for each bug found)
```

### 7.3 Test Helper Improvements

The existing `baseAnswers()` helper should be reused. Additional helpers needed:

```typescript
// Helper: Create a specific classification and verify core properties
function expectClassification(
  overrides: Partial<WizardAnswers>,
  expected: {
    classification: RiskClassification;
    confidence?: "DEFINITIVE" | "LIKELY" | "NEEDS_LEGAL_REVIEW";
    legalBasis?: string[];
    highRiskArea?: HighRiskArea;
    enforcementDeadline?: string;
  }
)

// Helper: Verify obligation presence by ID
function expectObligations(
  result: ClassificationResult,
  expectedIds: string[],
  unexpectedIds?: string[]
)

// Helper: Verify fine risk values
function expectFineRisk(
  result: ClassificationResult,
  expected: Partial<FineRisk>
)

// Helper: Build answers for specific real-world scenarios
function financialScenario(overrides?: Partial<WizardAnswers>): WizardAnswers
function healthcareScenario(overrides?: Partial<WizardAnswers>): WizardAnswers
// etc.
```

### 7.4 Test Execution Strategy

1. **Phase 1 — Bug regression tests (15 tests):** Implement the regression tests for all 15 bugs. Run them. They will FAIL (proving the bugs exist). Then fix the bugs and verify the tests pass.

2. **Phase 2 — Gap 1 adversarial tests (~130 tests):** Stress-test the engine. Any failures indicate fragile logic that needs hardening.

3. **Phase 3 — Gap 2 legal validation tests (~170 tests):** Cross-reference every legal citation. Any failure means our product is giving legally incorrect advice.

4. **Phase 4 — Gap 3 real-world scenario tests (~100 tests):** End-to-end integration scenarios. These are the most customer-facing — if a real SMB user gets an incorrect classification, we lose trust and potentially expose them to fines.

### 7.5 Success Criteria

- **All ~496 tests pass** (166 existing + ~330 new)
- **Zero CRITICAL bugs remaining** (all 5 CRITICAL bugs fixed)
- **Every article reference validated** against regulation text
- **Every fine amount matches** Art 99 and Art 101
- **Every deadline matches** the enforcement timeline
- **Every real-world scenario produces a defensible classification** with appropriate warnings for grey areas

---

*This document was produced by systematically reading all 1,722 lines of the classification engine, all 2,007 lines of existing tests, and cross-referencing against the full text of Regulation (EU) 2024/1689 from EUR-Lex.*

*End of QA Layer 1 Design Document.*
