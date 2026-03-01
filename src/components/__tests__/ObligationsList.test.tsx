/**
 * LAYER 6 — ObligationsList Component Tests (L6-OL)
 *
 * Presentational component that groups obligations by priority
 * (CRITICAL > HIGH > MEDIUM > LOW) and renders cards with truncation.
 *
 * 30 tests across 4 groups:
 *   OL-G: Priority grouping (10 tests)
 *   OL-C: Card rendering (8 tests)
 *   OL-T: Description truncation (5 tests)
 *   OL-S: Structure & styling (7 tests)
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ObligationsList from "@/components/result/ObligationsList";
import { mockObligation } from "./mocks";

// ============================================================================
// OL-G: Priority Grouping
// ============================================================================

describe("L6-OL-G: Priority group rendering", () => {
  it("OL-G01: renders CRITICAL group when critical obligations exist", () => {
    render(
      <ObligationsList
        obligations={[mockObligation({ priority: "CRITICAL", id: "C1" })]}
      />
    );
    expect(screen.getByText(/🔴 Critical — 1/)).toBeInTheDocument();
  });

  it("OL-G02: renders HIGH group when high obligations exist", () => {
    render(
      <ObligationsList
        obligations={[mockObligation({ priority: "HIGH", id: "H1" })]}
      />
    );
    expect(screen.getByText(/🟠 High — 1/)).toBeInTheDocument();
  });

  it("OL-G03: renders MEDIUM group when medium obligations exist", () => {
    render(
      <ObligationsList
        obligations={[mockObligation({ priority: "MEDIUM", id: "M1" })]}
      />
    );
    expect(screen.getByText(/🟡 Medium — 1/)).toBeInTheDocument();
  });

  it("OL-G04: renders LOW group when low obligations exist", () => {
    render(
      <ObligationsList
        obligations={[mockObligation({ priority: "LOW", id: "L1" })]}
      />
    );
    expect(screen.getByText(/🟢 Low — 1/)).toBeInTheDocument();
  });

  it("OL-G05: does NOT render CRITICAL group when none exist", () => {
    render(
      <ObligationsList
        obligations={[mockObligation({ priority: "HIGH", id: "H1" })]}
      />
    );
    expect(screen.queryByText(/🔴 Critical/)).not.toBeInTheDocument();
  });

  it("OL-G06: does NOT render HIGH group when none exist", () => {
    render(
      <ObligationsList
        obligations={[mockObligation({ priority: "CRITICAL", id: "C1" })]}
      />
    );
    expect(screen.queryByText(/🟠 High/)).not.toBeInTheDocument();
  });

  it("OL-G07: multiple groups render when mixed priorities", () => {
    render(
      <ObligationsList
        obligations={[
          mockObligation({ priority: "CRITICAL", id: "C1" }),
          mockObligation({ priority: "HIGH", id: "H1" }),
          mockObligation({ priority: "LOW", id: "L1" }),
        ]}
      />
    );
    expect(screen.getByText(/🔴 Critical — 1/)).toBeInTheDocument();
    expect(screen.getByText(/🟠 High — 1/)).toBeInTheDocument();
    expect(screen.getByText(/🟢 Low — 1/)).toBeInTheDocument();
    expect(screen.queryByText(/🟡 Medium/)).not.toBeInTheDocument();
  });

  it("OL-G08: group count shows correct number for multiple items", () => {
    render(
      <ObligationsList
        obligations={[
          mockObligation({ priority: "CRITICAL", id: "C1" }),
          mockObligation({ priority: "CRITICAL", id: "C2" }),
          mockObligation({ priority: "CRITICAL", id: "C3" }),
        ]}
      />
    );
    expect(screen.getByText(/🔴 Critical — 3/)).toBeInTheDocument();
  });

  it("OL-G09: header shows total obligations count", () => {
    render(
      <ObligationsList
        obligations={[
          mockObligation({ priority: "CRITICAL", id: "C1" }),
          mockObligation({ priority: "HIGH", id: "H1" }),
        ]}
      />
    );
    expect(screen.getByText("Your Obligations (2)")).toBeInTheDocument();
  });

  it("OL-G10: empty obligations array shows (0) count and no groups", () => {
    render(<ObligationsList obligations={[]} />);
    expect(screen.getByText("Your Obligations (0)")).toBeInTheDocument();
    expect(screen.queryByText(/🔴 Critical/)).not.toBeInTheDocument();
    expect(screen.queryByText(/🟠 High/)).not.toBeInTheDocument();
    expect(screen.queryByText(/🟡 Medium/)).not.toBeInTheDocument();
    expect(screen.queryByText(/🟢 Low/)).not.toBeInTheDocument();
  });
});

// ============================================================================
// OL-C: Card Rendering
// ============================================================================

describe("L6-OL-C: Obligation card content", () => {
  const obligation = mockObligation({
    id: "OB_CARD",
    title: "Risk Management System",
    article: "Article 9",
    description: "Establish and maintain a risk management system.",
    appliesToRole: "PROVIDER",
    deadline: "2026-08-02",
  });

  it("OL-C01: card shows obligation title", () => {
    render(<ObligationsList obligations={[obligation]} />);
    expect(screen.getByText("Risk Management System")).toBeInTheDocument();
  });

  it("OL-C02: card shows article reference", () => {
    render(<ObligationsList obligations={[obligation]} />);
    expect(screen.getByText("Article 9")).toBeInTheDocument();
  });

  it("OL-C03: card shows description", () => {
    render(<ObligationsList obligations={[obligation]} />);
    expect(screen.getByText(/Establish and maintain/)).toBeInTheDocument();
  });

  it("OL-C04: card shows role", () => {
    render(<ObligationsList obligations={[obligation]} />);
    expect(screen.getByText("Role: PROVIDER")).toBeInTheDocument();
  });

  it("OL-C05: card shows deadline", () => {
    render(<ObligationsList obligations={[obligation]} />);
    expect(screen.getByText("Deadline: 2026-08-02")).toBeInTheDocument();
  });

  it("OL-C06: '📄 Template available' shown when templateId exists", () => {
    render(
      <ObligationsList
        obligations={[mockObligation({ id: "T1", templateId: "TMPL_RISK" })]}
      />
    );
    expect(screen.getByText("📄 Template available")).toBeInTheDocument();
  });

  it("OL-C07: no template badge when templateId is absent", () => {
    const noTemplate = mockObligation({ id: "NT1" });
    delete (noTemplate as Record<string, unknown>).templateId;
    render(<ObligationsList obligations={[noTemplate]} />);
    expect(screen.queryByText("📄 Template available")).not.toBeInTheDocument();
  });

  it("OL-C08: each card has a priority dot with correct color", () => {
    const { container } = render(
      <ObligationsList
        obligations={[mockObligation({ priority: "CRITICAL", id: "C1" })]}
      />
    );
    expect(container.querySelector(".bg-red-500.rounded-full")).toBeInTheDocument();
  });
});

// ============================================================================
// OL-T: Description Truncation
// ============================================================================

describe("L6-OL-T: Description truncation at 200 chars", () => {
  it("OL-T01: short description (<= 200 chars) is not truncated", () => {
    const shortDesc = "This is a short description.";
    render(
      <ObligationsList
        obligations={[mockObligation({ id: "S1", description: shortDesc })]}
      />
    );
    expect(screen.getByText(shortDesc)).toBeInTheDocument();
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
  });

  it("OL-T02: description at exactly 200 chars is not truncated", () => {
    const exact200 = "A".repeat(200);
    render(
      <ObligationsList
        obligations={[mockObligation({ id: "E1", description: exact200 })]}
      />
    );
    expect(screen.getByText(exact200)).toBeInTheDocument();
  });

  it("OL-T03: description over 200 chars is truncated with '...'", () => {
    const longDesc = "B".repeat(250);
    render(
      <ObligationsList
        obligations={[mockObligation({ id: "L1", description: longDesc })]}
      />
    );
    const truncated = "B".repeat(200) + "...";
    expect(screen.getByText(truncated)).toBeInTheDocument();
  });

  it("OL-T04: truncated text is exactly 203 chars (200 + '...')", () => {
    const longDesc = "C".repeat(300);
    render(
      <ObligationsList
        obligations={[mockObligation({ id: "L2", description: longDesc })]}
      />
    );
    const rendered = screen.getByText(/C{10,}/).textContent!;
    expect(rendered.length).toBe(203);
  });

  it("OL-T05: description at 201 chars is truncated", () => {
    const desc201 = "D".repeat(201);
    render(
      <ObligationsList
        obligations={[mockObligation({ id: "L3", description: desc201 })]}
      />
    );
    const truncated = "D".repeat(200) + "...";
    expect(screen.getByText(truncated)).toBeInTheDocument();
  });
});

// ============================================================================
// OL-S: Structure & Styling
// ============================================================================

describe("L6-OL-S: Structural and styling checks", () => {
  it("OL-S01: outer container has rounded-2xl", () => {
    const { container } = render(
      <ObligationsList obligations={[mockObligation({ id: "S1" })]} />
    );
    expect(container.firstElementChild!.classList.contains("rounded-2xl")).toBe(true);
  });

  it("OL-S02: heading is h3 with 'Your Obligations'", () => {
    render(<ObligationsList obligations={[mockObligation({ id: "S1" })]} />);
    const h3 = screen.getByRole("heading", { level: 3 });
    expect(h3.textContent).toContain("Your Obligations");
  });

  it("OL-S03: subtitle mentions 'enforcement deadline'", () => {
    render(<ObligationsList obligations={[mockObligation({ id: "S1" })]} />);
    expect(screen.getByText(/enforcement deadline/)).toBeInTheDocument();
  });

  it("OL-S04: CRITICAL dot is bg-red-500", () => {
    const { container } = render(
      <ObligationsList
        obligations={[mockObligation({ priority: "CRITICAL", id: "C1" })]}
      />
    );
    expect(container.querySelector(".bg-red-500.rounded-full")).toBeInTheDocument();
  });

  it("OL-S05: HIGH dot is bg-orange-500", () => {
    const { container } = render(
      <ObligationsList
        obligations={[mockObligation({ priority: "HIGH", id: "H1" })]}
      />
    );
    expect(container.querySelector(".bg-orange-500.rounded-full")).toBeInTheDocument();
  });

  it("OL-S06: MEDIUM dot is bg-yellow-500", () => {
    const { container } = render(
      <ObligationsList
        obligations={[mockObligation({ priority: "MEDIUM", id: "M1" })]}
      />
    );
    expect(container.querySelector(".bg-yellow-500.rounded-full")).toBeInTheDocument();
  });

  it("OL-S07: LOW dot is bg-green-500", () => {
    const { container } = render(
      <ObligationsList
        obligations={[mockObligation({ priority: "LOW", id: "L1" })]}
      />
    );
    expect(container.querySelector(".bg-green-500.rounded-full")).toBeInTheDocument();
  });
});
