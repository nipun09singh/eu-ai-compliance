import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Sign in to your account</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Access your compliance documents, saved assessments, and dashboard.
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-none",
            },
          }}
        />
      </div>
    </div>
  );
}
