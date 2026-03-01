import type { Metadata } from "next";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "EU AI Act Compliance | Are You Ready?",
  description:
    "Free EU AI Act classification wizard for SMBs. Find out your risk level, obligations, and deadlines in 15 minutes.",
};

const hasClerkKeys =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your-key-here");

function NavAuthButtons() {
  if (!hasClerkKeys) {
    return (
      <a
        href="/wizard"
        className="rounded-lg bg-brand-600 px-4 py-2 text-white font-medium hover:bg-brand-500 transition-colors"
      >
        Start Now →
      </a>
    );
  }

  return (
    <>
      <SignedOut>
        <a href="/sign-in" className="hover:text-white transition-colors">
          Sign In
        </a>
        <a
          href="/sign-up"
          className="rounded-lg bg-brand-600 px-4 py-2 text-white font-medium hover:bg-brand-500 transition-colors"
        >
          Get Started →
        </a>
      </SignedOut>
      <SignedIn>
        <a href="/result" className="hover:text-white transition-colors">
          Dashboard
        </a>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </SignedIn>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
        <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <a href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="text-2xl">🛡️</span>
              <span>
                EU AI Act<span className="text-brand-400"> Compliance</span>
              </span>
            </a>
            <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
              <a href="/wizard" className="hover:text-white transition-colors">
                Free Assessment
              </a>
              <NavAuthButtons />
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasClerkKeys) {
    return <Shell>{children}</Shell>;
  }

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#6d5aff",
          colorBackground: "#0a0a0f",
          colorInputBackground: "#141420",
          colorText: "#e4e4ef",
        },
      }}
    >
      <Shell>{children}</Shell>
    </ClerkProvider>
  );
}
