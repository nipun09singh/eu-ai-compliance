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

  // Validation
  validationErrors: string[];
  showValidation: boolean;

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
  getStepValidationErrors: () => string[];
}

const initialStep = WIZARD_STEPS[0];

export const useWizardStore = create<WizardState>((set, get) => ({
  currentStepId: initialStep.id,
  currentStep: initialStep,
  answers: {},
  result: null,
  isComplete: false,
  progress: 0,
  validationErrors: [],
  showValidation: false,

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

    // Validate current step before proceeding
    const errors = get().getStepValidationErrors();
    if (errors.length > 0) {
      set({ validationErrors: errors, showValidation: true });
      return;
    }

    set({ validationErrors: [], showValidation: false });
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
      validationErrors: [],
      showValidation: false,
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

  getStepValidationErrors: () => {
    const { currentStep, answers } = get();
    const visible = getVisibleQuestions(currentStep, answers);
    const errors: string[] = [];

    for (const q of visible) {
      const fieldKey = typeof q.mapToField === "string" ? q.mapToField : q.id;
      const value = (answers as any)[fieldKey];

      // TEXT fields must be non-empty strings
      if (q.type === "TEXT") {
        if (!value || (typeof value === "string" && value.trim() === "")) {
          errors.push(`Please answer: ${q.text}`);
        }
      }
      // BOOLEAN & SINGLE_SELECT must have a selection
      else if (q.type === "BOOLEAN" || q.type === "SINGLE_SELECT") {
        if (value === undefined || value === null) {
          errors.push(`Please answer: ${q.text}`);
        }
      }
      // NUMBER must be defined
      else if (q.type === "NUMBER") {
        if (value === undefined || value === null || isNaN(value)) {
          errors.push(`Please answer: ${q.text}`);
        }
      }
    }

    return errors;
  },
}));
