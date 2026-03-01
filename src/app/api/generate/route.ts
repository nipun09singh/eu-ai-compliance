import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  generateDocument,
  generateExecutiveSummary,
  getApplicableTemplates,
  type GenerationRequest,
} from "@/lib/doc-generator";
import type { ClassificationResult } from "@/lib/classification-engine";
import { TEMPLATE_REGISTRY } from "@/lib/classification-engine";

export const maxDuration = 60; // Allow up to 60s for Claude API calls

// ─── POST /api/generate ───────────────────────────────────────────────────────
// Generates a single compliance document or executive summary.
// Requires authentication.
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Auth check (defense in depth — middleware also protects this route)
    // Skipped when Clerk is not configured (dev mode)
    const hasClerkKeys =
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your-key-here");

    if (hasClerkKeys) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { templateId, result, companyName, systemDescription } = body as {
      templateId: string;
      result: ClassificationResult;
      companyName: string;
      systemDescription: string;
    };

    // Validate required fields (companyName and systemDescription get defaults)
    if (!templateId || !result) {
      return NextResponse.json(
        { error: "Missing required fields: templateId, result" },
        { status: 400 }
      );
    }

    const resolvedCompanyName = companyName || "Your Company";
    const resolvedSystemDescription =
      systemDescription || `AI system classified as ${result.classification} under EU AI Act`;

    // Validate template exists (unless executive summary)
    if (templateId !== "EXEC_SUMMARY" && !TEMPLATE_REGISTRY[templateId]) {
      return NextResponse.json(
        { error: `Unknown template: ${templateId}` },
        { status: 400 }
      );
    }

    // Generate the document
    const doc =
      templateId === "EXEC_SUMMARY"
        ? await generateExecutiveSummary(result, resolvedCompanyName, resolvedSystemDescription)
        : await generateDocument(templateId, result, resolvedCompanyName, resolvedSystemDescription);

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error("Document generation error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Distinguish API key errors from other errors
    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "API key not configured. Set ANTHROPIC_API_KEY in .env.local" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Generation failed: ${message}` },
      { status: 500 }
    );
  }
}

// ─── GET /api/generate?classification=HIGH_RISK&role=PROVIDER ─────────────────
// Returns the list of applicable templates for a classification + role.
// ───────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classification = searchParams.get("classification");
  const role = searchParams.get("role");

  if (!classification || !role) {
    return NextResponse.json(
      { error: "Missing query params: classification, role" },
      { status: 400 }
    );
  }

  // Build a minimal result object for template filtering
  const minimalResult = {
    classification,
    role,
  } as ClassificationResult;

  const templateIds = getApplicableTemplates(minimalResult);
  const templates = templateIds.map((id) => ({
    id,
    ...TEMPLATE_REGISTRY[id],
  }));

  return NextResponse.json({ templates });
}
