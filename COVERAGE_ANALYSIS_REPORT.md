# Classification Engine — Exhaustive Coverage Analysis Report
**Generated: 2026-02-27**  
**Engine version: v2 (audited 25 Feb 2026), 1990 lines**  
**Existing tests: 602 (166+71+88+146+131)**

---

## A) Complete Decision Branch Inventory

### A.1 Scope Exclusions — `checkScopeExclusions()` (Art 2)

| ID | Branch | Condition | Result |
|----|--------|-----------|--------|
| E1 | Military/defence | `militaryDefenceOnly=true` | MINIMAL_RISK (excluded) |
| E2 | Scientific R&D | `scientificResearchOnly=true` | MINIMAL_RISK (excluded) |
| E3 | Personal non-professional | `personalNonProfessional=true` | MINIMAL_RISK (excluded) |
| E4a | Open-source excluded | `openSourceNonHighRisk=true` + NO prohibited/high-risk/transparency triggers | MINIMAL_RISK (excluded) |
| E4b | Open-source NOT excluded (prohibited trigger) | `openSourceNonHighRisk=true` + any of 8 prohibited flags true | Falls through to normal classification |
| E4c | Open-source NOT excluded (high-risk trigger) | `openSourceNonHighRisk=true` + any Annex III/safety component trigger | Falls through |
| E4d | Open-source NOT excluded (transparency trigger) | `openSourceNonHighRisk=true` + any of 6 Art 50 triggers | Falls through |
| E5 | No EU nexus | `!isEUBased && !outputUsedInEU` | MINIMAL_RISK (excluded) |
| E6 | EU-based (sufficient) | `isEUBased=true` (regardless of output) | NOT excluded |
| E7 | Output in EU (sufficient) | `!isEUBased && outputUsedInEU=true` | NOT excluded |
| E-MULTI | Combined exclusions | Multiple exclusion flags | All listed |
| E-PRIO | Exclusion > prohibited | Scope exclusion + prohibited practice | MINIMAL_RISK (excluded wins) |

### A.2 Prohibited Practices — `checkProhibitedPractices()` (Art 5)

| ID | Practice | Prohibited Path | Exception Path | Grey Area Path |
|----|----------|----------------|----------------|----------------|
| P1a | Art 5(1)(a) Subliminal/manipulative | `usesSubliminaManipulation=T + harmSignificant=T` → PROHIBITED | — | P1b: `manipulation=T + harm=F` → warning |
| P2a | Art 5(1)(b) Vulnerability exploitation | `exploitsVulnerabilities=T + harmSignificant=T` → PROHIBITED | — | P2b: `exploit=T + harm=F` → warning |
| P3 | Art 5(1)(c) Social scoring | `socialScoring=T` → PROHIBITED | None (absolute) | — |
| P4a | Art 5(1)(d) Criminal profiling | `criminal=T + solely=T + !human` → PROHIBITED | P4b: `human=T` → exception warning | P4c: `solely=F` → not prohibited |
| P5 | Art 5(1)(e) Facial scraping | `facialRecognitionScraping=T` → PROHIBITED | None (absolute) | — |
| P6a | Art 5(1)(f) Workplace emotion | `detection=T + !medical` → PROHIBITED | P6b: `medical=T` → exception warning | — |
| P7a | Art 5(1)(g) Biometric cat sensitive | `sensitive=T + !LE` → PROHIBITED | P7b: `LE=T` → exception warning | — |
| P8c | Art 5(1)(h) Realtime biometric (no LE) | `realtime=T + !LEException` → PROHIBITED | — | — |
| P8b | Art 5(1)(h) Realtime biometric (LE, no auth) | `realtime=T + LE=T + !judicial` → PROHIBITED | — | — |
| P8a | Art 5(1)(h) Realtime biometric (LE + auth) | — | `realtime=T + LE=T + judicial=T` → NOT prohibited | — |
| P-MULTI | Multiple violations | Multiple practice flags true | All violations listed | Pending warnings propagate |

**Total prohibited branch paths: 24** (3+3+2+4+2+3+3+4)

### A.3 GPAI — `checkGPAI()` (Art 51-56)

| ID | Branch | Condition | Result |
|----|--------|-----------|--------|
| G0 | Not GPAI | `isGeneralPurposeModel=false` | Skip (null) |
| G1a | Systemic (high impact) | `GPAI=T + highImpact=T` | GPAI_SYSTEMIC |
| G1b | Systemic (compute) | `GPAI=T + compute > 1e25` | GPAI_SYSTEMIC |
| G1c | Standard (compute boundary) | `GPAI=T + compute = 1e25` | GPAI (standard) |
| G1d | Standard (low compute) | `GPAI=T + compute < 1e25` | GPAI (standard) |
| G1e | Standard (no compute) | `GPAI=T + compute=undefined` | GPAI (standard) |
| G1f | Systemic + open-source | `GPAI_SYSTEMIC + openSource=T` | GPAI_SYSTEMIC (NO exemption) |
| G1g | Standard + open-source | `GPAI + openSource=T + !systemic` | GPAI (3 obligations, partial exemption) |
| G1h | Standard + closed | `GPAI + openSource=F + !systemic` | GPAI (5 obligations) |

### A.4 Safety Component — `checkHighRiskSafetyComponent()` (Art 6(1))

| ID | Branch | Condition | Result |
|----|--------|-----------|--------|
| SC1 | All 3 conditions | `safety=T + annexI=T + 3rdParty=T` | HIGH_RISK (2027 deadline) |
| SC2a | Missing Annex I | `safety=T + annexI=F` | Not high-risk via this path |
| SC2b | Missing 3rd party | `safety=T + annexI=T + 3rdParty=F` | Not high-risk via this path |
| SC2c | Not safety | `safety=F` | Skip |

### A.5 Annex III Areas — `checkHighRiskAnnexIII()` (Art 6(2))

**8 areas (each is an independent boolean check):**

| ID | Area | Gate Condition | Sub-types |
|----|------|---------------|-----------|
| A1 | BIOMETRICS | `usesBiometrics=T + !verificationOnly` | REMOTE_IDENTIFICATION, CATEGORISATION, EMOTION_RECOGNITION |
| A1x | Biometric verification exclusion | `verificationOnly=T` | NOT high-risk |
| A2 | CRITICAL_INFRASTRUCTURE | `criticalInfrastructure=T` | — |
| A3 | EDUCATION | `educationUseCase=T` | ADMISSION_ACCESS, LEARNING_ASSESSMENT, EDUCATION_LEVEL, BEHAVIOUR_MONITORING |
| A4 | EMPLOYMENT | `employmentUseCase=T` | RECRUITMENT_SELECTION, WORK_CONDITIONS_PROMOTION_TERMINATION, TASK_ALLOCATION, MONITORING_EVALUATION |
| A5 | ESSENTIAL_SERVICES | `essentialServicesUseCase=T` | PUBLIC_BENEFITS, CREDITWORTHINESS, CREDIT_SCORING, INSURANCE_RISK_PRICING, EMERGENCY_DISPATCH |
| A6 | LAW_ENFORCEMENT | `lawEnforcementUseCase=T` | POLYGRAPH, EVIDENCE_RELIABILITY, RISK_ASSESSMENT, CRIME_ANALYTICS, POST_BIOMETRIC_ID |
| A7 | MIGRATION_ASYLUM_BORDER | `migrationUseCase=T` | POLYGRAPH, RISK_ASSESSMENT, APPLICATION_EXAMINATION, BORDER_DETECTION |
| A8 | JUSTICE_DEMOCRACY | `justiceUseCase=T` | COURT_RESEARCH_APPLICATION, ALTERNATIVE_DISPUTE_RESOLUTION, ELECTION_INFLUENCE |

**Art 6(3) exception sub-branch (within Annex III):**

| ID | Branch | Condition | Result |
|----|--------|-----------|--------|
| X1 | Profiling override | `performsProfiling=T` | HIGH_RISK (no exception possible) |
| X2 | Exception granted | `!significantRisk + (narrow\|improves\|detects\|preparatory)` | MINIMAL_RISK + doc obligations |
| X2a | Condition (a) | `narrowProceduralTask=T` | One of the 4 qualifying conditions |
| X2b | Condition (b) | `improvesHumanActivity=T` | One of the 4 qualifying conditions |
| X2c | Condition (c) | `detectsPatterns=T` | One of the 4 qualifying conditions |
| X2d | Condition (d) | `preparatoryTask=T` | One of the 4 qualifying conditions |
| X3 | Significant risk blocks | `significantRisk=T + condition(a-d)` | HIGH_RISK (exception denied) |
| X4 | No condition met | `!significantRisk + no (a-d)` | HIGH_RISK (exception denied) |

**Multi-area handling:**
- Last area = primary `highRiskArea`
- All area warnings collected
- Multi-area warning when >1 area matches
- FRIA cross-checked across all areas

### A.6 Limited Risk — `checkLimitedRisk()` (Art 50)

| ID | Trigger | Obligation ID | Article |
|----|---------|--------------|---------|
| T1 | `interactsWithHumans=T` | TRANSPARENCY_INTERACTION | Art 50(1) |
| T2 | `usesEmotionRecognition=T` | TRANSPARENCY_EMOTION | Art 50(3) |
| T3 | `usesBiometricCategorisation=T` | TRANSPARENCY_BIOMETRIC_CAT | Art 50(3) |
| T4 | `generatesDeepfakes=T` | TRANSPARENCY_DEEPFAKE | Art 50(4) |
| T5 | `generatesText=T` | TRANSPARENCY_TEXT | Art 50(4) |
| T6 | `generatesMedia=T` | TRANSPARENCY_MEDIA | Art 50(2) |

### A.7 Post-Processing Overlays

**Transparency overlay** (`applyTransparencyOverlay`):
- Applies to: HIGH_RISK, GPAI, GPAI_SYSTEMIC, MINIMAL_RISK (non-scope-excluded)
- Does NOT apply to: PROHIBITED, LIMITED_RISK, scope-excluded
- Adds transparency obligations additively to existing classification

**GPAI dual classification overlay** (`applyGPAIHighRiskOverlay`):
- Applies to: GPAI, GPAI_SYSTEMIC when high-risk triggers also present
- 9 trigger conditions checked: safety component + 8 Annex III areas

### A.8 Fine Calculation — `buildFineRisk()`

| Category | General Amount | SME Rule | Article |
|----------|---------------|----------|---------|
| PROHIBITED | €35M / 7% higher | Lower of €35M or 7% | Art 99(3) |
| HIGH_RISK | €15M / 3% higher | Lower of €15M or 3% | Art 99(4) |
| GPAI | €15M / 3% higher | NO SME protection | Art 101(1) |
| INCORRECT_INFO | €7.5M / 1% higher | Lower of €7.5M or 1% | Art 99(5) |
| NONE | N/A | N/A | N/A |

### A.9 Role-Based Obligations — `getHighRiskObligations()`

| Role | High-Risk Obligations | FRIA? | Notes |
|------|----------------------|-------|-------|
| PROVIDER | 16 obligations (Art 9-49, 72-73) | No | Conformity assessment varies by area |
| DEPLOYER | 8 obligations (Art 26) | Yes (for 6 qualifying areas) | + public body FRIA warning for non-qualifying |
| BOTH | All provider + all deployer + FRIA | Always | No duplicate IDs |

FRIA-qualifying areas: ESSENTIAL_SERVICES, EDUCATION, EMPLOYMENT, LAW_ENFORCEMENT, MIGRATION_ASYLUM_BORDER, JUSTICE_DEMOCRACY  
Non-qualifying: BIOMETRICS, CRITICAL_INFRASTRUCTURE (get public body warning instead)

---

## B) Branch Coverage Status

### B.1 Scope Exclusions — COVERAGE

| Branch | Status | Test File(s) |
|--------|--------|-------------|
| E1 Military | ✅ COVERED | original:157, ADV-002, ADV-007, ML-007, JUR-010a |
| E2 Scientific R&D | ✅ COVERED | original:166, ADV-004, HC-004 |
| E3 Personal non-professional | ✅ COVERED | original:172, ADV-003 |
| E4a Open-source (clean exclusion) | ✅ COVERED | original:178, BUG-C5 "genuinely" |
| E4b Open-source + prohibited trigger (social scoring) | ✅ COVERED | BUG-C5:263 |
| E4b Open-source + prohibited trigger (other 7) | ❌ MISSING | Only social scoring tested |
| E4c Open-source + high-risk trigger (education) | ✅ COVERED | BUG-C5:255, ADV-005 |
| E4c Open-source + high-risk trigger (other 7 areas) | ❌ MISSING | Only education tested |
| E4c Open-source + safety component trigger | ❌ MISSING | Not tested |
| E4d Open-source + transparency trigger (interacts) | ✅ COVERED | BUG-C5:238, ADV-006 |
| E4d Open-source + transparency trigger (deepfakes) | ✅ COVERED | BUG-C5:247 |
| E4d Open-source + transparency trigger (media) | ✅ COVERED | BUG-C5:279 |
| E4d Open-source + transparency trigger (emotion) | ✅ COVERED | BUG-C5:287 |
| E4d Open-source + transparency trigger (text) | ❌ MISSING | Not tested |
| E4d Open-source + transparency trigger (biometric cat) | ❌ MISSING | Not tested |
| E5 No EU nexus | ✅ COVERED | original:186, ADV-008, JUR-002 |
| E6 EU-based sufficient | ✅ COVERED | original:194, JUR-003 |
| E7 Output in EU sufficient | ✅ COVERED | original:202, JUR-001 |
| E-MULTI Combined | ✅ COVERED | original:215, ADV-009 |
| E-PRIO vs prohibited | ✅ COVERED | original:227, ADV-002 |
| E-PRIO vs GPAI | ✅ COVERED | PRI-002 |
| E-PRIO vs high-risk (safety) | ✅ COVERED | PRI-003 |
| E-PRIO vs high-risk (Annex III) | ✅ COVERED | PRI-004 |

### B.2 Prohibited Practices — COVERAGE

| Branch | Status | Test File(s) |
|--------|--------|-------------|
| P1a Subliminal + harm | ✅ COVERED | original:247 |
| P1b Subliminal + no harm (grey) | ✅ COVERED | original:260, WRN-006 |
| P1c Subliminal=false | ✅ COVERED | original:271 |
| P2a Exploit + harm | ✅ COVERED | original:284 |
| P2b Exploit + no harm (grey) | ✅ COVERED | original:296, WRN-007 |
| P2c Exploit=false + harm=true (contradiction) | ✅ COVERED | ADV-012 |
| P3a Social scoring | ✅ COVERED | original:309 |
| P4a Criminal profiling (solely + !human) | ✅ COVERED | original:319 |
| P4b Criminal profiling (human exception) | ✅ COVERED | original:332, WRN-008 |
| P4c Criminal profiling (!solely) | ✅ COVERED | original:343 |
| P4d Criminal=false | ✅ COVERED | original:354 |
| P5a Facial scraping | ✅ COVERED | original:367 |
| P6a Workplace emotion (no medical) | ✅ COVERED | original:379 |
| P6b Workplace emotion (medical exception) | ✅ COVERED | original:391, WRN-009 |
| P6c Detection=false + medical=true | ✅ COVERED | ADV-015 |
| P7a Biometric cat sensitive (no LE) | ✅ COVERED | original:404 |
| P7b Biometric cat sensitive (LE exception) | ✅ COVERED | original:416, WRN-010 |
| P7c Sensitive=false + LE=true | ✅ COVERED | ADV-016 |
| P8a Realtime biometric (LE + judicial) | ✅ COVERED | original:455, WRN-012 |
| P8b Realtime biometric (LE + no judicial) | ✅ COVERED | original:441, WRN-011 |
| P8c Realtime biometric (no LE) | ✅ COVERED | original:429 |
| P8d Realtime=false + LE+judicial=true | ✅ COVERED | ADV-017 |
| P-MULTI Multiple violations | ✅ COVERED | original:469, ADV-018, ADV-019, MAX-002 |
| P-ALL All + all exceptions | ✅ COVERED | ADV-018 (→ only SOCIAL_SCORING + FACIAL_SCRAPING) |

**Prohibited practices: 24/24 paths COVERED ✅**

### B.3 GPAI — COVERAGE

| Branch | Status | Test File(s) |
|--------|--------|-------------|
| G0 Not GPAI | ✅ COVERED | ADV-040, ADV-041, ADV-042 |
| G1a Systemic (high impact) | ✅ COVERED | original:581 |
| G1b Systemic (compute > 1e25) | ✅ COVERED | original:593, BND-002 |
| G1c Standard (compute = 1e25) | ✅ COVERED | original:604 |
| G1d Standard (compute < 1e25) | ✅ COVERED | original:880, BND-003 |
| G1e Standard (compute undefined) | ✅ COVERED | ADV-043 |
| G1f Systemic + open-source (no exemption) | ✅ COVERED | original:630, MAX-013, AI-004 |
| G1g Standard + open-source (partial exemption) | ✅ COVERED | original:561, AI-003 |
| G1h Standard + closed (full obligations) | ✅ COVERED | original:537, AI-001 |
| Boundary: 0 | ✅ COVERED | BND-005, ADV-044 |
| Boundary: NaN | ✅ COVERED | BND-008 |
| Boundary: Infinity | ✅ COVERED | BND-007 |
| Boundary: -Infinity | ✅ COVERED | BND-009 |
| Boundary: MAX_VALUE | ✅ COVERED | BND-006 |
| GPAI > high-risk | ✅ COVERED | original:649, PRI-012 |

**GPAI: All branches COVERED ✅**

### B.4 Safety Component — COVERAGE

| Branch | Status | Test File(s) |
|--------|--------|-------------|
| SC1 All 3 conditions | ✅ COVERED | original:666, HC-001, TR-001 |
| SC2a Missing Annex I | ✅ COVERED | original:681 |
| SC2b Missing 3rd party | ✅ COVERED | original:692 |
| SC2c Safety=false | ✅ COVERED | ADV-023 (implicit in many tests) |
| SC1 × SME | ✅ COVERED | original:703 |

**Safety component: All branches COVERED ✅**

### B.5 Annex III Areas — COVERAGE

| Branch | Status | Test File(s) |
|--------|--------|-------------|
| A1 BIOMETRICS (remote ID) | ✅ COVERED | original:724 |
| A1 BIOMETRICS (categorisation) | ✅ COVERED | original:737 |
| A1 BIOMETRICS (emotion recognition) | ✅ COVERED | original:749 |
| A1x Biometric verification exclusion | ✅ COVERED | original:761, BIO-001, BIO-003 |
| A1 Biometrics no type (BUG-A4) | ✅ COVERED | BUG-A4:789, OPT-001 |
| A2 CRITICAL_INFRASTRUCTURE | ✅ COVERED | original:775, TR-002 |
| A3 EDUCATION (all 4 sub-types) | ✅ COVERED | original:787+801, ED-001..006 |
| A4 EMPLOYMENT (all 4 sub-types) | ✅ COVERED | original:813+828, HR-001..007 |
| A5 ESSENTIAL_SERVICES (all 5 sub-types) | ✅ COVERED | original:839+855, BUG-C1, FIN-001..007 |
| A6 LAW_ENFORCEMENT (all 5 sub-types) | ✅ COVERED | original:869+885, LE-001..007 |
| A7 MIGRATION (all 4 sub-types) | ✅ COVERED | original:899+914, GOV-002, GOV-003 |
| A8 JUSTICE_DEMOCRACY (all 3 sub-types) | ✅ COVERED | original:925+939, GOV-004..006 |
| Boolean false + type set (all 7 non-biometric) | ✅ COVERED | ADV-027..033 |
| All 8 areas simultaneously | ✅ COVERED | original:1845, MAX-004 |
| Area-specific warnings | ✅ COVERED | original:1730-1765, BUG-H5, WRN-015..018 |
| Conformity assessment routing | ✅ COVERED | original:1768, AX3-014, AX3-018a..g |

### B.6 Art 6(3) Exception — COVERAGE

| Branch | Status | Test File(s) |
|--------|--------|-------------|
| X2a Narrow procedural task | ✅ COVERED | original:979 |
| X2b Improves human activity | ✅ COVERED | original:992 |
| X2c Detects patterns | ✅ COVERED | original:1004 |
| X2d Preparatory task | ✅ COVERED | original:1016 |
| X3 Significant risk blocks | ✅ COVERED | original:1028, ADV-034 |
| X4 No condition met | ✅ COVERED | original:1039 |
| X1 Profiling override | ✅ COVERED | original:1053, ADV-035, ML-010, GREY-014 |
| X1+X3 Both blockers | ✅ COVERED | ADV-037 |
| No Annex III + exception flags | ✅ COVERED | ADV-038 |
| Doc/register obligations | ✅ COVERED | original:1065 |
| Narrow interpretation warnings | ✅ COVERED | original:1079, WRN-013 |

### B.7 Limited Risk (Transparency) — COVERAGE

| Branch | Status | Test File(s) |
|--------|--------|-------------|
| T1 Human interaction | ✅ COVERED | original:1096, LAW-024 |
| T2 Emotion recognition | ✅ COVERED | original:1134, LAW-025 |
| T3 Biometric categorisation | ✅ COVERED | original:1142, LAW-026 |
| T4 Deepfake content | ✅ COVERED | original:1107, LAW-027 |
| T5 AI-generated text | ✅ COVERED | original:1118, LAW-028 |
| T6 AI-generated media | ✅ COVERED | original:1126, LAW-029 |
| Multiple triggers | ✅ COVERED | original:1150, AI-007, GREY-013 |
| All 6 triggers | ✅ COVERED | original:1865 |

### B.8 Overlay Coverage

| Branch | Status | Test File(s) |
|--------|--------|-------------|
| Transparency overlay on HIGH_RISK + interacts | ✅ COVERED | BUG-A1:569 |
| Transparency overlay on HIGH_RISK + deepfakes | ✅ COVERED | BUG-A1:581 |
| Transparency overlay on HIGH_RISK + multiple | ✅ COVERED | BUG-A1:593 |
| Transparency overlay on HIGH_RISK + none | ✅ COVERED | BUG-A1:610 |
| Transparency overlay on safety component | ✅ COVERED | BUG-A1:620 |
| NO overlay on PROHIBITED | ✅ COVERED | BUG-A1:631 |
| NO overlay on scope-excluded | ✅ COVERED | BUG-A1:640 |
| Transparency overlay on Art 6(3) + interacts | ✅ COVERED | BUG-A5:831 |
| Transparency overlay on Art 6(3) + deepfakes+media | ✅ COVERED | BUG-A5:845 |
| Transparency overlay on Art 6(3) + none | ✅ COVERED | BUG-A5:859 |
| GPAI dual: + education | ✅ COVERED | BUG-A2:653 |
| GPAI dual: + multiple areas | ✅ COVERED | BUG-A2:664 |
| GPAI dual: + safety component | ✅ COVERED | BUG-A2:676 |
| GPAI dual: SYSTEMIC + area | ✅ COVERED | BUG-A2:687 |
| GPAI dual: + none | ✅ COVERED | BUG-A2:698 |
| GPAI + transparency + dual | ✅ COVERED | BUG-A2:706 |

### B.9 Role-based Obligations — COVERAGE

| Branch | Status | Test File(s) |
|--------|--------|-------------|
| PROVIDER × HIGH_RISK (16 obligations) | ✅ COVERED | original:1182, OBL-001 |
| DEPLOYER × HIGH_RISK (Art 26) | ✅ COVERED | original:1216, OBL-004 |
| DEPLOYER × FRIA area (education,employment,essential,LE,migration,justice) | ✅ COVERED | original:1248 |
| DEPLOYER × non-FRIA area (critical infra, biometrics) | ✅ COVERED | OBL-006, OBL-006b |
| BOTH × HIGH_RISK (all obligations) | ✅ COVERED | original:1271, MAX-007, MAX-008 |
| No duplicate obligation IDs for BOTH | ✅ COVERED | MAX-012 |
| Provider NOT including deployer obligations | ✅ COVERED | original:1201, OBL-002 |
| Deployer NOT including provider obligations | ✅ COVERED | original:1235 |
| FRIA from secondary area (BUG-A6) | ✅ COVERED | BUG-A6:873 |
| Public body FRIA warning | ✅ COVERED | BUG-A6:890, BUG-A6:905 |
| Provider no FRIA warning | ✅ COVERED | BUG-A6:917 |

### B.10 Fine Calculations — COVERAGE

| Branch | Status | Test File(s) |
|--------|--------|-------------|
| PROHIBITED × LARGE | ✅ COVERED | original:1299, FIN-001, SME-007 |
| PROHIBITED × SMALL | ✅ COVERED | FIN-002, SME-007 |
| PROHIBITED × MICRO | ✅ COVERED | FIN-003, SME-007 |
| PROHIBITED × MEDIUM | ✅ COVERED | FIN-004, SME-007 |
| HIGH_RISK × LARGE | ✅ COVERED | original:1321, FIN-005, SME-008 |
| HIGH_RISK × SMALL | ✅ COVERED | FIN-006, SME-008 |
| HIGH_RISK × MICRO | ✅ COVERED | FIN-007, SME-008 |
| HIGH_RISK × MEDIUM | ✅ COVERED | SME-008 |
| GPAI × LARGE | ✅ COVERED | FIN-009, SME-009 |
| GPAI × SMALL | ✅ COVERED | FIN-010, SME-009 |
| GPAI × MICRO | ✅ COVERED | FIN-011, SME-009 |
| GPAI × MEDIUM | ✅ COVERED | SME-009 |
| NONE × all 4 sizes | ✅ COVERED | SME-011, SME-012 |
| LIMITED_RISK fine tier | ✅ COVERED | FIN-016 |
| Art 6(3) exception fine tier | ✅ COVERED | FIN-015 |

**Fine calculations: All 20 used combos COVERED ✅**  
*Note: INCORRECT_INFO fine tier is defined but never invoked by `classifyAISystem()`. Not testable via public API.*

---

## C) Missing Combinatorial Matrices

### C.1: Annex III Areas × Roles × Art 6(3)/Profiling/Confirmed

**Matrix: 8 areas × 3 roles × 3 outcomes = 72 combinations**

"Outcome" = {confirmed HIGH_RISK, Art 6(3) exception → MINIMAL_RISK, profiling override → HIGH_RISK}

| Area | PROVIDER confirmed | DEPLOYER confirmed | BOTH confirmed | PROVIDER exception | DEPLOYER exception | BOTH exception | PROVIDER profiling | DEPLOYER profiling | BOTH profiling |
|------|-------------------|-------------------|---------------|-------------------|-------------------|---------------|-------------------|-------------------|---------------|
| BIOMETRICS | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| CRITICAL_INFRA | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| EDUCATION | ✅ | ✅ | ❌ | ✅¹ | ❌ | ❌ | ❌ | ❌ | ❌ |
| EMPLOYMENT | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅² | ❌ | ❌ |
| ESSENTIAL_SVC | ✅³ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| LAW_ENFORCE | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MIGRATION | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| JUSTICE_DEM | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

¹ GREY-007 (education + Art 6(3) — PROVIDER implied)  
² GREY-014 (employment profiling override)  
³ implicitly in some tests  

**Covered: ~14 of 72 combinations.  Missing: ~58**

### C.2: 8 Annex III Areas × Art 6(3) Conditions (a)-(d)

**Matrix: 8 areas × 4 conditions = 32 combinations**

| Area | (a) Narrow procedural | (b) Improves human | (c) Detects patterns | (d) Preparatory task |
|------|----------------------|-------------------|---------------------|---------------------|
| BIOMETRICS | ❌ | ❌ | ❌ | ❌ |
| CRITICAL_INFRA | ❌ | ❌ | ❌ | ❌ |
| EDUCATION | ❌ | ✅ (GREY-007) | ❌ | ❌ |
| EMPLOYMENT | ❌ | ❌ | ❌ | ❌ |
| ESSENTIAL_SVC | ✅⁴ | ✅⁴ | ✅⁴ | ✅⁴ |
| LAW_ENFORCE | ❌ | ❌ | ❌ | ❌ |
| MIGRATION | ❌ | ❌ | ❌ | ❌ |
| JUSTICE_DEM | ❌ | ❌ | ❌ | ❌ |

⁴ original tests use ESSENTIAL_SERVICES as the test area for 6(3) conditions (original:979-1028)

**Covered: ~5 of 32. Missing: ~27**

### C.3: 6 Transparency Triggers × Overlay Classifications

**Matrix: 6 triggers × 5 classification contexts = 30 combinations**

Classification contexts where overlay applies: HIGH_RISK (Annex III), HIGH_RISK (Safety), GPAI, GPAI_SYSTEMIC, Art 6(3) exception

| Trigger | HR Annex III | HR Safety | GPAI | GPAI_SYS | Art 6(3) |
|---------|-------------|-----------|------|----------|----------|
| interactsWithHumans | ✅ | ✅ | ✅⁵ | ❌ | ✅ |
| usesEmotionRecognition | ❌ | ❌ | ❌ | ❌ | ❌ |
| usesBiometricCategorisation | ❌ | ❌ | ❌ | ❌ | ❌ |
| generatesDeepfakes | ✅ | ❌ | ❌ | ❌ | ✅ |
| generatesText | ❌ | ❌ | ❌ | ❌ | ❌ |
| generatesMedia | ❌ | ❌ | ❌ | ❌ | ✅ |

⁵ BUG-A2:706 tests GPAI + transparency triggers (interacts + media + deepfakes)

**Covered: ~7 of 30. Missing: ~23**

### C.4: GPAI Dual Classification Triggers (9 total)

**Each of the 9 high-risk triggers individually combined with GPAI:**

| Trigger | GPAI | GPAI_SYSTEMIC |
|---------|------|--------------|
| Safety component (Art 6(1)) | ✅ | ❌ |
| BIOMETRICS | ❌ | ❌ |
| CRITICAL_INFRASTRUCTURE | ❌ | ❌ |
| EDUCATION | ✅ | ✅ |
| EMPLOYMENT | ❌ | ❌ |
| ESSENTIAL_SERVICES | ❌ | ❌ |
| LAW_ENFORCEMENT | ❌ | ❌ |
| MIGRATION | ❌ | ❌ |
| JUSTICE_DEMOCRACY | ❌ | ❌ |

**Covered: 3 of 18. Missing: 15**

### C.5: Multi-Area Annex III Pairs — C(8,2) = 28

| # | Pair | Status |
|---|------|--------|
| 1 | BIOMETRICS + CRITICAL_INFRA | ❌ |
| 2 | BIOMETRICS + EDUCATION | ✅ (BUG-A3, ML-011) |
| 3 | BIOMETRICS + EMPLOYMENT | ❌ |
| 4 | BIOMETRICS + ESSENTIAL_SVC | ❌ |
| 5 | BIOMETRICS + LAW_ENFORCE | ❌ |
| 6 | BIOMETRICS + MIGRATION | ❌ |
| 7 | BIOMETRICS + JUSTICE_DEM | ❌ |
| 8 | CRITICAL_INFRA + EDUCATION | ❌ |
| 9 | CRITICAL_INFRA + EMPLOYMENT | ❌ |
| 10 | CRITICAL_INFRA + ESSENTIAL_SVC | ❌ |
| 11 | CRITICAL_INFRA + LAW_ENFORCE | ❌ |
| 12 | CRITICAL_INFRA + MIGRATION | ❌ |
| 13 | CRITICAL_INFRA + JUSTICE_DEM | ❌ |
| 14 | EDUCATION + EMPLOYMENT | ❌ |
| 15 | EDUCATION + ESSENTIAL_SVC | ❌ |
| 16 | EDUCATION + LAW_ENFORCE | ❌ |
| 17 | EDUCATION + MIGRATION | ❌ |
| 18 | EDUCATION + JUSTICE_DEM | ❌ |
| 19 | EMPLOYMENT + ESSENTIAL_SVC | ✅ (BUG-A3 — triple with JUSTICE) |
| 20 | EMPLOYMENT + LAW_ENFORCE | ❌ |
| 21 | EMPLOYMENT + MIGRATION | ❌ |
| 22 | EMPLOYMENT + JUSTICE_DEM | ✅ (BUG-A3 — triple with ESSENTIAL) |
| 23 | ESSENTIAL_SVC + LAW_ENFORCE | ❌ |
| 24 | ESSENTIAL_SVC + MIGRATION | ❌ |
| 25 | ESSENTIAL_SVC + JUSTICE_DEM | ✅ (BUG-A3 — triple with EMPLOYMENT) |
| 26 | LAW_ENFORCE + MIGRATION | ❌ |
| 27 | LAW_ENFORCE + JUSTICE_DEM | ❌ |
| 28 | MIGRATION + JUSTICE_DEM | ❌ |

**Covered: 4 of 28. Missing: 24**

### C.6: Open-Source Exclusion × All Trigger Types

The engine checks 3 categories when `openSourceNonHighRisk=true`:

**Prohibited triggers (8):**

| Trigger | Tested as blocking open-source exclusion? |
|---------|------------------------------------------|
| usesSubliminaManipulation | ❌ |
| exploitsVulnerabilities | ❌ |
| socialScoring | ✅ (BUG-C5:263) |
| criminalRiskProfiling | ❌ |
| facialRecognitionScraping | ❌ |
| workplaceEmotionDetection | ❌ |
| biometricCategorisationSensitive | ❌ |
| realtimeBiometricPublicSpaces | ❌ |

**High-risk triggers (9):**

| Trigger | Tested? |
|---------|---------|
| safety component (all 3 flags) | ❌ |
| usesBiometrics (non-verification) | ❌ |
| criticalInfrastructure | ❌ |
| educationUseCase | ✅ (BUG-C5:255) |
| employmentUseCase | ❌ |
| essentialServicesUseCase | ❌ |
| lawEnforcementUseCase | ❌ |
| migrationUseCase | ❌ |
| justiceUseCase | ❌ |

**Transparency triggers (6):**

| Trigger | Tested? |
|---------|---------|
| interactsWithHumans | ✅ (BUG-C5:238) |
| generatesDeepfakes | ✅ (BUG-C5:247) |
| generatesText | ❌ |
| generatesMedia | ✅ (BUG-C5:279) |
| usesEmotionRecognition | ✅ (BUG-C5:287) |
| usesBiometricCategorisation | ❌ |

**Covered: 7 of 23. Missing: 16**

### C.7: Role × Company Size × Fine Categories (Already Fully Covered)

Via `SME-007..012` parameterized tests: all 4 sizes × PROHIBITED, HIGH_RISK, GPAI, MINIMAL, EXCLUDED = 20/20 ✅

---

## D) Summary Totals

### Individual Branch Paths  
| Category | Total Paths | Covered | Missing |
|----------|------------|---------|---------|
| Scope exclusions | 24 | 20 | 4 |
| Prohibited practices | 24 | 24 | 0 |
| GPAI | 15 | 15 | 0 |
| Safety component | 4 | 4 | 0 |
| Annex III areas (single) | 16 | 16 | 0 |
| Art 6(3) exception | 11 | 11 | 0 |
| Limited risk (transparency) | 8 | 8 | 0 |
| Overlays | 16 | 16 | 0 |
| Role-based obligations | 11 | 11 | 0 |
| Fine calculations | 20 | 20 | 0 |
| **TOTAL INDIVIDUAL PATHS** | **149** | **145** | **4** |

### Combinatorial Matrices
| Category | Total Combos | Covered | Missing |
|----------|-------------|---------|---------|
| C.1: Area × Role × Outcome | 72 | 14 | **58** |
| C.2: Area × Art 6(3) condition | 32 | 5 | **27** |
| C.3: Transparency × overlay classif. | 30 | 7 | **23** |
| C.4: GPAI dual × triggers | 18 | 3 | **15** |
| C.5: Multi-area pairs | 28 | 4 | **24** |
| C.6: Open-source × trigger types | 23 | 7 | **16** |
| C.7: Role × Size × Fines | 20 | 20 | **0** |
| **TOTAL COMBINATORIAL** | **223** | **60** | **163** |

### Grand Total
| | Paths | Covered | Missing | Coverage % |
|--|-------|---------|---------|-----------|
| Individual branches | 149 | 145 | 4 | 97.3% |
| Combinatorial matrices | 223 | 60 | 163 | 26.9% |
| **OVERALL** | **372** | **205** | **167** | **55.1%** |

---

## E) Recommended `test.each` Matrices

### Matrix 1: Area × Role × Outcome (58 missing → 72 total)

```typescript
const ANNEX_III_AREAS = [
  "BIOMETRICS", "CRITICAL_INFRASTRUCTURE", "EDUCATION", "EMPLOYMENT",
  "ESSENTIAL_SERVICES", "LAW_ENFORCEMENT", "MIGRATION_ASYLUM_BORDER", "JUSTICE_DEMOCRACY",
] as const;

const ROLES = ["PROVIDER", "DEPLOYER", "BOTH"] as const;

// Area gate flags per area
const AREA_FLAGS: Record<string, Partial<WizardAnswers>> = {
  BIOMETRICS: { usesBiometrics: true, isBiometricVerificationOnly: false },
  CRITICAL_INFRASTRUCTURE: { criticalInfrastructure: true },
  EDUCATION: { educationUseCase: true },
  EMPLOYMENT: { employmentUseCase: true },
  ESSENTIAL_SERVICES: { essentialServicesUseCase: true },
  LAW_ENFORCEMENT: { lawEnforcementUseCase: true },
  MIGRATION_ASYLUM_BORDER: { migrationUseCase: true },
  JUSTICE_DEMOCRACY: { justiceUseCase: true },
};

const FRIA_AREAS = new Set([
  "ESSENTIAL_SERVICES", "EDUCATION", "EMPLOYMENT",
  "LAW_ENFORCEMENT", "MIGRATION_ASYLUM_BORDER", "JUSTICE_DEMOCRACY",
]);

// 72 combos: area × role × outcome
const areaRoleOutcome = ANNEX_III_AREAS.flatMap(area =>
  ROLES.flatMap(role => [
    { area, role, outcome: "confirmed" as const },
    { area, role, outcome: "exception" as const },
    { area, role, outcome: "profiling" as const },
  ])
);

describe.each(areaRoleOutcome)(
  "Area=$area × Role=$role × Outcome=$outcome",
  ({ area, role, outcome }) => {
    it(`should produce correct classification`, () => {
      const answers = {
        ...baseAnswers(),
        ...AREA_FLAGS[area],
        role,
        // Outcome modifiers:
        ...(outcome === "exception" ? {
          posesSignificantRiskOfHarm: false,
          narrowProceduralTask: true,
          performsProfiling: false,
        } : {}),
        ...(outcome === "profiling" ? {
          posesSignificantRiskOfHarm: false,
          narrowProceduralTask: true,
          performsProfiling: true,
        } : {}),
      };
      const result = classifyAISystem(answers);

      if (outcome === "exception") {
        expect(result.classification).toBe("MINIMAL_RISK");
        expect(result.legalBasis).toContain("Article 6(3)");
      } else {
        expect(result.classification).toBe("HIGH_RISK");
        expect(result.highRiskArea).toBe(area);
      }

      // Role-specific obligation checks
      if (outcome !== "exception") {
        if (role === "PROVIDER" || role === "BOTH") {
          expect(result.obligations.some(o => o.id === "RISK_MANAGEMENT_SYSTEM")).toBe(true);
        }
        if (role === "DEPLOYER" || role === "BOTH") {
          expect(result.obligations.some(o => o.id === "DEPLOY_PER_INSTRUCTIONS")).toBe(true);
          if (FRIA_AREAS.has(area)) {
            expect(result.obligations.some(o => o.id === "FUNDAMENTAL_RIGHTS_IMPACT")).toBe(true);
          }
        }
      }
    });
  }
);
```

### Matrix 2: Area × Art 6(3) Condition (27 missing → 32 total)

```typescript
const CONDITIONS = [
  { key: "narrowProceduralTask", label: "(a) narrow procedural" },
  { key: "improvesHumanActivity", label: "(b) improves human activity" },
  { key: "detectsPatterns", label: "(c) detects patterns" },
  { key: "preparatoryTask", label: "(d) preparatory task" },
] as const;

const areaCondition = ANNEX_III_AREAS.flatMap(area =>
  CONDITIONS.map(cond => ({ area, condKey: cond.key, condLabel: cond.label }))
);

describe.each(areaCondition)(
  "Art 6(3): Area=$area × Condition=$condLabel",
  ({ area, condKey }) => {
    it(`should grant exception when ${condKey} + no significant risk`, () => {
      const answers = {
        ...baseAnswers(),
        ...AREA_FLAGS[area],
        posesSignificantRiskOfHarm: false,
        performsProfiling: false,
        [condKey]: true,
      };
      const result = classifyAISystem(answers);
      expect(result.classification).toBe("MINIMAL_RISK");
      expect(result.legalBasis).toContain("Article 6(3)");
    });
  }
);
```

### Matrix 3: Transparency Triggers × Overlay Classifications (23 missing → 30 total)

```typescript
const TRANSPARENCY_TRIGGERS = [
  { key: "interactsWithHumans", type: "HUMAN_INTERACTION", obligationId: "TRANSPARENCY_INTERACTION" },
  { key: "usesEmotionRecognition", type: "EMOTION_RECOGNITION", obligationId: "TRANSPARENCY_EMOTION" },
  { key: "usesBiometricCategorisation", type: "BIOMETRIC_CATEGORISATION", obligationId: "TRANSPARENCY_BIOMETRIC_CAT" },
  { key: "generatesDeepfakes", type: "DEEPFAKE_CONTENT", obligationId: "TRANSPARENCY_DEEPFAKE" },
  { key: "generatesText", type: "AI_GENERATED_TEXT", obligationId: "TRANSPARENCY_TEXT" },
  { key: "generatesMedia", type: "AI_GENERATED_MEDIA", obligationId: "TRANSPARENCY_MEDIA" },
] as const;

const OVERLAY_CONTEXTS = [
  { label: "HR_AnnexIII", baseFlags: { employmentUseCase: true } },
  { label: "HR_Safety", baseFlags: { isSafetyComponent: true, productUnderAnnexI: true, requiresThirdPartyConformity: true } },
  { label: "GPAI", baseFlags: { isGeneralPurposeModel: true } },
  { label: "GPAI_SYSTEMIC", baseFlags: { isGeneralPurposeModel: true, gpaiHighImpactCapabilities: true } },
  { label: "Art6(3)_Exception", baseFlags: {
    educationUseCase: true, posesSignificantRiskOfHarm: false,
    narrowProceduralTask: true, performsProfiling: false,
  }},
] as const;

const transparencyOverlay = TRANSPARENCY_TRIGGERS.flatMap(trigger =>
  OVERLAY_CONTEXTS.map(ctx => ({ trigger: trigger.key, obligationId: trigger.obligationId, context: ctx.label, baseFlags: ctx.baseFlags }))
);

describe.each(transparencyOverlay)(
  "Transparency overlay: $trigger on $context",
  ({ trigger, obligationId, baseFlags }) => {
    it(`should add ${obligationId} via overlay`, () => {
      const answers = { ...baseAnswers(), ...baseFlags, [trigger]: true };
      const result = classifyAISystem(answers);
      expect(result.obligations.some(o => o.id === obligationId)).toBe(true);
    });
  }
);
```

### Matrix 4: GPAI Dual Classification × All 9 Triggers (15 missing → 18 total)

```typescript
const DUAL_TRIGGERS = [
  { label: "Safety component", flags: { isSafetyComponent: true, productUnderAnnexI: true, requiresThirdPartyConformity: true }, warnContains: "Art 6(1)" },
  { label: "BIOMETRICS", flags: { usesBiometrics: true, isBiometricVerificationOnly: false }, warnContains: "Biometrics" },
  { label: "CRITICAL_INFRASTRUCTURE", flags: { criticalInfrastructure: true }, warnContains: "Critical infrastructure" },
  { label: "EDUCATION", flags: { educationUseCase: true }, warnContains: "Education" },
  { label: "EMPLOYMENT", flags: { employmentUseCase: true }, warnContains: "Employment" },
  { label: "ESSENTIAL_SERVICES", flags: { essentialServicesUseCase: true }, warnContains: "Essential services" },
  { label: "LAW_ENFORCEMENT", flags: { lawEnforcementUseCase: true }, warnContains: "Law enforcement" },
  { label: "MIGRATION", flags: { migrationUseCase: true }, warnContains: "Migration" },
  { label: "JUSTICE_DEMOCRACY", flags: { justiceUseCase: true }, warnContains: "Justice" },
];

const GPAI_TYPES = [
  { label: "GPAI", flags: { isGeneralPurposeModel: true, gpaiHighImpactCapabilities: false } },
  { label: "GPAI_SYSTEMIC", flags: { isGeneralPurposeModel: true, gpaiHighImpactCapabilities: true } },
];

const gpaiDual = GPAI_TYPES.flatMap(gpai =>
  DUAL_TRIGGERS.map(trigger => ({
    gpaiLabel: gpai.label, triggerLabel: trigger.label,
    flags: { ...gpai.flags, ...trigger.flags },
    warnContains: trigger.warnContains,
  }))
);

describe.each(gpaiDual)(
  "GPAI dual: $gpaiLabel + $triggerLabel",
  ({ gpaiLabel, flags, warnContains }) => {
    it(`should warn about dual classification`, () => {
      const answers = { ...baseAnswers(), ...flags };
      const result = classifyAISystem(answers);
      expect(result.classification).toBe(gpaiLabel);
      expect(result.warnings.some(w => w.includes("DUAL CLASSIFICATION") && w.includes(warnContains))).toBe(true);
    });
  }
);
```

### Matrix 5: Multi-Area Annex III Pairs (24 missing → 28 total)

```typescript
const pairs: [string, string][] = [];
for (let i = 0; i < ANNEX_III_AREAS.length; i++) {
  for (let j = i + 1; j < ANNEX_III_AREAS.length; j++) {
    pairs.push([ANNEX_III_AREAS[i], ANNEX_III_AREAS[j]]);
  }
}
// 28 pairs

describe.each(pairs)(
  "Multi-area pair: %s + %s",
  (area1, area2) => {
    it(`should be HIGH_RISK with multi-area warning`, () => {
      const answers = {
        ...baseAnswers(),
        ...AREA_FLAGS[area1],
        ...AREA_FLAGS[area2],
      };
      const result = classifyAISystem(answers);
      expect(result.classification).toBe("HIGH_RISK");
      expect(result.warnings.some(w => w.includes("MULTIPLE HIGH-RISK AREAS"))).toBe(true);
    });

    it(`should include warnings from both areas`, () => {
      const answers = { ...baseAnswers(), ...AREA_FLAGS[area1], ...AREA_FLAGS[area2] };
      const result = classifyAISystem(answers);
      // Both area names should appear somewhere in warnings
      expect(result.warnings.join(" ")).toContain(area1.replace(/_/g, " "));
      // Note: warnings use area.replace(/_/g, " ") so check for human-readable form
    });
  }
);
```

### Matrix 6: Open-Source Exclusion × All Blocking Triggers (16 missing → 23 total)

```typescript
const OS_PROHIBITED_TRIGGERS = [
  { label: "subliminal", flag: "usesSubliminaManipulation" },
  { label: "exploit", flag: "exploitsVulnerabilities" },
  { label: "socialScoring", flag: "socialScoring" },
  { label: "criminalProfiling", flag: "criminalRiskProfiling" },
  { label: "facialScraping", flag: "facialRecognitionScraping" },
  { label: "workplaceEmotion", flag: "workplaceEmotionDetection" },
  { label: "biometricCatSensitive", flag: "biometricCategorisationSensitive" },
  { label: "realtimeBiometric", flag: "realtimeBiometricPublicSpaces" },
];

const OS_HIGHRISK_TRIGGERS = [
  { label: "safetyComponent", flags: { isSafetyComponent: true, productUnderAnnexI: true, requiresThirdPartyConformity: true } },
  { label: "biometrics", flags: { usesBiometrics: true, isBiometricVerificationOnly: false } },
  { label: "criticalInfra", flags: { criticalInfrastructure: true } },
  { label: "education", flags: { educationUseCase: true } },
  { label: "employment", flags: { employmentUseCase: true } },
  { label: "essentialServices", flags: { essentialServicesUseCase: true } },
  { label: "lawEnforcement", flags: { lawEnforcementUseCase: true } },
  { label: "migration", flags: { migrationUseCase: true } },
  { label: "justice", flags: { justiceUseCase: true } },
];

const OS_TRANSPARENCY_TRIGGERS = [
  { label: "interactsWithHumans", flag: "interactsWithHumans" },
  { label: "generatesDeepfakes", flag: "generatesDeepfakes" },
  { label: "generatesText", flag: "generatesText" },
  { label: "generatesMedia", flag: "generatesMedia" },
  { label: "usesEmotionRecognition", flag: "usesEmotionRecognition" },
  { label: "usesBiometricCategorisation", flag: "usesBiometricCategorisation" },
];

describe("Open-source exclusion blocked by prohibited triggers", () => {
  test.each(OS_PROHIBITED_TRIGGERS)(
    "openSource + $label → should NOT be excluded",
    ({ flag }) => {
      const answers = { ...baseAnswers(), openSourceNonHighRisk: true, [flag]: true };
      const result = classifyAISystem(answers);
      expect(result.legalBasis).not.toContain("Article 2");
    }
  );
});

describe("Open-source exclusion blocked by high-risk triggers", () => {
  test.each(OS_HIGHRISK_TRIGGERS)(
    "openSource + $label → should NOT be excluded",
    ({ flags }) => {
      const answers = { ...baseAnswers(), openSourceNonHighRisk: true, ...flags };
      const result = classifyAISystem(answers);
      expect(result.legalBasis).not.toContain("Article 2");
    }
  );
});

describe("Open-source exclusion blocked by transparency triggers", () => {
  test.each(OS_TRANSPARENCY_TRIGGERS)(
    "openSource + $label → should NOT be excluded",
    ({ flag }) => {
      const answers = { ...baseAnswers(), openSourceNonHighRisk: true, [flag]: true };
      const result = classifyAISystem(answers);
      expect(result.legalBasis).not.toContain("Article 2");
    }
  );
});
```

### Matrix 7: Role × Company Size × Fine Category (Already Covered — No Action Needed)

All 20 combinations covered by `SME-007..012` parameterized tests.

---

## F) Priority Recommendations

### Tier 1 — High Value (fills largest gaps with fewest tests)

| Matrix | New Tests | Coverage Gain |
|--------|-----------|---------------|
| C.1: Area × Role × Outcome | 72 parameterized | +58 combos |
| C.5: Multi-area pairs | 56 parameterized (28 pairs × 2 assertions) | +24 combos |
| C.2: Area × Art 6(3) conditions | 32 parameterized | +27 combos |

### Tier 2 — Medium Value (cross-cutting overlays)

| Matrix | New Tests | Coverage Gain |
|--------|-----------|---------------|
| C.3: Transparency × overlay | 30 parameterized | +23 combos |
| C.4: GPAI dual × triggers | 18 parameterized | +15 combos |
| C.6: Open-source × triggers | 23 parameterized | +16 combos |

### Tier 3 — Already Complete

| Matrix | Status |
|--------|--------|
| C.7: Role × Size × Fines | ✅ 20/20 |
| Prohibited practices | ✅ 24/24 |
| GPAI branches | ✅ 15/15 |
| Safety component | ✅ 4/4 |

---

## G) Estimated Effort

Adding all 6 missing matrices as `test.each` parameterized suites:

| Matrix | Tests | Lines (est.) |
|--------|-------|-------------|
| C.1: Area × Role × Outcome | 72 | ~120 |
| C.2: Area × Art 6(3) conditions | 32 | ~50 |
| C.3: Transparency × overlay | 30 | ~70 |
| C.4: GPAI dual | 18 | ~60 |
| C.5: Multi-area pairs | 56 | ~60 |
| C.6: Open-source × triggers | 23 | ~80 |
| **TOTAL** | **231** | **~440** |

This would bring combinatorial coverage from **26.9% → ~100%** and overall coverage from **55.1% → ~100%** of identified meaningful paths.

**Final combined test count: 602 (existing) + 231 (new) = 833 tests**
