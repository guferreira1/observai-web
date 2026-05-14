import type { Analysis } from "@/features/analysis/api/analysis.schemas";
import { severityLabels } from "@/features/analysis/domain/analysis.constants";
import { formatDateTime } from "@/shared/lib/date";

export function buildAnalysisExportText(analysis: Analysis) {
  const rootCauses = analysis.possibleRootCauses
    .map((rootCause) => `- ${rootCause.cause} (${rootCause.confidence} confidence)`)
    .join("\n");
  const recommendedActions = analysis.recommendedActions
    .toSorted((firstAction, secondAction) => firstAction.priority - secondAction.priority)
    .map((recommendation) => `- P${recommendation.priority}: ${recommendation.action}`)
    .join("\n");
  const affectedServices = analysis.affectedServices.join(", ") || "Not reported";

  return [
    `ObservAI analysis ${analysis.id}`,
    `Created: ${formatDateTime(analysis.createdAt)}`,
    `Severity: ${severityLabels[analysis.severity]}`,
    `Confidence: ${analysis.confidence}`,
    `Affected services: ${affectedServices}`,
    "",
    "Summary",
    analysis.summary,
    "",
    "Possible root causes",
    rootCauses || "No root causes returned.",
    "",
    "Recommended actions",
    recommendedActions || "No recommended actions returned."
  ].join("\n");
}
