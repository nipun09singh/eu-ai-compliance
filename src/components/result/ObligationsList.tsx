"use client";

import type { Obligation } from "@/lib/classification-engine";

export default function ObligationsList({
  obligations,
}: {
  obligations: Obligation[];
}) {
  const critical = obligations.filter((o) => o.priority === "CRITICAL");
  const high = obligations.filter((o) => o.priority === "HIGH");
  const medium = obligations.filter((o) => o.priority === "MEDIUM");
  const low = obligations.filter((o) => o.priority === "LOW");

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="mb-1 text-xl font-bold">
        Your Obligations ({obligations.length})
      </h3>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        Ranked by priority. Each needs to be addressed before the enforcement deadline.
      </p>

      {critical.length > 0 && (
        <ObligationGroup
          label="🔴 Critical"
          items={critical}
          dotColor="bg-red-500"
        />
      )}
      {high.length > 0 && (
        <ObligationGroup
          label="🟠 High"
          items={high}
          dotColor="bg-orange-500"
        />
      )}
      {medium.length > 0 && (
        <ObligationGroup
          label="🟡 Medium"
          items={medium}
          dotColor="bg-yellow-500"
        />
      )}
      {low.length > 0 && (
        <ObligationGroup
          label="🟢 Low"
          items={low}
          dotColor="bg-green-500"
        />
      )}
    </div>
  );
}

function ObligationGroup({
  label,
  items,
  dotColor,
}: {
  label: string;
  items: Obligation[];
  dotColor: string;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label} — {items.length}
      </h4>
      <div className="space-y-3">
        {items.map((o) => (
          <div
            key={o.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
          >
            <div className="mb-1 flex items-start gap-2">
              <span
                className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${dotColor}`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold">{o.title}</h5>
                  <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-0.5 text-xs text-[var(--color-text-muted)]">
                    {o.article}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {o.description.length > 200
                    ? o.description.slice(0, 200) + "..."
                    : o.description}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  <span>Role: {o.appliesToRole}</span>
                  <span>·</span>
                  <span>Deadline: {o.deadline}</span>
                  {o.templateId && (
                    <>
                      <span>·</span>
                      <span className="text-brand-400">
                        📄 Template available
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
