"use client";

import { useState } from "react";
import type { ClassificationResult } from "@/lib/classification-engine";
import { TEMPLATE_REGISTRY } from "@/lib/classification-engine";
import { getApplicableTemplates } from "@/lib/doc-generator";
import type { GeneratedDocument } from "@/lib/doc-generator";
import DocumentViewer from "./DocumentViewer";
import { useAuth, SignInButton } from "@clerk/nextjs";

interface DocumentGeneratorProps {
  result: ClassificationResult;
  companyName: string;
  systemDescription: string;
}

type GenState = "idle" | "generating" | "done" | "error";

export default function DocumentGenerator({
  result,
  companyName: initialCompanyName,
  systemDescription: initialSystemDescription,
}: DocumentGeneratorProps) {
  const { isSignedIn } = useAuth();
  // If Clerk is not configured (isSignedIn === undefined), allow generation
  const canGenerate = isSignedIn !== false;
  const applicableIds = getApplicableTemplates(result);

  const [companyName, setCompanyName] = useState(initialCompanyName || "");
  const [systemDescription, setSystemDescription] = useState(initialSystemDescription || "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(applicableIds)
  );
  const [genState, setGenState] = useState<GenState>("idle");
  const [currentTemplate, setCurrentTemplate] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [viewingDoc, setViewingDoc] = useState<GeneratedDocument | null>(null);
  const [error, setError] = useState("");

  if (applicableIds.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="text-lg font-bold">📄 Compliance Documents</h3>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          No compliance documents are required for your classification. You may
          still voluntarily adopt best practices.
        </p>
      </div>
    );
  }

  const toggleTemplate = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(applicableIds));
  const selectNone = () => setSelectedIds(new Set());

  const totalMinutes = Array.from(selectedIds).reduce(
    (sum, id) => sum + (TEMPLATE_REGISTRY[id]?.estimatedMinutes ?? 0),
    0
  );

  const handleGenerate = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setGenState("generating");
    setError("");
    setDocuments([]);
    setProgress({ done: 0, total: ids.length });

    // Include executive summary as first document
    const allIds = ["EXEC_SUMMARY", ...ids];
    setProgress({ done: 0, total: allIds.length });

    const docs: GeneratedDocument[] = [];

    for (let i = 0; i < allIds.length; i++) {
      const templateId = allIds[i];
      const tmpl =
        templateId === "EXEC_SUMMARY"
          ? { name: "Executive Summary" }
          : TEMPLATE_REGISTRY[templateId];
      setCurrentTemplate(tmpl?.name ?? templateId);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            result,
            companyName,
            systemDescription,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        docs.push(data.document);
        setDocuments([...docs]);
        setProgress({ done: i + 1, total: allIds.length });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setGenState("error");
        return;
      }
    }

    setGenState("done");
  };

  const handleDownloadAll = () => {
    const fullContent = documents
      .map(
        (doc) =>
          `${"=".repeat(80)}\n# ${doc.templateName}\n**${doc.article}**\n${"=".repeat(80)}\n\n${doc.content}\n\n`
      )
      .join("\n");

    const blob = new Blob(
      [
        `# EU AI Act Compliance Pack — ${companyName}\n`,
        `Generated: ${new Date().toLocaleString()}\n\n`,
        fullContent,
        `\n\n---\n\n`,
        `_${documents[0]?.disclaimer ?? ""}_\n`,
      ],
      { type: "text/markdown" }
    );
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `eu-ai-act-compliance-pack_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">📄 Generate Compliance Documents</h3>
          {genState === "idle" && (
            <span className="text-xs text-[var(--color-text-muted)]">
              {applicableIds.length} documents applicable
            </span>
          )}
        </div>

        {/* ── IDLE: Template selection ── */}
        {genState === "idle" && (
          <>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Select which compliance documents to generate. Each document is AI-generated
              with specific guidance for your classification, role, and applicable articles.
            </p>

            {/* Select all / none */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={selectAll}
                className="text-xs text-brand-400 hover:text-brand-300"
              >
                Select all
              </button>
              <span className="text-xs text-[var(--color-text-muted)]">·</span>
              <button
                onClick={selectNone}
                className="text-xs text-brand-400 hover:text-brand-300"
              >
                Select none
              </button>
              <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                {selectedIds.size} selected · ~{totalMinutes} min manual effort saved
              </span>
            </div>

            {/* Template list */}
            <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
              {applicableIds.map((id) => {
                const tmpl = TEMPLATE_REGISTRY[id];
                const isSelected = selectedIds.has(id);
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      isSelected
                        ? "bg-brand-600/10 border border-brand-500/20"
                        : "hover:bg-[var(--color-bg)] border border-transparent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTemplate(id)}
                      className="mt-1 h-4 w-4 rounded accent-brand-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{tmpl.name}</span>
                        <span className="flex-shrink-0 rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                          {tmpl.articles.join(", ")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)] line-clamp-1">
                        {tmpl.description}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[10px] text-[var(--color-text-muted)]">
                      ~{tmpl.estimatedMinutes}min
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Missing field prompts */}
            {(!companyName.trim() || !systemDescription.trim()) && (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-sm font-medium text-amber-400 mb-3">
                  Complete these fields to generate documents:
                </p>
                {!companyName.trim() && (
                  <div className="mb-3">
                    <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                      Company Name <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                )}
                {!systemDescription.trim() && (
                  <div>
                    <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                      AI System Description <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={systemDescription}
                      onChange={(e) => setSystemDescription(e.target.value)}
                      placeholder="e.g. AI chatbot for customer service"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Generate button — auth gated */}
            {canGenerate ? (
              <button
                onClick={handleGenerate}
                disabled={selectedIds.size === 0 || !companyName.trim() || !systemDescription.trim()}
                className="mt-4 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Generate {selectedIds.size} Document{selectedIds.size !== 1 ? "s" : ""} + Executive Summary
              </button>
            ) : (
              <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-center">
                <p className="text-sm font-medium">
                  Sign in to generate compliance documents
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Free classification — document generation requires an account.
                </p>
                <SignInButton mode="modal">
                  <button className="mt-3 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 transition-colors">
                    Sign In to Generate
                  </button>
                </SignInButton>
              </div>
            )}

            <p className="mt-2 text-center text-[10px] text-[var(--color-text-muted)]">
              Powered by Claude AI. Generation takes ~10-30 seconds per document.
            </p>
          </>
        )}

        {/* ── GENERATING: Progress ── */}
        {genState === "generating" && (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <span className="text-sm">
                Generating: <strong>{currentTemplate}</strong>
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-[var(--color-bg)]">
              <div
                className="h-2 rounded-full bg-brand-500 transition-all duration-500"
                style={{
                  width: `${(progress.done / progress.total) * 100}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              {progress.done} / {progress.total} documents complete
            </p>
          </div>
        )}

        {/* ── ERROR ── */}
        {genState === "error" && (
          <div className="mt-4">
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
              <p className="text-sm text-red-400 font-medium">Generation failed</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{error}</p>
            </div>
            {documents.length > 0 && (
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                {documents.length} document{documents.length !== 1 ? "s were" : " was"} generated before the error.
              </p>
            )}
            <button
              onClick={() => setGenState("idle")}
              className="mt-3 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
            >
              ← Back to selection
            </button>
          </div>
        )}

        {/* ── DONE: Document list ── */}
        {(genState === "done" || (genState === "error" && documents.length > 0)) && (
          <div className="mt-4">
            {genState === "done" && (
              <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
                <p className="text-sm text-green-400 font-medium">
                  ✓ {documents.length} documents generated successfully
                </p>
              </div>
            )}

            <div className="space-y-1">
              {documents.map((doc) => (
                <div
                  key={doc.templateId}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 py-3 hover:bg-[var(--color-bg)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{doc.templateName}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {doc.article} · {doc.wordCount} words
                    </p>
                  </div>
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="flex-shrink-0 rounded-lg bg-brand-600/20 px-3 py-1.5 text-xs font-medium text-brand-400 hover:bg-brand-600/30 transition-colors"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleDownloadAll}
                className="flex-1 rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-500 transition-colors"
              >
                ↓ Download All ({documents.length} docs)
              </button>
              <button
                onClick={() => {
                  setGenState("idle");
                  setDocuments([]);
                }}
                className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Document viewer modal */}
      {viewingDoc && (
        <DocumentViewer
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </>
  );
}
