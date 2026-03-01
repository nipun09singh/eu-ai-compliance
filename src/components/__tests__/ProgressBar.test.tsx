/**
 * LAYER 6 — ProgressBar Component Tests (L6-PB)
 *
 * Wizard progress indicator with percentage bar and step pills.
 *
 * 20 tests across 4 groups:
 *   PB-B: Bar rendering (4 tests)
 *   PB-P: Step pills (8 tests)
 *   PB-I: Interactions (3 tests)
 *   PB-S: Structure & styling (5 tests)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProgressBar from "@/components/wizard/ProgressBar";
import { createMockStoreState, createMockUseWizardStore, mockVisibleSteps } from "./wizard-mocks";
import type { MockStoreState } from "./wizard-mocks";

// ============================================================================
// Module mock — Zustand store
// ============================================================================
let storeState: MockStoreState;
let mockStore: ReturnType<typeof createMockUseWizardStore>;

vi.mock("@/lib/store", () => ({
  get useWizardStore() {
    return mockStore;
  },
}));

beforeEach(() => {
  const steps = mockVisibleSteps();
  storeState = createMockStoreState({
    currentStepId: "technical",
    currentStep: steps[1],
    progress: 42,
    getVisibleSteps: vi.fn(() => steps),
    goToStep: vi.fn(),
  });
  mockStore = createMockUseWizardStore(storeState);
});

// ============================================================================
// PB-B: Bar rendering
// ============================================================================
describe("L6-PB-B: Bar rendering", () => {
  it("PB-B01: shows progress percentage text", () => {
    render(<ProgressBar />);
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("PB-B02: progress bar has correct width style", () => {
    const { container } = render(<ProgressBar />);
    const bar = container.querySelector(".bg-brand-500");
    expect(bar).toHaveStyle({ width: "42%" });
  });

  it("PB-B03: progress bar has transition animation", () => {
    const { container } = render(<ProgressBar />);
    const bar = container.querySelector(".bg-brand-500");
    expect(bar?.className).toContain("transition-all");
  });

  it("PB-B04: shows 0% for zero progress", () => {
    storeState.progress = 0;
    render(<ProgressBar />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});

// ============================================================================
// PB-P: Step pills
// ============================================================================
describe("L6-PB-P: Step pills", () => {
  it("PB-P01: renders all step icons", () => {
    render(<ProgressBar />);
    expect(screen.getByText("📋")).toBeInTheDocument();
    expect(screen.getByText("⚙️")).toBeInTheDocument();
    expect(screen.getByText("🚀")).toBeInTheDocument();
    expect(screen.getByText("📊")).toBeInTheDocument();
  });

  it("PB-P02: renders step titles (hidden on mobile)", () => {
    render(<ProgressBar />);
    const titles = screen.getAllByText(/System Basics|Technical Details|Deployment|Summary/);
    expect(titles.length).toBe(4);
  });

  it("PB-P03: active step has brand-600 background", () => {
    render(<ProgressBar />);
    // "technical" is currentStepId (index 1)
    const activeButton = screen.getByText("⚙️").closest("button");
    expect(activeButton?.className).toContain("bg-brand-600");
    expect(activeButton?.className).toContain("text-white");
  });

  it("PB-P04: past step has surface background and brand text", () => {
    render(<ProgressBar />);
    // "basics" is index 0, before currentStepId="technical" (index 1) → past
    const pastButton = screen.getByText("📋").closest("button");
    expect(pastButton?.className).toContain("text-brand-400");
    expect(pastButton?.className).toContain("cursor-pointer");
  });

  it("PB-P05: future step has muted text and cursor-default", () => {
    render(<ProgressBar />);
    // "deployment" is index 2, after currentStepId="technical" (index 1) → future
    const futureButton = screen.getByText("🚀").closest("button");
    expect(futureButton?.className).toContain("text-[var(--color-text-muted)]");
    expect(futureButton?.className).toContain("cursor-default");
  });

  it("PB-P06: step titles have hidden sm:inline for responsiveness", () => {
    render(<ProgressBar />);
    const title = screen.getByText("System Basics");
    expect(title.className).toContain("hidden");
    expect(title.className).toContain("sm:inline");
  });

  it("PB-P07: pills are buttons", () => {
    render(<ProgressBar />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(4);
  });

  it("PB-P08: each pill has rounded-full", () => {
    render(<ProgressBar />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn.className).toContain("rounded-full");
    });
  });
});

// ============================================================================
// PB-I: Interactions
// ============================================================================
describe("L6-PB-I: Interactions", () => {
  it("PB-I01: clicking past step calls goToStep", () => {
    render(<ProgressBar />);
    const pastButton = screen.getByText("📋").closest("button")!;
    fireEvent.click(pastButton);
    expect(storeState.goToStep).toHaveBeenCalledWith("basics");
  });

  it("PB-I02: clicking future step does NOT call goToStep", () => {
    render(<ProgressBar />);
    const futureButton = screen.getByText("🚀").closest("button")!;
    fireEvent.click(futureButton);
    expect(storeState.goToStep).not.toHaveBeenCalled();
  });

  it("PB-I03: clicking active step does NOT call goToStep", () => {
    render(<ProgressBar />);
    const activeButton = screen.getByText("⚙️").closest("button")!;
    fireEvent.click(activeButton);
    expect(storeState.goToStep).not.toHaveBeenCalled();
  });
});

// ============================================================================
// PB-S: Structure & styling
// ============================================================================
describe("L6-PB-S: Structure & styling", () => {
  it("PB-S01: wrapper has mb-8", () => {
    const { container } = render(<ProgressBar />);
    expect(container.firstElementChild?.className).toContain("mb-8");
  });

  it("PB-S02: progress track has rounded-full", () => {
    const { container } = render(<ProgressBar />);
    const track = container.querySelector(".rounded-full.bg-\\[var\\(--color-surface\\)\\]");
    expect(track).toBeInTheDocument();
  });

  it("PB-S03: step container allows horizontal scroll", () => {
    const { container } = render(<ProgressBar />);
    const stepContainer = container.querySelector(".overflow-x-auto");
    expect(stepContainer).toBeInTheDocument();
  });

  it("PB-S04: percentage text has text-sm", () => {
    render(<ProgressBar />);
    const pct = screen.getByText("42%");
    expect(pct.className).toContain("text-sm");
  });

  it("PB-S05: progress bar fill has h-2 height", () => {
    const { container } = render(<ProgressBar />);
    const fill = container.querySelector(".bg-brand-500");
    expect(fill?.className).toContain("h-2");
  });
});
