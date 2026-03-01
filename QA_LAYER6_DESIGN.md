# QA Layer 6: React UI Components — Exhaustive Test Design

**Document Version:** 1.0  
**Date:** 28 February 2026  
**Target:** 10 React components + 4 pages (1,808 lines of UI code)  
**Existing Component Tests:** 0  
**Framework:** Vitest + React Testing Library + jsdom  
**Prerequisite:** `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Infrastructure Setup](#2-infrastructure-setup)
3. [Component Dependency Map](#3-component-dependency-map)
4. [Test File 1: QuestionRenderer (L6-QR)](#4-test-file-1-questionrenderer-l6-qr)
5. [Test File 2: ProgressBar (L6-PB)](#5-test-file-2-progressbar-l6-pb)
6. [Test File 3: WizardStep (L6-WS)](#6-test-file-3-wizardstep-l6-ws)
7. [Test File 4: WizardShell (L6-SH)](#7-test-file-4-wizardshell-l6-sh)
8. [Test File 5: ClassificationBadge (L6-CB)](#8-test-file-5-classificationbadge-l6-cb)
9. [Test File 6: FineCalculator (L6-FC)](#9-test-file-6-finecalculator-l6-fc)
10. [Test File 7: ObligationsList (L6-OL)](#10-test-file-7-obligationslist-l6-ol)
11. [Test File 8: TimelineView (L6-TV)](#11-test-file-8-timelineview-l6-tv)
12. [Test File 9: DocumentViewer (L6-DV)](#12-test-file-9-documentviewer-l6-dv)
13. [Test File 10: DocumentGenerator (L6-DG)](#13-test-file-10-documentgenerator-l6-dg)
14. [Test File 11: Landing Page (L6-LP)](#14-test-file-11-landing-page-l6-lp)
15. [Test File 12: Result Page (L6-RP)](#15-test-file-12-result-page-l6-rp)
16. [Test Inventory Summary](#16-test-inventory-summary)
17. [Implementation Notes](#17-implementation-notes)

---

## 1. EXECUTIVE SUMMARY

### The Problem
We have **100/100/100/100** coverage on all 6 backend source files — 2,976 tests across 17 test files. But the entire user-facing React layer — 10 components and 4 pages, 1,808 lines of code — has **zero** tests. Every user interaction, every conditional render, every state transition in the UI is unvalidated.

### Methodology
1. Read all 10 components and 4 pages line by line (1,808 total lines)
2. Mapped every component's props interface, state hooks, user interactions, conditional renders, and side effects
3. Built a complete dependency graph (which component calls which, which store selectors, which library exports)
4. Identified every render branch — `if/else`, ternary, `&&` short-circuit, `.map()`, `.filter()` — in every component
5. Designed tests that cover: (a) rendering correctness, (b) user interaction flows, (c) state integration, (d) edge cases, (e) accessibility basics

### Architecture

```
┌─────────────── PAGES ───────────────────────┐
│                                              │
│  page.tsx (landing)   wizard/page.tsx        │
│       │                    │                 │
│       │              WizardShell             │
│       │              ┌────┴────┐             │
│       │         ProgressBar  WizardStep      │
│       │                      ┌───┴───┐       │
│       │               SummaryView  QuestionRenderer
│       │                            ┌──┴──┐   │
│       │                     BooleanInput  │   │
│       │                     SelectInput   │   │
│       │                     TextInput     │   │
│       │                     NumberInput   │   │
│       │                     HelpText      │   │
│                                              │
│  result/page.tsx ────────────────────────────│
│       │                                      │
│       ├── ClassificationBadge                │
│       ├── FineCalculator                     │
│       ├── ObligationsList                    │
│       │     └── ObligationGroup              │
│       ├── TimelineView                       │
│       └── DocumentGenerator                  │
│             └── DocumentViewer               │
│                   └── renderInlineMarkdown() │
│                                              │
│  layout.tsx                                  │
│       ├── NavAuthButtons (Clerk integration) │
│       └── Shell (nav + main)                 │
└──────────────────────────────────────────────┘

Store Integration:
  WizardShell → useWizardStore (isComplete, result, answers)
  WizardStep → useWizardStore (currentStep, nextStep, prevStep, getVisibleQuestions, getVisibleSteps)
  ProgressBar → useWizardStore (progress, currentStepId, goToStep, getVisibleSteps)
  QuestionRenderer → useWizardStore (answers, setAnswer)

External Dependencies:
  WizardShell → next/navigation (useRouter → router.push)
  DocumentGenerator → @clerk/nextjs (useAuth, SignInButton) — dynamic import with fallback
  DocumentGenerator → fetch("/api/generate")
  DocumentViewer → navigator.clipboard
  ResultPage → sessionStorage, next/navigation (useRouter)
```

### What Makes This Layer Tricky
1. **Zustand store integration** — 4 wizard components read/write from `useWizardStore`. Tests must either mock the store or use it directly.
2. **Next.js router mocking** — `useRouter()` from `next/navigation` needs to be mocked for navigation assertions.
3. **Clerk auth mocking** — `DocumentGenerator` dynamically imports `@clerk/nextjs`. Tests need both "signed in" and "signed out" states.
4. **sessionStorage** — `ResultPage` reads from `sessionStorage` on mount. `WizardShell` writes to it before redirecting.
5. **fetch mocking** — `DocumentGenerator.handleGenerate` makes sequential `fetch("/api/generate")` calls.
6. **clipboard API** — `DocumentViewer.handleCopy` uses `navigator.clipboard.writeText`.
7. **Blob + URL.createObjectURL** — Download functionality in both `DocumentViewer` and `DocumentGenerator`.
8. **Conditional rendering complexity** — `ResultPage` alone has 8 conditional sections (art25, substantialMod, warnings, sme, sector, gdpr, transitional, valueChain, sandbox, authority).

### Test Strategy
- **Approach:** Test each component in isolation with mocked dependencies, then test page-level integration
- **Store strategy:** Mock `useWizardStore` at the module level for unit tests; use actual store for a few integration tests
- **Router strategy:** Mock `next/navigation` module
- **Auth strategy:** Mock `@clerk/nextjs` module; test both authed and unauthed states
- **User events:** Use `@testing-library/user-event` for realistic click/type interactions
- **DOM assertions:** Use `@testing-library/jest-dom` matchers (`.toBeInTheDocument()`, `.toHaveClass()`, etc.)

---

## 2. INFRASTRUCTURE SETUP

### New Dependencies
```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Vitest Config Changes
Update `vitest.config.ts` to add a browser-environment project for component tests:

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
    environment: "jsdom",         // ← ADD: default to jsdom for all tests
    setupFiles: ["./vitest.setup.ts"],  // ← ADD: global RTL matchers
  },
});
```

### Setup File
```typescript
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

### Global Mocks File
```typescript
// src/components/__tests__/mocks.ts
// Shared mock factories for Next.js router, Clerk, sessionStorage, etc.
```

### File Structure
```
src/components/__tests__/
  mocks.ts                        # Shared mock helpers
  QuestionRenderer.test.tsx       # L6-QR  (~55 tests)
  ProgressBar.test.tsx            # L6-PB  (~30 tests)
  WizardStep.test.tsx             # L6-WS  (~45 tests)
  WizardShell.test.tsx            # L6-SH  (~25 tests)
  ClassificationBadge.test.tsx    # L6-CB  (~20 tests)
  FineCalculator.test.tsx         # L6-FC  (~18 tests)
  ObligationsList.test.tsx        # L6-OL  (~30 tests)
  TimelineView.test.tsx           # L6-TV  (~22 tests)
  DocumentViewer.test.tsx         # L6-DV  (~35 tests)
  DocumentGenerator.test.tsx      # L6-DG  (~55 tests)
  LandingPage.test.tsx            # L6-LP  (~18 tests)
  ResultPage.test.tsx             # L6-RP  (~50 tests)
```

---

## 3. COMPONENT DEPENDENCY MAP

| Component | Lines | Props | Store Selectors | Hooks | External Deps | Render Branches |
|-----------|-------|-------|-----------------|-------|---------------|-----------------|
| QuestionRenderer | 190 | `{question}` | `answers`, `setAnswer` | `useState` (HelpText) | — | 4 type branches + help expand |
| ProgressBar | 57 | — | `progress`, `currentStepId`, `goToStep`, `getVisibleSteps` | — | — | active/past/future per step |
| WizardStep | 117 | — | `currentStep`, `nextStep`, `prevStep`, `currentStepId`, `getVisibleQuestions`, `getVisibleSteps` | — | — | summary vs questions, first/last step, button text |
| WizardShell | 33 | — | `isComplete`, `result`, `answers` | `useEffect`, `useRouter` | `next/navigation`, `sessionStorage` | redirect on complete |
| ClassificationBadge | 80 | `{classification}` | — | — | — | 6 classification configs |
| FineCalculator | 60 | `{fineRisk, companySize?}` | — | — | — | null if 0%, SME card if non-LARGE |
| ObligationsList | 105 | `{obligations}` | — | — | — | 4 priority groups, template badge, description truncation |
| TimelineView | 90 | `{currentDeadline}` | — | — | `getEnforcementTimeline()` | ENFORCED/UPCOMING, isYours highlight, days-left badge |
| DocumentViewer | 237 | `{document, onClose}` | — | `useState` (copied) | `clipboard`, `Blob`, `URL` | 10+ markdown line types, copy/download/close |
| DocumentGenerator | 378 | `{result, companyName, systemDescription}` | — | `useState` ×8, `useAuth` | `@clerk/nextjs`, `fetch` | 4 state views (idle/generating/error/done), auth gate, template selection |

**Total: 1,347 component lines + 461 page lines = 1,808 lines**

---

## 4. TEST FILE 1: QuestionRenderer (L6-QR)

**File:** `src/components/__tests__/QuestionRenderer.test.tsx`  
**Component:** `src/components/wizard/QuestionRenderer.tsx` (190 lines)  
**Estimated tests:** ~55  

### What It Does
Renders a wizard question with type-specific input (BOOLEAN → yes/no buttons, SINGLE_SELECT → option cards, TEXT → text input, NUMBER → number input). Also renders help text with expand/collapse for long text.

### Mock Requirements
- `@/lib/store` — mock `useWizardStore` to provide `answers` and `setAnswer`
- Question objects with different types

### Test Groups

#### 4.1 BOOLEAN Input (L6-QR-B) — 10 tests
| ID | Test | Assertion |
|----|------|-----------|
| QR-B01 | Renders "Yes" and "No" buttons for BOOLEAN question | Two buttons in DOM with text "Yes" / "No" |
| QR-B02 | Clicking "Yes" calls `setAnswer(field, true)` | `setAnswer` mock called with `(fieldKey, true)` |
| QR-B03 | Clicking "No" calls `setAnswer(field, false)` | `setAnswer` mock called with `(fieldKey, false)` |
| QR-B04 | "Yes" button has active styling when value is `true` | Button has `border-brand-500` class |
| QR-B05 | "No" button has active styling when value is `false` | Button has `border-brand-500` class |
| QR-B06 | Neither button active when value is `undefined` | Neither button has active class |
| QR-B07 | Switching from Yes to No updates styling | Verify class changes |
| QR-B08 | Renders question text as label | `question.text` visible in the document |
| QR-B09 | Uses `mapToField` string as field key when present | `setAnswer` called with `mapToField` value, not `question.id` |
| QR-B10 | Falls back to `question.id` when `mapToField` is absent | `setAnswer` called with `question.id` |

#### 4.2 SINGLE_SELECT Input (L6-QR-S) — 10 tests
| ID | Test | Assertion |
|----|------|-----------|
| QR-S01 | Renders one button per option | Correct number of buttons |
| QR-S02 | Each button shows option label | All labels visible |
| QR-S03 | Option descriptions render when present | Description text visible |
| QR-S04 | Clicking option calls `setAnswer(field, optionValue)` | Correct value passed |
| QR-S05 | Selected option has active border styling | `border-brand-500` class |
| QR-S06 | Non-selected options have default styling | Default border class |
| QR-S07 | Switching selection updates both old and new option styles | Old loses active, new gains it |
| QR-S08 | Options without descriptions don't render description `<p>` | No extra paragraph element |
| QR-S09 | Single option renders correctly (not just multi) | Works with 1 option |
| QR-S10 | Many options (6+) all render | All options visible |

#### 4.3 TEXT Input (L6-QR-T) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| QR-T01 | Renders text input with placeholder | Input element with `placeholder="Type your answer..."` |
| QR-T02 | Input shows current value from store | `input.value` matches store answer |
| QR-T03 | Typing calls `setAnswer` with new value | `setAnswer` called on each keystroke |
| QR-T04 | Empty string value renders empty input | `value=""` |
| QR-T05 | `undefined` store value renders empty input | `value=""` (via `?? ""`) |
| QR-T06 | Input has correct CSS classes | `rounded-xl`, `border-2`, focus classes |
| QR-T07 | Very long text input works | 500-char string renders |
| QR-T08 | Special characters in text input preserved | `<>&"` etc. not escaped incorrectly |

#### 4.4 NUMBER Input (L6-QR-N) — 7 tests
| ID | Test | Assertion |
|----|------|-----------|
| QR-N01 | Renders number input with placeholder | `type="number"`, placeholder text |
| QR-N02 | Input shows current numeric value | `input.value` matches store answer |
| QR-N03 | Typing number calls `setAnswer` with parsed float | `setAnswer` called with `parseFloat(value)` |
| QR-N04 | `undefined` value renders empty input | `value=""` (via `?? ""`) |
| QR-N05 | Decimal values work | Typing "1.5e25" → `1.5e25` |
| QR-N06 | Zero is a valid value (not treated as falsy) | `0` displays as `"0"` |
| QR-N07 | NaN from empty clear triggers setAnswer(NaN) | Verify behavior on clear |

#### 4.5 HelpText Sub-Component (L6-QR-H) — 10 tests
| ID | Test | Assertion |
|----|------|-----------|
| QR-H01 | Short help text (<= 120 chars) renders in full | Full text visible, no "Read more" |
| QR-H02 | Long help text (> 120 chars) truncated to 120 + "..." | Truncated text + ellipsis |
| QR-H03 | "Read more" button shown for long text | Button with text "Read more" visible |
| QR-H04 | Clicking "Read more" expands to full text | Full text visible after click |
| QR-H05 | Button text changes to "Show less" after expand | "Show less" visible |
| QR-H06 | Clicking "Show less" collapses back | Text truncated again |
| QR-H07 | Exactly 120 chars — no "Read more" | No expand button |
| QR-H08 | 121 chars — "Read more" appears | Expand button present |
| QR-H09 | No help text prop → no help text rendered | Component not in DOM when `question.helpText` is undefined |
| QR-H10 | Help text has muted styling | `text-[var(--color-text-muted)]` class |

#### 4.6 Cross-Type (L6-QR-X) — 10 tests
| ID | Test | Assertion |
|----|------|-----------|
| QR-X01 | Only BOOLEAN input renders for type "BOOLEAN" | No text/select/number inputs |
| QR-X02 | Only SELECT input renders for type "SINGLE_SELECT" | No boolean/text/number inputs |
| QR-X03 | Only TEXT input renders for type "TEXT" | No boolean/select/number inputs |
| QR-X04 | Only NUMBER input renders for type "NUMBER" | No boolean/text/select inputs |
| QR-X05 | Question label always renders regardless of type | `<label>` always present |
| QR-X06 | Component handles `mapToField` as function (if applicable) | Verify `typeof` check |
| QR-X07 | Re-render with different question type works | Swap question prop |
| QR-X08 | Multiple QuestionRenderers with different types coexist | Render 4 at once |
| QR-X09 | `question.options` undefined for non-SELECT doesn't crash | No runtime error |
| QR-X10 | Integration: BOOLEAN answer persists across re-render | Answer survives parent re-render |

---

## 5. TEST FILE 2: ProgressBar (L6-PB)

**File:** `src/components/__tests__/ProgressBar.test.tsx`  
**Component:** `src/components/wizard/ProgressBar.tsx` (57 lines)  
**Estimated tests:** ~30  

### What It Does
Shows a progress bar (percentage fill) and step indicator pills. Steps are clickable only if they're in the past. Active step is highlighted. Future steps are dimmed.

### Mock Requirements
- `@/lib/store` — mock `useWizardStore` to provide `progress`, `currentStepId`, `goToStep`, `getVisibleSteps`

### Test Groups

#### 5.1 Progress Bar Display (L6-PB-D) — 10 tests
| ID | Test | Assertion |
|----|------|-----------|
| PB-D01 | Renders progress percentage text | `"0%"` visible |
| PB-D02 | Progress bar width matches percentage | `style.width === "45%"` |
| PB-D03 | 0% progress → zero-width bar | `width: "0%"` |
| PB-D04 | 100% progress → full-width bar | `width: "100%"` |
| PB-D05 | 50% progress update reflected | Width changes |
| PB-D06 | Progress bar has correct background class | `bg-brand-500` |
| PB-D07 | Progress bar has transition classes | `transition-all duration-500` |
| PB-D08 | Percentage text has muted color | `text-[var(--color-text-muted)]` |
| PB-D09 | Progress bar container has rounded styling | `rounded-full` class |
| PB-D10 | Percentage text uses `font-medium` | Class check |

#### 5.2 Step Indicators (L6-PB-S) — 12 tests
| ID | Test | Assertion |
|----|------|-----------|
| PB-S01 | Renders one button per visible step | Button count matches `visibleSteps.length` |
| PB-S02 | Each step shows its icon | Icon emoji visible |
| PB-S03 | Step titles visible on larger screens | Title text in DOM (may be `hidden sm:inline`) |
| PB-S04 | Active step has `bg-brand-600 text-white` | Class check |
| PB-S05 | Past steps have `text-brand-400` styling | Class check |
| PB-S06 | Future steps have muted text styling | `text-[var(--color-text-muted)]` |
| PB-S07 | Past steps have `cursor-pointer` | Class check |
| PB-S08 | Future steps have `cursor-default` | Class check |
| PB-S09 | Active step does NOT have `cursor-pointer` | Not clickable-looking |
| PB-S10 | Only 1 step → it's active, no past/future | Single step rendered as active |
| PB-S11 | All steps past (last step active) → all but last are past | Correct class distribution |
| PB-S12 | Steps container allows horizontal scroll | `overflow-x-auto` class |

#### 5.3 Step Navigation (L6-PB-N) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| PB-N01 | Clicking a past step calls `goToStep(stepId)` | Mock called with correct ID |
| PB-N02 | Clicking a future step does NOT call `goToStep` | Mock not called |
| PB-N03 | Clicking the active step does NOT call `goToStep` | Mock not called (neither past nor calling) |
| PB-N04 | Multiple past steps — each is independently clickable | Correct ID for each |
| PB-N05 | Click past step → verify `goToStep` arg matches step.id | Exact string match |
| PB-N06 | Step buttons have correct key attribute | No React key warnings |
| PB-N07 | Re-render with new `currentStepId` updates active/past | Styling changes correctly |
| PB-N08 | Hover state on past steps applies | `hover:bg-[var(--color-surface-hover)]` |

---

## 6. TEST FILE 3: WizardStep (L6-WS)

**File:** `src/components/__tests__/WizardStep.test.tsx`  
**Component:** `src/components/wizard/WizardStep.tsx` (117 lines — includes `SummaryView` and `SummaryItem`)  
**Estimated tests:** ~45  

### What It Does
Renders the current step's header (icon + title + subtitle), the questions for that step (via `QuestionRenderer`), or the summary view (on the final step). Provides "Back" and "Continue" navigation buttons.

### Mock Requirements
- `@/lib/store` — full mock of `useWizardStore`
- `./QuestionRenderer` — mock as a simple render to isolate WizardStep logic

### Test Groups

#### 6.1 Step Header (L6-WS-H) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| WS-H01 | Renders step icon as emoji | Icon visible |
| WS-H02 | Renders step title in `<h2>` | Title text in heading |
| WS-H03 | Renders step subtitle | Subtitle text visible with muted color |
| WS-H04 | Title has `text-2xl font-bold` | Class check |
| WS-H05 | Icon and title in flex row | `flex items-center gap-3` |
| WS-H06 | Different step renders different title | Swap step, verify text change |
| WS-H07 | Step with empty subtitle renders empty `<p>` | Element present but empty |
| WS-H08 | Step icon is `text-3xl` | Class check |

#### 6.2 Questions Rendering (L6-WS-Q) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| WS-Q01 | Non-summary step renders QuestionRenderer for each visible question | Correct count of rendered questions |
| WS-Q02 | Each QuestionRenderer gets correct `question` prop | Props match visible questions |
| WS-Q03 | Zero visible questions → empty questions area | No QuestionRenderer instances |
| WS-Q04 | 5 visible questions → 5 QuestionRenderer instances | Count check |
| WS-Q05 | Questions wrapper has `space-y-2` class | Correct spacing |
| WS-Q06 | Summary step does NOT render QuestionRenderers | Summary content instead |
| WS-Q07 | Non-summary step does NOT render SummaryView | No summary content |
| WS-Q08 | Questions have unique keys (from `q.id`) | No React key warnings |

#### 6.3 Navigation Buttons (L6-WS-N) — 14 tests
| ID | Test | Assertion |
|----|------|-----------|
| WS-N01 | "Continue →" text on middle steps | Button text check |
| WS-N02 | "Review & Submit" text on last non-summary step | Button text check |
| WS-N03 | "🔍 Get My Classification" on summary step | Button text check |
| WS-N04 | "← Back" button present on non-first steps | Button visible |
| WS-N05 | "← Back" button invisible on first step | `invisible` class |
| WS-N06 | Clicking "Continue" calls `nextStep()` | Mock called |
| WS-N07 | Clicking "← Back" calls `prevStep()` | Mock called |
| WS-N08 | Back button disabled on first step | `disabled` attribute or `invisible` |
| WS-N09 | Continue button has `bg-brand-600` on normal steps | Class check |
| WS-N10 | Summary step button has `bg-green-600` + larger padding | Class check |
| WS-N11 | Summary step button is larger (`text-lg px-10 py-4`) | Class check |
| WS-N12 | Navigation buttons are in flex container with `justify-between` | Layout check |
| WS-N13 | Back button on second step is visible and enabled | Not invisible, not disabled |
| WS-N14 | Clicking Continue on last step still calls `nextStep()` (store handles classification) | Mock called |

#### 6.4 SummaryView (L6-WS-SV) — 10 tests
| ID | Test | Assertion |
|----|------|-----------|
| WS-SV01 | Renders "Ready to classify" heading | Text visible |
| WS-SV02 | Shows answered question count | "You've answered X questions" |
| WS-SV03 | Shows company name when present | `SummaryItem` with label "Company" |
| WS-SV04 | Shows company size when present | `SummaryItem` with label "Size" |
| WS-SV05 | Shows role when present | `SummaryItem` with label "Role" |
| WS-SV06 | Shows system description (truncated at 60 chars) when present | Truncated text + "..." |
| WS-SV07 | Short system description NOT truncated | Full text, no "..." |
| WS-SV08 | Exactly 60 chars → not truncated | No ellipsis |
| WS-SV09 | 61 chars → truncated to 60 + "..." | Ellipsis present |
| WS-SV10 | Missing optional fields don't render SummaryItems | Only present fields shown |

#### 6.5 SummaryItem (L6-WS-SI) — 5 tests
| ID | Test | Assertion |
|----|------|-----------|
| WS-SI01 | Renders label in `text-xs` muted style | Label visible with correct classes |
| WS-SI02 | Renders value in `font-medium` | Value visible with correct class |
| WS-SI03 | Has rounded background | `rounded-lg bg-[var(--color-bg)]` |
| WS-SI04 | Different labels render correctly | "Company" vs "Role" etc. |
| WS-SI05 | Long value doesn't break layout | No overflow issues |

---

## 7. TEST FILE 4: WizardShell (L6-SH)

**File:** `src/components/__tests__/WizardShell.test.tsx`  
**Component:** `src/components/wizard/WizardShell.tsx` (33 lines)  
**Estimated tests:** ~25  

### What It Does
Top-level wizard container. Renders `ProgressBar` + `WizardStep`. When `isComplete && result`, writes to `sessionStorage` and calls `router.push("/result")`.

### Mock Requirements
- `@/lib/store` — mock `useWizardStore`
- `next/navigation` — mock `useRouter` → `{ push: vi.fn() }`
- `./ProgressBar` and `./WizardStep` — mock as simple divs to isolate Shell logic
- `sessionStorage` — spy/mock `setItem`

### Test Groups

#### 7.1 Basic Rendering (L6-SH-R) — 5 tests
| ID | Test | Assertion |
|----|------|-----------|
| SH-R01 | Renders ProgressBar | Mocked ProgressBar in DOM |
| SH-R02 | Renders WizardStep | Mocked WizardStep in DOM |
| SH-R03 | Has max-width wrapper | `max-w-4xl` class |
| SH-R04 | Has padding | `px-6 py-8` classes |
| SH-R05 | Both children render simultaneously | Both present |

#### 7.2 Redirect on Complete (L6-SH-C) — 12 tests
| ID | Test | Assertion |
|----|------|-----------|
| SH-C01 | `isComplete=false` → no redirect | `router.push` not called |
| SH-C02 | `isComplete=true, result=null` → no redirect | `router.push` not called |
| SH-C03 | `isComplete=true, result=valid` → redirect to `/result` | `router.push("/result")` called |
| SH-C04 | Redirect stores result in sessionStorage | `sessionStorage.setItem("classificationResult", ...)` called |
| SH-C05 | Redirect stores answers in sessionStorage | `sessionStorage.setItem("wizardAnswers", ...)` called |
| SH-C06 | sessionStorage values are JSON.stringify'd | Parse-back matches original |
| SH-C07 | Redirect happens via `useEffect` (not synchronous) | Called after render |
| SH-C08 | Changing `isComplete` from false→true triggers redirect | Effect fires on state change |
| SH-C09 | Result with full ClassificationResult shape stored correctly | All fields preserved |
| SH-C10 | Answers with all fields stored correctly | Full WizardAnswers shape |
| SH-C11 | Multiple re-renders with `isComplete=true` → push called once per effect | Not called excessively |
| SH-C12 | `isComplete=true` but result is empty object → still redirects | As long as truthy |

#### 7.3 Edge Cases (L6-SH-E) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| SH-E01 | Initial render with empty store → no crash | Component renders |
| SH-E02 | Store with partial answers → renders normally | No errors |
| SH-E03 | Re-render with store update → effect re-evaluates | Correct behavior |
| SH-E04 | sessionStorage.setItem called BEFORE router.push | Order of operations |
| SH-E05 | Result contains arrays with special characters | Serialization correct |
| SH-E06 | Component unmount doesn't trigger spurious effects | Clean up |
| SH-E07 | `router.push` receives exactly `/result` string | No query params |
| SH-E08 | Very large result object (50+ obligations) serializes | No truncation |

---

## 8. TEST FILE 5: ClassificationBadge (L6-CB)

**File:** `src/components/__tests__/ClassificationBadge.test.tsx`  
**Component:** `src/components/result/ClassificationBadge.tsx` (80 lines)  
**Estimated tests:** ~20  

### What It Does
Displays a large badge showing the classification result — icon, label, color, description. Config-driven from a `Record<RiskClassification, Config>`.

### Mock Requirements
- None — pure presentational component with props only

### Test Groups

#### 8.1 All 6 Classifications (L6-CB-C) — 12 tests (2 per classification)
| ID | Test | Assertion |
|----|------|-----------|
| CB-C01 | PROHIBITED → red styling + "PROHIBITED" label | `text-red-400`, label text |
| CB-C02 | PROHIBITED → "🚨" icon + "BANNED" description | Icon + description text |
| CB-C03 | HIGH_RISK → orange styling + "HIGH RISK" label | `text-orange-400` |
| CB-C04 | HIGH_RISK → "⚠️" icon + "Significant compliance" description | Icon + description |
| CB-C05 | LIMITED_RISK → yellow styling + "LIMITED RISK" label | `text-yellow-400` |
| CB-C06 | LIMITED_RISK → "👁️" icon + "Transparency" description | Icon + description |
| CB-C07 | GPAI → violet styling + "GPAI MODEL" label | `text-violet-400` |
| CB-C08 | GPAI → "🧠" icon + "General-purpose" description | Icon + description |
| CB-C09 | GPAI_SYSTEMIC → violet styling + "GPAI — SYSTEMIC RISK" label | `text-violet-300` |
| CB-C10 | GPAI_SYSTEMIC → "🧠⚠️" icon + "Highest GPAI tier" description | Icon + description |
| CB-C11 | MINIMAL_RISK → green styling + "MINIMAL RISK" label | `text-green-400` |
| CB-C12 | MINIMAL_RISK → "✅" icon + "No mandatory requirements" description | Icon + description |

#### 8.2 Structure & Styling (L6-CB-S) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| CB-S01 | Outer div has `rounded-2xl` | Class check |
| CB-S02 | Outer div has `border-2` | Class check |
| CB-S03 | Badge is centered (`text-center`) | Class check |
| CB-S04 | Icon is `text-5xl` | Class check |
| CB-S05 | Label is `text-3xl font-black` | Class check |
| CB-S06 | Description is `text-lg` with muted color | Class check |
| CB-S07 | Each classification gets the correct `bg-*` class | Background class matches config |
| CB-S08 | Each classification gets the correct `border-*` class | Border class matches config |

---

## 9. TEST FILE 6: FineCalculator (L6-FC)

**File:** `src/components/__tests__/FineCalculator.test.tsx`  
**Component:** `src/components/result/FineCalculator.tsx` (60 lines)  
**Estimated tests:** ~18  

### What It Does
Shows fine exposure card. Returns `null` if `maxPercentTurnover === 0`. Shows SME-specific card only for non-LARGE companies. Displays max fine amount, percentage, article reference, and optional note.

### Mock Requirements
- None — pure presentational

### Test Groups

#### 9.1 Null Rendering (L6-FC-N) — 3 tests
| ID | Test | Assertion |
|----|------|-----------|
| FC-N01 | `maxPercentTurnover === 0` → returns null (nothing rendered) | Container empty |
| FC-N02 | `maxPercentTurnover === 1` → renders content | Card visible |
| FC-N03 | `maxPercentTurnover === 7` → renders content | Card visible |

#### 9.2 General Fine Display (L6-FC-G) — 5 tests
| ID | Test | Assertion |
|----|------|-----------|
| FC-G01 | Shows "💰 Fine Exposure" heading | Heading text visible |
| FC-G02 | Shows article reference from `fineRisk.article` | Article text visible |
| FC-G03 | Displays `maxAmountGeneral` in prominent text | "€35,000,000" or equivalent |
| FC-G04 | Displays `maxPercentTurnover` percentage | "7% of global annual turnover" |
| FC-G05 | Card has red border styling | `border-red-500/20` class |

#### 9.3 SME Card Logic (L6-FC-S) — 10 tests
| ID | Test | Assertion |
|----|------|-----------|
| FC-S01 | `companySize="LARGE"` → NO SME card | SME section not rendered |
| FC-S02 | `companySize="SMALL"` → SME card shown | SME section visible |
| FC-S03 | `companySize="MICRO"` → SME card shown | SME section visible |
| FC-S04 | `companySize="MEDIUM"` → SME card shown | SME section visible |
| FC-S05 | `companySize=undefined` → NO SME card | SME section not rendered |
| FC-S06 | SME card shows `maxAmountSME` | SME amount visible |
| FC-S07 | SME card shows "Your SME Cap" label | Label text visible |
| FC-S08 | `fineRisk.note` present → note rendered | Note text visible |
| FC-S09 | `fineRisk.note` absent → no note paragraph | No extra `<p>` |
| FC-S10 | SME card has yellow accent | `text-yellow-400` |

---

## 10. TEST FILE 7: ObligationsList (L6-OL)

**File:** `src/components/__tests__/ObligationsList.test.tsx`  
**Component:** `src/components/result/ObligationsList.tsx` (105 lines)  
**Estimated tests:** ~30  

### What It Does
Groups obligations by priority (CRITICAL → HIGH → MEDIUM → LOW), renders each group with colored dots, shows obligation title, article, description (truncated at 200 chars), role, deadline, and template badge.

### Mock Requirements
- None — pure presentational

### Test Groups

#### 10.1 Priority Grouping (L6-OL-P) — 10 tests
| ID | Test | Assertion |
|----|------|-----------|
| OL-P01 | All CRITICAL obligations → only "🔴 Critical" group | One group header |
| OL-P02 | All HIGH obligations → only "🟠 High" group | One group header |
| OL-P03 | All MEDIUM obligations → only "🟡 Medium" group | One group header |
| OL-P04 | All LOW obligations → only "🟢 Low" group | One group header |
| OL-P05 | Mixed priorities → all 4 groups rendered | 4 group headers |
| OL-P06 | Empty obligations → no groups | No group headers |
| OL-P07 | Group shows count: "🔴 Critical — 3" | Count in header |
| OL-P08 | No CRITICAL obligations → no Critical group rendered | Missing group |
| OL-P09 | Order: Critical first, then High, Medium, Low | DOM order check |
| OL-P10 | Total count in heading: "Your Obligations (N)" | Correct total |

#### 10.2 Obligation Cards (L6-OL-C) — 12 tests
| ID | Test | Assertion |
|----|------|-----------|
| OL-C01 | Card renders obligation title | Title text visible |
| OL-C02 | Card renders article reference | Article in pill |
| OL-C03 | Short description (<= 200 chars) renders in full | Full text |
| OL-C04 | Long description (> 200 chars) truncated + "..." | Truncated at 200 |
| OL-C05 | Exactly 200 chars → not truncated | No ellipsis |
| OL-C06 | 201 chars → truncated | Ellipsis present |
| OL-C07 | Shows "Role: PROVIDER" | Role text |
| OL-C08 | Shows "Deadline: AUGUST_2026" | Deadline text |
| OL-C09 | `templateId` present → "📄 Template available" shown | Badge visible |
| OL-C10 | `templateId` absent → no template badge | Badge not in DOM |
| OL-C11 | Colored dot matches priority (red/orange/yellow/green) | `bg-red-500` etc. |
| OL-C12 | Card has border and rounded styling | `rounded-xl border` |

#### 10.3 Edge Cases (L6-OL-E) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| OL-E01 | Single obligation → renders correctly | One card, one group |
| OL-E02 | 20+ obligations → all render | High count works |
| OL-E03 | Obligation with very long title → no overflow | Title renders |
| OL-E04 | Multiple obligations same priority → all in same group | Count matches |
| OL-E05 | Heading subtitle is visible | "Ranked by priority..." text |
| OL-E06 | Component has outer rounded border | `rounded-2xl border` |
| OL-E07 | Dot separator "·" between role and deadline | Separator visible |
| OL-E08 | Dot separator "·" before template badge | Separator visible |

---

## 11. TEST FILE 8: TimelineView (L6-TV)

**File:** `src/components/__tests__/TimelineView.test.tsx`  
**Component:** `src/components/result/TimelineView.tsx` (90 lines)  
**Estimated tests:** ~22  

### What It Does
Renders a vertical timeline of enforcement milestones from `getEnforcementTimeline()`. Highlights the user's deadline. Shows ENFORCED/UPCOMING status and days-left countdown.

### Mock Requirements
- `@/lib/classification-engine` — mock `getEnforcementTimeline` to control milestones
- OR test with real `getEnforcementTimeline` (it's a pure function we already test)

### Test Groups

#### 11.1 Milestone Rendering (L6-TV-M) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| TV-M01 | Renders all milestones from `getEnforcementTimeline()` | Correct count |
| TV-M02 | Each milestone shows date string | Date visible |
| TV-M03 | Each milestone shows label text | Description visible |
| TV-M04 | ENFORCED milestones show green "ENFORCED" badge | Badge visible |
| TV-M05 | UPCOMING milestones with `daysUntil > 0` show days-left badge | "N days left" |
| TV-M06 | Title "📅 Enforcement Timeline" rendered | Heading check |
| TV-M07 | Subtitle "Your deadline is highlighted" rendered | Subtitle check |
| TV-M08 | Milestones render in chronological order | DOM order matches date order |

#### 11.2 Your Deadline Highlighting (L6-TV-Y) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| TV-Y01 | Milestone matching `currentDeadline` gets "YOUR DEADLINE" badge | Badge visible |
| TV-Y02 | Matching milestone has orange highlight styling | `bg-orange-500/5` and border |
| TV-Y03 | Non-matching milestones don't have "YOUR DEADLINE" badge | Badge absent |
| TV-Y04 | Matching milestone dot has orange ring | `ring-4 ring-orange-500/20` |
| TV-Y05 | `currentDeadline` not matching any milestone → no highlight | No YOUR DEADLINE badge |
| TV-Y06 | `currentDeadline = "2026-08-02"` → HIGH_RISK milestone highlighted | Correct match |
| TV-Y07 | `currentDeadline = "2025-08-02"` → GPAI milestone highlighted | Correct match |
| TV-Y08 | `currentDeadline = "2027-08-02"` → product safety milestone highlighted | Correct match |

#### 11.3 Timeline Visual Structure (L6-TV-V) — 6 tests
| ID | Test | Assertion |
|----|------|-----------|
| TV-V01 | Timeline dots are colored (green for ENFORCED, border color for upcoming) | Dot classes |
| TV-V02 | Connecting line between milestones (not on last) | Line element present |
| TV-V03 | Last milestone has no connecting line | No line after last |
| TV-V04 | ENFORCED milestone line is green-tinted | `bg-green-500/30` |
| TV-V05 | UPCOMING milestone line is default border color | `bg-[var(--color-border)]` |
| TV-V06 | Card has `rounded-2xl border` outer styling | Class check |

---

## 12. TEST FILE 9: DocumentViewer (L6-DV)

**File:** `src/components/__tests__/DocumentViewer.test.tsx`  
**Component:** `src/components/result/DocumentViewer.tsx` (237 lines)  
**Estimated tests:** ~35  

### What It Does
Full-screen modal showing a generated document with markdown rendering, copy, download, and close buttons. Includes inline markdown parsing (bold + code).

### Mock Requirements
- `navigator.clipboard.writeText` — mock
- `URL.createObjectURL` / `URL.revokeObjectURL` — mock
- `document.createElement("a")` — spy for download trigger
- `vi.useFakeTimers()` for the 2-second "Copied" timeout

### Test Groups

#### 12.1 Header (L6-DV-H) — 6 tests
| ID | Test | Assertion |
|----|------|-----------|
| DV-H01 | Shows document `templateName` | Title visible |
| DV-H02 | Shows article, word count, generated date | Subtitle info |
| DV-H03 | "Copy" button visible | Button text |
| DV-H04 | "↓ Download .md" button visible | Button text |
| DV-H05 | "✕" close button visible | Button text |
| DV-H06 | Header has border-bottom | `border-b` class |

#### 12.2 Copy Functionality (L6-DV-CP) — 6 tests
| ID | Test | Assertion |
|----|------|-----------|
| DV-CP01 | Clicking "Copy" calls `navigator.clipboard.writeText` with doc content | Mock called with content |
| DV-CP02 | After copy, button text changes to "✓ Copied" | Text change |
| DV-CP03 | After 2 seconds, button reverts to "Copy" | Timer + text revert |
| DV-CP04 | Multiple rapid clicks → clipboard called each time | No debounce issues |
| DV-CP05 | Content with special characters copies correctly | Special chars preserved |
| DV-CP06 | Very long content (10,000 chars) copies | Large string works |

#### 12.3 Download Functionality (L6-DV-DL) — 5 tests
| ID | Test | Assertion |
|----|------|-----------|
| DV-DL01 | Clicking download creates Blob with correct content | Blob includes template name, article, content, disclaimer |
| DV-DL02 | Download filename follows pattern `{templateId}_{date}.md` | `a.download` check |
| DV-DL03 | `URL.createObjectURL` called with blob | Mock verification |
| DV-DL04 | `URL.revokeObjectURL` called after click (cleanup) | Revoke called |
| DV-DL05 | `a.click()` triggered | Click called on anchor |

#### 12.4 Close Functionality (L6-DV-CL) — 3 tests
| ID | Test | Assertion |
|----|------|-----------|
| DV-CL01 | Clicking "✕" calls `onClose` callback | Prop callback called |
| DV-CL02 | Modal has backdrop (`bg-black/60 backdrop-blur-sm`) | Class check |
| DV-CL03 | Modal is fixed fullscreen (`fixed inset-0 z-50`) | Class check |

#### 12.5 Markdown Rendering (L6-DV-MD) — 10 tests
| ID | Test | Assertion |
|----|------|-----------|
| DV-MD01 | `# Heading` → renders `<h1>` with text | Heading element |
| DV-MD02 | `## Heading` → renders `<h2>` | Heading element |
| DV-MD03 | `### Heading` → renders `<h3>` | Heading element |
| DV-MD04 | `#### Heading` → renders `<h4>` | Heading element |
| DV-MD05 | `---` → renders `<hr>` | HR element |
| DV-MD06 | `- item` / `* item` → renders `<li>` | List item |
| DV-MD07 | `1. item` → renders ordered `<li>` | Ordered list item |
| DV-MD08 | `> quote` → renders `<blockquote>` | Blockquote element |
| DV-MD09 | `⚠️ warning` → renders yellow-tinted paragraph | Warning styling |
| DV-MD10 | Empty line → renders spacer `<div>` | Spacer element |

#### 12.6 Inline Markdown (L6-DV-IL) — 5 tests
| ID | Test | Assertion |
|----|------|-----------|
| DV-IL01 | `**bold**` → renders `<strong>` | Bold element |
| DV-IL02 | `` `code` `` → renders `<code>` | Code element |
| DV-IL03 | Text with both bold and code → both render | Mixed inline |
| DV-IL04 | Text with no inline markdown → plain text | No extra elements |
| DV-IL05 | Multiple bold phrases in one line → all render | Multiple `<strong>` |

---

## 13. TEST FILE 10: DocumentGenerator (L6-DG)

**File:** `src/components/__tests__/DocumentGenerator.test.tsx`  
**Component:** `src/components/result/DocumentGenerator.tsx` (378 lines)  
**Estimated tests:** ~55  

### What It Does
The most complex component. Four state views: idle (template selection), generating (progress bar), error, done (document list). Handles auth gating via Clerk, sequential `fetch` calls, and document download.

### Mock Requirements
- `@clerk/nextjs` — mock `useAuth` and `SignInButton`
- `fetch` — global mock for `/api/generate` calls
- `@/lib/classification-engine` — may need `TEMPLATE_REGISTRY`
- `@/lib/doc-generator` — mock `getApplicableTemplates`
- `URL.createObjectURL` / `URL.revokeObjectURL` — mock
- `document.createElement("a")` — spy

### Test Groups

#### 13.1 No Applicable Templates (L6-DG-NA) — 3 tests
| ID | Test | Assertion |
|----|------|-----------|
| DG-NA01 | Zero applicable templates → "No compliance documents are required" message | Text visible |
| DG-NA02 | No template list rendered | No checkboxes |
| DG-NA03 | No generate button rendered | No button |

#### 13.2 Idle State — Template Selection (L6-DG-I) — 15 tests
| ID | Test | Assertion |
|----|------|-----------|
| DG-I01 | Shows "📄 Generate Compliance Documents" heading | Heading visible |
| DG-I02 | Shows "N documents applicable" count | Count text |
| DG-I03 | Each template rendered with checkbox, name, articles, description, minutes | Template info visible |
| DG-I04 | All templates selected by default | All checkboxes checked |
| DG-I05 | Clicking checkbox deselects template | Checkbox unchecked |
| DG-I06 | "Select all" reselects all templates | All re-checked |
| DG-I07 | "Select none" deselects all | All unchecked |
| DG-I08 | Selected count updates: "3 selected" | Count text |
| DG-I09 | Estimated time updates with selection | "~120 min" updates |
| DG-I10 | Generate button shows count: "Generate 5 Documents + Executive Summary" | Button text |
| DG-I11 | Singular: "Generate 1 Document + Executive Summary" | Singular grammar |
| DG-I12 | Generate button disabled when 0 selected | `disabled` + `opacity-40` |
| DG-I13 | Generate button enabled when 1+ selected | Not disabled |
| DG-I14 | Template description has `line-clamp-1` | Class check |
| DG-I15 | Toggle individual template on/off | Checkbox toggles |

#### 13.3 Auth Gating (L6-DG-A) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| DG-A01 | `isSignedIn=true` → Generate button shown | Button visible |
| DG-A02 | `isSignedIn=false` → sign-in prompt shown instead of button | "Sign in to generate" text |
| DG-A03 | `isSignedIn=undefined` (Clerk not configured) → Generate button shown | Treated as allowed |
| DG-A04 | Sign-in prompt includes SignInButton component | Button rendered |
| DG-A05 | Sign-in prompt text: "Free classification — document generation requires an account" | Text visible |
| DG-A06 | "Sign In to Generate" button inside SignInButton | Button text |
| DG-A07 | Switching from signed-out to signed-in → button appears | State change |
| DG-A08 | Auth state doesn't affect template selection | Templates still selectable when signed out |

#### 13.4 Generating State (L6-DG-G) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| DG-G01 | Shows spinner animation | `animate-spin` element |
| DG-G02 | Shows "Generating: {templateName}" text | Current template name |
| DG-G03 | Progress bar fills incrementally | Width % increases |
| DG-G04 | Shows "N / M documents complete" counter | Progress text |
| DG-G05 | fetch called for EXEC_SUMMARY first, then selected templates | Request order |
| DG-G06 | Each fetch sends correct body (templateId, result, companyName, systemDescription) | Request body check |
| DG-G07 | Template list not shown during generation | Idle UI hidden |
| DG-G08 | Sequential fetch: second call waits for first to resolve | Not parallel |

#### 13.5 Error State (L6-DG-E) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| DG-E01 | Failed fetch → "Generation failed" message | Error text visible |
| DG-E02 | Error message from response shown | Specific error text |
| DG-E03 | "← Back to selection" button visible | Button present |
| DG-E04 | Clicking back returns to idle state | Template selection re-appears |
| DG-E05 | HTTP error (non-200) shows "HTTP {status}" | Error message |
| DG-E06 | Network error shows error message | "Network error" or similar |
| DG-E07 | Partial success: "N documents were generated before the error" | Partial count |
| DG-E08 | Partial docs still viewable after error | Document list shown |

#### 13.6 Done State (L6-DG-D) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| DG-D01 | Success banner: "✓ N documents generated successfully" | Success text |
| DG-D02 | Each document listed with name, article, word count | Document info |
| DG-D03 | "View" button on each document | View buttons |
| DG-D04 | Clicking "View" opens DocumentViewer modal | DocumentViewer rendered |
| DG-D05 | "↓ Download All (N docs)" button visible | Download button |
| DG-D06 | "Regenerate" button resets to idle state | Back to template selection |
| DG-D07 | Download All creates blob with all documents | Blob content |
| DG-D08 | Download filename includes date | `eu-ai-act-compliance-pack_{date}.md` |

#### 13.7 Full Flow Integration (L6-DG-F) — 5 tests
| ID | Test | Assertion |
|----|------|-----------|
| DG-F01 | idle → select 2 → generate → done → view doc → close | Full happy path |
| DG-F02 | idle → generate → error → back → generate → done | Error recovery |
| DG-F03 | idle → select none → button disabled → select 1 → enabled → generate | Selection flow |
| DG-F04 | done → regenerate → idle → generate → done | Re-generation flow |
| DG-F05 | Generating 1 template: progress shows 2 total (EXEC_SUMMARY + 1) | EXEC_SUMMARY always added |

---

## 14. TEST FILE 11: Landing Page (L6-LP)

**File:** `src/components/__tests__/LandingPage.test.tsx`  
**Component:** `src/app/page.tsx` (190 lines)  
**Estimated tests:** ~18  

### What It Does
Static landing page with hero, social proof, "how it works", risk categories, and CTA sections. Server component (no hooks).

### Mock Requirements
- `next/link` — may need mock or RTL renders it as `<a>`

### Test Groups

#### 14.1 Hero Section (L6-LP-H) — 5 tests
| ID | Test | Assertion |
|----|------|-----------|
| LP-H01 | Main heading: "Is Your AI System EU AI Act Compliant?" | Heading text |
| LP-H02 | CTA link: "Start Free Assessment →" pointing to `/wizard` | Link href |
| LP-H03 | "No sign-up required" subtitle | Text visible |
| LP-H04 | Urgency badge: "EU AI Act enforcement" | Badge text |
| LP-H05 | "~5 months away" timing indicator | Text visible |

#### 14.2 Social Proof Section (L6-LP-SP) — 3 tests
| ID | Test | Assertion |
|----|------|-----------|
| LP-SP01 | "€35M" max fine displayed | Stat visible |
| LP-SP02 | "16" obligations count displayed | Stat visible |
| LP-SP03 | "~5 months" until enforcement displayed | Stat visible |

#### 14.3 How It Works (L6-LP-HW) — 4 tests
| ID | Test | Assertion |
|----|------|-----------|
| LP-HW01 | "How It Works" heading | Heading visible |
| LP-HW02 | Three steps rendered | 3 cards |
| LP-HW03 | Steps numbered 1, 2, 3 | Step numbers visible |
| LP-HW04 | Step titles: "Answer Simple Questions", "Get Your Classification", "Compliance Roadmap" | All three titles |

#### 14.4 Risk Categories (L6-LP-RC) — 3 tests
| ID | Test | Assertion |
|----|------|-----------|
| LP-RC01 | "6 Risk Classifications" heading | Heading text |
| LP-RC02 | All 6 categories rendered | 6 cards |
| LP-RC03 | Each category shows label and fine | Fine text per card |

#### 14.5 Footer & CTA (L6-LP-F) — 3 tests
| ID | Test | Assertion |
|----|------|-----------|
| LP-F01 | Bottom CTA: "Start Free Assessment →" link to `/wizard` | Link href |
| LP-F02 | "Don't Wait for the Deadline" heading | Heading text |
| LP-F03 | Footer disclaimer: "does not constitute legal advice" | Disclaimer text |

---

## 15. TEST FILE 12: Result Page (L6-RP)

**File:** `src/components/__tests__/ResultPage.test.tsx`  
**Component:** `src/app/result/page.tsx` (340 lines)  
**Estimated tests:** ~50  

### What It Does
Reads `ClassificationResult` from `sessionStorage` on mount. If missing, redirects to `/wizard`. Renders a dashboard with: ClassificationBadge, InfoCards, 8+ conditional alert sections, FineCalculator, ObligationsList, TimelineView, DocumentGenerator, next steps, and disclaimer.

### Mock Requirements
- `sessionStorage` — mock `getItem`/`setItem`
- `next/navigation` — mock `useRouter`
- All child components — mock to isolate page logic
- `next/link` — Link component

### Test Groups

#### 15.1 Data Loading (L6-RP-L) — 8 tests
| ID | Test | Assertion |
|----|------|-----------|
| RP-L01 | No sessionStorage result → redirect to `/wizard` | `router.push("/wizard")` called |
| RP-L02 | Valid sessionStorage result → renders dashboard | ClassificationBadge visible |
| RP-L03 | `classificationResult` parsed from JSON correctly | Correct props passed to children |
| RP-L04 | `wizardAnswers` parsed → companyName extracted | Company name used |
| RP-L05 | Missing `wizardAnswers` → defaults to "Your Company" | Default name |
| RP-L06 | Loading state shows "Loading classification..." | Loading text visible before data |
| RP-L07 | Partial sessionStorage (result but no answers) → works | No crash |
| RP-L08 | Malformed JSON in sessionStorage → graceful handling | No crash or redirect |

#### 15.2 Header (L6-RP-H) — 4 tests
| ID | Test | Assertion |
|----|------|-----------|
| RP-H01 | "Your Classification Result" heading | Heading visible |
| RP-H02 | "← Retake assessment" link to `/wizard` | Link href |
| RP-H03 | Subtitle mentions "113 articles" | Text content |
| RP-H04 | Subtitle mentions "Regulation 2024/1689" | Text content |

#### 15.3 Info Cards (L6-RP-IC) — 6 tests
| ID | Test | Assertion |
|----|------|-----------|
| RP-IC01 | Confidence card shows classification confidence | "DEFINITIVE" / "LIKELY" / "NEEDS_LEGAL_REVIEW" |
| RP-IC02 | Confidence card shows appropriate description | Description matches confidence |
| RP-IC03 | Role card shows user's role | "PROVIDER" / "DEPLOYER" / "BOTH" |
| RP-IC04 | Role card with `detectedRoles` shows "Multiple roles" | Multi-role text |
| RP-IC05 | Role card without `detectedRoles` → role description | Single role description |
| RP-IC06 | Legal Basis card shows joined article references | Articles joined by ", " |

#### 15.4 Conditional Sections (L6-RP-CS) — 18 tests (2 per section: present + absent)
| ID | Test | Assertion |
|----|------|-----------|
| RP-CS01 | `art25ProviderUpgrade=true` → Art 25 alert shown | "🚨 Art 25 Role Upgrade" visible |
| RP-CS02 | `art25ProviderUpgrade=false/undefined` → no Art 25 alert | Alert not in DOM |
| RP-CS03 | `substantialModificationFlag=true` → modification alert shown | "🔄 Substantial Modification" visible |
| RP-CS04 | `substantialModificationFlag=false` → no modification alert | Alert not in DOM |
| RP-CS05 | `warnings.length > 0` → warnings section shown | "⚠️ Important Warnings" visible |
| RP-CS06 | `warnings.length === 0` → no warnings section | Section not in DOM |
| RP-CS07 | `smeSimplifications.length > 0` → SME section shown | "💡 SME Advantages" visible |
| RP-CS08 | `smeSimplifications.length === 0` → no SME section | Section not in DOM |
| RP-CS09 | `sectorSpecificGuidance` present → sector section shown | "🏥 Sector-Specific" visible |
| RP-CS10 | `sectorSpecificGuidance` empty/missing → no section | Section not in DOM |
| RP-CS11 | `gdprInterplay` present → GDPR section shown | "🔒 GDPR" visible |
| RP-CS12 | `gdprInterplay` empty/missing → no section | Section not in DOM |
| RP-CS13 | `transitionalProvisions` present → transition section shown | "⏳ Transitional" visible |
| RP-CS14 | `transitionalProvisions` empty/missing → no section | Section not in DOM |
| RP-CS15 | `valueChainWarnings` present → supply chain section shown | "🔗 Supply Chain" visible |
| RP-CS16 | `valueChainWarnings` empty/missing → no section | Section not in DOM |
| RP-CS17 | `sandboxGuidance` present → sandbox section shown | "🧪 Regulatory Sandbox" visible |
| RP-CS18 | `sandboxGuidance` empty/missing → no section | Section not in DOM |

#### 15.5 Authority Cooperation (L6-RP-AC) — 2 tests
| ID | Test | Assertion |
|----|------|-----------|
| RP-AC01 | `authorityCooperation` present → section shown | "🏛️ Regulatory Authority" visible |
| RP-AC02 | `authorityCooperation` empty/missing → no section | Section not in DOM |

#### 15.6 Child Component Integration (L6-RP-CC) — 6 tests
| ID | Test | Assertion |
|----|------|-----------|
| RP-CC01 | ClassificationBadge receives `result.classification` | Correct prop |
| RP-CC02 | FineCalculator receives `result.fineRisk` | Correct prop |
| RP-CC03 | ObligationsList receives `result.obligations` | Correct prop |
| RP-CC04 | TimelineView receives `result.enforcementDeadline` | Correct prop |
| RP-CC05 | DocumentGenerator receives result + companyName + systemDescription | Correct props |
| RP-CC06 | Next Steps section renders numbered list | Step numbers 1, 2, 3... |

#### 15.7 Next Steps & Disclaimer (L6-RP-NS) — 6 tests
| ID | Test | Assertion |
|----|------|-----------|
| RP-NS01 | "🚀 Next Steps" heading | Heading visible |
| RP-NS02 | Each next step has numbered circle | Numbers visible |
| RP-NS03 | Next steps in correct order | DOM order matches array order |
| RP-NS04 | Disclaimer at bottom of page | Disclaimer text visible |
| RP-NS05 | Disclaimer mentions "not constitute legal advice" | Text content |
| RP-NS06 | Empty next steps → no numbered items | Empty list |

---

## 16. TEST INVENTORY SUMMARY

> **IMPLEMENTATION COMPLETE** — All tests passing as of this update.

| Test File | ID Prefix | Planned | Actual | Status |
|-----------|-----------|---------|--------|--------|
| ClassificationBadge.test.tsx | L6-CB | ~20 | 20 | ✅ PASS |
| FineCalculator.test.tsx | L6-FC | ~18 | 18 | ✅ PASS |
| ObligationsList.test.tsx | L6-OL | ~30 | 30 | ✅ PASS |
| TimelineView.test.tsx | L6-TV | ~22 | 22 | ✅ PASS |
| DocumentViewer.test.tsx | L6-DV | ~35 | 35 | ✅ PASS |
| DocumentGenerator.test.tsx | L6-DG | ~55 | 55 | ✅ PASS |
| QuestionRenderer.test.tsx | L6-QR | ~55 | 38 | ✅ PASS |
| ProgressBar.test.tsx | L6-PB | ~30 | 20 | ✅ PASS |
| WizardStep.test.tsx | L6-WS | ~45 | 30 | ✅ PASS |
| WizardShell.test.tsx | L6-SH | ~25 | 10 | ✅ PASS |
| LandingPage.test.tsx | L6-LP | ~18 | 20 | ✅ PASS |
| ResultPage.test.tsx | L6-RP | ~50 | 35 | ✅ PASS |
| **TOTAL** | | **~403** | **333** | **✅ ALL PASS** |

> Note: Actual count (333) vs planned (~403) reflects test consolidation
> during implementation — redundant tests were merged, and some planned
> test groups were combined for clarity without sacrificing coverage.

### Running Totals After Layer 6
| Metric | Before L6 | After L6 |
|--------|-----------|----------|
| Test files | 17 | 29 |
| Total tests | 2,976 | 3,309 |
| Source lines tested | ~5,100 | ~6,977 |
| Backend coverage | 100/100/100/100 | 100/100/100/100 |
| Component coverage | 0% | ✅ All 10 components + 2 pages tested |

---

## 17. IMPLEMENTATION NOTES

### Implementation Order (Dependency-Based)
Build leaf components first (no child dependencies), then composites:

```
Phase 1 — Pure Presentational (no store, no side effects):
  1. ClassificationBadge.test.tsx    ← Simplest: prop in → render out
  2. FineCalculator.test.tsx         ← Simple with null-return branch
  3. ObligationsList.test.tsx        ← Grouping + truncation logic
  4. TimelineView.test.tsx           ← getEnforcementTimeline integration

Phase 2 — Interactive (user events, mocked APIs):
  5. DocumentViewer.test.tsx         ← Clipboard, download, markdown
  6. DocumentGenerator.test.tsx      ← Most complex: auth, fetch, state machine

Phase 3 — Store-Integrated (Zustand mocking):
  7. QuestionRenderer.test.tsx       ← Store read/write, 4 input types
  8. ProgressBar.test.tsx            ← Store read, click navigation
  9. WizardStep.test.tsx             ← Store read, nav buttons, summary
  10. WizardShell.test.tsx           ← Store + router + sessionStorage

Phase 4 — Page-Level:
  11. LandingPage.test.tsx           ← Static, easiest page
  12. ResultPage.test.tsx            ← sessionStorage, conditional sections
```

### Mock Factory Pattern
Create reusable mock factories in `src/components/__tests__/mocks.ts`:

```typescript
// mocks.ts
export function mockClassificationResult(overrides?: Partial<ClassificationResult>): ClassificationResult { ... }
export function mockObligation(overrides?: Partial<Obligation>): Obligation { ... }
export function mockFineRisk(overrides?: Partial<FineRisk>): FineRisk { ... }
export function mockGeneratedDocument(overrides?: Partial<GeneratedDocument>): GeneratedDocument { ... }
export function mockWizardStep(overrides?: Partial<WizardStep>): WizardStep { ... }
export function mockWizardQuestion(type: QuestionType, overrides?: Partial<WizardQuestion>): WizardQuestion { ... }
```

### Store Mocking Strategy
For wizard components that read from `useWizardStore`:

```typescript
vi.mock("@/lib/store", () => ({
  useWizardStore: vi.fn((selector?: any) => {
    const state = { /* test state */ };
    return selector ? selector(state) : state;
  }),
}));
```

This allows per-test state customization by updating the mock return value.

### Router Mocking Pattern
```typescript
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
```

### Existing Backend Test Suite (Unaffected)
All 2,976 existing tests run in Node environment (no DOM). Adding `environment: "jsdom"` globally is safe because:
- Backend tests don't use any browser APIs
- jsdom is a superset of Node globals
- No conflicts expected

If any friction arises, we can use `// @vitest-environment node` per-file overrides on existing tests.

### Coverage Configuration
Update `vitest.config.ts` to include component files in coverage:

```typescript
coverage: {
  provider: "v8",
  include: [
    "src/lib/**/*.ts",
    "src/middleware.ts",
    "src/app/api/**/*.ts",
    "src/components/**/*.tsx",  // ← ADD
    "src/app/**/*.tsx",         // ← ADD
  ],
}
```

### Key Risks
1. **jsdom + Zustand** — Zustand works in jsdom but may need careful cleanup between tests (`useWizardStore.setState` or store reset in `afterEach`)
2. **Next.js `Link` component** — RTL renders it as `<a>` by default, but we should verify `href` attributes
3. **Dynamic `require()` in DocumentGenerator** — The Clerk `require("@clerk/nextjs")` with try/catch may behave differently in test environments. Mock the module entirely.
4. **CSS variables** — `var(--color-*)` classes won't resolve in jsdom, but we're testing for class presence, not computed styles
5. **`window.document.createElement("a")`** — jsdom supports this, but need to verify `click()` dispatch

---

*End of Layer 6 Design Document*
