/**
 * LAYER 6 — TimelineView Component Tests (L6-TV)
 *
 * Renders enforcement milestones from getEnforcementTimeline().
 * Highlights the user's deadline. Shows ENFORCED/UPCOMING status.
 *
 * 22 tests across 3 groups:
 *   TV-R: Rendering & milestones (8 tests)
 *   TV-H: User deadline highlighting (7 tests)
 *   TV-S: Status badges (7 tests)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import TimelineView from "@/components/result/TimelineView";

// Mock the classification engine to control milestones
vi.mock("@/lib/classification-engine", () => ({
  getEnforcementTimeline: vi.fn(),
}));

import { getEnforcementTimeline } from "@/lib/classification-engine";
const mockedGetTimeline = vi.mocked(getEnforcementTimeline);

// Mock milestones factory
function makeMilestones(
  overrides?: Array<{
    date?: Date;
    dateString?: string;
    label?: string;
    status?: "ENFORCED" | "UPCOMING";
    daysUntil?: number;
    articles?: string[];
  }>
) {
  const defaults = [
    {
      date: new Date("2025-02-02"),
      dateString: "2025-02-02",
      label: "Prohibited practices & general provisions",
      status: "ENFORCED" as const,
      daysUntil: 0,
      articles: ["Article 4", "Article 5"],
    },
    {
      date: new Date("2025-08-02"),
      dateString: "2025-08-02",
      label: "GPAI obligations, notified bodies & governance",
      status: "ENFORCED" as const,
      daysUntil: 0,
      articles: ["Articles 51-56"],
    },
    {
      date: new Date("2026-08-02"),
      dateString: "2026-08-02",
      label: "HIGH-RISK obligations + transparency",
      status: "UPCOMING" as const,
      daysUntil: 365,
      articles: ["Articles 6-49"],
    },
    {
      date: new Date("2027-08-02"),
      dateString: "2027-08-02",
      label: "Product safety AI (Annex I, Section A)",
      status: "UPCOMING" as const,
      daysUntil: 730,
      articles: ["Article 6(1)"],
    },
  ];
  if (overrides) {
    return overrides.map((o, i) => ({ ...defaults[i] ?? defaults[0], ...o }));
  }
  return defaults;
}

beforeEach(() => {
  mockedGetTimeline.mockReturnValue(makeMilestones());
});

// ============================================================================
// TV-R: Rendering & Milestones
// ============================================================================

describe("L6-TV-R: Milestone rendering", () => {
  it("TV-R01: renders the heading '📅 Enforcement Timeline'", () => {
    render(<TimelineView currentDeadline="2026-08-02" />);
    expect(screen.getByText(/Enforcement Timeline/)).toBeInTheDocument();
  });

  it("TV-R02: renders subtitle mentioning highlighted deadline", () => {
    render(<TimelineView currentDeadline="2026-08-02" />);
    expect(screen.getByText(/Your deadline is highlighted/)).toBeInTheDocument();
  });

  it("TV-R03: renders all milestone date strings", () => {
    render(<TimelineView currentDeadline="2026-08-02" />);
    expect(screen.getByText("2025-02-02")).toBeInTheDocument();
    expect(screen.getByText("2025-08-02")).toBeInTheDocument();
    expect(screen.getByText("2026-08-02")).toBeInTheDocument();
    expect(screen.getByText("2027-08-02")).toBeInTheDocument();
  });

  it("TV-R04: renders milestone labels", () => {
    render(<TimelineView currentDeadline="2026-08-02" />);
    expect(screen.getByText(/Prohibited practices/)).toBeInTheDocument();
    expect(screen.getByText(/HIGH-RISK obligations/)).toBeInTheDocument();
  });

  it("TV-R05: renders each milestone as a flex row", () => {
    const { container } = render(<TimelineView currentDeadline="2026-08-02" />);
    const rows = container.querySelectorAll(".flex.gap-4");
    expect(rows.length).toBe(4);
  });

  it("TV-R06: timeline connecting lines exist between milestones", () => {
    const { container } = render(<TimelineView currentDeadline="2026-08-02" />);
    // Last milestone should NOT have a connecting line
    const connectors = container.querySelectorAll(".w-0\\.5");
    expect(connectors.length).toBe(3); // 4 milestones - 1
  });

  it("TV-R07: handles single milestone without connector", () => {
    mockedGetTimeline.mockReturnValue(
      makeMilestones([
        {
          dateString: "2026-08-02",
          label: "Only milestone",
          status: "UPCOMING",
          daysUntil: 365,
        },
      ])
    );
    const { container } = render(<TimelineView currentDeadline="2026-08-02" />);
    const connectors = container.querySelectorAll(".w-0\\.5");
    expect(connectors.length).toBe(0);
  });

  it("TV-R08: calls getEnforcementTimeline on render", () => {
    render(<TimelineView currentDeadline="2026-08-02" />);
    expect(mockedGetTimeline).toHaveBeenCalled();
  });
});

// ============================================================================
// TV-H: User Deadline Highlighting
// ============================================================================

describe("L6-TV-H: User deadline highlighting (YOUR DEADLINE badge)", () => {
  it("TV-H01: shows 'YOUR DEADLINE' badge for matching milestone", () => {
    render(<TimelineView currentDeadline="2026-08-02" />);
    expect(screen.getByText("YOUR DEADLINE")).toBeInTheDocument();
  });

  it("TV-H02: 'YOUR DEADLINE' badge has orange styling", () => {
    render(<TimelineView currentDeadline="2026-08-02" />);
    const badge = screen.getByText("YOUR DEADLINE");
    expect(badge.classList.contains("text-orange-400")).toBe(true);
  });

  it("TV-H03: highlighted milestone has orange background container", () => {
    render(<TimelineView currentDeadline="2026-08-02" />);
    const badge = screen.getByText("YOUR DEADLINE");
    const milestone = badge.closest(".bg-orange-500\\/5");
    expect(milestone).toBeInTheDocument();
  });

  it("TV-H04: non-matching milestones do NOT get 'YOUR DEADLINE'", () => {
    render(<TimelineView currentDeadline="2026-08-02" />);
    const allBadges = screen.getAllByText("YOUR DEADLINE");
    expect(allBadges.length).toBe(1);
  });

  it("TV-H05: no 'YOUR DEADLINE' banner when deadline doesn't match any milestone", () => {
    render(<TimelineView currentDeadline="2099-01-01" />);
    expect(screen.queryByText("YOUR DEADLINE")).not.toBeInTheDocument();
  });

  it("TV-H06: deadline dot gets orange ring for user's milestone", () => {
    const { container } = render(<TimelineView currentDeadline="2026-08-02" />);
    expect(container.querySelector(".ring-orange-500\\/20")).toBeInTheDocument();
  });

  it("TV-H07: highlighted milestone dot is bg-orange-500", () => {
    const { container } = render(<TimelineView currentDeadline="2026-08-02" />);
    expect(
      container.querySelector(".bg-orange-500.ring-4.ring-orange-500\\/20")
    ).toBeInTheDocument();
  });
});

// ============================================================================
// TV-S: Status Badges
// ============================================================================

describe("L6-TV-S: ENFORCED / UPCOMING status badges", () => {
  it("TV-S01: ENFORCED milestones show 'ENFORCED' badge", () => {
    render(<TimelineView currentDeadline="2026-08-02" />);
    const badges = screen.getAllByText("ENFORCED");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("TV-S02: ENFORCED badge has green styling", () => {
    render(<TimelineView currentDeadline="2026-08-02" />);
    const badge = screen.getAllByText("ENFORCED")[0];
    expect(badge.classList.contains("text-green-400")).toBe(true);
  });

  it("TV-S03: ENFORCED dots are bg-green-500", () => {
    const { container } = render(<TimelineView currentDeadline="2099-01-01" />);
    const greenDots = container.querySelectorAll(
      ".bg-green-500.rounded-full:not(.ring-4)"
    );
    expect(greenDots.length).toBe(2); // 2 enforced milestones
  });

  it("TV-S04: UPCOMING milestones show 'X days left' badge", () => {
    render(<TimelineView currentDeadline="2099-01-01" />);
    const daysLeftBadges = screen.getAllByText(/days left/);
    expect(daysLeftBadges.length).toBe(2);
    expect(daysLeftBadges[0].textContent).toContain("365");
    expect(daysLeftBadges[1].textContent).toContain("730");
  });

  it("TV-S05: 'days left' badge has yellow styling", () => {
    render(<TimelineView currentDeadline="2099-01-01" />);
    const badges = screen.getAllByText(/days left/);
    expect(badges[0].classList.contains("text-yellow-400")).toBe(true);
  });

  it("TV-S06: UPCOMING milestones with daysUntil=0 do NOT show days left", () => {
    mockedGetTimeline.mockReturnValue(
      makeMilestones([
        {
          dateString: "2026-08-02",
          label: "Today milestone",
          status: "UPCOMING",
          daysUntil: 0,
        },
      ])
    );
    render(<TimelineView currentDeadline="2099-01-01" />);
    expect(screen.queryAllByText(/days left/).length).toBe(0);
  });

  it("TV-S07: ENFORCED line connectors are green", () => {
    const { container } = render(<TimelineView currentDeadline="2099-01-01" />);
    const greenLines = container.querySelectorAll(".bg-green-500\\/30.w-0\\.5");
    expect(greenLines.length).toBeGreaterThanOrEqual(1);
  });
});
