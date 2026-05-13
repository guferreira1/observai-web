import type { Analysis } from "@/features/analysis/api/analysis.schemas";

type FollowUpQuestionCopy = {
  affectedServiceFallback: string;
  inspectFirst: (service: string) => string;
  validateAction: (action: string) => string;
  prioritizeNext: string;
  bestEvidence: string;
  additionalTelemetry: string;
};

const defaultFollowUpQuestionCopy: FollowUpQuestionCopy = {
  affectedServiceFallback: "the affected service",
  inspectFirst: (service) => `What should I inspect first for ${service}?`,
  validateAction: (action) => `How should I validate "${action}"?`,
  prioritizeNext: "What action should I prioritize next?",
  bestEvidence: "Which evidence best supports the current root cause hypothesis?",
  additionalTelemetry: "What additional telemetry would reduce uncertainty?"
};

export function buildAnalysisFollowUpQuestions(
  analysis: Analysis,
  copy: FollowUpQuestionCopy = defaultFollowUpQuestionCopy
) {
  const primaryService = analysis.affectedServices[0] ?? copy.affectedServiceFallback;
  const topAction = analysis.recommendedActions
    .toSorted((firstAction, secondAction) => firstAction.priority - secondAction.priority)[0];

  return [
    copy.inspectFirst(primaryService),
    topAction ? copy.validateAction(topAction.action) : copy.prioritizeNext,
    copy.bestEvidence,
    copy.additionalTelemetry
  ];
}
