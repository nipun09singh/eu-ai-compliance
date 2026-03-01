/**
 * LAYER 6 — ClassificationBadge Component Tests (L6-CB)
 *
 * Pure presentational component: receives `classification` prop,
 * renders icon + label + description + color-coded styling from a
 * static CONFIG record covering all 6 RiskClassification values.
 *
 * 20 tests across 2 groups:
 *   CB-C: All 6 classifications (12 tests)
 *   CB-S: Structure & styling (8 tests)
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClassificationBadge from "@/components/result/ClassificationBadge";
import type { RiskClassification } from "@/lib/classification-engine";

// ============================================================================
// CB-C: All 6 Classifications
// ============================================================================

describe("L6-CB-C: Classification rendering for all 6 risk levels", () => {
  it("CB-C01: PROHIBITED → red styling + 'PROHIBITED' label", () => {
    const { container } = render(<ClassificationBadge classification="PROHIBITED" />);
    expect(screen.getByText("PROHIBITED")).toBeInTheDocument();
    expect(container.querySelector(".text-red-400")).toBeInTheDocument();
  });

  it("CB-C02: PROHIBITED → '🚨' icon + 'BANNED' description", () => {
    render(<ClassificationBadge classification="PROHIBITED" />);
    expect(screen.getByText("🚨")).toBeInTheDocument();
    expect(screen.getByText(/BANNED/)).toBeInTheDocument();
  });

  it("CB-C03: HIGH_RISK → orange styling + 'HIGH RISK' label", () => {
    const { container } = render(<ClassificationBadge classification="HIGH_RISK" />);
    expect(screen.getByText("HIGH RISK")).toBeInTheDocument();
    expect(container.querySelector(".text-orange-400")).toBeInTheDocument();
  });

  it("CB-C04: HIGH_RISK → '⚠️' icon + 'Significant compliance' description", () => {
    render(<ClassificationBadge classification="HIGH_RISK" />);
    expect(screen.getByText("⚠️")).toBeInTheDocument();
    expect(screen.getByText(/Significant compliance/)).toBeInTheDocument();
  });

  it("CB-C05: LIMITED_RISK → yellow styling + 'LIMITED RISK' label", () => {
    const { container } = render(<ClassificationBadge classification="LIMITED_RISK" />);
    expect(screen.getByText("LIMITED RISK")).toBeInTheDocument();
    expect(container.querySelector(".text-yellow-400")).toBeInTheDocument();
  });

  it("CB-C06: LIMITED_RISK → '👁️' icon + 'Transparency' description", () => {
    render(<ClassificationBadge classification="LIMITED_RISK" />);
    expect(screen.getByText("👁️")).toBeInTheDocument();
    expect(screen.getByText(/Transparency/)).toBeInTheDocument();
  });

  it("CB-C07: GPAI → violet styling + 'GPAI MODEL' label", () => {
    const { container } = render(<ClassificationBadge classification="GPAI" />);
    expect(screen.getByText("GPAI MODEL")).toBeInTheDocument();
    expect(container.querySelector(".text-violet-400")).toBeInTheDocument();
  });

  it("CB-C08: GPAI → '🧠' icon + 'General-purpose' description", () => {
    render(<ClassificationBadge classification="GPAI" />);
    expect(screen.getByText("🧠")).toBeInTheDocument();
    expect(screen.getByText(/General-purpose/)).toBeInTheDocument();
  });

  it("CB-C09: GPAI_SYSTEMIC → violet styling + 'GPAI — SYSTEMIC RISK' label", () => {
    const { container } = render(<ClassificationBadge classification="GPAI_SYSTEMIC" />);
    expect(screen.getByText("GPAI — SYSTEMIC RISK")).toBeInTheDocument();
    expect(container.querySelector(".text-violet-300")).toBeInTheDocument();
  });

  it("CB-C10: GPAI_SYSTEMIC → '🧠⚠️' icon + 'Highest GPAI tier' description", () => {
    render(<ClassificationBadge classification="GPAI_SYSTEMIC" />);
    expect(screen.getByText("🧠⚠️")).toBeInTheDocument();
    expect(screen.getByText(/Highest GPAI tier/)).toBeInTheDocument();
  });

  it("CB-C11: MINIMAL_RISK → green styling + 'MINIMAL RISK' label", () => {
    const { container } = render(<ClassificationBadge classification="MINIMAL_RISK" />);
    expect(screen.getByText("MINIMAL RISK")).toBeInTheDocument();
    expect(container.querySelector(".text-green-400")).toBeInTheDocument();
  });

  it("CB-C12: MINIMAL_RISK → '✅' icon + 'No mandatory requirements' description", () => {
    render(<ClassificationBadge classification="MINIMAL_RISK" />);
    expect(screen.getByText("✅")).toBeInTheDocument();
    expect(screen.getByText(/No mandatory requirements/)).toBeInTheDocument();
  });
});

// ============================================================================
// CB-S: Structure & Styling
// ============================================================================

describe("L6-CB-S: Badge structure and styling", () => {
  it("CB-S01: outer div has rounded-2xl", () => {
    const { container } = render(<ClassificationBadge classification="HIGH_RISK" />);
    expect(container.firstElementChild!.classList.contains("rounded-2xl")).toBe(true);
  });

  it("CB-S02: outer div has border-2", () => {
    const { container } = render(<ClassificationBadge classification="HIGH_RISK" />);
    expect(container.firstElementChild!.classList.contains("border-2")).toBe(true);
  });

  it("CB-S03: badge is centered (text-center)", () => {
    const { container } = render(<ClassificationBadge classification="HIGH_RISK" />);
    expect(container.firstElementChild!.classList.contains("text-center")).toBe(true);
  });

  it("CB-S04: icon is text-5xl", () => {
    const { container } = render(<ClassificationBadge classification="HIGH_RISK" />);
    expect(container.querySelector(".text-5xl")).toBeInTheDocument();
  });

  it("CB-S05: label is text-3xl font-black", () => {
    const { container } = render(<ClassificationBadge classification="HIGH_RISK" />);
    const h2 = container.querySelector("h2");
    expect(h2).toBeInTheDocument();
    expect(h2!.classList.contains("text-3xl")).toBe(true);
    expect(h2!.classList.contains("font-black")).toBe(true);
  });

  it("CB-S06: description is text-lg with muted color", () => {
    const { container } = render(<ClassificationBadge classification="HIGH_RISK" />);
    const desc = container.querySelector("p");
    expect(desc).toBeInTheDocument();
    expect(desc!.classList.contains("text-lg")).toBe(true);
  });

  it("CB-S07: each classification gets the correct bg-* class", () => {
    const bgMap: Record<RiskClassification, string> = {
      PROHIBITED: "bg-red-500/10",
      HIGH_RISK: "bg-orange-500/10",
      LIMITED_RISK: "bg-yellow-500/10",
      GPAI: "bg-violet-500/10",
      GPAI_SYSTEMIC: "bg-violet-500/15",
      MINIMAL_RISK: "bg-green-500/10",
    };
    for (const [cls, bg] of Object.entries(bgMap)) {
      const { container, unmount } = render(
        <ClassificationBadge classification={cls as RiskClassification} />
      );
      expect(container.firstElementChild!.className).toContain(bg);
      unmount();
    }
  });

  it("CB-S08: each classification gets the correct border-* class", () => {
    const borderMap: Record<RiskClassification, string> = {
      PROHIBITED: "border-red-500/30",
      HIGH_RISK: "border-orange-500/30",
      LIMITED_RISK: "border-yellow-500/30",
      GPAI: "border-violet-500/30",
      GPAI_SYSTEMIC: "border-violet-400/40",
      MINIMAL_RISK: "border-green-500/30",
    };
    for (const [cls, border] of Object.entries(borderMap)) {
      const { container, unmount } = render(
        <ClassificationBadge classification={cls as RiskClassification} />
      );
      expect(container.firstElementChild!.className).toContain(border);
      unmount();
    }
  });
});
