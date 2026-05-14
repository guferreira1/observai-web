import { describe, expect, it } from "vitest";

import type { Analysis, AnalysisStatsResponse } from "@/features/analysis/api/analysis.schemas";
import {
  buildAnalysisDashboardMetrics,
  buildConfidenceDistribution,
  buildSeverityDistribution,
  buildTopAffectedServiceMetrics,
  buildTrendMetrics,
  hasMetricCounts
} from "@/features/analysis/domain/analysis.metrics";

function createAnalysis(overrides: Partial<Analysis>): Analysis {
  return {
    id: "analysis-1",
    summary: "checkout-service latency increased",
    severity: "high",
    confidence: "high",
    affectedServices: ["checkout-service"],
    evidence: [],
    detectedAnomalies: [],
    possibleRootCauses: [],
    recommendedActions: [],
    codeLevelInsights: [],
    missingEvidence: [],
    createdAt: "2026-05-13T12:00:00Z",
    ...overrides
  };
}

describe("buildAnalysisDashboardMetrics", () => {
  it("summarizes analyses without inventing values", () => {
    const metrics = buildAnalysisDashboardMetrics([
      createAnalysis({
        id: "analysis-1",
        severity: "low",
        affectedServices: ["checkout-service"],
        evidence: [
          {
            id: "evidence-1",
            signal: "logs",
            service: "checkout-service",
            source: "logs",
            name: "error rate",
            summary: "errors increased",
            observed: "2026-05-13T12:00:00Z",
            score: 12
          }
        ]
      }),
      createAnalysis({
        id: "analysis-2",
        severity: "critical",
        affectedServices: ["checkout-service", "payment-service"],
        evidence: []
      })
    ]);

    expect(metrics.totalAnalyses).toBe(2);
    expect(metrics.affectedServices).toBe(2);
    expect(metrics.evidenceItems).toBe(1);
    expect(metrics.latestSeverity).toBe("critical");
    expect(metrics.severityCounts.critical).toBe(1);
    expect(metrics.severityCounts.low).toBe(1);
  });
});

describe("analysis stats metrics", () => {
  const analysisStats: AnalysisStatsResponse = {
    total: 10,
    bySeverity: {
      critical: 2,
      high: 3
    },
    byConfidence: {
      high: 4,
      low: 1
    },
    topAffectedServices: [
      { service: "checkout-service", count: 5 },
      { service: "payment-service", count: 3 },
      { service: "catalog-service", count: 2 }
    ],
    trendBuckets: [
      { bucketStart: "2026-05-13T12:00:00Z", count: 2 },
      { bucketStart: "2026-05-13T10:00:00Z", count: 1 }
    ]
  };

  it("normalizes sparse severity and confidence records into ordered distributions", () => {
    expect(buildSeverityDistribution(analysisStats)).toEqual([
      { category: "critical", count: 2 },
      { category: "high", count: 3 },
      { category: "medium", count: 0 },
      { category: "low", count: 0 }
    ]);
    expect(buildConfidenceDistribution(analysisStats)).toEqual([
      { category: "high", count: 4 },
      { category: "medium", count: 0 },
      { category: "low", count: 1 }
    ]);
  });

  it("sorts trend buckets chronologically", () => {
    expect(buildTrendMetrics(analysisStats)).toEqual([
      { bucketStart: "2026-05-13T10:00:00Z", count: 1 },
      { bucketStart: "2026-05-13T12:00:00Z", count: 2 }
    ]);
  });

  it("limits top affected services and calculates total share", () => {
    expect(buildTopAffectedServiceMetrics(analysisStats, 2)).toEqual([
      { service: "checkout-service", count: 5, percentage: 50 },
      { service: "payment-service", count: 3, percentage: 30 }
    ]);
  });

  it("detects whether a distribution has reportable counts", () => {
    expect(hasMetricCounts(buildSeverityDistribution(analysisStats))).toBe(true);
    expect(hasMetricCounts(buildSeverityDistribution())).toBe(false);
  });
});
