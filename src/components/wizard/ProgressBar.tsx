"use client";

/**
 * ProgressBar — shows wizard completion and step labels
 */
import { useWizardStore } from "@/lib/store";

export default function ProgressBar() {
  const { progress, currentStepId, goToStep } = useWizardStore();
  const visibleSteps = useWizardStore((s) => s.getVisibleSteps());

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-[var(--color-surface)]">
          <div
            className="h-2 rounded-full bg-brand-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          {progress}%
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {visibleSteps.map((step, i) => {
          const isActive = step.id === currentStepId;
          const stepIndex = visibleSteps.findIndex((s) => s.id === currentStepId);
          const isPast = i < stepIndex;

          return (
            <button
              key={step.id}
              onClick={() => isPast && goToStep(step.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : isPast
                  ? "bg-[var(--color-surface)] text-brand-400 hover:bg-[var(--color-surface-hover)] cursor-pointer"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] cursor-default"
              }`}
            >
              <span>{step.icon}</span>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
