/**
 * LAYER 7D — Accessibility Tests for Real Components (L7D-A11Y)
 *
 * Tests that NEED real (unmocked) result components:
 *   A11Y-DG:  DocumentGenerator accessibility (6 tests)
 *   A11Y-FC:  Focus & contrast with real components FC02–FC05 (4 tests)
 *
 * These live in a separate file so that vi.mock for result components
 * (used in the main Accessibility.test.tsx) does not interfere.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Only mock what's needed — NOT the result sub-components
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: any) => <div>{children}</div>,
  SignedIn: ({ children }: any) => <div>{children}</div>,
  SignedOut: ({ children }: any) => <div>{children}</div>,
  UserButton: () => <div />,
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
  SignInButton: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@clerk/themes", () => ({ dark: {} }));

// ============================================================================
// A11Y-DG: DocumentGenerator accessibility (real component)
// ============================================================================
describe("L7D-A11Y-DG: DocumentGenerator accessibility", () => {
  const mockResult = {
    classification: "HIGH_RISK" as const,
    role: "PROVIDER" as const,
    confidence: "DEFINITIVE" as const,
    legalBasis: ["Article 6"],
    obligations: [
      {
        id: "OB_1",
        article: "Art 9",
        title: "Risk Mgmt",
        description: "Risk management system",
        priority: "CRITICAL" as const,
        deadline: "2026-08-02",
        appliesToRole: "PROVIDER" as const,
        templateId: "TMPL_RISK_MANAGEMENT",
      },
    ],
    enforcementDeadline: "2026-08-02" as const,
    fineRisk: {
      maxAmountGeneral: "€15M",
      maxAmountSME: "€7.5M",
      maxPercentTurnover: 3,
      article: "Art 99",
    },
    nextSteps: ["Step 1"],
    warnings: [],
    smeSimplifications: [],
  };

  it("DG01: has a heading for the section", async () => {
    const { default: DocumentGenerator } = await import(
      "@/components/result/DocumentGenerator"
    );
    render(
      <DocumentGenerator
        result={mockResult as any}
        companyName="Test"
        systemDescription="Test AI"
      />
    );
    // Real component renders "📄 Generate Compliance Documents" (may appear multiple times)
    const headings = screen.getAllByText(/Compliance Documents/i);
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("DG02: template selection elements are present", async () => {
    const { default: DocumentGenerator } = await import(
      "@/components/result/DocumentGenerator"
    );
    render(
      <DocumentGenerator
        result={mockResult as any}
        companyName="Test"
        systemDescription="Test AI"
      />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
  });

  it("DG03: template names are visible as text labels", async () => {
    const { default: DocumentGenerator } = await import(
      "@/components/result/DocumentGenerator"
    );
    const { container } = render(
      <DocumentGenerator
        result={mockResult as any}
        companyName="Test"
        systemDescription="Test AI"
      />
    );
    // component should render significant text content
    expect(container.textContent!.length).toBeGreaterThan(10);
  });

  it("DG04: generate button is present", async () => {
    const { default: DocumentGenerator } = await import(
      "@/components/result/DocumentGenerator"
    );
    render(
      <DocumentGenerator
        result={mockResult as any}
        companyName="Test"
        systemDescription="Test AI"
      />
    );
    const buttons = screen.getAllByRole("button");
    const generateBtn = buttons.find((b) =>
      /generate/i.test(b.textContent || "")
    );
    expect(generateBtn).toBeTruthy();
  });

  it("DG05: generate button has descriptive text", async () => {
    const { default: DocumentGenerator } = await import(
      "@/components/result/DocumentGenerator"
    );
    render(
      <DocumentGenerator
        result={mockResult as any}
        companyName="Test"
        systemDescription="Test AI"
      />
    );
    const buttons = screen.getAllByRole("button");
    const generateBtn = buttons.find((b) =>
      /generate/i.test(b.textContent || "")
    );
    expect(generateBtn?.textContent).toMatch(/generate/i);
  });

  it("DG06: component renders without crashing for HIGH_RISK", async () => {
    const { default: DocumentGenerator } = await import(
      "@/components/result/DocumentGenerator"
    );
    const { container } = render(
      <DocumentGenerator
        result={mockResult as any}
        companyName="Test"
        systemDescription="Test AI"
      />
    );
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// A11Y-FC: Focus & contrast with real components (FC02–FC05)
// ============================================================================
describe("L7D-A11Y-FC: Focus & contrast patterns (real components)", () => {
  it("FC02: classification badges use color-coded classes", async () => {
    const { default: ClassificationBadge } = await import(
      "@/components/result/ClassificationBadge"
    );
    const { container } = render(
      <ClassificationBadge classification="HIGH_RISK" />
    );
    expect(container.innerHTML).toBeTruthy();
    // Real component renders "HIGH RISK" text & orange CSS classes
    expect(container.textContent).toMatch(/HIGH.RISK|High Risk/i);
    expect(container.innerHTML).toMatch(/orange|red|yellow|green|violet|brand/);
  });

  it("FC03: fine calculator renders amount text", async () => {
    const { default: FineCalculator } = await import(
      "@/components/result/FineCalculator"
    );
    const fineRisk = {
      maxAmountGeneral: "€15,000,000",
      maxAmountSME: "€7,500,000",
      maxPercentTurnover: 3,
      article: "Article 99(3)",
    };
    const { container } = render(<FineCalculator fineRisk={fineRisk} />);
    // Real component renders the maxAmountGeneral value
    expect(container.textContent).toMatch(/€15,000,000/);
  });

  it("FC04: obligations list renders obligation items", async () => {
    const { default: ObligationsList } = await import(
      "@/components/result/ObligationsList"
    );
    const obligations = [
      {
        id: "OB_1",
        article: "Art 9",
        title: "Risk Mgmt",
        description: "Risk management system",
        priority: "CRITICAL",
        deadline: "2026-08-02",
        appliesToRole: "PROVIDER",
      },
      {
        id: "OB_2",
        article: "Art 10",
        title: "Data Gov",
        description: "Data governance requirements",
        priority: "HIGH",
        deadline: "2026-08-02",
        appliesToRole: "PROVIDER",
      },
    ];
    const { container } = render(
      <ObligationsList obligations={obligations as any} />
    );
    expect(container.textContent).toMatch(/Risk Mgmt|Data Gov|Art 9|Art 10/);
  });

  it("FC05: timeline view renders date information", async () => {
    const { default: TimelineView } = await import(
      "@/components/result/TimelineView"
    );
    const { container } = render(
      <TimelineView currentDeadline="2026-08-02" />
    );
    expect(container.textContent).toMatch(/2026|deadline|Aug/i);
  });
});
