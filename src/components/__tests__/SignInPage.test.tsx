/**
 * LAYER 7A — Sign In Page Tests (L7A-SI)
 *
 * Clerk sign-in wrapper page.
 *
 * 6 tests across 2 groups:
 *   SI-R: Rendering (4 tests)
 *   SI-S: Structure (2 tests)
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock Clerk SignIn component
vi.mock("@clerk/nextjs", () => ({
  SignIn: (props: any) => (
    <div data-testid="clerk-sign-in" data-appearance={JSON.stringify(props.appearance)}>
      Clerk SignIn
    </div>
  ),
}));

import SignInPage from "@/app/sign-in/[[...sign-in]]/page";

// ============================================================================
// SI-R: Rendering
// ============================================================================
describe("L7A-SI-R: Rendering", () => {
  it("SI-R01: renders Sign In heading", () => {
    render(<SignInPage />);
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
  });

  it("SI-R02: heading is h1", () => {
    render(<SignInPage />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Sign in to your account");
  });

  it("SI-R03: renders description text", () => {
    render(<SignInPage />);
    expect(screen.getByText(/compliance documents.*saved assessments/)).toBeInTheDocument();
  });

  it("SI-R04: renders Clerk SignIn component", () => {
    render(<SignInPage />);
    expect(screen.getByTestId("clerk-sign-in")).toBeInTheDocument();
  });
});

// ============================================================================
// SI-S: Structure
// ============================================================================
describe("L7A-SI-S: Structure", () => {
  it("SI-S01: has centered container layout", () => {
    const { container } = render(<SignInPage />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("items-center");
    expect(wrapper.className).toContain("justify-center");
  });

  it("SI-S02: has min-height for vertical centering", () => {
    const { container } = render(<SignInPage />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-");
  });
});
