/**
 * LAYER 6 — Landing Page Tests (L6-LP)
 *
 * Server-rendered landing page with hero, social proof, how-it-works,
 * risk categories, CTA, and footer sections.
 *
 * 20 tests across 6 groups:
 *   LP-H: Hero section (5 tests)
 *   LP-SP: Social proof (3 tests)
 *   LP-HW: How It Works (4 tests)
 *   LP-RC: Risk categories (3 tests)
 *   LP-F: Footer (3 tests)
 *   LP-S: Structure & styling (2 tests)
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// Mock next/link to render <a> tags
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// ============================================================================
// LP-H: Hero section
// ============================================================================
describe("L6-LP-H: Hero section", () => {
  it("LP-H01: shows main heading text", () => {
    render(<Home />);
    expect(screen.getByText(/Is Your AI System/)).toBeInTheDocument();
    expect(screen.getAllByText(/EU AI Act/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Compliant\?/)).toBeInTheDocument();
  });

  it("LP-H02: heading is h1 element", () => {
    render(<Home />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it("LP-H03: shows 'Start Free Assessment' CTA link", () => {
    render(<Home />);
    const link = screen.getAllByText("Start Free Assessment →")[0];
    expect(link.closest("a")).toHaveAttribute("href", "/wizard");
  });

  it("LP-H04: shows enforcement deadline badge", () => {
    render(<Home />);
    expect(screen.getAllByText(/Aug 2026/).length).toBeGreaterThanOrEqual(1);
  });

  it("LP-H05: shows 'No sign-up required' note", () => {
    render(<Home />);
    expect(screen.getByText(/No sign-up required/)).toBeInTheDocument();
  });
});

// ============================================================================
// LP-SP: Social proof
// ============================================================================
describe("L6-LP-SP: Social proof", () => {
  it("LP-SP01: shows €35M fine stat", () => {
    render(<Home />);
    expect(screen.getByText("€35M")).toBeInTheDocument();
  });

  it("LP-SP02: shows 16 obligations stat", () => {
    render(<Home />);
    expect(screen.getByText("16")).toBeInTheDocument();
  });

  it("LP-SP03: shows ~5 months stat", () => {
    render(<Home />);
    expect(screen.getByText("~5 months")).toBeInTheDocument();
  });
});

// ============================================================================
// LP-HW: How It Works
// ============================================================================
describe("L6-LP-HW: How It Works", () => {
  it("LP-HW01: shows 'How It Works' heading", () => {
    render(<Home />);
    expect(screen.getByText("How It Works")).toBeInTheDocument();
  });

  it("LP-HW02: shows 3 step titles", () => {
    render(<Home />);
    expect(screen.getByText("Answer Simple Questions")).toBeInTheDocument();
    expect(screen.getByText("Get Your Classification")).toBeInTheDocument();
    expect(screen.getByText("Compliance Roadmap")).toBeInTheDocument();
  });

  it("LP-HW03: shows step numbers 1, 2, 3", () => {
    render(<Home />);
    const stepNumbers = screen.getAllByText(/^[123]$/);
    expect(stepNumbers.length).toBe(3);
  });

  it("LP-HW04: shows step icons", () => {
    render(<Home />);
    expect(screen.getByText("💬")).toBeInTheDocument();
    expect(screen.getByText("🔍")).toBeInTheDocument();
    expect(screen.getByText("📋")).toBeInTheDocument();
  });
});

// ============================================================================
// LP-RC: Risk categories
// ============================================================================
describe("L6-LP-RC: Risk categories", () => {
  it("LP-RC01: shows '6 Risk Classifications' heading", () => {
    render(<Home />);
    expect(screen.getByText("6 Risk Classifications")).toBeInTheDocument();
  });

  it("LP-RC02: shows all 6 category labels", () => {
    render(<Home />);
    expect(screen.getByText("Prohibited")).toBeInTheDocument();
    expect(screen.getByText("High Risk")).toBeInTheDocument();
    expect(screen.getByText("Limited Risk")).toBeInTheDocument();
    expect(screen.getByText("Minimal Risk")).toBeInTheDocument();
    // GPAI appears twice (GPAI + GPAI Systemic)
    const gpaiElements = screen.getAllByText(/GPAI/);
    expect(gpaiElements.length).toBeGreaterThanOrEqual(2);
  });

  it("LP-RC03: shows fine info for categories", () => {
    render(<Home />);
    expect(screen.getByText("Fine: €35M / 7%")).toBeInTheDocument();
    expect(screen.getByText("Fine: None")).toBeInTheDocument();
  });
});

// ============================================================================
// LP-F: Footer
// ============================================================================
describe("L6-LP-F: Footer", () => {
  it("LP-F01: shows EU AI Act legal reference", () => {
    render(<Home />);
    expect(screen.getByText(/Regulation \(EU\) 2024\/1689/)).toBeInTheDocument();
  });

  it("LP-F02: shows legal disclaimer", () => {
    render(<Home />);
    expect(screen.getByText(/not legal advice/)).toBeInTheDocument();
  });

  it("LP-F03: shows copyright with current year", () => {
    render(<Home />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
  });
});

// ============================================================================
// LP-S: Structure & styling
// ============================================================================
describe("L6-LP-S: Structure & styling", () => {
  it("LP-S01: 'Don't Wait for the Deadline' CTA section exists", () => {
    render(<Home />);
    expect(screen.getByText(/Don.t Wait for the Deadline/)).toBeInTheDocument();
  });

  it("LP-S02: footer is a footer element", () => {
    const { container } = render(<Home />);
    const footer = container.querySelector("footer");
    expect(footer).toBeInTheDocument();
  });
});
