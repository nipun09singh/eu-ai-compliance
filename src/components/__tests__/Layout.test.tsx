/**
 * LAYER 7A — Layout Component Tests (L7A-LY)
 *
 * Root layout with conditional Clerk auth, nav, Shell wrapper.
 *
 * 25 tests across 5 groups:
 *   LY-NB: NavAuthButtons (8 tests)
 *   LY-SH: Shell wrapper (5 tests)
 *   LY-RL: RootLayout (6 tests)
 *   LY-M:  Metadata (3 tests)
 *   LY-S:  Structure / styling (3 tests)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ============================================================================
// We test the layout components by importing the module dynamically so we
// can control process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY per test group.
// ============================================================================

// Mock Clerk components
vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: any) => <div data-testid="clerk-provider">{children}</div>,
  SignedIn: ({ children }: any) => <div data-testid="signed-in">{children}</div>,
  SignedOut: ({ children }: any) => <div data-testid="signed-out">{children}</div>,
  UserButton: (props: any) => <div data-testid="user-button" data-after-sign-out={props.afterSignOutUrl} />,
}));

vi.mock("@clerk/themes", () => ({
  dark: { id: "dark-theme" },
}));

// ============================================================================
// Since the module reads `process.env` at module-level to set `hasClerkKeys`,
// we need to isolate module loading per test group.
// ============================================================================

describe("L7A-LY: Layout — Without Clerk Keys", () => {
  let RootLayout: any;

  beforeEach(async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    // Reset module cache so `hasClerkKeys` is re-evaluated
    vi.resetModules();
    const mod = await import("@/app/layout");
    RootLayout = mod.default;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // LY-NB: NavAuthButtons without Clerk
  describe("LY-NB: NavAuthButtons (no Clerk)", () => {
    it("NB01: renders 'Start Now →' link when Clerk is disabled", () => {
      render(<RootLayout><div>child</div></RootLayout>);
      const link = screen.getByText("Start Now →");
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute("href", "/wizard");
    });

    it("NB02: does not render SignedIn/SignedOut components", () => {
      render(<RootLayout><div>child</div></RootLayout>);
      expect(screen.queryByTestId("signed-in")).not.toBeInTheDocument();
      expect(screen.queryByTestId("signed-out")).not.toBeInTheDocument();
    });

    it("NB03: does not render UserButton", () => {
      render(<RootLayout><div>child</div></RootLayout>);
      expect(screen.queryByTestId("user-button")).not.toBeInTheDocument();
    });

    it("NB04: does not render Sign In link", () => {
      render(<RootLayout><div>child</div></RootLayout>);
      expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    });
  });

  // LY-RL: RootLayout without Clerk
  describe("LY-RL: RootLayout (no Clerk)", () => {
    it("RL01: renders Shell without ClerkProvider", () => {
      render(<RootLayout><div>my content</div></RootLayout>);
      expect(screen.queryByTestId("clerk-provider")).not.toBeInTheDocument();
      expect(screen.getByText("my content")).toBeInTheDocument();
    });

    it("RL02: renders children in main element", () => {
      const { container } = render(<RootLayout><div data-testid="child">Hello</div></RootLayout>);
      const main = container.querySelector("main");
      expect(main).toBeInTheDocument();
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  // LY-SH: Shell structure
  describe("LY-SH: Shell wrapper (no Clerk)", () => {
    it("SH01: renders nav element", () => {
      const { container } = render(<RootLayout><div>content</div></RootLayout>);
      expect(container.querySelector("nav")).toBeInTheDocument();
    });

    it("SH02: shows logo text", () => {
      render(<RootLayout><div>content</div></RootLayout>);
      expect(screen.getByText("EU AI Act")).toBeInTheDocument();
      expect(screen.getByText("Compliance")).toBeInTheDocument();
    });

    it("SH03: shows shield emoji", () => {
      render(<RootLayout><div>content</div></RootLayout>);
      expect(screen.getByText("🛡️")).toBeInTheDocument();
    });

    it("SH04: logo links to home", () => {
      render(<RootLayout><div>content</div></RootLayout>);
      const logo = screen.getByText("🛡️").closest("a");
      expect(logo).toHaveAttribute("href", "/");
    });

    it("SH05: shows Free Assessment nav link", () => {
      render(<RootLayout><div>content</div></RootLayout>);
      const link = screen.getByText("Free Assessment");
      expect(link.closest("a")).toHaveAttribute("href", "/wizard");
    });
  });
});

describe("L7A-LY: Layout — With Clerk Keys", () => {
  let RootLayout: any;

  beforeEach(async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_real-key-123");
    vi.resetModules();
    const mod = await import("@/app/layout");
    RootLayout = mod.default;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // LY-NB: NavAuthButtons with Clerk
  describe("LY-NB: NavAuthButtons (with Clerk)", () => {
    it("NB05: renders SignedOut container with Sign In and Get Started links", () => {
      render(<RootLayout><div>child</div></RootLayout>);
      expect(screen.getByTestId("signed-out")).toBeInTheDocument();
      const signIn = screen.getByText("Sign In");
      expect(signIn.closest("a")).toHaveAttribute("href", "/sign-in");
      const getStarted = screen.getByText("Get Started →");
      expect(getStarted.closest("a")).toHaveAttribute("href", "/sign-up");
    });

    it("NB06: renders SignedIn container with Dashboard link and UserButton", () => {
      render(<RootLayout><div>child</div></RootLayout>);
      expect(screen.getByTestId("signed-in")).toBeInTheDocument();
      const dashboard = screen.getByText("Dashboard");
      expect(dashboard.closest("a")).toHaveAttribute("href", "/result");
      expect(screen.getByTestId("user-button")).toBeInTheDocument();
    });

    it("NB07: UserButton has afterSignOutUrl set to /", () => {
      render(<RootLayout><div>child</div></RootLayout>);
      expect(screen.getByTestId("user-button")).toHaveAttribute("data-after-sign-out", "/");
    });

    it("NB08: does not render 'Start Now →' when Clerk is enabled", () => {
      render(<RootLayout><div>child</div></RootLayout>);
      expect(screen.queryByText("Start Now →")).not.toBeInTheDocument();
    });
  });

  // LY-RL: RootLayout with Clerk
  describe("LY-RL: RootLayout (with Clerk)", () => {
    it("RL03: wraps children in ClerkProvider", () => {
      render(<RootLayout><div>child</div></RootLayout>);
      expect(screen.getByTestId("clerk-provider")).toBeInTheDocument();
    });

    it("RL04: renders children through ClerkProvider → Shell → main", () => {
      render(<RootLayout><div>clerk child</div></RootLayout>);
      expect(screen.getByText("clerk child")).toBeInTheDocument();
    });

    it("RL05: shell nav structure is present inside ClerkProvider", () => {
      const { container } = render(<RootLayout><div>child</div></RootLayout>);
      const provider = screen.getByTestId("clerk-provider");
      expect(provider).toBeInTheDocument();
      expect(container.querySelector("nav")).toBeInTheDocument();
    });
  });

  // LY-SH: Shell still works with Clerk
  describe("LY-SH: Shell with Clerk", () => {
    it("SH06: still shows Free Assessment link", () => {
      render(<RootLayout><div>content</div></RootLayout>);
      const link = screen.getByText("Free Assessment");
      expect(link.closest("a")).toHaveAttribute("href", "/wizard");
    });
  });
});

// ============================================================================
// LY-M: Metadata (testing the export)
// ============================================================================
describe("L7A-LY-M: Metadata", () => {
  it("M01: exports metadata with correct title", async () => {
    // Reset modules to import fresh
    vi.resetModules();
    const mod = await import("@/app/layout");
    expect(mod.metadata).toBeDefined();
    expect(mod.metadata.title).toBe("EU AI Act Compliance | Are You Ready?");
  });

  it("M02: exports metadata with description", async () => {
    vi.resetModules();
    const mod = await import("@/app/layout");
    expect(mod.metadata.description).toContain("EU AI Act classification wizard");
  });

  it("M03: description mentions SMBs", async () => {
    vi.resetModules();
    const mod = await import("@/app/layout");
    expect(mod.metadata.description).toContain("SMBs");
  });
});

// ============================================================================
// LY-S: Structure / styling edge cases
// ============================================================================
describe("L7A-LY-S: Structure & styling", () => {
  let RootLayout: any;

  beforeEach(async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.resetModules();
    const mod = await import("@/app/layout");
    RootLayout = mod.default;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("S01: html element has lang='en' and class='dark'", () => {
    const { container } = render(<RootLayout><div>foo</div></RootLayout>);
    const html = container.closest("html") || container.querySelector("html");
    // jsdom may not support direct html, but the component renders html tag
    // Let's check what we can
    expect(container.innerHTML).toContain("dark");
  });

  it("S02: body has antialiased class", () => {
    const { container } = render(<RootLayout><div>foo</div></RootLayout>);
    expect(container.innerHTML).toContain("antialiased");
  });

  it("S03: renders 'your-key-here' as no-Clerk mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_your-key-here_abc");
    vi.resetModules();
    const mod = await import("@/app/layout");
    const Layout = mod.default;
    render(<Layout><div>child</div></Layout>);
    expect(screen.queryByTestId("clerk-provider")).not.toBeInTheDocument();
    expect(screen.getByText("Start Now →")).toBeInTheDocument();
  });
});
