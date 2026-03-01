"use client";

import { getEnforcementTimeline } from "@/lib/classification-engine";

export default function TimelineView({
  currentDeadline,
}: {
  currentDeadline: string;
}) {
  const milestones = getEnforcementTimeline();

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="mb-1 text-xl font-bold">📅 Enforcement Timeline</h3>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        Your deadline is highlighted
      </p>

      <div className="relative space-y-0">
        {milestones.map((m, i) => {
          const isYours = m.dateString === currentDeadline;
          const isLast = i === milestones.length - 1;

          return (
            <div key={m.dateString} className="flex gap-4">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-4 w-4 rounded-full flex-shrink-0 ${
                    m.status === "ENFORCED"
                      ? isYours
                        ? "bg-orange-500 ring-4 ring-orange-500/20"
                        : "bg-green-500"
                      : isYours
                      ? "bg-orange-500 ring-4 ring-orange-500/20"
                      : "bg-[var(--color-border)]"
                  }`}
                />
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[3rem] ${
                      m.status === "ENFORCED"
                        ? "bg-green-500/30"
                        : "bg-[var(--color-border)]"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div
                className={`flex-1 pb-6 ${
                  isYours ? "rounded-xl bg-orange-500/5 -ml-2 px-4 py-3 border border-orange-500/20" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {m.dateString}
                  </span>
                  {m.status === "ENFORCED" && (
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                      ENFORCED
                    </span>
                  )}
                  {m.status === "UPCOMING" && m.daysUntil > 0 && (
                    <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
                      {m.daysUntil} days left
                    </span>
                  )}
                  {isYours && (
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-400">
                      YOUR DEADLINE
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {m.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
