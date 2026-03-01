"use client";

/**
 * QuestionRenderer — renders a single wizard question based on its type.
 * Handles: BOOLEAN (yes/no cards), SINGLE_SELECT (option cards), TEXT (input), NUMBER (input)
 */
import type { WizardQuestion } from "@/lib/wizard-questions";
import { useWizardStore } from "@/lib/store";
import { useState } from "react";

interface Props {
  question: WizardQuestion;
}

export default function QuestionRenderer({ question }: Props) {
  const { answers, setAnswer } = useWizardStore();
  const fieldKey =
    typeof question.mapToField === "string" ? question.mapToField : question.id;
  const currentValue = (answers as any)[fieldKey];

  return (
    <div className="mb-6">
      {/* Question text */}
      <label className="mb-2 block text-base font-medium leading-relaxed">
        {question.text}
      </label>

      {/* Help text */}
      {question.helpText && <HelpText text={question.helpText} />}

      {/* Input based on type */}
      <div className="mt-3">
        {question.type === "BOOLEAN" && (
          <BooleanInput
            value={currentValue}
            onChange={(v) => setAnswer(fieldKey, v)}
          />
        )}
        {question.type === "SINGLE_SELECT" && question.options && (
          <SelectInput
            options={question.options}
            value={currentValue}
            onChange={(v) => setAnswer(fieldKey, v)}
          />
        )}
        {question.type === "TEXT" && (
          <TextInput
            value={currentValue ?? ""}
            onChange={(v) => setAnswer(fieldKey, v)}
          />
        )}
        {question.type === "NUMBER" && (
          <NumberInput
            value={currentValue}
            onChange={(v) => setAnswer(fieldKey, v)}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HelpText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 120;

  return (
    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
      {isLong && !expanded ? text.slice(0, 120) + "..." : text}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-1 text-brand-400 hover:text-brand-300 text-xs"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </p>
  );
}

function BooleanInput({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onChange(true)}
        className={`flex-1 rounded-xl border-2 px-6 py-4 font-medium transition-all ${
          value === true
            ? "border-brand-500 bg-brand-500/10 text-brand-400"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
        }`}
      >
        Yes
      </button>
      <button
        onClick={() => onChange(false)}
        className={`flex-1 rounded-xl border-2 px-6 py-4 font-medium transition-all ${
          value === false
            ? "border-brand-500 bg-brand-500/10 text-brand-400"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
        }`}
      >
        No
      </button>
    </div>
  );
}

function SelectInput({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; description?: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-xl border-2 px-5 py-4 text-left transition-all ${
            value === opt.value
              ? "border-brand-500 bg-brand-500/10"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          <span
            className={`font-medium ${
              value === opt.value
                ? "text-brand-400"
                : "text-[var(--color-text)]"
            }`}
          >
            {opt.label}
          </span>
          {opt.description && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {opt.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer..."
      className="w-full rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-brand-500 focus:outline-none transition-colors"
    />
  );
}

function NumberInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      placeholder="Enter a number..."
      className="w-full rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-brand-500 focus:outline-none transition-colors"
    />
  );
}
