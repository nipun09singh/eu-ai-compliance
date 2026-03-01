/**
 * LAYER 6 — WizardStep Component Tests (L6-WS)
 *
 * Renders current step header, question list (or SummaryView), and nav buttons.
 *
 * 30 tests across 5 groups:
 *   WS-H: Header rendering (5 tests)
 *   WS-Q: Question rendering (3 tests)
 *   WS-N: Navigation buttons (8 tests)
 *   WS-SM: SummaryView (9 tests)
 *   WS-S: Structure & styling (5 tests)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WizardStep from "@/components/wizard/WizardStep";
import { createMockStoreState, createMockUseWizardStore, mockWizardStep, mockVisibleSteps } from "./wizard-mocks";
import type { MockStoreState } from "./wizard-mocks";

// ============================================================================
// Module mocks
// ============================================================================
let storeState: MockStoreState;
let mockStore: ReturnType<typeof createMockUseWizardStore>;

vi.mock("@/lib/store", () => ({
  get useWizardStore() {
    return mockStore;
  },
}));

// Mock QuestionRenderer to avoid needing full store interaction
vi.mock("@/components/wizard/QuestionRenderer", () => ({
  default: ({ question }: any) => (
    <div data-testid={`question-${question.id}`}>{question.text}</div>
  ),
}));

beforeEach(() => {
  const steps = mockVisibleSteps();
  storeState = createMockStoreState({
    currentStepId: "technical",
    currentStep: steps[1], // Technical Details (not first, not last)
    progress: 50,
    getVisibleQuestions: vi.fn(() => [
      { id: "q1", text: "Question One", type: "TEXT" },
      { id: "q2", text: "Question Two", type: "BOOLEAN" },
    ]),
    getVisibleSteps: vi.fn(() => steps),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
  });
  mockStore = createMockUseWizardStore(storeState);
});

// ============================================================================
// WS-H: Header rendering
// ============================================================================
describe("L6-WS-H: Header rendering", () => {
  it("WS-H01: shows step icon", () => {
    render(<WizardStep />);
    expect(screen.getByText("⚙️")).toBeInTheDocument();
  });

  it("WS-H02: shows step title", () => {
    render(<WizardStep />);
    expect(screen.getByText("Technical Details")).toBeInTheDocument();
  });

  it("WS-H03: title is h2 element", () => {
    render(<WizardStep />);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2.textContent).toBe("Technical Details");
  });

  it("WS-H04: shows step subtitle", () => {
    render(<WizardStep />);
    expect(screen.getByText("Tell us about your AI system")).toBeInTheDocument();
  });

  it("WS-H05: icon has text-3xl class", () => {
    render(<WizardStep />);
    const icon = screen.getByText("⚙️");
    expect(icon.className).toContain("text-3xl");
  });
});

// ============================================================================
// WS-Q: Question rendering
// ============================================================================
describe("L6-WS-Q: Question rendering", () => {
  it("WS-Q01: renders QuestionRenderer for each visible question", () => {
    render(<WizardStep />);
    expect(screen.getByTestId("question-q1")).toBeInTheDocument();
    expect(screen.getByTestId("question-q2")).toBeInTheDocument();
  });

  it("WS-Q02: shows question text via QuestionRenderer", () => {
    render(<WizardStep />);
    expect(screen.getByText("Question One")).toBeInTheDocument();
    expect(screen.getByText("Question Two")).toBeInTheDocument();
  });

  it("WS-Q03: questions container has space-y-2", () => {
    const { container } = render(<WizardStep />);
    const questionsDiv = container.querySelector(".space-y-2");
    expect(questionsDiv).toBeInTheDocument();
  });
});

// ============================================================================
// WS-N: Navigation buttons
// ============================================================================
describe("L6-WS-N: Navigation buttons", () => {
  it("WS-N01: shows Back button on non-first step", () => {
    render(<WizardStep />);
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("WS-N02: Back button is invisible on first step", () => {
    const steps = mockVisibleSteps();
    storeState.currentStepId = "basics";
    storeState.currentStep = steps[0]; // First step
    render(<WizardStep />);
    const backBtn = screen.getByText("← Back");
    expect(backBtn.className).toContain("invisible");
  });

  it("WS-N03: shows 'Continue →' on middle step", () => {
    render(<WizardStep />);
    expect(screen.getByText("Continue →")).toBeInTheDocument();
  });

  it("WS-N04: shows 'Review & Submit' on last non-summary step", () => {
    const steps = mockVisibleSteps();
    storeState.currentStepId = "deployment";
    storeState.currentStep = steps[2]; // Last before summary
    // Make the last visible step = deployment (remove summary)
    storeState.getVisibleSteps = vi.fn(() => steps.slice(0, 3));
    render(<WizardStep />);
    expect(screen.getByText("Review & Submit")).toBeInTheDocument();
  });

  it("WS-N05: shows '🔍 Get My Classification' on summary step", () => {
    const steps = mockVisibleSteps();
    storeState.currentStepId = "summary";
    storeState.currentStep = mockWizardStep({ id: "summary", title: "Summary", icon: "📊" });
    storeState.getVisibleSteps = vi.fn(() => steps);
    render(<WizardStep />);
    expect(screen.getByText("🔍 Get My Classification")).toBeInTheDocument();
  });

  it("WS-N06: clicking Continue calls nextStep", () => {
    render(<WizardStep />);
    fireEvent.click(screen.getByText("Continue →"));
    expect(storeState.nextStep).toHaveBeenCalledTimes(1);
  });

  it("WS-N07: clicking Back calls prevStep", () => {
    render(<WizardStep />);
    fireEvent.click(screen.getByText("← Back"));
    expect(storeState.prevStep).toHaveBeenCalledTimes(1);
  });

  it("WS-N08: summary step next button has green styling", () => {
    storeState.currentStepId = "summary";
    storeState.currentStep = mockWizardStep({ id: "summary", title: "Summary", icon: "📊" });
    render(<WizardStep />);
    const btn = screen.getByText("🔍 Get My Classification");
    expect(btn.className).toContain("bg-green-600");
  });
});

// ============================================================================
// WS-SM: SummaryView
// ============================================================================
describe("L6-WS-SM: SummaryView", () => {
  beforeEach(() => {
    storeState.currentStepId = "summary";
    storeState.currentStep = mockWizardStep({ id: "summary", title: "Summary", icon: "📊" });
    storeState.answers = {
      companyName: "Acme Corp",
      companySize: "SME",
      role: "PROVIDER",
      systemDescription: "AI-powered hiring tool",
    };
  });

  it("WS-SM01: shows 'Ready to classify' heading", () => {
    render(<WizardStep />);
    expect(screen.getByText("Ready to classify")).toBeInTheDocument();
  });

  it("WS-SM02: shows answered question count", () => {
    render(<WizardStep />);
    expect(screen.getByText(/4 questions/)).toBeInTheDocument();
  });

  it("WS-SM03: shows company name", () => {
    render(<WizardStep />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("WS-SM04: shows company size", () => {
    render(<WizardStep />);
    expect(screen.getByText("SME")).toBeInTheDocument();
  });

  it("WS-SM05: shows role", () => {
    render(<WizardStep />);
    expect(screen.getByText("PROVIDER")).toBeInTheDocument();
  });

  it("WS-SM06: shows system description", () => {
    render(<WizardStep />);
    expect(screen.getByText("AI-powered hiring tool")).toBeInTheDocument();
  });

  it("WS-SM07: truncates long system description at 60 chars", () => {
    storeState.answers.systemDescription = "A".repeat(70);
    render(<WizardStep />);
    expect(screen.getByText("A".repeat(60) + "...")).toBeInTheDocument();
  });

  it("WS-SM08: hides missing fields gracefully", () => {
    storeState.answers = { companyName: "Acme" };
    render(<WizardStep />);
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.queryByText("Size")).not.toBeInTheDocument();
    expect(screen.queryByText("Role")).not.toBeInTheDocument();
  });

  it("WS-SM09: summary card has rounded-2xl border", () => {
    const { container } = render(<WizardStep />);
    const card = container.querySelector(".rounded-2xl.border");
    expect(card).toBeInTheDocument();
  });
});

// ============================================================================
// WS-S: Structure & styling
// ============================================================================
describe("L6-WS-S: Structure & styling", () => {
  it("WS-S01: wrapper has max-w-2xl", () => {
    const { container } = render(<WizardStep />);
    expect(container.firstElementChild?.className).toContain("max-w-2xl");
  });

  it("WS-S02: step header has mb-8 spacing", () => {
    const { container } = render(<WizardStep />);
    const header = container.querySelector(".mb-8");
    expect(header).toBeInTheDocument();
  });

  it("WS-S03: navigation has mt-10 spacing", () => {
    const { container } = render(<WizardStep />);
    const nav = container.querySelector(".mt-10");
    expect(nav).toBeInTheDocument();
  });

  it("WS-S04: navigation is flex with justify-between", () => {
    const { container } = render(<WizardStep />);
    const nav = container.querySelector(".flex.items-center.justify-between");
    expect(nav).toBeInTheDocument();
  });

  it("WS-S05: continue button has brand-600 styling on normal steps", () => {
    render(<WizardStep />);
    const btn = screen.getByText("Continue →");
    expect(btn.className).toContain("bg-brand-600");
  });
});
