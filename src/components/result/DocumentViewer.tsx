"use client";

import { useState } from "react";
import type { GeneratedDocument } from "@/lib/doc-generator";

interface DocumentViewerProps {
  document: GeneratedDocument;
  onClose: () => void;
}

export default function DocumentViewer({ document: doc, onClose }: DocumentViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob(
      [
        `# ${doc.templateName}\n\n`,
        `**Article:** ${doc.article}\n`,
        `**Generated:** ${new Date(doc.generatedAt).toLocaleDateString()}\n`,
        `**Word Count:** ${doc.wordCount}\n\n`,
        `---\n\n`,
        doc.content,
        `\n\n---\n\n`,
        `_${doc.disclaimer}_\n`,
      ],
      { type: "text/markdown" }
    );
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${doc.templateId.toLowerCase().replace(/^tmpl_/, "")}_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">{doc.templateName}</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              {doc.article} · {doc.wordCount} words ·{" "}
              {new Date(doc.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface)] transition-colors"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <button
              onClick={handleDownload}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface)] transition-colors"
            >
              ↓ Download .md
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface)] transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="prose prose-invert max-w-none">
            {doc.content.split("\n").map((line, i) => {
              if (line.startsWith("# ")) {
                return (
                  <h1 key={i} className="mt-6 mb-3 text-2xl font-black">
                    {line.slice(2)}
                  </h1>
                );
              }
              if (line.startsWith("## ")) {
                return (
                  <h2 key={i} className="mt-5 mb-2 text-xl font-bold">
                    {line.slice(3)}
                  </h2>
                );
              }
              if (line.startsWith("### ")) {
                return (
                  <h3 key={i} className="mt-4 mb-2 text-lg font-semibold">
                    {line.slice(4)}
                  </h3>
                );
              }
              if (line.startsWith("#### ")) {
                return (
                  <h4 key={i} className="mt-3 mb-1 text-base font-semibold">
                    {line.slice(5)}
                  </h4>
                );
              }
              if (line.startsWith("---")) {
                return (
                  <hr
                    key={i}
                    className="my-4 border-[var(--color-border)]"
                  />
                );
              }
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                  <li
                    key={i}
                    className="ml-4 text-sm leading-relaxed text-[var(--color-text-muted)]"
                  >
                    {line.slice(2)}
                  </li>
                );
              }
              if (/^\d+\.\s/.test(line)) {
                return (
                  <li
                    key={i}
                    className="ml-4 list-decimal text-sm leading-relaxed text-[var(--color-text-muted)]"
                  >
                    {line.replace(/^\d+\.\s/, "")}
                  </li>
                );
              }
              if (line.startsWith("|")) {
                return (
                  <pre
                    key={i}
                    className="text-xs text-[var(--color-text-muted)] font-mono"
                  >
                    {line}
                  </pre>
                );
              }
              if (line.startsWith("> ")) {
                return (
                  <blockquote
                    key={i}
                    className="border-l-2 border-brand-500 pl-4 italic text-sm text-[var(--color-text-muted)]"
                  >
                    {line.slice(2)}
                  </blockquote>
                );
              }
              if (line.startsWith("⚠️")) {
                return (
                  <p
                    key={i}
                    className="rounded-lg bg-yellow-500/10 px-3 py-2 text-sm text-yellow-400"
                  >
                    {line}
                  </p>
                );
              }
              if (line.trim() === "") {
                return <div key={i} className="h-2" />;
              }
              return (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-[var(--color-text-muted)]"
                >
                  {renderInlineMarkdown(line)}
                </p>
              );
            })}
          </div>
        </div>

        {/* Disclaimer footer */}
        <div className="border-t border-[var(--color-border)] px-6 py-3">
          <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
            {doc.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Minimal inline markdown: **bold**, `code` */
function renderInlineMarkdown(text: string) {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Code
    const codeMatch = remaining.match(/`(.+?)`/);

    // Find earliest match
    const boldIdx = boldMatch?.index ?? Infinity;
    const codeIdx = codeMatch?.index ?? Infinity;

    if (boldIdx === Infinity && codeIdx === Infinity) {
      parts.push(remaining);
      break;
    }

    if (boldIdx <= codeIdx && boldMatch) {
      parts.push(remaining.slice(0, boldIdx));
      parts.push(
        <strong key={key++} className="font-semibold text-[var(--color-text)]">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldIdx + boldMatch[0].length);
    } else if (codeMatch) {
      parts.push(remaining.slice(0, codeIdx));
      parts.push(
        <code
          key={key++}
          className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-xs font-mono text-brand-400"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeIdx + codeMatch[0].length);
    }
  }

  return <>{parts}</>;
}
