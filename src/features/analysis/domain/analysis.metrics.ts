import { severityOrder } from "@/features/analysis/domain/analysis.constants";
import type { Analysis, AnalysisStatsResponse, Confidence, Severity } from "@/features/analysis/api/analysis.schemas";

export type AnalysisDashboardMetrics = {
  totalAnalyses: number;
  affectedServices: number;
  evidenceItems: number;
  latestSeverity: Severity | null;
  severityCounts: Record<Severity, number>;
};

export type AnalysisStatsCountMetric<TCategory extends string> = {
  category: TCategory;
  count: number;
};

export type AnalysisStatsTrendMetric = {
  bucketStart: string;
  count: number;
};

export type AnalysisStatsServiceMetric = {
  service: string;
  count: number;
  percentage: number;
};

export const confidenceOrder: Confidence[] = ["high", "medium", "low"];

function createSeverityCounts(): Record<Severity, number> {
  return {
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

function readStatsCount(counts: Record<string, number> | undefined, category: string) {
  return counts?.[category] ?? 0;
}

export function buildSeverityDistribution(
  analysisStats?: AnalysisStatsResponse
): Array<AnalysisStatsCountMetric<Severity>> {
  return severityOrder.map((severity) => ({
    category: severity,
    count: readStatsCount(analysisStats?.bySeverity, severity)
  }));
}

export function buildConfidenceDistribution(
  analysisStats?: AnalysisStatsResponse
): Array<AnalysisStatsCountMetric<Confidence>> {
  return confidenceOrder.map((confidence) => ({
    category: confidence,
    count: readStatsCount(analysisStats?.byConfidence, confidence)
  }));
}

export function buildTrendMetrics(analysisStats?: AnalysisStatsResponse): AnalysisStatsTrendMetric[] {
  return (analysisStats?.trendBuckets ?? [])
    .map((bucket) => ({
      bucketStart: bucket.bucketStart,
      count: bucket.count
    }))
    .sort((firstBucket, secondBucket) => firstBucket.bucketStart.localeCompare(secondBucket.bucketStart));
}

export function buildTopAffectedServiceMetrics(
  analysisStats?: AnalysisStatsResponse,
  limit = 5
): AnalysisStatsServiceMetric[] {
  const totalAnalyses = analysisStats?.total ?? 0;

  return (analysisStats?.topAffectedServices ?? []).slice(0, limit).map((serviceMetric) => ({
    service: serviceMetric.service,
    count: serviceMetric.count,
    percentage: totalAnalyses > 0 ? Math.round((serviceMetric.count / totalAnalyses) * 100) : 0
  }));
}

export function hasMetricCounts<TCategory extends string>(metrics: Array<AnalysisStatsCountMetric<TCategory>>) {
  return metrics.some((metric) => metric.count > 0);
}
