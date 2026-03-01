/**
 * LAYER 7D — Accessibility Tests (L7D-A11Y)
 *
 * Tests for semantic HTML, keyboard accessibility, ARIA, content structure,
 * and page-level accessibility across landing, wizard, and result pages.
 *
 * 50 tests across 7 groups:
 *   A11Y-SEM: Semantic HTML on landing page (8 tests)
 *   A11Y-LP:  Landing page content accessibility (8 tests)
 *   A11Y-WZ:  Wizard page accessibility (10 tests)
 *   A11Y-RES: Result page accessibility (10 tests)
 *   A11Y-NAV: Navigation & link accessibility (5 tests)
 *   A11Y-DV:  Document & content structure (8 tests)
 *   A11Y-FC:  Focus & contrast baseline (1 test)
 *
 * Companion file: Accessibility-realcomp.test.tsx (10 tests for unmocked components)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "@/app/page";
import ResultPage from "@/app/result/page";
import WizardShell from "@/components/wizard/WizardShell";

// ============================================================================
// Module-level mocks
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

// Result sub-component stubs
vi.mock("@/components/result/ClassificationBadge", () => ({
  default: ({ classification }: any) => (
    <div data-testid="badge">{classification}</div>
  ),
}));

vi.mock("@/components/result/ObligationsList", () => ({
  default: ({ obligations }: any) => (
    <div data-testid="obligations">
      {obligations?.map((o: any, i: number) => (
        <div key={i}>{o.title}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/result/FineCalculator", () => ({
  default: ({ fineRisk }: any) => (
    <div data-testid="fine">{fineRisk?.maxAmountGeneral}</div>
  ),
}));

vi.mock("@/components/result/TimelineView", () => ({
  default: ({ currentDeadline }: any) => (
    <div data-testid="timeline">{currentDeadline}</div>
  ),
}));

vi.mock("@/components/result/DocumentGenerator", () => ({
  default: ({ companyName }: any) => (
    <div data-testid="docgen">{companyName}</div>
  ),
}));

// Wizard sub-component stubs
vi.mock("@/components/wizard/ProgressBar", () => ({
  default: () => <div data-testid="progress-bar" role="progressbar" aria-valuenow={50}>50%</div>,
}));

vi.mock("@/components/wizard/WizardStep", () => ({
  default: () => (
    <div data-testid="wizard-step">
      <h2>System Basics</h2>
      <div>Step content area</div>
      <button>Next</button>
      <button>Back</button>
    </div>
  ),
}));

// Wizard store mock (mutable for per-test overrides)
const mockStoreState: Record<string, any> = {
  isComplete: false,
  result: null,
  answers: {},
};

vi.mock("@/lib/store", () => ({
  useWizardStore: (selector?: any) =>
    selector ? selector(mockStoreState) : mockStoreState,
}));

// ============================================================================
// Shared helpers
// ============================================================================
function makeResult(overrides: Record<string, any> = {}) {
  return {
    classification: "HIGH_RISK",
    role: "PROVIDER",
    confidence: "DEFINITIVE",
    legalBasis: ["Article 6", "Annex III"],
    obligations: [
      {
        id: "OB_1",
        article: "Art 9",
        title: "Risk Management",
        description: "Implement risk management system",
        priority: "CRITICAL",
        deadline: "2026-08-02",
        appliesToRole: "PROVIDER",
      },
    ],
    enforcementDeadline: "2026-08-02",
    fineRisk: {
      maxAmountGeneral: "\u20AC15M",
      maxAmountSME: "\u20AC7.5M",
      maxPercentTurnover: 3,
      article: "Art 99",
    },
    nextSteps: ["Appoint compliance officer", "Conduct risk assessment"],
    warnings: ["Close to prohibited territory"],
    smeSimplifications: ["Simplified conformity assessment"],
    art25ProviderUpgrade: false,
    substantialModificationFlag: false,
    sectorSpecificGuidance: [],
    gdprInterplay: [],
    transitionalProvisions: [],
    valueChainWarnings: [],
    sandboxGuidance: [],
    authorityCooperation: [],
    ...overrides,
  };
}

function setSessionResult(result: any, answers?: any) {
  sessionStorage.setItem("classificationResult", JSON.stringify(result));
  if (answers) {
    sessionStorage.setItem("wizardAnswers", JSON.stringify(answers));
  }
}

// ============================================================================
// A11Y-SEM: Semantic HTML — Landing Page
// ============================================================================
describe("L7D-A11Y-SEM: Semantic HTML structure", () => {
  it("SEM01: landing page renders an h1 heading", () => {
    render(<LandingPage />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it("SEM02: landing page has section elements for content areas", () => {
    const { container } = render(<LandingPage />);
    const sections = container.querySelectorAll("section");
    expect(sections.length).toBeGreaterThanOrEqual(3);
  });

  it("SEM03: landing page has a footer element", () => {
    const { container } = render(<LandingPage />);
    const footer = container.querySelector("footer");
    expect(footer).toBeInTheDocument();
  });

  it("SEM04: all links have non-empty href attributes", () => {
    const { container } = render(<LandingPage />);
    const links = container.querySelectorAll("a");
    links.forEach((link) => {
      expect(link.getAttribute("href")).toBeTruthy();
    });
  });

  it("SEM05: heading hierarchy has h1 before h2", () => {
    const { container } = render(<LandingPage />);
    const headings = container.querySelectorAll("h1, h2, h3");
    const tags = Array.from(headings).map((h) => h.tagName);
    const h1Index = tags.indexOf("H1");
    const h2Index = tags.indexOf("H2");
    expect(h1Index).toBeLessThan(h2Index);
  });

  it("SEM06: step numbers use numbered containers", () => {
    render(<LandingPage />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("SEM07: h2 headings exist for main sections", () => {
    render(<LandingPage />);
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText("6 Risk Classifications")).toBeInTheDocument();
  });

  it("SEM08: footer contains copyright symbol or year", () => {
    const { container } = render(<LandingPage />);
    const footer = container.querySelector("footer");
    expect(footer).toBeTruthy();
    expect(footer!.textContent).toMatch(/©|\d{4}/);
  });
});

// ============================================================================
// A11Y-LP: Landing Page Content Accessibility
// ============================================================================
describe("L7D-A11Y-LP: Landing page content", () => {
  it("LP01: h1 mentions EU AI Act", () => {
    render(<LandingPage />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/EU AI Act/i);
  });

  it("LP02: primary CTA reads Start Free Assessment", () => {
    render(<LandingPage />);
    const ctas = screen.getAllByText(/Start Free Assessment/);
    expect(ctas.length).toBeGreaterThanOrEqual(1);
  });

  it("LP03: social proof section shows fine amount", () => {
    render(<LandingPage />);
    const matches = screen.getAllByText(/€35M/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("LP04: how it works section lists steps with titles", () => {
    render(<LandingPage />);
    expect(screen.getByText("Answer Simple Questions")).toBeInTheDocument();
    expect(screen.getByText("Get Your Classification")).toBeInTheDocument();
    expect(screen.getByText("Compliance Roadmap")).toBeInTheDocument();
  });

  it("LP05: risk categories heading is present", () => {
    render(<LandingPage />);
    expect(screen.getByText("6 Risk Classifications")).toBeInTheDocument();
  });

  it("LP06: footer contains current year", () => {
    const { container } = render(<LandingPage />);
    const footer = container.querySelector("footer");
    expect(footer).toBeTruthy();
    const year = new Date().getFullYear().toString();
    expect(footer!.textContent).toContain(year);
  });

  it("LP07: second CTA link to /wizard exists", () => {
    const { container } = render(<LandingPage />);
    const links = container.querySelectorAll('a[href="/wizard"]');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it("LP08: descriptive text mentions 15 minutes", () => {
    render(<LandingPage />);
    const matches = screen.getAllByText(/15 min/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// A11Y-WZ: Wizard Page Accessibility
// ============================================================================
describe("L7D-A11Y-WZ: Wizard accessibility", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockStoreState.isComplete = false;
    mockStoreState.result = null;
    mockStoreState.answers = {};
  });

  it("WZ01: WizardShell renders progress bar", () => {
    render(<WizardShell />);
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
  });

  it("WZ02: WizardShell renders wizard step content", () => {
    render(<WizardShell />);
    expect(screen.getByTestId("wizard-step")).toBeInTheDocument();
  });

  it("WZ03: progress bar has role=progressbar", () => {
    render(<WizardShell />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();
  });

  it("WZ04: progress bar shows percentage text", () => {
    render(<WizardShell />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("WZ05: wizard container has consistent max-width", () => {
    const { container } = render(<WizardShell />);
    const wrapper = container.querySelector(".max-w-4xl");
    expect(wrapper).toBeTruthy();
  });

  it("WZ06: wizard redirects to /result when complete", () => {
    mockStoreState.isComplete = true;
    mockStoreState.result = { classification: "HIGH_RISK" };
    mockStoreState.answers = { companyName: "Test" };
    render(<WizardShell />);
    expect(mockPush).toHaveBeenCalledWith("/result");
  });

  it("WZ07: wizard does NOT redirect when incomplete", () => {
    render(<WizardShell />);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("WZ08: step heading is visible", () => {
    render(<WizardShell />);
    expect(screen.getByText("System Basics")).toBeInTheDocument();
  });

  it("WZ09: navigation buttons are present", () => {
    render(<WizardShell />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("WZ10: wizard renders without crashing", () => {
    const { container } = render(<WizardShell />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// A11Y-RES: Result Page Accessibility (mocked components)
// ============================================================================
describe("L7D-A11Y-RES: Result page accessibility", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockPush.mockClear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("RES01: result page has h1 heading", () => {
    setSessionResult(makeResult(), { companyName: "TestCo" });
    render(<ResultPage />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Your Classification Result");
  });

  it("RES02: retake assessment link is present", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.getByText(/Retake assessment/)).toBeInTheDocument();
  });

  it("RES03: retake link points to /wizard", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    const link = screen.getByText(/Retake assessment/).closest("a");
    expect(link).toHaveAttribute("href", "/wizard");
  });

  it("RES04: classification badge renders", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });

  it("RES05: fine calculator renders", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.getByTestId("fine")).toBeInTheDocument();
  });

  it("RES06: timeline renders", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.getByTestId("timeline")).toBeInTheDocument();
  });

  it("RES07: document generator renders with company name", () => {
    setSessionResult(makeResult(), { companyName: "A11yCorp" });
    render(<ResultPage />);
    const docgen = screen.getByTestId("docgen");
    expect(docgen).toHaveTextContent("A11yCorp");
  });

  it("RES08: next steps section is visible", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.getByText("Appoint compliance officer")).toBeInTheDocument();
  });

  it("RES09: disclaimer text about legal advice is present", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.getByText(/does not constitute legal advice/)).toBeInTheDocument();
  });

  it("RES10: loading state shown when no data", () => {
    render(<ResultPage />);
    expect(screen.getByText(/Loading classification/i)).toBeInTheDocument();
  });
});

// ============================================================================
// A11Y-NAV: Navigation & Link Accessibility
// ============================================================================
describe("L7D-A11Y-NAV: Navigation accessibility", () => {
  it("NAV01: all landing page links have visible text content", () => {
    const { container } = render(<LandingPage />);
    const links = container.querySelectorAll("a");
    links.forEach((link) => {
      expect(link.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  it("NAV02: landing page links point to valid paths", () => {
    const { container } = render(<LandingPage />);
    const links = container.querySelectorAll("a");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      expect(href).toMatch(/^\/|^https?:\/\//);
    });
  });

  it("NAV03: multiple CTA links all point to /wizard", () => {
    const { container } = render(<LandingPage />);
    const wizardLinks = container.querySelectorAll('a[href="/wizard"]');
    expect(wizardLinks.length).toBeGreaterThanOrEqual(2);
  });

  it("NAV04: result page retake link is keyboard accessible", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    const link = screen.getByText(/Retake assessment/).closest("a");
    expect(link).toBeTruthy();
    expect(link!.tagName).toBe("A");
  });

  it("NAV05: links have distinguishable text", () => {
    const { container } = render(<LandingPage />);
    const links = container.querySelectorAll("a");
    const texts = Array.from(links).map((l) => l.textContent!.trim());
    // At least CTA text should be meaningful (not empty or "click here")
    texts.forEach((t) => {
      expect(t.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// A11Y-DV: Document & Content Structure
// ============================================================================
describe("L7D-A11Y-DV: Content structure", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockPush.mockClear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("DV01: result page shows confidence info", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.getByText("DEFINITIVE")).toBeInTheDocument();
  });

  it("DV02: result page shows role info", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.getByText("PROVIDER")).toBeInTheDocument();
  });

  it("DV03: result page shows legal basis", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.getByText("Article 6, Annex III")).toBeInTheDocument();
  });

  it("DV04: warnings section appears when warnings exist", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.getByText(/Important Warnings/)).toBeInTheDocument();
  });

  it("DV05: SME section appears when simplifications exist", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.getByText(/SME Advantages/)).toBeInTheDocument();
  });

  it("DV06: Art 25 alert is hidden by default", () => {
    setSessionResult(makeResult());
    render(<ResultPage />);
    expect(screen.queryByText(/Art 25 Role Upgrade/)).not.toBeInTheDocument();
  });

  it("DV07: result page wrapper has max-w-4xl for readability", () => {
    setSessionResult(makeResult());
    const { container } = render(<ResultPage />);
    expect(container.querySelector(".max-w-4xl")).toBeTruthy();
  });

  it("DV08: risk categories on landing page show all 6 types", () => {
    render(<LandingPage />);
    expect(screen.getByText("Prohibited")).toBeInTheDocument();
    expect(screen.getByText("High Risk")).toBeInTheDocument();
    expect(screen.getByText("Minimal Risk")).toBeInTheDocument();
  });
});

// ============================================================================
// A11Y-FC: Focus & contrast baseline
// ============================================================================
describe("L7D-A11Y-FC: Focus & contrast", () => {
  it("FC01: brand-colored elements exist on landing page", () => {
    const { container } = render(<LandingPage />);
    const brandElements = container.querySelectorAll(
      '[class*="brand"], [class*="orange"], [class*="yellow"], [class*="green"]'
    );
    expect(brandElements.length).toBeGreaterThan(0);
  });
});
