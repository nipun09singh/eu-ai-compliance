"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClassificationResult } from "@/lib/classification-engine";
import ClassificationBadge from "@/components/result/ClassificationBadge";
import ObligationsList from "@/components/result/ObligationsList";
import FineCalculator from "@/components/result/FineCalculator";
import TimelineView from "@/components/result/TimelineView";
import DocumentGenerator from "@/components/result/DocumentGenerator";
import Link from "next/link";

export default function ResultPage() {
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [companyName, setCompanyName] = useState("Your Company");
  const [systemDescription, setSystemDescription] = useState("AI system under EU AI Act assessment");
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("classificationResult");
    const answersStored = sessionStorage.getItem("wizardAnswers");
    if (stored) {
      setResult(JSON.parse(stored));
      if (answersStored) {
        const answers = JSON.parse(answersStored);
        if (answers.companyName) setCompanyName(answers.companyName);
        if (answers.systemDescription) setSystemDescription(answers.systemDescription);
      }
    } else {
      router.push("/wizard");
    }
  }, [router]);

  if (!result) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-[var(--color-text-muted)]">Loading classification...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-3xl font-black">Your Classification Result</h1>
        <Link
          href="/wizard"
          className="text-sm text-brand-400 hover:text-brand-300"
        >
          ← Retake assessment
        </Link>
      </div>
      <p className="mb-8 text-[var(--color-text-muted)]">
        Based on your answers, cross-referenced against all 113 articles of the
        EU AI Act (Regulation 2024/1689).
      </p>

      {/* Classification badge */}
      <ClassificationBadge classification={result.classification} />

      {/* Key info grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <InfoCard
          label="Confidence"
          value={result.confidence}
          description={
            result.confidence === "DEFINITIVE"
              ? "Clear-cut classification"
              : result.confidence === "LIKELY"
              ? "High confidence, edge cases possible"
              : "Consider professional legal review"
          }
        />
        <InfoCard
          label="Your Role"
          value={result.role}
          description={
            result.detectedRoles && result.detectedRoles.length > 1
              ? `Multiple roles: ${result.detectedRoles.join(", ")}`
              : result.role === "PROVIDER"
              ? "You build/develop AI systems"
              : result.role === "DEPLOYER"
              ? "You use AI built by others"
              : "You build AND use AI"
          }
        />
        <InfoCard
          label="Legal Basis"
          value={result.legalBasis.join(", ")}
          description="Articles of the EU AI Act"
        />
      </div>

      {/* Art 25 Provider Upgrade Alert */}
      {result.art25ProviderUpgrade && (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-red-400">
            🚨 Art 25 Role Upgrade
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Based on your answers, you have been <strong>upgraded to Provider status</strong> under
            Article 25 of the EU AI Act. This means you must meet all provider obligations,
            even though you originally identified as a deployer. This commonly happens when
            you put your own brand on an AI system, make substantial modifications, or
            repurpose a system for high-risk use.
          </p>
        </div>
      )}

      {/* Substantial Modification Flag */}
      {result.substantialModificationFlag && (
        <div className="mt-4 rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-orange-400">
            🔄 Substantial Modification Detected
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Your AI system has undergone a substantial modification (Art 6(6)). This triggers
            a full re-assessment of conformity — you must update technical documentation,
            perform a new conformity assessment, update the EU Declaration of Conformity,
            and update the EU database registration.
          </p>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-yellow-400">
            ⚠️ Important Warnings
          </h3>
          <ul className="space-y-2">
            {result.warnings.map((w, i) => (
              <li
                key={i}
                className="text-sm text-[var(--color-text-muted)] leading-relaxed"
              >
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SME simplifications */}
      {result.smeSimplifications.length > 0 && (
        <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-green-400">
            💡 SME Advantages
          </h3>
          <ul className="space-y-2">
            {result.smeSimplifications.map((s, i) => (
              <li
                key={i}
                className="text-sm text-[var(--color-text-muted)] leading-relaxed"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fine exposure */}
      <div className="mt-8">
        <FineCalculator fineRisk={result.fineRisk} />
      </div>

      {/* Sector-Specific Guidance */}
      {result.sectorSpecificGuidance && result.sectorSpecificGuidance.length > 0 && (
        <div className="mt-8 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-purple-400">
            🏥 Sector-Specific Requirements
          </h3>
          <ul className="space-y-2">
            {result.sectorSpecificGuidance.map((g, i) => (
              <li key={i} className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* GDPR Interplay */}
      {result.gdprInterplay && result.gdprInterplay.length > 0 && (
        <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-blue-400">
            🔒 GDPR & Data Protection
          </h3>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">
            The EU AI Act and GDPR apply in parallel. Here are the key interplay requirements:
          </p>
          <ul className="space-y-2">
            {result.gdprInterplay.map((g, i) => (
              <li key={i} className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transitional Provisions */}
      {result.transitionalProvisions && result.transitionalProvisions.length > 0 && (
        <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-cyan-400">
            ⏳ Transitional Provisions
          </h3>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">
            Grace periods apply to your existing system:
          </p>
          <ul className="space-y-2">
            {result.transitionalProvisions.map((p, i) => (
              <li key={i} className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Value Chain Warnings */}
      {result.valueChainWarnings && result.valueChainWarnings.length > 0 && (
        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-amber-400">
            🔗 Supply Chain Obligations
          </h3>
          <ul className="space-y-2">
            {result.valueChainWarnings.map((w, i) => (
              <li key={i} className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sandbox Guidance */}
      {result.sandboxGuidance && result.sandboxGuidance.length > 0 && (
        <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-emerald-400">
            🧪 Regulatory Sandbox Opportunity
          </h3>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">
            EU Member States are establishing AI regulatory sandboxes. You may benefit from:
          </p>
          <ul className="space-y-2">
            {result.sandboxGuidance.map((g, i) => (
              <li key={i} className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Authority Cooperation */}
      {result.authorityCooperation && result.authorityCooperation.length > 0 && (
        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h3 className="mb-3 text-lg font-bold">
            🏛️ Regulatory Authority Cooperation
          </h3>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">
            What to expect from market surveillance authorities:
          </p>
          <ul className="space-y-2">
            {result.authorityCooperation.map((c, i) => (
              <li key={i} className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Obligations */}
      <div className="mt-8">
        <ObligationsList obligations={result.obligations} />
      </div>

      {/* Timeline */}
      <div className="mt-8">
        <TimelineView currentDeadline={result.enforcementDeadline} />
      </div>

      {/* Next steps */}
      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-3 text-xl font-bold">🚀 Next Steps</h3>
        <ol className="space-y-2">
          {result.nextSteps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="text-[var(--color-text-muted)]">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Document Generator */}
      <div className="mt-8">
        <DocumentGenerator
          result={result}
          companyName={companyName}
          systemDescription={systemDescription}
        />
      </div>

      {/* Disclaimer */}
      <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
        This classification is based on your self-reported answers and
        Regulation (EU) 2024/1689. It does not constitute legal advice. For
        binding legal opinions, consult a qualified legal professional.
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  );
}
