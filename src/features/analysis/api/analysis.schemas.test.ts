import { describe, expect, it } from "vitest";

import {
  analysisJobAcceptedSchema,
  analysisJobSchema,
  analysisListFilterSchema,
  analysisStatsResponseSchema,
  analysisSchema,
  createAnalysisRequestSchema,
  servicesResponseSchema,
  traceInsightsResponseSchema
} from "@/features/analysis/api/analysis.schemas";

describe("analysis schemas", () => {
  it("accepts backend analysis responses", () => {
    const parsedAnalysis = analysisSchema.parse({
      id: "analysis-123",
      summary: "checkout-service is degraded",
      severity: "high",
      confidence: "medium",
      affectedServices: ["checkout-service"],
      evidence: [
        {
          id: "evidence-1",
          signal: "metrics",
          service: "checkout-service",
          source: "prometheus",
          name: "p95 latency",
          summary: "p95 latency increased",
          observed: "2026-05-13T12:00:00Z",
          score: 430,
          unit: "ms"
        }
      ],
      detectedAnomalies: ["latency increased"],
      possibleRootCauses: [
        {
          cause: "External payment dependency degraded",
          evidence: ["p95 latency"],
          confidence: "medium"
        }
      ],
      recommendedActions: [
        {
          action: "Inspect payment provider latency",
          rationale: "Payment span dominates request time",
          priority: 1
        }
      ],
      codeLevelInsights: ["Add timeout boundaries"],
      missingEvidence: [],
      createdAt: "2026-05-13T12:00:00Z"
    });

    expect(parsedAnalysis.id).toBe("analysis-123");
  });

  it("rejects unsupported signal values before sending requests", () => {
    const result = createAnalysisRequestSchema.safeParse({
      goal: "Analyze checkout-service",
      timeWindow: {
        start: "2026-05-13T11:00:00Z",
        end: "2026-05-13T12:00:00Z"
      },
      affectedServices: ["checkout-service"],
      signals: ["events"],
      context: ""
    });

    expect(result.success).toBe(false);
  });

  it("rejects analysis requests whose start is not before end", () => {
    const result = createAnalysisRequestSchema.safeParse({
      goal: "Analyze checkout-service",
      timeWindow: {
        start: "2026-05-13T12:00:00Z",
        end: "2026-05-13T11:00:00Z"
      },
      affectedServices: ["checkout-service"],
      signals: ["logs"],
      context: ""
    });

    expect(result.success).toBe(false);
  });

  it("accepts asynchronous analysis job acceptance responses", () => {
    const parsedJob = analysisJobAcceptedSchema.parse({
      jobId: "analysis-job-123",
      status: "pending",
      statusUrl: "/v1/jobs/analysis-job-123"
    });

    expect(parsedJob.statusUrl).toBe("/v1/jobs/analysis-job-123");
  });

  it("accepts completed asynchronous analysis job status responses", () => {
    const parsedJob = analysisJobSchema.parse({
      jobId: "analysis-job-123",
      status: "completed",
      phase: "done",
      progressPercent: 100,
      analysisId: "analysis-job-123",
      analysisUrl: "/v1/analyses/analysis-job-123",
      attempt: 1,
      createdAt: "2026-05-13T12:00:00Z",
      startedAt: "2026-05-13T12:00:01Z",
      finishedAt: "2026-05-13T12:00:08Z"
    });

    expect(parsedJob.analysisId).toBe("analysis-job-123");
  });

  it("accepts running asynchronous analysis job progress responses", () => {
    const parsedJob = analysisJobSchema.parse({
      jobId: "analysis-job-123",
      status: "running",
      phase: "calling_llm",
      progressPercent: 65,
      attempt: 1,
      createdAt: "2026-05-13T12:00:00Z",
      startedAt: "2026-05-13T12:00:01Z",
      phaseStartedAt: "2026-05-13T12:00:04Z"
    });

    expect(parsedJob.phase).toBe("calling_llm");
  });

  it("accepts canceled asynchronous analysis job responses", () => {
    const parsedJob = analysisJobSchema.parse({
      jobId: "analysis-job-123",
      status: "canceled",
      phase: "queued",
      progressPercent: 0,
      attempt: 1,
      createdAt: "2026-05-13T12:00:00Z",
      finishedAt: "2026-05-13T12:00:03Z"
    });

    expect(parsedJob.status).toBe("canceled");
  });

  it("accepts advanced analysis list filters", () => {
    const parsedFilter = analysisListFilterSchema.parse({
      limit: 25,
      offset: 50,
      severity: "critical",
      service: "checkout-service",
      signal: "traces",
      provider: "jaeger",
      from: "2026-05-13T11:00:00Z",
      to: "2026-05-13T12:00:00Z",
      q: "payment",
      sort: "confidence",
      order: "asc"
    });

    expect(parsedFilter.signal).toBe("traces");
    expect(parsedFilter.sort).toBe("confidence");
  });

  it("accepts service autocomplete responses", () => {
    const parsedServices = servicesResponseSchema.parse({
      items: ["checkout-service", "payment-service"]
    });

    expect(parsedServices.items).toContain("checkout-service");
  });

  it("accepts analysis stats responses", () => {
    const parsedStats = analysisStatsResponseSchema.parse({
      total: 2,
      bySeverity: {
        critical: 1,
        high: 1
      },
      byConfidence: {
        high: 2
      },
      topAffectedServices: [
        {
          service: "checkout-service",
          count: 2
        }
      ],
      trendBuckets: [
        {
          bucketStart: "2026-05-13T12:00:00Z",
          count: 2
        }
      ],
      from: "2026-05-13T00:00:00Z",
      to: "2026-05-13T23:59:59Z"
    });

    expect(parsedStats.total).toBe(2);
  });

  it("accepts structured trace insight responses", () => {
    const parsedTraces = traceInsightsResponseSchema.parse({
      spans: [
        {
          traceId: "trace-1",
          spanId: "span-1",
          service: "checkout-service",
          operation: "POST /checkout",
          startTime: "2026-05-13T12:00:00Z",
          durationMs: 120,
          selfTimeMs: 20,
          status: "ok",
          attributes: {
            route: "/checkout"
          }
        },
        {
          traceId: "trace-1",
          spanId: "span-2",
          parentSpanId: "span-1",
          service: "payment-service",
          operation: "authorize",
          startTime: "2026-05-13T12:00:00.020Z",
          durationMs: 90,
          selfTimeMs: 90,
          status: "error"
        }
      ],
      criticalPathSpanIds: ["span-1", "span-2"],
      slowestSpanIds: ["span-1", "span-2"],
      dependencyEdges: [
        {
          from: "checkout-service",
          to: "payment-service",
          callCount: 1,
          p95Ms: 90
        }
      ]
    });

    expect(parsedTraces.dependencyEdges[0]?.to).toBe("payment-service");
  });
});
