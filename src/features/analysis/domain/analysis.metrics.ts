import { severityOrder } from "@/features/analysis/domain/analysis.constants";
import type { Analysis, Severity } from "@/features/analysis/api/analysis.schemas";

export type AnalysisDashboardMetrics = {
  totalAnalyses: number;
  affectedServices: number;
  evidenceItems: number;
  latestSeverity: Severity | null;
  severityCounts: Record<Severity, number>;
};

function createSeverityCounts(): Record<Severity, number> {
  return {
    info: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };
}

export function buildAnalysisDashboardMetrics(analyses: Analysis[]): AnalysisDashboardMetrics {
  const severityCounts = createSeverityCounts();
  const services = new Set<string>();
  let evidenceItems = 0;

  analyses.forEach((analysis) => {
    severityCounts[analysis.severity] += 1;
    evidenceItems += analysis.evidence.length;
    analysis.affectedServices.forEach((service) => services.add(service));
  });

  const latestSeverity =
    severityOrder.find((severity) => severityCounts[severity] > 0) ?? null;

  return {
    totalAnalyses: analyses.length,
    affectedServices: services.size,
    evidenceItems,
    latestSeverity,
    severityCounts
  };
}
