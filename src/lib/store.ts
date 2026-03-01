/**
 * Wizard state management with Zustand
 * Persists wizard answers across steps, handles navigation, triggers classification.
 */
import { create } from "zustand";
import type { WizardAnswers, ClassificationResult } from "./classification-engine";
import { classifyAISystem } from "./classification-engine";
import {
  WIZARD_STEPS,
  getNextStep,
  getPreviousStep,
  getVisibleQuestions,
  getProgressPercent,
  getVisibleSteps,
} from "./wizard-questions";
import type { WizardStep } from "./wizard-questions";

interface WizardState {
  // Current step
  currentStepId: string;
  currentStep: WizardStep;

  // Answers (partial until complete)
  answers: Partial<WizardAnswers>;

  // Classification result (null until submitted)
  result: ClassificationResult | null;

  // Status
  isComplete: boolean;
  progress: number;

  // Actions
  setAnswer: (field: string, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepId: string) => void;
  submitClassification: () => void;
  reset: () => void;

  // Computed
  getVisibleQuestions: () => ReturnType<typeof getVisibleQuestions>;
  getVisibleSteps: () => WizardStep[];
}

const initialStep = WIZARD_STEPS[0];

export const useWizardStore = create<WizardState>((set, get) => ({
  currentStepId: initialStep.id,
  currentStep: initialStep,
  answers: {},
  result: null,
  isComplete: false,
  progress: 0,

  setAnswer: (field: string, value: any) => {
    set((state) => {
      const newAnswers = { ...state.answers, [field]: value };
      return {
        answers: newAnswers,
        progress: getProgressPercent(state.currentStepId, newAnswers),
      };
    });
  },

  nextStep: () => {
    const { currentStepId, answers } = get();
    const next = getNextStep(currentStepId, answers);
    if (next) {
      set({
        currentStepId: next.id,
        currentStep: next,
        progress: getProgressPercent(next.id, answers),
      });
    } else {
      // Last step — trigger classification
      get().submitClassification();
    }
  },

  prevStep: () => {
    const { currentStepId, answers } = get();
    const prev = getPreviousStep(currentStepId, answers);
    if (prev) {
      set({
        currentStepId: prev.id,
        currentStep: prev,
        progress: getProgressPercent(prev.id, answers),
      });
    }
  },

  goToStep: (stepId: string) => {
    const { answers } = get();
    const step = WIZARD_STEPS.find((s) => s.id === stepId);
    if (step && (!step.showIf || step.showIf(answers))) {
      set({
        currentStepId: step.id,
        currentStep: step,
        progress: getProgressPercent(step.id, answers),
      });
    }
  },

  submitClassification: () => {
    const { answers } = get();
    try {
      const result = classifyAISystem(answers as WizardAnswers);
      set({ result, isComplete: true, progress: 100 });
    } catch (e) {
      console.error("Classification error:", e);
    }
  },

  reset: () => {
    set({
      currentStepId: initialStep.id,
      currentStep: initialStep,
      answers: {},
      result: null,
      isComplete: false,
      progress: 0,
    });
  },

  getVisibleQuestions: () => {
    const { currentStep, answers } = get();
    return getVisibleQuestions(currentStep, answers);
  },

  getVisibleSteps: () => {
    const { answers } = get();
    return getVisibleSteps(answers);
  },
}));
