/**
 * LAYER 6 — Result Page Tests (L6-RP)
 *
 * Client-side result page that reads classification from sessionStorage
 * and renders multiple result sections conditionally.
 *
 * 35 tests across 9 groups:
 *   RP-L: Loading & redirect (3 tests)
 *   RP-H: Header (3 tests)
 *   RP-IC: InfoCards (5 tests)
 *   RP-A: Alert sections (6 tests)
 *   RP-C: Conditional sections (6 tests)
 *   RP-NS: Next steps (3 tests)
 *   RP-CH: Child component rendering (4 tests)
 *   RP-D: Disclaimer (2 tests)
 *   RP-S: Structure & styling (3 tests)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ResultPage from "@/app/result/page";

// ============================================================================
// Module mocks
// ============================================================================
const mockPush = vi.fn();
const mockRouter = { push: mockPush };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock all child components to isolate page logic
vi.mock("@/components/result/ClassificationBadge", () => ({
  default: ({ classification }: any) => (
    <div data-testid="classification-badge">{classification}</div>
  ),
}));

vi.mock("@/components/result/ObligationsList", () => ({
  default: ({ obligations }: any) => (
    <div data-testid="obligations-list">{obligations?.length ?? 0} obligations</div>
  ),
}));

vi.mock("@/components/result/FineCalculator", () => ({
  default: ({ fineRisk }: any) => (
    <div data-testid="fine-calculator">{fineRisk?.maxEuro ?? "none"}</div>
  ),
}));

vi.mock("@/components/result/TimelineView", () => ({
  default: ({ currentDeadline }: any) => (
    <div data-testid="timeline-view">{currentDeadline}</div>
  ),
}));

vi.mock("@/components/result/DocumentGenerator", () => ({
  default: ({ result, companyName }: any) => (
    <div data-testid="doc-generator">{companyName}</div>
  ),
}));

// ── Test data ────────────────────────────────────────────────────────────────

function fullResult() {
  return {
    classification: "HIGH_RISK",
    confidence: "DEFINITIVE",
    role: "PROVIDER",
    detectedRoles: ["PROVIDER"],
    legalBasis: ["Article 6", "Annex III"],
    obligations: [
      { title: "Risk Management", priority: "CRITICAL", article: "Art 9" },
      { title: "Data Governance", priority: "HIGH", article: "Art 10" },
    ],
    fineRisk: { maxEuro: 15000000, maxPercentTurnover: 3, article: "Art 99(3)" },
    enforcementDeadline: "2026-08-01",
    nextSteps: ["Appoint compliance officer", "Conduct risk assessment", "Prepare documentation"],
    warnings: ["You are close to prohibited territory"],
    smeSimplifications: ["Simplified conformity assessment available"],
    art25ProviderUpgrade: false,
    substantialModificationFlag: false,
    sectorSpecificGuidance: [],
    gdprInterplay: [],
    transitionalProvisions: [],
    valueChainWarnings: [],
    sandboxGuidance: [],
    authorityCooperation: [],
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function setSessionResult(result: any, answers?: any) {
  sessionStorage.setItem("classificationResult", JSON.stringify(result));
  if (answers) {
    sessionStorage.setItem("wizardAnswers", JSON.stringify(answers));
  }
}

beforeEach(() => {
  mockPush.mockClear();
  sessionStorage.clear();
});

// ============================================================================
// RP-L: Loading & redirect
// ============================================================================
describe("L6-RP-L: Loading & redirect", () => {
  it("RP-L01: shows loading message when no result in session", () => {
    render(<ResultPage />);
    expect(screen.getByText("Loading classification...")).toBeInTheDocument();
  });

  it("RP-L02: redirects to /wizard when no result stored", () => {
    render(<ResultPage />);
    expect(mockPush).toHaveBeenCalledWith("/wizard");
  });

  it("RP-L03: does NOT redirect when result exists in session", () => {
    setSessionResult(fullResult());
    render(<ResultPage />);
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ============================================================================
// RP-H: Header
// ============================================================================
describe("L6-RP-H: Header", () => {
  beforeEach(() => setSessionResult(fullResult(), { companyName: "Acme Corp" }));

  it("RP-H01: shows 'Your Classification Result' heading", () => {
    render(<ResultPage />);
    expect(screen.getByText("Your Classification Result")).toBeInTheDocument();
  });

  it("RP-H02: heading is h1 element", () => {
    render(<ResultPage />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Your Classification Result");
  });

  it("RP-H03: shows retake assessment link to /wizard", () => {
    render(<ResultPage />);
    const link = screen.getByText("← Retake assessment");
    expect(link.closest("a")).toHaveAttribute("href", "/wizard");
  });
});

// ============================================================================
// RP-IC: InfoCards
// ============================================================================
describe("L6-RP-IC: InfoCards", () => {
  beforeEach(() => setSessionResult(fullResult()));

  it("RP-IC01: shows Confidence card", () => {
    render(<ResultPage />);
    expect(screen.getByText("Confidence")).toBeInTheDocument();
    expect(screen.getByText("DEFINITIVE")).toBeInTheDocument();
  });

  it("RP-IC02: shows 'Clear-cut classification' for DEFINITIVE", () => {
    render(<ResultPage />);
    expect(screen.getByText("Clear-cut classification")).toBeInTheDocument();
  });

  it("RP-IC03: shows Role card", () => {
    render(<ResultPage />);
    expect(screen.getByText("Your Role")).toBeInTheDocument();
    expect(screen.getByText("PROVIDER")).toBeInTheDocument();
  });

  it("RP-IC04: shows Legal Basis card", () => {
    render(<ResultPage />);
    expect(screen.getByText("Legal Basis")).toBeInTheDocument();
    expect(screen.getByText("Article 6, Annex III")).toBeInTheDocument();
  });

  it("RP-IC05: shows 'LIKELY' confidence description", () => {
    const r = fullResult();
    r.confidence = "LIKELY";
    setSessionResult(r);
    render(<ResultPage />);
    expect(screen.getByText("High confidence, edge cases possible")).toBeInTheDocument();
  });
});

// ============================================================================
// RP-A: Alert sections
// ============================================================================
describe("L6-RP-A: Alert sections", () => {
  it("RP-A01: shows Art 25 alert when art25ProviderUpgrade is true", () => {
    const r = fullResult();
    r.art25ProviderUpgrade = true;
    setSessionResult(r);
    render(<ResultPage />);
    expect(screen.getByText(/Art 25 Role Upgrade/)).toBeInTheDocument();
  });

  it("RP-A02: hides Art 25 alert when art25ProviderUpgrade is false", () => {
    setSessionResult(fullResult());
    render(<ResultPage />);
    expect(screen.queryByText(/Art 25 Role Upgrade/)).not.toBeInTheDocument();
  });

  it("RP-A03: shows substantial modification alert when flag is true", () => {
    const r = fullResult();
    r.substantialModificationFlag = true;
    setSessionResult(r);
    render(<ResultPage />);
    expect(screen.getByText(/Substantial Modification Detected/)).toBeInTheDocument();
  });

  it("RP-A04: shows warnings section when warnings exist", () => {
    setSessionResult(fullResult());
    render(<ResultPage />);
    expect(screen.getByText("⚠️ Important Warnings")).toBeInTheDocument();
    expect(screen.getByText("You are close to prohibited territory")).toBeInTheDocument();
  });

  it("RP-A05: hides warnings section when warnings array is empty", () => {
    const r = fullResult();
    r.warnings = [];
    setSessionResult(r);
    render(<ResultPage />);
    expect(screen.queryByText("⚠️ Important Warnings")).not.toBeInTheDocument();
  });

  it("RP-A06: shows SME advantages when smeSimplifications exist", () => {
    setSessionResult(fullResult());
    render(<ResultPage />);
    expect(screen.getByText("💡 SME Advantages")).toBeInTheDocument();
    expect(screen.getByText("Simplified conformity assessment available")).toBeInTheDocument();
  });
});

// ============================================================================
// RP-C: Conditional sections
// ============================================================================
describe("L6-RP-C: Conditional sections", () => {
  it("RP-C01: shows sector guidance when present", () => {
    const r = fullResult();
    r.sectorSpecificGuidance = ["Medical device rules apply"];
    setSessionResult(r);
    render(<ResultPage />);
    expect(screen.getByText("🏥 Sector-Specific Requirements")).toBeInTheDocument();
    expect(screen.getByText("Medical device rules apply")).toBeInTheDocument();
  });

  it("RP-C02: shows GDPR interplay when present", () => {
    const r = fullResult();
    r.gdprInterplay = ["DPIA required under GDPR"];
    setSessionResult(r);
    render(<ResultPage />);
    expect(screen.getByText("🔒 GDPR & Data Protection")).toBeInTheDocument();
    expect(screen.getByText("DPIA required under GDPR")).toBeInTheDocument();
  });

  it("RP-C03: shows transitional provisions when present", () => {
    const r = fullResult();
    r.transitionalProvisions = ["Grace period until 2027"];
    setSessionResult(r);
    render(<ResultPage />);
    expect(screen.getByText("⏳ Transitional Provisions")).toBeInTheDocument();
    expect(screen.getByText("Grace period until 2027")).toBeInTheDocument();
  });

  it("RP-C04: shows value chain warnings when present", () => {
    const r = fullResult();
    r.valueChainWarnings = ["Upstream provider obligations"];
    setSessionResult(r);
    render(<ResultPage />);
    expect(screen.getByText("🔗 Supply Chain Obligations")).toBeInTheDocument();
  });

  it("RP-C05: shows sandbox guidance when present", () => {
    const r = fullResult();
    r.sandboxGuidance = ["Apply to national sandbox"];
    setSessionResult(r);
    render(<ResultPage />);
    expect(screen.getByText("🧪 Regulatory Sandbox Opportunity")).toBeInTheDocument();
  });

  it("RP-C06: shows authority cooperation when present", () => {
    const r = fullResult();
    r.authorityCooperation = ["Annual audit expected"];
    setSessionResult(r);
    render(<ResultPage />);
    expect(screen.getByText("🏛️ Regulatory Authority Cooperation")).toBeInTheDocument();
  });
});

// ============================================================================
// RP-NS: Next steps
// ============================================================================
describe("L6-RP-NS: Next steps", () => {
  beforeEach(() => setSessionResult(fullResult()));

  it("RP-NS01: shows '🚀 Next Steps' heading", () => {
    render(<ResultPage />);
    expect(screen.getByText("🚀 Next Steps")).toBeInTheDocument();
  });

  it("RP-NS02: shows all next step items", () => {
    render(<ResultPage />);
    expect(screen.getByText("Appoint compliance officer")).toBeInTheDocument();
    expect(screen.getByText("Conduct risk assessment")).toBeInTheDocument();
    expect(screen.getByText("Prepare documentation")).toBeInTheDocument();
  });

  it("RP-NS03: shows numbered badges for each step", () => {
    render(<ResultPage />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

// ============================================================================
// RP-CH: Child components rendered with proper props
// ============================================================================
describe("L6-RP-CH: Child components", () => {
  beforeEach(() => setSessionResult(fullResult(), { companyName: "TestCo", systemDescription: "AI thing" }));

  it("RP-CH01: renders ClassificationBadge with classification", () => {
    render(<ResultPage />);
    const badge = screen.getByTestId("classification-badge");
    expect(badge.textContent).toBe("HIGH_RISK");
  });

  it("RP-CH02: renders FineCalculator", () => {
    render(<ResultPage />);
    expect(screen.getByTestId("fine-calculator")).toBeInTheDocument();
  });

  it("RP-CH03: renders ObligationsList with obligations", () => {
    render(<ResultPage />);
    const list = screen.getByTestId("obligations-list");
    expect(list.textContent).toContain("2 obligations");
  });

  it("RP-CH04: renders DocumentGenerator with companyName from session", () => {
    render(<ResultPage />);
    const gen = screen.getByTestId("doc-generator");
    expect(gen.textContent).toBe("TestCo");
  });
});

// ============================================================================
// RP-D: Disclaimer
// ============================================================================
describe("L6-RP-D: Disclaimer", () => {
  beforeEach(() => setSessionResult(fullResult()));

  it("RP-D01: shows legal disclaimer text", () => {
    render(<ResultPage />);
    expect(screen.getByText(/does not constitute legal advice/)).toBeInTheDocument();
  });

  it("RP-D02: shows Regulation (EU) 2024/1689 reference", () => {
    render(<ResultPage />);
    expect(screen.getByText(/Regulation \(EU\) 2024\/1689/)).toBeInTheDocument();
  });
});

// ============================================================================
// RP-S: Structure & styling
// ============================================================================
describe("L6-RP-S: Structure & styling", () => {
  beforeEach(() => setSessionResult(fullResult()));

  it("RP-S01: wrapper has max-w-4xl", () => {
    const { container } = render(<ResultPage />);
    const wrapper = container.querySelector(".max-w-4xl");
    expect(wrapper).toBeInTheDocument();
  });

  it("RP-S02: wrapper has px-6 py-10", () => {
    const { container } = render(<ResultPage />);
    const wrapper = container.querySelector(".max-w-4xl");
    expect(wrapper?.className).toContain("px-6");
    expect(wrapper?.className).toContain("py-10");
  });

  it("RP-S03: loading state has flex centering", () => {
    // Clear result to trigger loading state
    sessionStorage.clear();
    const { container } = render(<ResultPage />);
    const loadingText = screen.getByText("Loading classification...");
    const wrapper = loadingText.parentElement;
    expect(wrapper?.className).toContain("flex");
    expect(wrapper?.className).toContain("items-center");
    expect(wrapper?.className).toContain("justify-center");
  });
});
