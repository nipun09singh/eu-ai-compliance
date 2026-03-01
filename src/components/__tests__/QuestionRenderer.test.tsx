/**
 * LAYER 6 — QuestionRenderer Component Tests (L6-QR)
 *
 * Renders a single wizard question based on type:
 * BOOLEAN (yes/no), SINGLE_SELECT, TEXT, NUMBER — plus HelpText sub-component.
 *
 * 38 tests across 7 groups:
 *   QR-T: Question text & label (3 tests)
 *   QR-H: HelpText truncation & toggle (6 tests)
 *   QR-B: BooleanInput (6 tests)
 *   QR-S: SelectInput (7 tests)
 *   QR-TX: TextInput (4 tests)
 *   QR-N: NumberInput (4 tests)
 *   QR-F: Field key mapping (3 tests)
 *   QR-ST: Structure & styling (5 tests)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import QuestionRenderer from "@/components/wizard/QuestionRenderer";
import type { WizardQuestion } from "@/lib/wizard-questions";
import { createMockStoreState, createMockUseWizardStore } from "./wizard-mocks";
import type { MockStoreState } from "./wizard-mocks";

// ============================================================================
// Module mock — Zustand store
// ============================================================================
let storeState: MockStoreState;
let mockUseWizardStore: ReturnType<typeof createMockUseWizardStore>;

vi.mock("@/lib/store", () => ({
  get useWizardStore() {
    return mockUseWizardStore;
  },
}));

beforeEach(() => {
  storeState = createMockStoreState();
  mockUseWizardStore = createMockUseWizardStore(storeState);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function booleanQ(overrides: Partial<WizardQuestion> = {}): WizardQuestion {
  return {
    id: "q_bool",
    text: "Is this a safety-critical system?",
    type: "BOOLEAN",
    mapToField: "isSafetyCritical",
    ...overrides,
  } as WizardQuestion;
}

function selectQ(overrides: Partial<WizardQuestion> = {}): WizardQuestion {
  return {
    id: "q_select",
    text: "What is your company size?",
    type: "SINGLE_SELECT",
    mapToField: "companySize",
    options: [
      { value: "STARTUP", label: "Startup (<50 people)", description: "Small team" },
      { value: "SME", label: "SME (50-250 people)" },
      { value: "LARGE", label: "Large Enterprise (250+ people)", description: "Big org" },
    ],
    ...overrides,
  } as WizardQuestion;
}

function textQ(overrides: Partial<WizardQuestion> = {}): WizardQuestion {
  return {
    id: "q_text",
    text: "Describe your AI system",
    type: "TEXT",
    mapToField: "systemDescription",
    ...overrides,
  } as WizardQuestion;
}

function numberQ(overrides: Partial<WizardQuestion> = {}): WizardQuestion {
  return {
    id: "q_num",
    text: "Annual revenue in EUR?",
    type: "NUMBER",
    mapToField: "annualRevenue",
    ...overrides,
  } as WizardQuestion;
}

// ============================================================================
// QR-T: Question text & label
// ============================================================================
describe("L6-QR-T: Question text & label", () => {
  it("QR-T01: renders question text", () => {
    render(<QuestionRenderer question={booleanQ()} />);
    expect(screen.getByText("Is this a safety-critical system?")).toBeInTheDocument();
  });

  it("QR-T02: question text is inside a label element", () => {
    render(<QuestionRenderer question={booleanQ()} />);
    const label = screen.getByText("Is this a safety-critical system?");
    expect(label.tagName).toBe("LABEL");
  });

  it("QR-T03: label has font-medium styling", () => {
    render(<QuestionRenderer question={booleanQ()} />);
    const label = screen.getByText("Is this a safety-critical system?");
    expect(label.className).toContain("font-medium");
  });
});

// ============================================================================
// QR-H: HelpText truncation & toggle
// ============================================================================
describe("L6-QR-H: HelpText", () => {
  const shortHelp = "Short help text.";
  const longHelp = "A".repeat(130);

  it("QR-H01: shows full text when ≤120 chars", () => {
    render(<QuestionRenderer question={booleanQ({ helpText: shortHelp })} />);
    expect(screen.getByText(shortHelp)).toBeInTheDocument();
  });

  it("QR-H02: does not show Read more for short text", () => {
    render(<QuestionRenderer question={booleanQ({ helpText: shortHelp })} />);
    expect(screen.queryByText("Read more")).not.toBeInTheDocument();
  });

  it("QR-H03: truncates text >120 chars with '...'", () => {
    render(<QuestionRenderer question={booleanQ({ helpText: longHelp })} />);
    const p = screen.getByText(/\.\.\.$/);
    expect(p.textContent).toContain("A".repeat(120) + "...");
  });

  it("QR-H04: shows 'Read more' button for long text", () => {
    render(<QuestionRenderer question={booleanQ({ helpText: longHelp })} />);
    expect(screen.getByText("Read more")).toBeInTheDocument();
  });

  it("QR-H05: clicking 'Read more' shows full text", () => {
    render(<QuestionRenderer question={booleanQ({ helpText: longHelp })} />);
    fireEvent.click(screen.getByText("Read more"));
    expect(screen.getByText(/A{130}/)).toBeInTheDocument();
    expect(screen.getByText("Show less")).toBeInTheDocument();
  });

  it("QR-H06: clicking 'Show less' re-truncates", () => {
    render(<QuestionRenderer question={booleanQ({ helpText: longHelp })} />);
    fireEvent.click(screen.getByText("Read more"));
    fireEvent.click(screen.getByText("Show less"));
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });
});

// ============================================================================
// QR-B: BooleanInput
// ============================================================================
describe("L6-QR-B: BooleanInput", () => {
  it("QR-B01: renders Yes and No buttons", () => {
    render(<QuestionRenderer question={booleanQ()} />);
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("QR-B02: clicking Yes calls setAnswer with true", () => {
    render(<QuestionRenderer question={booleanQ()} />);
    fireEvent.click(screen.getByText("Yes"));
    expect(storeState.setAnswer).toHaveBeenCalledWith("isSafetyCritical", true);
  });

  it("QR-B03: clicking No calls setAnswer with false", () => {
    render(<QuestionRenderer question={booleanQ()} />);
    fireEvent.click(screen.getByText("No"));
    expect(storeState.setAnswer).toHaveBeenCalledWith("isSafetyCritical", false);
  });

  it("QR-B04: selected=true highlights Yes button", () => {
    storeState.answers = { isSafetyCritical: true };
    render(<QuestionRenderer question={booleanQ()} />);
    const yes = screen.getByText("Yes");
    expect(yes.className).toContain("border-brand-500");
  });

  it("QR-B05: selected=false highlights No button", () => {
    storeState.answers = { isSafetyCritical: false };
    render(<QuestionRenderer question={booleanQ()} />);
    const no = screen.getByText("No");
    expect(no.className).toContain("border-brand-500");
  });

  it("QR-B06: unselected buttons have muted styling", () => {
    render(<QuestionRenderer question={booleanQ()} />);
    const yes = screen.getByText("Yes");
    expect(yes.className).toContain("text-[var(--color-text-muted)]");
  });
});

// ============================================================================
// QR-S: SelectInput
// ============================================================================
describe("L6-QR-S: SelectInput", () => {
  it("QR-S01: renders all option labels", () => {
    render(<QuestionRenderer question={selectQ()} />);
    expect(screen.getByText("Startup (<50 people)")).toBeInTheDocument();
    expect(screen.getByText("SME (50-250 people)")).toBeInTheDocument();
    expect(screen.getByText("Large Enterprise (250+ people)")).toBeInTheDocument();
  });

  it("QR-S02: shows option descriptions when present", () => {
    render(<QuestionRenderer question={selectQ()} />);
    expect(screen.getByText("Small team")).toBeInTheDocument();
    expect(screen.getByText("Big org")).toBeInTheDocument();
  });

  it("QR-S03: clicking option calls setAnswer with value", () => {
    render(<QuestionRenderer question={selectQ()} />);
    fireEvent.click(screen.getByText("Startup (<50 people)"));
    expect(storeState.setAnswer).toHaveBeenCalledWith("companySize", "STARTUP");
  });

  it("QR-S04: clicking another option calls setAnswer with its value", () => {
    render(<QuestionRenderer question={selectQ()} />);
    fireEvent.click(screen.getByText("Large Enterprise (250+ people)"));
    expect(storeState.setAnswer).toHaveBeenCalledWith("companySize", "LARGE");
  });

  it("QR-S05: selected option has brand-500 border", () => {
    storeState.answers = { companySize: "SME" };
    render(<QuestionRenderer question={selectQ()} />);
    const sme = screen.getByText("SME (50-250 people)").closest("button");
    expect(sme?.className).toContain("border-brand-500");
  });

  it("QR-S06: unselected option has default border", () => {
    storeState.answers = { companySize: "SME" };
    render(<QuestionRenderer question={selectQ()} />);
    const startup = screen.getByText("Startup (<50 people)").closest("button");
    expect(startup?.className).toContain("border-[var(--color-border)]");
  });

  it("QR-S07: selected option label has text-brand-400", () => {
    storeState.answers = { companySize: "LARGE" };
    render(<QuestionRenderer question={selectQ()} />);
    const label = screen.getByText("Large Enterprise (250+ people)");
    expect(label.className).toContain("text-brand-400");
  });
});

// ============================================================================
// QR-TX: TextInput
// ============================================================================
describe("L6-QR-TX: TextInput", () => {
  it("QR-TX01: renders text input with placeholder", () => {
    render(<QuestionRenderer question={textQ()} />);
    expect(screen.getByPlaceholderText("Type your answer...")).toBeInTheDocument();
  });

  it("QR-TX02: input displays current value from store", () => {
    storeState.answers = { systemDescription: "My AI system" };
    render(<QuestionRenderer question={textQ()} />);
    expect(screen.getByDisplayValue("My AI system")).toBeInTheDocument();
  });

  it("QR-TX03: typing calls setAnswer with new value", () => {
    render(<QuestionRenderer question={textQ()} />);
    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Updated" },
    });
    expect(storeState.setAnswer).toHaveBeenCalledWith("systemDescription", "Updated");
  });

  it("QR-TX04: input has rounded-xl styling", () => {
    render(<QuestionRenderer question={textQ()} />);
    const input = screen.getByPlaceholderText("Type your answer...");
    expect(input.className).toContain("rounded-xl");
  });
});

// ============================================================================
// QR-N: NumberInput
// ============================================================================
describe("L6-QR-N: NumberInput", () => {
  it("QR-N01: renders number input with placeholder", () => {
    render(<QuestionRenderer question={numberQ()} />);
    expect(screen.getByPlaceholderText("Enter a number...")).toBeInTheDocument();
  });

  it("QR-N02: input displays current value from store", () => {
    storeState.answers = { annualRevenue: 1000000 };
    render(<QuestionRenderer question={numberQ()} />);
    expect(screen.getByDisplayValue("1000000")).toBeInTheDocument();
  });

  it("QR-N03: changing value calls setAnswer with parsed float", () => {
    render(<QuestionRenderer question={numberQ()} />);
    fireEvent.change(screen.getByPlaceholderText("Enter a number..."), {
      target: { value: "42.5" },
    });
    expect(storeState.setAnswer).toHaveBeenCalledWith("annualRevenue", 42.5);
  });

  it("QR-N04: input has type='number'", () => {
    render(<QuestionRenderer question={numberQ()} />);
    const input = screen.getByPlaceholderText("Enter a number...");
    expect(input).toHaveAttribute("type", "number");
  });
});

// ============================================================================
// QR-F: Field key mapping
// ============================================================================
describe("L6-QR-F: Field key mapping", () => {
  it("QR-F01: uses mapToField when it is a string", () => {
    render(<QuestionRenderer question={booleanQ({ mapToField: "customField" })} />);
    fireEvent.click(screen.getByText("Yes"));
    expect(storeState.setAnswer).toHaveBeenCalledWith("customField", true);
  });

  it("QR-F02: falls back to question.id when mapToField is not a string", () => {
    const q = booleanQ();
    (q as any).mapToField = (v: boolean) => ({ a: v }); // function, not string
    render(<QuestionRenderer question={q} />);
    fireEvent.click(screen.getByText("No"));
    expect(storeState.setAnswer).toHaveBeenCalledWith("q_bool", false);
  });

  it("QR-F03: reads current value using correct field key", () => {
    storeState.answers = { customField: true };
    render(<QuestionRenderer question={booleanQ({ mapToField: "customField" })} />);
    const yes = screen.getByText("Yes");
    expect(yes.className).toContain("border-brand-500");
  });
});

// ============================================================================
// QR-ST: Structure & styling
// ============================================================================
describe("L6-QR-ST: Structure & styling", () => {
  it("QR-ST01: outer wrapper has mb-6", () => {
    const { container } = render(<QuestionRenderer question={booleanQ()} />);
    expect(container.firstElementChild?.className).toContain("mb-6");
  });

  it("QR-ST02: boolean buttons have flex gap-3 layout", () => {
    const { container } = render(<QuestionRenderer question={booleanQ()} />);
    const flexDiv = container.querySelector(".flex.gap-3");
    expect(flexDiv).toBeInTheDocument();
  });

  it("QR-ST03: select options have flex-col layout", () => {
    const { container } = render(<QuestionRenderer question={selectQ()} />);
    const flexCol = container.querySelector(".flex.flex-col");
    expect(flexCol).toBeInTheDocument();
  });

  it("QR-ST04: no input rendered for BOOLEAN type", () => {
    render(<QuestionRenderer question={booleanQ()} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("QR-ST05: helpText has text-sm and muted color", () => {
    render(<QuestionRenderer question={booleanQ({ helpText: "Help!" })} />);
    const p = screen.getByText("Help!");
    expect(p.className).toContain("text-sm");
    expect(p.className).toContain("text-[var(--color-text-muted)]");
  });
});
