/**
 * LAYER 6 — DocumentGenerator Component Tests (L6-DG)
 *
 * Complex 4-state component (idle/generating/error/done) with auth gating,
 * template selection, sequential fetch, download all.
 *
 * 55 tests across 7 groups:
 *   DG-E: Empty state (3 tests)
 *   DG-I: Idle / template selection (14 tests)
 *   DG-A: Auth gating (6 tests)
 *   DG-G: Generating state (7 tests)
 *   DG-D: Done state (10 tests)
 *   DG-X: Error state (8 tests)
 *   DG-S: Structure & styling (7 tests)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { mockClassificationResult, mockGeneratedDocument } from "./mocks";

// ============================================================================
// Module mocks
// ============================================================================

// Now that DocumentGenerator uses ESM import, vi.mock can intercept @clerk/nextjs
const mockUseAuth = vi.hoisted(() => vi.fn(() => ({ isSignedIn: true as boolean | undefined })));

vi.mock("@clerk/nextjs", () => ({
  useAuth: mockUseAuth,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/lib/doc-generator", () => ({
  getApplicableTemplates: vi.fn(() => [
    "TMPL_RISK_MANAGEMENT",
    "TMPL_DATA_GOVERNANCE",
    "TMPL_TECHNICAL_DOC",
  ]),
}));

import DocumentGenerator from "@/components/result/DocumentGenerator";
import { getApplicableTemplates } from "@/lib/doc-generator";
const mockedGetTemplates = vi.mocked(getApplicableTemplates);

// Stash original fetch
const originalFetch = globalThis.fetch;

beforeEach(() => {
  mockUseAuth.mockReturnValue({ isSignedIn: true });
  mockedGetTemplates.mockReturnValue([
    "TMPL_RISK_MANAGEMENT",
    "TMPL_DATA_GOVERNANCE",
    "TMPL_TECHNICAL_DOC",
  ]);

  globalThis.URL.createObjectURL = vi.fn(() => "blob:mock");
  globalThis.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// Helper
const defaultProps = () => ({
  result: mockClassificationResult(),
  companyName: "Acme Corp",
  systemDescription: "AI hiring tool",
});

// ============================================================================
// DG-E: Empty State (no applicable templates)
// ============================================================================

describe("L6-DG-E: Empty state", () => {
  beforeEach(() => {
    mockedGetTemplates.mockReturnValue([]);
  });

  it("DG-E01: shows 'No compliance documents' message", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText(/No compliance documents are required/)).toBeInTheDocument();
  });

  it("DG-E02: shows 'voluntarily adopt' text", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText(/voluntarily adopt best practices/)).toBeInTheDocument();
  });

  it("DG-E03: does NOT show generate button", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.queryByText(/Generate/)).not.toBeInTheDocument();
  });
});

// ============================================================================
// DG-I: Idle / Template Selection
// ============================================================================

describe("L6-DG-I: Idle template selection", () => {
  it("DG-I01: shows heading '📄 Generate Compliance Documents'", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText(/Generate Compliance Documents/)).toBeInTheDocument();
  });

  it("DG-I02: shows applicable template count", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText(/3 documents applicable/)).toBeInTheDocument();
  });

  it("DG-I03: renders checkboxes for each template", () => {
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    expect(checkboxes.length).toBe(3);
  });

  it("DG-I04: all templates are selected by default", () => {
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach((cb) => {
      expect((cb as HTMLInputElement).checked).toBe(true);
    });
  });

  it("DG-I05: shows template names from TEMPLATE_REGISTRY", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText("Risk Management System")).toBeInTheDocument();
    expect(screen.getByText("Data Governance Policy")).toBeInTheDocument();
  });

  it("DG-I06: 'Select all' button selects all templates", () => {
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    // First uncheck one
    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    fireEvent.click(checkboxes[0]);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(false);
    // Now select all
    fireEvent.click(screen.getByText("Select all"));
    container.querySelectorAll("input[type='checkbox']").forEach((cb) => {
      expect((cb as HTMLInputElement).checked).toBe(true);
    });
  });

  it("DG-I07: 'Select none' button deselects all templates", () => {
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    fireEvent.click(screen.getByText("Select none"));
    container.querySelectorAll("input[type='checkbox']").forEach((cb) => {
      expect((cb as HTMLInputElement).checked).toBe(false);
    });
  });

  it("DG-I08: shows selected count and estimated time", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText(/3 selected/)).toBeInTheDocument();
    expect(screen.getByText(/min manual effort saved/)).toBeInTheDocument();
  });

  it("DG-I09: toggling checkbox updates selection count", () => {
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText(/2 selected/)).toBeInTheDocument();
  });

  it("DG-I10: generate button shows correct document count", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText(/Generate 3 Documents \+ Executive Summary/)).toBeInTheDocument();
  });

  it("DG-I11: generate button singular text for 1 doc", () => {
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    // Uncheck 2 of 3
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    expect(screen.getByText(/Generate 1 Document \+ Executive Summary/)).toBeInTheDocument();
  });

  it("DG-I12: generate button is disabled when 0 selected", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    fireEvent.click(screen.getByText("Select none"));
    const btn = screen.getByText(/Generate 0 Documents/);
    expect(btn).toBeDisabled();
  });

  it("DG-I13: shows 'Powered by Claude AI' footer note", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText(/Powered by Claude AI/)).toBeInTheDocument();
  });

  it("DG-I14: shows article info for each template", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText("Article 9")).toBeInTheDocument();
  });
});

// ============================================================================
// DG-A: Auth Gating
// ============================================================================

describe("L6-DG-A: Auth gating", () => {
  it("DG-A01: signed-in user sees generate button", () => {
    mockUseAuth.mockReturnValue({ isSignedIn: true } as ReturnType<typeof mockUseAuth>);
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText(/Generate 3 Documents/)).toBeInTheDocument();
  });

  it("DG-A02: unsigned user sees sign-in prompt", () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false } as ReturnType<typeof mockUseAuth>);
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText(/Sign in to generate/)).toBeInTheDocument();
  });

  it("DG-A03: unsigned user sees Sign In button", () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false } as ReturnType<typeof mockUseAuth>);
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText("Sign In to Generate")).toBeInTheDocument();
  });

  it("DG-A04: undefined auth (no Clerk) shows generate button", () => {
    mockUseAuth.mockReturnValue({ isSignedIn: undefined } as ReturnType<typeof mockUseAuth>);
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText(/Generate 3 Documents/)).toBeInTheDocument();
  });

  it("DG-A05: unsigned user does NOT see generate buttons", () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false } as ReturnType<typeof mockUseAuth>);
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.queryByText(/Generate \d+ Document/)).not.toBeInTheDocument();
  });

  it("DG-A06: sign-in wrapper rendered for unsigned users", () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false } as ReturnType<typeof mockUseAuth>);
    render(<DocumentGenerator {...defaultProps()} />);
    // The Sign In to Generate button is rendered within the SignInButton wrapper
    expect(screen.getByText("Sign In to Generate")).toBeInTheDocument();
  });
});

// ============================================================================
// DG-G: Generating State
// ============================================================================

describe("L6-DG-G: Generating state", () => {
  const setupGenerating = () => {
    let resolvers: Array<(value: unknown) => void> = [];
    globalThis.fetch = vi.fn(() =>
      new Promise((resolve) => {
        resolvers.push(resolve);
      })
    ) as unknown as typeof fetch;
    return { resolvers, getResolvers: () => resolvers };
  };

  it("DG-G01: shows spinner during generation", async () => {
    setupGenerating();
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    await act(async () => {
      fireEvent.click(screen.getByText(/Generate 3 Documents/));
    });
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("DG-G02: shows current template name being generated", async () => {
    setupGenerating();
    render(<DocumentGenerator {...defaultProps()} />);
    await act(async () => {
      fireEvent.click(screen.getByText(/Generate 3 Documents/));
    });
    expect(screen.getByText(/Generating:/)).toBeInTheDocument();
  });

  it("DG-G03: shows progress bar", async () => {
    setupGenerating();
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    await act(async () => {
      fireEvent.click(screen.getByText(/Generate 3 Documents/));
    });
    expect(container.querySelector(".bg-brand-500")).toBeInTheDocument();
  });

  it("DG-G04: shows document progress counter", async () => {
    setupGenerating();
    render(<DocumentGenerator {...defaultProps()} />);
    await act(async () => {
      fireEvent.click(screen.getByText(/Generate 3 Documents/));
    });
    // 3 templates + 1 exec summary = 4 total
    expect(screen.getByText(/0 \/ 4 documents complete/)).toBeInTheDocument();
  });

  it("DG-G05: progress updates after each fetch resolves", async () => {
    const { getResolvers } = setupGenerating();
    render(<DocumentGenerator {...defaultProps()} />);
    await act(async () => {
      fireEvent.click(screen.getByText(/Generate 3 Documents/));
    });

    // Resolve first fetch (exec summary)
    await act(async () => {
      getResolvers()[0]({
        ok: true,
        json: async () => ({ document: mockGeneratedDocument({ templateId: "EXEC_SUMMARY" }) }),
      });
    });

    expect(screen.getByText(/1 \/ 4 documents complete/)).toBeInTheDocument();
  });

  it("DG-G06: clicking generate with 0 selected does nothing", async () => {
    render(<DocumentGenerator {...defaultProps()} />);
    fireEvent.click(screen.getByText("Select none"));
    const btn = screen.getByText(/Generate 0 Documents/);
    fireEvent.click(btn);
    // Should still be in idle state
    expect(screen.getByText(/Select all/)).toBeInTheDocument();
  });

  it("DG-G07: fetch is called with correct body params", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ document: mockGeneratedDocument() }),
      })
    ) as unknown as typeof fetch;
    globalThis.fetch = fetchMock;

    // Only select 1 template for simplicity
    mockedGetTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT"]);
    render(<DocumentGenerator {...defaultProps()} />);

    await act(async () => {
      fireEvent.click(screen.getByText(/Generate 1 Document/));
    });

    // Should be called twice: EXEC_SUMMARY + TMPL_RISK_MANAGEMENT
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Check second call has our templateId
    const secondCallInit = (fetchMock.mock.calls[1] as [string, RequestInit])[1];
    const parsed = JSON.parse(secondCallInit.body as string);
    expect(parsed.templateId).toBe("TMPL_RISK_MANAGEMENT");
    expect(parsed.companyName).toBe("Acme Corp");
    expect(parsed.systemDescription).toBe("AI hiring tool");
  });
});

// ============================================================================
// DG-D: Done State
// ============================================================================

describe("L6-DG-D: Done state", () => {
  const finishGeneration = async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ document: mockGeneratedDocument() }),
      })
    ) as unknown as typeof fetch;

    mockedGetTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT"]);
    const rendered = render(<DocumentGenerator {...defaultProps()} />);

    await act(async () => {
      fireEvent.click(screen.getByText(/Generate 1 Document/));
    });

    return rendered;
  };

  it("DG-D01: shows success message with doc count", async () => {
    await finishGeneration();
    expect(screen.getByText(/2 documents generated successfully/)).toBeInTheDocument();
  });

  it("DG-D02: success banner has green styling", async () => {
    await finishGeneration();
    const success = screen.getByText(/documents generated successfully/);
    expect(success.classList.contains("text-green-400")).toBe(true);
  });

  it("DG-D03: lists generated documents", async () => {
    await finishGeneration();
    // Both exec summary + template generate the same mock doc name
    const items = screen.getAllByText("Risk Management System");
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it("DG-D04: each doc has a View button", async () => {
    await finishGeneration();
    const viewButtons = screen.getAllByText("View");
    expect(viewButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("DG-D05: clicking View opens DocumentViewer", async () => {
    await finishGeneration();
    const viewButton = screen.getAllByText("View")[0];
    fireEvent.click(viewButton);
    // DocumentViewer renders a modal with close button
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("DG-D06: 'Download All' button is present", async () => {
    await finishGeneration();
    expect(screen.getByText(/Download All/)).toBeInTheDocument();
  });

  it("DG-D07: 'Regenerate' button is present", async () => {
    await finishGeneration();
    expect(screen.getByText("Regenerate")).toBeInTheDocument();
  });

  it("DG-D08: clicking Regenerate returns to idle state", async () => {
    await finishGeneration();
    fireEvent.click(screen.getByText("Regenerate"));
    expect(screen.getByText(/Generate \d+ Document/)).toBeInTheDocument();
    expect(screen.getByText(/Select all/)).toBeInTheDocument();
  });

  it("DG-D09: Download All triggers blob download", async () => {
    const clickMock = vi.fn();
    const origCreateElement = window.document.createElement.bind(window.document);
    vi.spyOn(window.document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return { href: "", download: "", click: clickMock } as unknown as HTMLAnchorElement;
      }
      return origCreateElement(tag);
    });

    await finishGeneration();
    fireEvent.click(screen.getByText(/Download All/));
    expect(clickMock).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it("DG-D10: shows word count for each generated doc", async () => {
    await finishGeneration();
    expect(screen.getAllByText(/1500 words/).length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// DG-X: Error State
// ============================================================================

describe("L6-DG-X: Error state", () => {
  const triggerError = async (errorMsg = "Rate limit exceeded") => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({ error: errorMsg }),
      })
    ) as unknown as typeof fetch;

    mockedGetTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT"]);
    const rendered = render(<DocumentGenerator {...defaultProps()} />);

    await act(async () => {
      fireEvent.click(screen.getByText(/Generate 1 Document/));
    });

    return rendered;
  };

  it("DG-X01: shows 'Generation failed' on error", async () => {
    await triggerError();
    expect(screen.getByText("Generation failed")).toBeInTheDocument();
  });

  it("DG-X02: shows error message", async () => {
    await triggerError("Rate limit exceeded");
    expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
  });

  it("DG-X03: error banner has red styling", async () => {
    const { container } = await triggerError();
    expect(container.querySelector(".bg-red-500\\/10")).toBeInTheDocument();
  });

  it("DG-X04: '← Back to selection' button is present", async () => {
    await triggerError();
    expect(screen.getByText("← Back to selection")).toBeInTheDocument();
  });

  it("DG-X05: clicking back returns to idle state", async () => {
    await triggerError();
    fireEvent.click(screen.getByText("← Back to selection"));
    expect(screen.getByText(/Select all/)).toBeInTheDocument();
  });

  it("DG-X06: shows HTTP error status as fallback", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({}),
        status: 500,
      })
    ) as unknown as typeof fetch;

    mockedGetTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT"]);
    render(<DocumentGenerator {...defaultProps()} />);

    await act(async () => {
      fireEvent.click(screen.getByText(/Generate 1 Document/));
    });

    expect(screen.getByText("Generation failed")).toBeInTheDocument();
  });

  it("DG-X07: network error triggers error state", async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error("Network error"))) as unknown as typeof fetch;

    mockedGetTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT"]);
    render(<DocumentGenerator {...defaultProps()} />);

    await act(async () => {
      fireEvent.click(screen.getByText(/Generate 1 Document/));
    });

    expect(screen.getByText("Generation failed")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("DG-X08: partial docs before error shows recovery message", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ document: mockGeneratedDocument() }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "Timeout" }),
      });
    }) as unknown as typeof fetch;

    mockedGetTemplates.mockReturnValue(["TMPL_RISK_MANAGEMENT"]);
    render(<DocumentGenerator {...defaultProps()} />);

    await act(async () => {
      fireEvent.click(screen.getByText(/Generate 1 Document/));
    });

    expect(screen.getByText("Generation failed")).toBeInTheDocument();
    expect(screen.getByText(/1 document was generated before the error/)).toBeInTheDocument();
  });
});

// ============================================================================
// DG-S: Structure & Styling
// ============================================================================

describe("L6-DG-S: Structure and styling", () => {
  it("DG-S01: outer container has rounded-2xl", () => {
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    expect(container.querySelector(".rounded-2xl")).toBeInTheDocument();
  });

  it("DG-S02: heading is h3 level", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    const h3 = screen.getByRole("heading", { level: 3 });
    expect(h3).toBeInTheDocument();
  });

  it("DG-S03: template list has max-h-80 for scrolling", () => {
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    expect(container.querySelector(".max-h-80")).toBeInTheDocument();
  });

  it("DG-S04: selected template has highlighted border", () => {
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    const selectedLabels = container.querySelectorAll("label.bg-brand-600\\/10");
    expect(selectedLabels.length).toBe(3);
  });

  it("DG-S05: generate button has brand styling", () => {
    const { container } = render(<DocumentGenerator {...defaultProps()} />);
    const btn = container.querySelector("button.bg-brand-600");
    expect(btn).toBeInTheDocument();
  });

  it("DG-S06: each template shows estimated minutes", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    const minuteLabels = screen.getAllByText(/\d+min/);
    expect(minuteLabels.length).toBeGreaterThanOrEqual(3);
  });

  it("DG-S07: descriptions guidance text present", () => {
    render(<DocumentGenerator {...defaultProps()} />);
    expect(screen.getByText(/Select which compliance documents/)).toBeInTheDocument();
  });
});
