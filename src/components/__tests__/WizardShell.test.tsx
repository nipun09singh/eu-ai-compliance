/**
 * LAYER 6 — WizardShell Component Tests (L6-WSH)
 *
 * Top-level wizard container that handles redirect to /result on completion.
 *
 * 10 tests across 3 groups:
 *   WSH-R: Rendering (3 tests)
 *   WSH-N: Navigation on completion (5 tests)
 *   WSH-S: Structure & styling (2 tests)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import WizardShell from "@/components/wizard/WizardShell";
import { createMockStoreState, createMockUseWizardStore } from "./wizard-mocks";
import type { MockStoreState } from "./wizard-mocks";

// ============================================================================
// Module mocks
// ============================================================================
let storeState: MockStoreState;
let mockStore: ReturnType<typeof createMockUseWizardStore>;
const mockPush = vi.fn();

vi.mock("@/lib/store", () => ({
  get useWizardStore() {
    return mockStore;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock child components to isolate WizardShell behavior
vi.mock("@/components/wizard/ProgressBar", () => ({
  default: () => <div data-testid="progress-bar">ProgressBar</div>,
}));

vi.mock("@/components/wizard/WizardStep", () => ({
  default: () => <div data-testid="wizard-step">WizardStep</div>,
}));

beforeEach(() => {
  storeState = createMockStoreState({ isComplete: false, result: null });
  mockStore = createMockUseWizardStore(storeState);
  mockPush.mockClear();
  sessionStorage.clear();
});

// ============================================================================
// WSH-R: Rendering
// ============================================================================
describe("L6-WSH-R: Rendering", () => {
  it("WSH-R01: renders ProgressBar", () => {
    render(<WizardShell />);
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
  });

  it("WSH-R02: renders WizardStep", () => {
    render(<WizardShell />);
    expect(screen.getByTestId("wizard-step")).toBeInTheDocument();
  });

  it("WSH-R03: renders both components together", () => {
    render(<WizardShell />);
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-step")).toBeInTheDocument();
  });
});

// ============================================================================
// WSH-N: Navigation on completion
// ============================================================================
describe("L6-WSH-N: Navigation on completion", () => {
  it("WSH-N01: does NOT redirect when isComplete is false", () => {
    render(<WizardShell />);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("WSH-N02: does NOT redirect when result is null", () => {
    storeState.isComplete = true;
    storeState.result = null;
    render(<WizardShell />);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("WSH-N03: redirects to /result when isComplete AND result exist", () => {
    storeState.isComplete = true;
    storeState.result = { classification: "HIGH_RISK" };
    storeState.answers = { companyName: "Test" };
    render(<WizardShell />);
    expect(mockPush).toHaveBeenCalledWith("/result");
  });

  it("WSH-N04: stores result in sessionStorage on redirect", () => {
    storeState.isComplete = true;
    storeState.result = { classification: "HIGH_RISK" };
    storeState.answers = { companyName: "Test" };
    render(<WizardShell />);
    const stored = sessionStorage.getItem("classificationResult");
    expect(stored).toBe(JSON.stringify({ classification: "HIGH_RISK" }));
  });

  it("WSH-N05: stores answers in sessionStorage on redirect", () => {
    storeState.isComplete = true;
    storeState.result = { classification: "HIGH_RISK" };
    storeState.answers = { companyName: "TestCo", role: "PROVIDER" };
    render(<WizardShell />);
    const stored = sessionStorage.getItem("wizardAnswers");
    expect(stored).toBe(JSON.stringify({ companyName: "TestCo", role: "PROVIDER" }));
  });
});

// ============================================================================
// WSH-S: Structure & styling
// ============================================================================
describe("L6-WSH-S: Structure & styling", () => {
  it("WSH-S01: wrapper has max-w-4xl", () => {
    const { container } = render(<WizardShell />);
    expect(container.firstElementChild?.className).toContain("max-w-4xl");
  });

  it("WSH-S02: wrapper has px-6 py-8 padding", () => {
    const { container } = render(<WizardShell />);
    const classes = container.firstElementChild?.className ?? "";
    expect(classes).toContain("px-6");
    expect(classes).toContain("py-8");
  });
});
