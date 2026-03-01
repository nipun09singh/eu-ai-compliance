"use client";

import type { RiskClassification } from "@/lib/classification-engine";

const CONFIG: Record<
  RiskClassification,
  { label: string; color: string; bg: string; border: string; icon: string; description: string }
> = {
  PROHIBITED: {
    label: "PROHIBITED",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "🚨",
    description: "This AI practice is BANNED under the EU AI Act.",
  },
  HIGH_RISK: {
    label: "HIGH RISK",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: "⚠️",
    description: "Significant compliance obligations apply. Start immediately.",
  },
  LIMITED_RISK: {
    label: "LIMITED RISK",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: "👁️",
    description: "Transparency obligations apply. Users must be informed.",
  },
  GPAI: {
    label: "GPAI MODEL",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    icon: "🧠",
    description: "General-purpose AI model obligations apply.",
  },
  GPAI_SYSTEMIC: {
    label: "GPAI — SYSTEMIC RISK",
    color: "text-violet-300",
    bg: "bg-violet-500/15",
    border: "border-violet-400/40",
    icon: "🧠⚠️",
    description: "Highest GPAI tier. Additional safety & reporting obligations.",
  },
  MINIMAL_RISK: {
    label: "MINIMAL RISK",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: "✅",
    description: "No mandatory requirements beyond AI literacy. You're in good shape.",
  },
};

export default function ClassificationBadge({
  classification,
}: {
  classification: RiskClassification;
}) {
  const c = CONFIG[classification];

  return (
    <div
      className={`rounded-2xl border-2 ${c.border} ${c.bg} p-8 text-center`}
    >
      <div className="mb-4 text-5xl">{c.icon}</div>
      <h2 className={`mb-2 text-3xl font-black tracking-tight ${c.color}`}>
        {c.label}
      </h2>
      <p className="text-lg text-[var(--color-text-muted)]">{c.description}</p>
    </div>
  );
}
