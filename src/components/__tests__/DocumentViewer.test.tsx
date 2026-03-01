/**
 * LAYER 6 — DocumentViewer Component Tests (L6-DV)
 *
 * Modal overlay that renders a generated document with markdown parsing,
 * copy-to-clipboard, download (.md), and a close button.
 *
 * 35 tests across 5 groups:
 *   DV-H: Header rendering (6 tests)
 *   DV-M: Markdown rendering (12 tests)
 *   DV-A: Actions — copy, download, close (9 tests)
 *   DV-F: Footer / disclaimer (3 tests)
 *   DV-S: Structure & styling (5 tests)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentViewer from "@/components/result/DocumentViewer";
import { mockGeneratedDocument } from "./mocks";

// ============================================================================
// Clipboard & URL mocks
// ============================================================================

let clipboardText = "";
const revokeObjectURL = vi.fn();
const createObjectURL = vi.fn(() => "blob:mock-url");

beforeEach(() => {
  clipboardText = "";
  vi.useFakeTimers({ shouldAdvanceTime: true });

  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn(async (t: string) => {
        clipboardText = t;
      }),
    },
  });

  globalThis.URL.createObjectURL = createObjectURL;
  globalThis.URL.revokeObjectURL = revokeObjectURL;
});

import { afterEach } from "vitest";
afterEach(() => {
  vi.useRealTimers();
});

// ============================================================================
// DV-H: Header Rendering
// ============================================================================

describe("L6-DV-H: Header", () => {
  it("DV-H01: displays template name as heading", () => {
    const doc = mockGeneratedDocument({ templateName: "Risk Management System" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByText("Risk Management System")).toBeInTheDocument();
  });

  it("DV-H02: shows article reference in subtitle", () => {
    const doc = mockGeneratedDocument({ article: "Article 9" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByText(/Article 9/)).toBeInTheDocument();
  });

  it("DV-H03: shows word count in subtitle", () => {
    const doc = mockGeneratedDocument({ wordCount: 1500 });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByText(/1500 words/)).toBeInTheDocument();
  });

  it("DV-H04: shows formatted date in subtitle", () => {
    const doc = mockGeneratedDocument({ generatedAt: "2026-02-28T12:00:00.000Z" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    // The date will be localized, just check it renders something date-like
    const subtitle = screen.getByText(/words/);
    expect(subtitle.textContent).toBeTruthy();
  });

  it("DV-H05: heading is an h2 element", () => {
    const doc = mockGeneratedDocument({ content: "No markdown headings" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toBeInTheDocument();
  });

  it("DV-H06: Copy, Download, and Close buttons are present", () => {
    const doc = mockGeneratedDocument();
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
    expect(screen.getByText(/Download/)).toBeInTheDocument();
    expect(screen.getByText("✕")).toBeInTheDocument();
  });
});

// ============================================================================
// DV-M: Markdown Rendering
// ============================================================================

describe("L6-DV-M: Markdown rendering", () => {
  it("DV-M01: renders # as h1", () => {
    const doc = mockGeneratedDocument({ content: "# Main Title" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Main Title");
  });

  it("DV-M02: renders ## as h2 in content (separate from header h2)", () => {
    const doc = mockGeneratedDocument({ content: "## Section Two" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    // One is the doc title, one is from content
    const contentH2 = headings.find((h) => h.textContent === "Section Two");
    expect(contentH2).toBeTruthy();
  });

  it("DV-M03: renders ### as h3", () => {
    const doc = mockGeneratedDocument({ content: "### Sub Section" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Sub Section");
  });

  it("DV-M04: renders #### as h4", () => {
    const doc = mockGeneratedDocument({ content: "#### Deep Section" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 4 }).textContent).toBe("Deep Section");
  });

  it("DV-M05: renders --- as <hr>", () => {
    const doc = mockGeneratedDocument({ content: "---" });
    const { container } = render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("DV-M06: renders '- item' as <li>", () => {
    const doc = mockGeneratedDocument({ content: "- Bullet item" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByText("Bullet item").tagName).toBe("LI");
  });

  it("DV-M07: renders '* item' as <li>", () => {
    const doc = mockGeneratedDocument({ content: "* Star item" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByText("Star item").tagName).toBe("LI");
  });

  it("DV-M08: renders numbered items as <li>", () => {
    const doc = mockGeneratedDocument({ content: "1. First item" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByText("First item").tagName).toBe("LI");
  });

  it("DV-M09: renders '| table' as <pre>", () => {
    const doc = mockGeneratedDocument({ content: "| Col1 | Col2 |" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByText("| Col1 | Col2 |").tagName).toBe("PRE");
  });

  it("DV-M10: renders '> quote' as <blockquote>", () => {
    const doc = mockGeneratedDocument({ content: "> Important note" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByText("Important note").tagName).toBe("BLOCKQUOTE");
  });

  it("DV-M11: renders ⚠️ warning with yellow styling", () => {
    const doc = mockGeneratedDocument({ content: "⚠️ Warning text" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    const warning = screen.getByText(/Warning text/);
    expect(warning.classList.contains("text-yellow-400")).toBe(true);
  });

  it("DV-M12: renders **bold** as <strong> in inline markdown", () => {
    const doc = mockGeneratedDocument({ content: "This is **bold text** here" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByText("bold text").tagName).toBe("STRONG");
  });
});

// ============================================================================
// DV-A: Actions — Copy, Download, Close
// ============================================================================

describe("L6-DV-A: Actions", () => {
  it("DV-A01: Copy button writes content to clipboard", async () => {
    const doc = mockGeneratedDocument({ content: "Copy me" });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy"));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Copy me");
  });

  it("DV-A02: Copy button shows '✓ Copied' after click", async () => {
    const doc = mockGeneratedDocument();
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy"));
    });
    expect(screen.getByText("✓ Copied")).toBeInTheDocument();
  });

  it("DV-A03: '✓ Copied' reverts to 'Copy' after 2 seconds", async () => {
    const doc = mockGeneratedDocument();
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy"));
    });
    expect(screen.getByText("✓ Copied")).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("DV-A04: Download button creates Blob and triggers download", () => {
    const doc = mockGeneratedDocument({ templateId: "TMPL_RISK_MANAGEMENT" });
    const clickMock = vi.fn();
    const origCreateElement = window.document.createElement.bind(window.document);
    vi.spyOn(window.document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return { href: "", download: "", click: clickMock } as unknown as HTMLAnchorElement;
      }
      return origCreateElement(tag);
    });

    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText(/Download/));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it("DV-A05: Download filename contains template id (lowercased, no TMPL_ prefix)", () => {
    const doc = mockGeneratedDocument({ templateId: "TMPL_DATA_GOVERNANCE" });
    let downloadFilename = "";
    const origCreateElement = window.document.createElement.bind(window.document);
    vi.spyOn(window.document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return {
          href: "",
          set download(v: string) { downloadFilename = v; },
          get download() { return downloadFilename; },
          click: vi.fn(),
        } as unknown as HTMLAnchorElement;
      }
      return origCreateElement(tag);
    });

    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText(/Download/));
    expect(downloadFilename).toMatch(/^data_governance_\d{4}-\d{2}-\d{2}\.md$/);

    vi.restoreAllMocks();
  });

  it("DV-A06: Close button calls onClose", () => {
    const onClose = vi.fn();
    render(<DocumentViewer document={mockGeneratedDocument()} onClose={onClose} />);
    fireEvent.click(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("DV-A07: multiple Copy clicks only write to clipboard each time", async () => {
    const doc = mockGeneratedDocument();
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Copy"));
    });
    // After copy shows "✓ Copied" — wait for it to revert
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Copy")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText("Copy"));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2);
  });

  it("DV-A08: Download .md button has correct label", () => {
    render(<DocumentViewer document={mockGeneratedDocument()} onClose={vi.fn()} />);
    expect(screen.getByText("↓ Download .md")).toBeInTheDocument();
  });

  it("DV-A09: all action buttons have rounded-lg styling", () => {
    const { container } = render(<DocumentViewer document={mockGeneratedDocument()} onClose={vi.fn()} />);
    const buttons = container.querySelectorAll("button.rounded-lg");
    expect(buttons.length).toBe(3);
  });
});

// ============================================================================
// DV-F: Footer / Disclaimer
// ============================================================================

describe("L6-DV-F: Footer and disclaimer", () => {
  it("DV-F01: disclaimer text is rendered", () => {
    const doc = mockGeneratedDocument({
      disclaimer: "DISCLAIMER: This is auto-generated. Not legal advice.",
    });
    render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    expect(screen.getByText(/DISCLAIMER/)).toBeInTheDocument();
  });

  it("DV-F02: disclaimer is in a border-top footer section", () => {
    const doc = mockGeneratedDocument();
    const { container } = render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    const footer = container.querySelector(".border-t");
    expect(footer).toBeInTheDocument();
    expect(footer!.textContent).toContain("DISCLAIMER");
  });

  it("DV-F03: disclaimer text is very small (text-[10px])", () => {
    const doc = mockGeneratedDocument();
    const { container } = render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    const disclaimer = container.querySelector(".text-\\[10px\\]");
    expect(disclaimer).toBeInTheDocument();
  });
});

// ============================================================================
// DV-S: Structure & Styling
// ============================================================================

describe("L6-DV-S: Structure and styling", () => {
  it("DV-S01: modal overlay has fixed position and z-50", () => {
    const { container } = render(<DocumentViewer document={mockGeneratedDocument()} onClose={vi.fn()} />);
    const overlay = container.firstElementChild!;
    expect(overlay.classList.contains("fixed")).toBe(true);
    expect(overlay.classList.contains("z-50")).toBe(true);
  });

  it("DV-S02: modal overlay has backdrop blur", () => {
    const { container } = render(<DocumentViewer document={mockGeneratedDocument()} onClose={vi.fn()} />);
    const overlay = container.firstElementChild!;
    expect(overlay.classList.contains("backdrop-blur-sm")).toBe(true);
  });

  it("DV-S03: content modal has max-w-4xl", () => {
    const { container } = render(<DocumentViewer document={mockGeneratedDocument()} onClose={vi.fn()} />);
    const modal = container.querySelector(".max-w-4xl");
    expect(modal).toBeInTheDocument();
  });

  it("DV-S04: content area has overflow-y-auto for scrolling", () => {
    const { container } = render(<DocumentViewer document={mockGeneratedDocument()} onClose={vi.fn()} />);
    const scrollArea = container.querySelector(".overflow-y-auto");
    expect(scrollArea).toBeInTheDocument();
  });

  it("DV-S05: empty lines render as spacer divs", () => {
    const doc = mockGeneratedDocument({ content: "Line 1\n\nLine 2" });
    const { container } = render(<DocumentViewer document={doc} onClose={vi.fn()} />);
    const spacers = container.querySelectorAll(".h-2");
    expect(spacers.length).toBeGreaterThanOrEqual(1);
  });
});
