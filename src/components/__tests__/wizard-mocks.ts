/**
 * Shared mock utilities for wizard component tests.
 *
 * Provides a mock `useWizardStore` that handles both:
 *   - Direct calls: `useWizardStore()` → full state
 *   - Selector calls: `useWizardStore(s => s.getVisibleSteps())` → selector(state)
 */
import { vi } from "vitest";
import type { WizardStep } from "@/lib/wizard-questions";

/** Default mock wizard step */
export function mockWizardStep(overrides: Partial<WizardStep> = {}): WizardStep {
  return {
    id: "basics",
    title: "System Basics",
    icon: "📋",
    subtitle: "Tell us about your AI system",
    questions: [],
    ...overrides,
  };
}

/** Default visible steps array */
export function mockVisibleSteps(): WizardStep[] {
  return [
    mockWizardStep({ id: "basics", title: "System Basics", icon: "📋" }),
    mockWizardStep({ id: "technical", title: "Technical Details", icon: "⚙️" }),
    mockWizardStep({ id: "deployment", title: "Deployment", icon: "🚀" }),
    mockWizardStep({ id: "summary", title: "Summary", icon: "📊" }),
  ];
}

/** Type for the store state that mock returns */
export interface MockStoreState {
  currentStepId: string;
  currentStep: WizardStep;
  answers: Record<string, any>;
  result: any;
  isComplete: boolean;
  progress: number;
  setAnswer: ReturnType<typeof vi.fn>;
  nextStep: ReturnType<typeof vi.fn>;
  prevStep: ReturnType<typeof vi.fn>;
  goToStep: ReturnType<typeof vi.fn>;
  submitClassification: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  getVisibleQuestions: ReturnType<typeof vi.fn>;
  getVisibleSteps: ReturnType<typeof vi.fn>;
}

/** Create a full mock store state */
export function createMockStoreState(overrides: Partial<MockStoreState> = {}): MockStoreState {
  const steps = mockVisibleSteps();
  return {
    currentStepId: "basics",
    currentStep: steps[0],
    answers: {},
    result: null,
    isComplete: false,
    progress: 50,
    setAnswer: vi.fn(),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    goToStep: vi.fn(),
    submitClassification: vi.fn(),
    reset: vi.fn(),
    getVisibleQuestions: vi.fn(() => []),
    getVisibleSteps: vi.fn(() => steps),
    ...overrides,
  };
}

/**
 * Create the mock function that vi.mock("@/lib/store") should return as useWizardStore.
 * Handles both direct and selector call patterns.
 */
export function createMockUseWizardStore(state: MockStoreState) {
  const fn = vi.fn((selector?: (s: MockStoreState) => any) => {
    return selector ? selector(state) : state;
  });
  return fn;
}
