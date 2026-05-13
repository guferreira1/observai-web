import { describe, expect, it } from "vitest";

import type { Analysis } from "@/features/analysis/api/analysis.schemas";
import { buildAnalysisDashboardMetrics } from "@/features/analysis/domain/analysis.metrics";

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
