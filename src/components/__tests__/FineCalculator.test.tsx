/**
 * LAYER 6 — FineCalculator Component Tests (L6-FC)
 *
 * Conditional component: returns null when maxPercentTurnover=0.
 * Shows fine details + SME card when companySize !== "LARGE".
 *
 * 18 tests across 3 groups:
 *   FC-N: Null rendering (3 tests)
 *   FC-G: General fine display (8 tests)
 *   FC-S: SME card logic (7 tests)
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FineCalculator from "@/components/result/FineCalculator";
import { mockFineRisk } from "./mocks";

// ============================================================================
// FC-N: Null Rendering
// ============================================================================

describe("L6-FC-N: Null rendering when no fine exposure", () => {
  it("FC-N01: returns null when maxPercentTurnover === 0", () => {
    const { container } = render(
      <FineCalculator fineRisk={mockFineRisk({ maxPercentTurnover: 0 })} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("FC-N02: returns null with maxPercentTurnover=0 even if companySize provided", () => {
    const { container } = render(
      <FineCalculator
        fineRisk={mockFineRisk({ maxPercentTurnover: 0 })}
        companySize="STARTUP"
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("FC-N03: returns null with maxPercentTurnover=0 and companySize=LARGE", () => {
    const { container } = render(
      <FineCalculator
        fineRisk={mockFineRisk({ maxPercentTurnover: 0 })}
        companySize="LARGE"
      />
    );
    expect(container.innerHTML).toBe("");
  });
});

// ============================================================================
// FC-G: General Fine Display
// ============================================================================

describe("L6-FC-G: General fine information display", () => {
  it("FC-G01: renders the fine heading '💰 Fine Exposure'", () => {
    render(<FineCalculator fineRisk={mockFineRisk()} />);
    expect(screen.getByText(/Fine Exposure/)).toBeInTheDocument();
  });

  it("FC-G02: shows the article reference", () => {
    render(<FineCalculator fineRisk={mockFineRisk({ article: "Article 99(3)" })} />);
    expect(screen.getByText(/Article 99\(3\)/)).toBeInTheDocument();
  });

  it("FC-G03: shows maxAmountGeneral (€15,000,000)", () => {
    render(<FineCalculator fineRisk={mockFineRisk()} />);
    expect(screen.getByText("€15,000,000")).toBeInTheDocument();
  });

  it("FC-G04: shows maxPercentTurnover (3%) text", () => {
    render(<FineCalculator fineRisk={mockFineRisk()} />);
    expect(screen.getByText(/3% of global annual turnover/)).toBeInTheDocument();
  });

  it("FC-G05: custom maxAmountGeneral renders correctly", () => {
    render(<FineCalculator fineRisk={mockFineRisk({ maxAmountGeneral: "€35,000,000" })} />);
    expect(screen.getByText("€35,000,000")).toBeInTheDocument();
  });

  it("FC-G06: custom maxPercentTurnover renders correctly", () => {
    render(<FineCalculator fineRisk={mockFineRisk({ maxPercentTurnover: 7 })} />);
    expect(screen.getByText(/7% of global annual turnover/)).toBeInTheDocument();
  });

  it("FC-G07: outer div has rounded-2xl border", () => {
    const { container } = render(<FineCalculator fineRisk={mockFineRisk()} />);
    expect(container.firstElementChild!.classList.contains("rounded-2xl")).toBe(true);
  });

  it("FC-G08: 'Maximum Fine' label is present", () => {
    render(<FineCalculator fineRisk={mockFineRisk()} />);
    expect(screen.getByText("Maximum Fine")).toBeInTheDocument();
  });
});

// ============================================================================
// FC-S: SME Card Logic
// ============================================================================

describe("L6-FC-S: SME card display logic", () => {
  it("FC-S01: no SME card when companySize is undefined", () => {
    render(<FineCalculator fineRisk={mockFineRisk()} />);
    expect(screen.queryByText("Your SME Cap")).not.toBeInTheDocument();
  });

  it("FC-S02: no SME card when companySize === 'LARGE'", () => {
    render(<FineCalculator fineRisk={mockFineRisk()} companySize="LARGE" />);
    expect(screen.queryByText("Your SME Cap")).not.toBeInTheDocument();
  });

  it("FC-S03: SME card shown when companySize === 'STARTUP'", () => {
    render(<FineCalculator fineRisk={mockFineRisk()} companySize="STARTUP" />);
    expect(screen.getByText("Your SME Cap")).toBeInTheDocument();
    expect(screen.getByText("€7,500,000")).toBeInTheDocument();
  });

  it("FC-S04: SME card shown when companySize === 'SME'", () => {
    render(<FineCalculator fineRisk={mockFineRisk()} companySize="SME" />);
    expect(screen.getByText("Your SME Cap")).toBeInTheDocument();
  });

  it("FC-S05: SME card shows maxAmountSME value", () => {
    render(
      <FineCalculator
        fineRisk={mockFineRisk({ maxAmountSME: "€3,000,000" })}
        companySize="STARTUP"
      />
    );
    expect(screen.getByText("€3,000,000")).toBeInTheDocument();
  });

  it("FC-S06: SME card shows note when present", () => {
    render(
      <FineCalculator
        fineRisk={mockFineRisk({ note: "Proportionality applies for startups" })}
        companySize="STARTUP"
      />
    );
    expect(screen.getByText("Proportionality applies for startups")).toBeInTheDocument();
  });

  it("FC-S07: SME card does NOT show note when absent", () => {
    const risk = mockFineRisk();
    delete (risk as Record<string, unknown>).note;
    render(<FineCalculator fineRisk={risk} companySize="STARTUP" />);
    // note element should not exist — only "Your SME Cap" + amount
    const smeCard = screen.getByText("Your SME Cap").closest("div");
    const paragraphs = smeCard!.querySelectorAll("p");
    // Should have 2 paragraphs: label + amount, no note
    expect(paragraphs.length).toBeLessThanOrEqual(2);
  });
});
