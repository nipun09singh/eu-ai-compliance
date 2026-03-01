import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient bg */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-950/50 via-transparent to-transparent" />

        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-400">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            EU AI Act enforcement: Aug 2026 — ~5 months away
          </div>

          <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight sm:text-6xl">
            Is Your AI System{" "}
            <span className="text-brand-400">EU AI Act</span> Compliant?
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-xl text-[var(--color-text-muted)] leading-relaxed">
            Free classification in 15 minutes. Know your risk level,
            obligations, deadlines, and fine exposure — before the regulators
            come knocking.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/wizard"
              className="rounded-2xl bg-brand-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all hover:shadow-brand-500/30 hover:scale-[1.02]"
            >
              Start Free Assessment →
            </Link>
            <span className="text-sm text-[var(--color-text-muted)]">
              No sign-up required • Takes ~15 min
            </span>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            <div>
              <p className="text-3xl font-black text-brand-400">€35M</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Max fine for prohibited AI practices
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-orange-400">16</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Obligations for high-risk AI providers
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-yellow-400">~5 months</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Until high-risk enforcement (Aug 2026)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">
          How It Works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              icon: "💬",
              title: "Answer Simple Questions",
              description:
                "11 steps of plain-language questions about your AI system. No legal jargon. Takes ~15 minutes.",
            },
            {
              step: "2",
              icon: "🔍",
              title: "Get Your Classification",
              description:
                "Our engine checks your system against every article of the EU AI Act. Instant, accurate result.",
            },
            {
              step: "3",
              icon: "📋",
              title: "Compliance Roadmap",
              description:
                "See exactly which obligations apply, your deadlines, fine exposure, and get auto-generated templates.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {item.step}
                </span>
                <span className="text-2xl">{item.icon}</span>
              </div>
              <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk categories preview */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="mb-4 text-center text-3xl font-bold">
            6 Risk Classifications
          </h2>
          <p className="mb-12 text-center text-[var(--color-text-muted)]">
            The EU AI Act classifies every AI system into one of these
            categories
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Prohibited", color: "border-red-500/30 bg-red-500/5", icon: "🚨", fine: "€35M / 7%" },
              { label: "High Risk", color: "border-orange-500/30 bg-orange-500/5", icon: "⚠️", fine: "€15M / 3%" },
              { label: "GPAI Systemic", color: "border-violet-500/30 bg-violet-500/5", icon: "🧠", fine: "€15M / 3%" },
              { label: "GPAI", color: "border-violet-500/20 bg-violet-500/5", icon: "🧠", fine: "€15M / 3%" },
              { label: "Limited Risk", color: "border-yellow-500/30 bg-yellow-500/5", icon: "👁️", fine: "€15M / 3%" },
              { label: "Minimal Risk", color: "border-green-500/30 bg-green-500/5", icon: "✅", fine: "None" },
            ].map((cat) => (
              <div
                key={cat.label}
                className={`rounded-xl border p-5 ${cat.color}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">
                    {cat.icon}{" "}
                    <span className="font-bold">{cat.label}</span>
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Fine: {cat.fine}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold">
          Don&apos;t Wait for the Deadline
        </h2>
        <p className="mb-8 text-lg text-[var(--color-text-muted)]">
          August 2026 is coming fast. Find out where you stand today.
        </p>
        <Link
          href="/wizard"
          className="inline-block rounded-2xl bg-brand-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all"
        >
          Start Free Assessment →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-[var(--color-text-muted)]">
          <p>
            Based on Regulation (EU) 2024/1689 — the EU Artificial Intelligence
            Act.
          </p>
          <p className="mt-1">
            This tool provides guidance, not legal advice. Consult a qualified
            legal professional for binding opinions.
          </p>
          <p className="mt-3">
            © {new Date().getFullYear()} EU AI Act Compliance. Built in Dublin
            🇮🇪
          </p>
        </div>
      </footer>
    </div>
  );
}
