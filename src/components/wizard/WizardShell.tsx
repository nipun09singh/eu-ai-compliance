"use client";

/**
 * WizardShell — top-level wizard container with progress + step rendering.
 * Redirects to /result when classification is complete.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";
import ProgressBar from "./ProgressBar";
import WizardStep from "./WizardStep";

export default function WizardShell() {
  const { isComplete, result, answers } = useWizardStore();
  const router = useRouter();

  useEffect(() => {
    if (isComplete && result) {
      // Store result and answers in sessionStorage for the result page
      sessionStorage.setItem("classificationResult", JSON.stringify(result));
      sessionStorage.setItem("wizardAnswers", JSON.stringify(answers));
      router.push("/result");
    }
  }, [isComplete, result, answers, router]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <ProgressBar />
      <WizardStep />
    </div>
  );
}
