import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Get instant compliance documents, obligation tracking, and deadline
            reminders for the EU AI Act.
          </p>
        </div>
        <SignUp
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
