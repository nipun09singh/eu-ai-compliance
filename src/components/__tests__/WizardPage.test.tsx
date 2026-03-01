/**
 * LAYER 7A — Wizard Page Tests (L7A-WP)
 *
 * Thin wrapper page at /wizard that renders <WizardShell />.
 *
 * 8 tests across 2 groups:
 *   WP-R: Rendering (4 tests)
 *   WP-S: Structure (4 tests)
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock WizardShell
vi.mock("@/components/wizard/WizardShell", () => ({
  default: () => <div data-testid="wizard-shell">WizardShell Mock</div>,
}));

// The page is a "use client" component
import WizardPage from "@/app/wizard/page";

// ============================================================================
// WP-R: Rendering
// ============================================================================
describe("L7A-WP-R: Rendering", () => {
  it("WP-R01: renders WizardShell component", () => {
    render(<WizardPage />);
    expect(screen.getByTestId("wizard-shell")).toBeInTheDocument();
  });

  it("WP-R02: renders WizardShell text", () => {
    render(<WizardPage />);
    expect(screen.getByText("WizardShell Mock")).toBeInTheDocument();
  });

  it("WP-R03: renders without crashing", () => {
    const { container } = render(<WizardPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("WP-R04: renders a single top-level div", () => {
    const { container } = render(<WizardPage />);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });
});

// ============================================================================
// WP-S: Structure
// ============================================================================
describe("L7A-WP-S: Structure", () => {
  it("WP-S01: wrapper div has min-height style class", () => {
    const { container } = render(<WizardPage />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-");
  });

  it("WP-S02: WizardShell is child of the wrapper div", () => {
    const { container } = render(<WizardPage />);
    const wrapper = container.firstChild as HTMLElement;
    const shell = wrapper.querySelector('[data-testid="wizard-shell"]');
    expect(shell).toBeInTheDocument();
  });

  it("WP-S03: only one child component rendered", () => {
    const { container } = render(<WizardPage />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.childElementCount).toBe(1);
  });

  it("WP-S04: no extraneous text content outside WizardShell", () => {
    const { container } = render(<WizardPage />);
    const wrapper = container.firstChild as HTMLElement;
    // Only text should be inside WizardShell mock
    const textContent = wrapper.textContent;
    expect(textContent).toBe("WizardShell Mock");
  });
});
