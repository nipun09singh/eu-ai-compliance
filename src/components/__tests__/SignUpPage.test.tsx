/**
 * LAYER 7A — Sign Up Page Tests (L7A-SU)
 *
 * Clerk sign-up wrapper page.
 *
 * 6 tests across 2 groups:
 *   SU-R: Rendering (4 tests)
 *   SU-S: Structure (2 tests)
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock Clerk SignUp component
vi.mock("@clerk/nextjs", () => ({
  SignUp: (props: any) => (
    <div data-testid="clerk-sign-up" data-appearance={JSON.stringify(props.appearance)}>
      Clerk SignUp
    </div>
  ),
}));

import SignUpPage from "@/app/sign-up/[[...sign-up]]/page";

// ============================================================================
// SU-R: Rendering
// ============================================================================
describe("L7A-SU-R: Rendering", () => {
  it("SU-R01: renders Create Your Account heading", () => {
    render(<SignUpPage />);
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  it("SU-R02: heading is h1", () => {
    render(<SignUpPage />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Create your account");
  });

  it("SU-R03: renders description text about EU AI Act", () => {
    render(<SignUpPage />);
    expect(screen.getByText(/compliance documents.*obligation tracking/)).toBeInTheDocument();
  });

  it("SU-R04: renders Clerk SignUp component", () => {
    render(<SignUpPage />);
    expect(screen.getByTestId("clerk-sign-up")).toBeInTheDocument();
  });
});

// ============================================================================
// SU-S: Structure
// ============================================================================
describe("L7A-SU-S: Structure", () => {
  it("SU-S01: has centered container layout", () => {
    const { container } = render(<SignUpPage />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("items-center");
    expect(wrapper.className).toContain("justify-center");
  });

  it("SU-S02: has min-height for vertical centering", () => {
    const { container } = render(<SignUpPage />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-");
  });
});
