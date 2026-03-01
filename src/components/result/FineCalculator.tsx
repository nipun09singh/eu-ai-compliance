"use client";

import type { FineRisk } from "@/lib/classification-engine";

export default function FineCalculator({
  fineRisk,
  companySize,
}: {
  fineRisk: FineRisk;
  companySize?: string;
}) {
  if (fineRisk.maxPercentTurnover === 0) return null;

  const isSME = companySize && companySize !== "LARGE";

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
      <h3 className="mb-1 text-xl font-bold text-red-400">
        💰 Fine Exposure
      </h3>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        Non-compliance penalties under {fineRisk.article}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            Maximum Fine
          </p>
          <p className="mt-1 text-2xl font-black text-red-400">
            {fineRisk.maxAmountGeneral}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            or {fineRisk.maxPercentTurnover}% of global annual turnover
          </p>
        </div>

        {isSME && (
          <div className="rounded-xl bg-[var(--color-surface)] p-4">
            <p className="text-xs text-[var(--color-text-muted)]">
              Your SME Cap
            </p>
            <p className="mt-1 text-lg font-bold text-yellow-400">
              {fineRisk.maxAmountSME}
            </p>
            {fineRisk.note && (
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {fineRisk.note}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
