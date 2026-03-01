# EU AI Act Compliance Platform — Product Specification v2
## AUDITED & CORRECTED — 25 February 2026

> **Mission**: Self-serve EU AI Act compliance for SMBs. "Vanta, but for EU regulations."  
> **Regulation**: EU AI Act — Regulation (EU) 2024/1689  
> **Target Market**: EU-based SMBs (10-500 employees) deploying or building AI systems  
> **Differentiator**: Only product focused on EU AI Act for SMBs; competitors (Vanta, OneTrust) are enterprise-first & don't cover AI Act

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER-FACING WEB APP                       │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Wizard   │→ │ Classification│→ │ Compliance Dashboard  │  │
│  │ (Q&A)    │  │ Engine       │  │ (Obligations+Status)  │  │
│  └──────────┘  └──────────────┘  └───────────────────────┘  │
│       ↕                               ↕                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Template Generator (Claude API)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Timeline │  │ Fine Risk    │  │ Document Storage      │  │
│  │ Tracker  │  │ Calculator   │  │ (Generated templates) │  │
│  └──────────┘  └──────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **Wizard** (11-step conversational Q&A) → collects `WizardAnswers`
2. **Classification Engine** (`classifyAISystem()`) → returns `ClassificationResult`
3. **Dashboard** renders: risk level, obligations checklist, enforcement timeline
4. **Template Generator** produces compliance documents via Claude API
5. **Document Storage** persists generated templates for each customer

---

## 2. Classification Logic (v2 — Audited)

### Decision Flow

```
User answers wizard
        │
        ▼
┌─── Art 2 scope check ───┐
│ Military? R&D? Personal?│
│ Open-source non-HR?     │──── YES ──→ OUT OF SCOPE
│ No EU nexus?            │
└──────────┬──────────────┘
           │ NO
           ▼
┌─── Art 5 prohibited ────┐
│ 8 banned practices      │
│ WITH harm thresholds    │──── YES ──→ PROHIBITED 🚨
│ AND exception checks    │            (€35M / 7% fine)
└──────────┬──────────────┘
           │ NO
           ▼
┌─── Art 51-56 GPAI ──────┐
│ Foundation model?        │
│ Systemic risk (>10²⁵)?  │──── YES ──→ GPAI / GPAI_SYSTEMIC
│ Open-source exception?   │
└──────────┬──────────────┘
           │ NO
           ▼
┌─── Art 6(1) Product ────┐
│ Safety component?        │
│ Annex I product?         │──── YES ──→ HIGH-RISK (Product)
│ Third-party conformity?  │            Deadline: Aug 2027
└──────────┬──────────────┘
           │ NO
           ▼
┌─── Art 6(2) Annex III ──┐
│ 8 high-risk areas        │
│ ┌─ Art 6(3) exception ─┐│
│ │ NOT significant risk  ││──── Exception ──→ MINIMAL + Document
│ │ AND one of (a)-(d)   ││
│ │ AND no profiling      ││
│ └───────────────────────┘│──── No exception ──→ HIGH-RISK (Annex III)
└──────────┬──────────────┘                      Deadline: Aug 2026
           │ NOT in Annex III
           ▼
┌─── Art 50 Transparency ─┐
│ Chatbot? Deepfake?       │
│ Emotion? Biometric cat?  │──── YES ──→ LIMITED_RISK
│ AI-generated content?    │
└──────────┬──────────────┘
           │ NO
           ▼
      MINIMAL_RISK
  (AI literacy only)
```

### v2 Fixes Applied (15 issues — see AUDIT_LOG.md)

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | CRITICAL | Missing Provider vs Deployer role | Added `role` field; deployer obligations (Art 26), FRIA (Art 27) |
| 2 | CRITICAL | Art 5(1)(f) missing medical/safety exception | Added `workplaceEmotionForMedicalSafety` check |
| 3 | CRITICAL | Art 5(1)(h) missing LE exceptions | Added `realtimeBiometricForLEException` + judicial auth check |
| 4 | CRITICAL | Art 5(1)(a)/(b) missing harm threshold | Added `manipulationCausesSignificantHarm` and `exploitationCausesSignificantHarm` |
| 5 | HIGH | Art 6(3) missing "significant risk" prerequisite | Added `posesSignificantRiskOfHarm` as dual-condition gate |
| 6 | HIGH | Art 4 AI Literacy only on minimal risk | AI Literacy now applied to ALL classifications via `getUniversalObligations()` |
| 7 | HIGH | Missing deployer obligations | Added 8 deployer obligations (Art 26) + FRIA (Art 27) |
| 8 | HIGH | Annex III Point 5 wrong sub-types | Fixed to exactly 5 sub-types matching Act: (a)-(e) |
| 9 | MEDIUM | Annex III Point 8 missing ADR | Added `ALTERNATIVE_DISPUTE_RESOLUTION` type |
| 10 | MEDIUM | Biometric verification not excluded | Added `isBiometricVerificationOnly` question |
| 11 | MEDIUM | No SME simplifications | Added `getSMESimplifications()`, SME-aware fine calculator |
| 12 | MEDIUM | Art 5(1)(g) missing LE labelling exception | Added `biometricCatForLawEnforcementLabelling` check |
| 13 | LOW | Missing Annex I product examples | Added product examples in wizard help text |
| 14 | LOW | Enforcement timeline was static | Now dynamic via `getEnforcementTimeline(currentDate)` |
| 15 | LOW | Art 5(1)(d) "solely" qualifier | Added `crimeProfilingSupportingHumanAssessment` exception check |

---

## 3. Risk Categories & Obligations

### Classification Summary

| Classification | Articles | # Provider Obligations | # Deployer Obligations | Fine Risk | Deadline |
|---|---|---|---|---|---|
| PROHIBITED | Art 5 | 1 (cease & desist) | 1 (cease & desist) | €35M / 7% | **Feb 2025** ✅ ENFORCED |
| GPAI_SYSTEMIC | Art 51, 55 | 8-10 | — | €15M / 3% | **Aug 2025** ✅ ENFORCED |
| GPAI | Art 53 | 2-4 (depends on open-source) | — | €15M / 3% | **Aug 2025** ✅ ENFORCED |
| HIGH_RISK (Annex III) | Art 6(2), 8-15, 16-21 | 16 | 8 + FRIA | €15M / 3% | **Aug 2026** ⏰ 5 months |
| HIGH_RISK (Annex I) | Art 6(1) | 16 | 8 + FRIA | €15M / 3% | **Aug 2027** |
| LIMITED_RISK | Art 50 | 2-4 transparency | 2-4 transparency | €15M / 3% | **Aug 2026** |
| MINIMAL_RISK | Art 95 | 1 (AI literacy) | 1 (AI literacy) | — | — |

### Role-Based Obligations (v2 Critical Addition)

**Provider Obligations (Art 16-21)** — 16 requirements:
Risk management, data governance, technical documentation, logging, transparency to deployers, human oversight design, accuracy/robustness/cybersecurity, QMS, documentation retention (10yr), log retention (6mo min), corrective actions, conformity assessment, EU declaration, CE marking, EU database registration, post-market monitoring, serious incident reporting.

**Deployer Obligations (Art 26)** — 8 requirements:
Use per instructions, assign human oversight, monitor operations, keep logs (6mo), inform workers' representatives, inform affected persons, DPIA if applicable, register in EU database (public bodies).

**Fundamental Rights Impact Assessment (Art 27)**:
Required for public body deployers, private deployers providing public services, and deployers of Annex III point 5(b)/(c) systems.

---

## 4. Template Registry

25 compliance document templates, each auto-generated by Claude API with company-specific context:

| ID | Template | For Role | Estimated Time |
|----|----------|----------|----------------|
| TMPL_RISK_MANAGEMENT | Risk Management System | Provider | 120 min |
| TMPL_DATA_GOVERNANCE | Data Governance Policy | Provider | 90 min |
| TMPL_TECHNICAL_DOC | Technical Documentation (Annex IV) | Provider | 240 min |
| TMPL_LOGGING_SPEC | Logging & Record-Keeping Spec | Provider | 60 min |
| TMPL_INSTRUCTIONS_FOR_USE | Instructions for Use | Provider | 90 min |
| TMPL_HUMAN_OVERSIGHT | Human Oversight Procedures | Both | 90 min |
| TMPL_ACCURACY_ROBUSTNESS | Accuracy/Robustness/Cybersecurity | Provider | 120 min |
| TMPL_QMS | Quality Management System | Provider | 180 min |
| TMPL_CORRECTIVE_ACTIONS | Corrective Actions & Incident Response | Provider | 60 min |
| TMPL_CONFORMITY_ASSESSMENT | Conformity Assessment Record | Provider | 120 min |
| TMPL_EU_DECLARATION | EU Declaration of Conformity | Provider | 30 min |
| TMPL_EU_DB_REGISTRATION | EU Database Registration Data | Both | 45 min |
| TMPL_POST_MARKET_MONITORING | Post-Market Monitoring Plan | Provider | 90 min |
| TMPL_NON_HIGH_RISK_ASSESSMENT | Non-High-Risk Exception Doc | Provider | 60 min |
| TMPL_FUNDAMENTAL_RIGHTS_IMPACT | Fundamental Rights Impact Assessment | Deployer | 120 min |
| TMPL_AI_INTERACTION_NOTICE | AI Interaction Transparency Notice | Provider | 15 min |
| TMPL_DEEPFAKE_DISCLOSURE | Deepfake/Synthetic Content Disclosure | Deployer | 30 min |
| TMPL_AI_TEXT_LABEL | AI-Generated Text Label | Both | 20 min |
| TMPL_AI_MEDIA_MARKING | AI-Generated Media Marking | Provider | 30 min |
| TMPL_EMOTION_NOTICE | Emotion Recognition Notice | Deployer | 15 min |
| TMPL_BIOMETRIC_CAT_NOTICE | Biometric Categorisation Notice | Deployer | 15 min |
| TMPL_GPAI_TECH_DOC | GPAI Technical Doc (Annex XI) | Provider | 180 min |
| TMPL_GPAI_DOWNSTREAM | GPAI Downstream Provider Info (Annex XII) | Provider | 90 min |
| TMPL_COPYRIGHT_POLICY | Copyright Compliance Policy | Provider | 60 min |
| TMPL_TRAINING_SUMMARY | Training Data Summary (public) | Provider | 60 min |

---

## 5. Enforcement Timeline (as of 25 Feb 2026)

```
Feb 2025 ━━━━━━━━━━━━━━━━━━━━━━ ✅ ENFORCED
  ├── Art 4: AI Literacy (ALL systems)
  └── Art 5: Prohibited practices (8 banned uses)

May 2025 ━━━━━━━━━━━━━━━━━━━━━━ ✅ ENFORCED
  └── Codes of practice for GPAI ready

Aug 2025 ━━━━━━━━━━━━━━━━━━━━━━ ✅ ENFORCED
  ├── Art 51-56: GPAI model obligations
  ├── Notified bodies + governance structure
  └── AI Office fully operational

Aug 2026 ━━━━━━━━━━━━━━━━━━━━━━ ⏰ ~5 MONTHS AWAY
  ├── Art 6-49: HIGH-RISK obligations (Annex III)
  ├── Art 50: Transparency obligations
  ├── Art 72-73: Post-market monitoring + incident reporting
  └── Art 99: Full fine regime active

Aug 2027 ━━━━━━━━━━━━━━━━━━━━━━ 🔮 UPCOMING
  └── Art 6(1): Product safety AI (Annex I, Section A)

Aug 2030 ━━━━━━━━━━━━━━━━━━━━━━ 🔮 FUTURE
  ├── Public authority deployers must comply
  └── Large-scale IT systems (Annex X) by 31 Dec 2030
```

---

## 6. Fine Structure

| Violation | General Cap | SME Cap | Turnover % | Article |
|-----------|------------|---------|------------|---------|
| Prohibited practices | €35,000,000 | LOWER of €35M or 7% | 7% | Art 99(3) |
| Other obligations (high-risk, etc.) | €15,000,000 | LOWER of €15M or 3% | 3% | Art 99(4) |
| Incorrect info to authorities | €7,500,000 | LOWER of €7.5M or 1% | 1% | Art 99(5) |
| GPAI violations | €15,000,000 | LOWER of €15M or 3% | 3% | Art 101(1) |

**SME Advantage (Art 99(4) last sentence)**: For SMEs including start-ups, each fine is capped at the **LOWER** of the fixed amount and the percentage of turnover. Example: Company with €2M turnover faces max €60K for high-risk violations (3% of €2M), NOT €15M.

---

## 7. UX Design

### User Journey

```
Landing Page ("Are you EU AI Act ready?")
    │
    ▼
Sign Up (email + company) → FREE classification
    │
    ▼
Wizard (11 steps, ~10-15 min)
    │ Plain-language questions
    │ Conditional logic (skip irrelevant steps)
    │ Progress bar + save & resume
    │
    ▼
Classification Result
    │ Risk level (colour-coded: 🔴🟡🟢)
    │ Legal basis (article references)
    │ Fine risk (SME-adjusted €€€)
    │
    ▼
Compliance Dashboard ← PAYWALL STARTS HERE
    │ Obligations checklist (green/yellow/red)
    │ Enforcement countdown timer
    │ Per-obligation: status, assigned owner, due date
    │
    ▼
Template Generator
    │ Click obligation → generate document draft
    │ Claude API fills in company-specific details
    │ Edit in-app → export as PDF/Word
    │
    ▼
Ongoing Monitoring
    │ Act updates (delegated acts, guidance docs)
    │ Re-assessment reminders
    │ Audit trail for regulators
```

### Key UX Principles
1. **TurboTax Model**: Complex regulation → simple yes/no questions → clear result
2. **Never show legal jargon first**: Plain language, with expandable "legal details" for those who want it
3. **Save & resume**: People need to consult colleagues before answering some questions
4. **Multiple AI systems**: One company may operate 5-10 different AI systems, each needing separate classification
5. **Exportable**: Everything must be PDF/Word exportable for handing to lawyers, regulators, auditors

---

## 8. Pricing

| Tier | Price | What's Included | Target |
|------|-------|-----------------|--------|
| **Free** | €0/mo | Classification wizard (unlimited), risk result, enforcement timeline | Lead generation |
| **Starter** | €99/mo | Dashboard + 3 templates/mo + 1 AI system | Micro/small companies, 1 AI system |
| **Growth** | €299/mo | All templates + up to 5 AI systems + Claude AI drafts + email support | SMBs with multiple AI deployments |
| **Business** | €499/mo | Unlimited systems + team access (5 users) + priority support + audit trail | Medium companies, multi-team |

Freemium model: Free classification is the **hook**. Once they see "HIGH-RISK — 16 obligations — €15M fine risk — 5 months to deadline" they'll pay for the templates.

---

## 9. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 + React + Tailwind CSS | SEO for landing page, fast interactions |
| Backend | Next.js API routes + tRPC or REST | Keep it simple, monolith first |
| Database | PostgreSQL (Supabase or Neon) | Relational for compliance data |
| AI | Claude API (Opus 4.6) | Template generation, system analysis |
| Auth | Clerk | Fast, EU-friendly, GDPR-compliant |
| Payments | Stripe | EU billing, VAT handling |
| Hosting | Vercel (frontend) + AWS EU region | Data residency in EU |
| File Storage | S3 (eu-west-1) | Generated documents |
| Email | Resend or Postmark | Transactional emails, reminders |

### Data Residency
ALL customer data stored in EU regions only (AWS eu-west-1 Dublin). This is both a compliance requirement for our customers and a trust differentiator.

---

## 10. Build Timeline

### Phase 1: MVP (Weeks 1-4) — Launch with €0 + €99 tier
- [ ] Classification engine (TypeScript) — **DONE (v2 audited)**
- [ ] Wizard UI (Next.js + React)
- [ ] Classification result page (risk level, obligations, fines)
- [ ] Landing page + SEO
- [ ] Auth (Clerk) + basic user accounts
- [ ] Stripe billing (€99 Starter)
- [ ] 3 most critical templates (Risk Management, Technical Doc, EU Declaration)

### Phase 2: Core (Weeks 5-8) — Growth tier
- [ ] Full template generator with Claude API (all 25 templates)
- [ ] Compliance dashboard (obligation tracking, status updates)
- [ ] Multi-system support (one company, many AI systems)
- [ ] Document export (PDF/Word)
- [ ] Enforcement countdown timer + email reminders

### Phase 3: Scale (Weeks 9-12) — Business tier
- [ ] Team access + role-based permissions
- [ ] Audit trail (immutable log of all compliance actions)
- [ ] Act updates feed (delegated acts, Commission guidance)
- [ ] API for enterprise integrations
- [ ] SOC 2 Type I preparation

---

## 11. Competitive Positioning

| Feature | Us | Vanta | OneTrust | Credo AI |
|---------|-----|-------|----------|----------|
| EU AI Act focus | ✅ Core product | ❌ No AI Act | ⚠️ General | ⚠️ US-focused |
| Self-serve for SMBs | ✅ | ⚠️ Enterprise | ❌ Enterprise | ❌ Enterprise |
| Price (SMB) | €99-499/mo | $10K+/yr | $50K+/yr | Custom |
| Classification wizard | ✅ 11-step | ❌ | ❌ | ❌ |
| Provider + Deployer | ✅ Both | N/A | N/A | ⚠️ Provider only |
| Auto template generation | ✅ Claude AI | ❌ | ⚠️ Manual | ❌ |
| EU data residency | ✅ Ireland | ❌ US | ⚠️ Optional | ❌ US |
| Enforcement timeline | ✅ Dynamic | N/A | ⚠️ Manual | N/A |
| SME fine calculator | ✅ | ❌ | ❌ | ❌ |
| Time to value | < 15 min | Weeks | Months | Months |

**Our moat**: We're the only product that gives an SMB a clear, audited, legally-accurate EU AI Act classification in 15 minutes, with auto-generated compliance templates at €99/month. Everyone else is enterprise-first, US-focused, and doesn't cover the AI Act.

---

## 12. Source Files

| File | Purpose | Status |
|------|---------|--------|
| `src/classification-engine.ts` | Core classification logic (v2, 15 fixes applied) | ✅ Complete |
| `src/wizard-questions.ts` | 11-step conversational wizard (v2) | ✅ Complete |
| `AUDIT_LOG.md` | 15-issue regulatory audit documentation | ✅ Complete |
| `PRODUCT_SPEC.md` | This document | ✅ Complete |

---

*Last updated: 25 February 2026*  
*Regulation source: Regulation (EU) 2024/1689 — https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689*  
*Audit status: 15/15 issues fixed — see AUDIT_LOG.md*
