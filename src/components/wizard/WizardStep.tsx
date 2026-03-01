"use client";

/**
 * WizardStep — renders the current step's title, questions, and navigation buttons.
 */
import { useWizardStore } from "@/lib/store";
import QuestionRenderer from "./QuestionRenderer";

export default function WizardStep() {
  const { currentStep, nextStep, prevStep, currentStepId } = useWizardStore();
  const visibleQuestions = useWizardStore((s) => s.getVisibleQuestions());
  const visibleSteps = useWizardStore((s) => s.getVisibleSteps());

  const isFirstStep = visibleSteps[0]?.id === currentStepId;
  const isLastStep = visibleSteps[visibleSteps.length - 1]?.id === currentStepId;
  const isSummaryStep = currentStep.id === "summary";

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <span className="text-3xl">{currentStep.icon}</span>
          <h2 className="text-2xl font-bold">{currentStep.title}</h2>
        </div>
        <p className="text-[var(--color-text-muted)]">
          {currentStep.subtitle}
        </p>
      </div>

      {/* Questions */}
      {isSummaryStep ? (
        <SummaryView />
      ) : (
        <div className="space-y-2">
          {visibleQuestions.map((q) => (
            <QuestionRenderer key={q.id} question={q} />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={isFirstStep}
          className={`rounded-xl px-6 py-3 font-medium transition-colors ${
            isFirstStep
              ? "invisible"
              : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-white"
          }`}
        >
          ← Back
        </button>

        <button
          onClick={nextStep}
          className={`rounded-xl px-8 py-3 font-semibold transition-colors ${
            isSummaryStep
              ? "bg-green-600 text-white hover:bg-green-500 text-lg px-10 py-4"
              : "bg-brand-600 text-white hover:bg-brand-500"
          }`}
        >
          {isSummaryStep
            ? "🔍 Get My Classification"
            : isLastStep
            ? "Review & Submit"
            : "Continue →"}
        </button>
      </div>
    </div>
  );
}

function SummaryView() {
  const { answers } = useWizardStore();

  const answeredCount = Object.values(answers).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
      <h3 className="mb-4 text-lg font-semibold">Ready to classify</h3>
      <p className="mb-6 text-[var(--color-text-muted)]">
        You&apos;ve answered {answeredCount} questions about your AI system.
        Click the button below to get your EU AI Act risk classification,
        specific obligations, enforcement deadlines, and fine exposure.
      </p>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {answers.companyName && (
          <SummaryItem label="Company" value={answers.companyName} />
        )}
        {answers.companySize && (
          <SummaryItem label="Size" value={answers.companySize} />
        )}
        {answers.role && <SummaryItem label="Role" value={answers.role} />}
        {answers.systemDescription && (
          <SummaryItem
            label="System"
            value={
              answers.systemDescription.length > 60
                ? answers.systemDescription.slice(0, 60) + "..."
                : answers.systemDescription
            }
          />
        )}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--color-bg)] p-3">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
