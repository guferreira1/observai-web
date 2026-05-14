import { describe, expect, it } from "vitest";

import type { Evidence } from "@/features/analysis/api/analysis.schemas";
import { buildSignalCorrelationTimeline } from "@/features/analysis/domain/signal-correlation";

const evidenceEntries: Evidence[] = [
  {
    id: "trace-late",
    signal: "traces",
    service: "payment-service",
    source: "jaeger",
    provider: "jaeger",
    name: "slow payment span",
    summary: "payment authorization is slow",
    observed: "2026-05-13T12:35:00Z",
    score: 430
  },
  {
    id: "log-first",
    signal: "logs",
    service: "checkout-service",
    source: "loki",
    provider: "loki",
    name: "error logs",
    summary: "checkout errors increased",
    observed: "2026-05-13T12:00:00Z",
    score: 12
  },
  {
    id: "metric-same-bucket",
    signal: "metrics",
    service: "checkout-service",
    source: "prometheus",
    provider: "prometheus",
    name: "latency p95",
    summary: "checkout latency increased",
    observed: "2026-05-13T12:15:00Z",
    score: 240
  }
];

describe("signal correlation timeline", () => {
  it("keeps the first observed signal and buckets evidence by observed time", () => {
    const timeline = buildSignalCorrelationTimeline(evidenceEntries);

    expect(timeline.firstObservedEvidence?.id).toBe("log-first");
    expect(timeline.bucketSizeMs).toBe(30 * 60 * 1000);
    expect(timeline.buckets).toHaveLength(2);
    expect(timeline.buckets[0]?.firstEvidence.id).toBe("log-first");
    expect(timeline.buckets[0]?.countsBySignal).toMatchObject({
      logs: 1,
      metrics: 1,
      traces: 0,
      apm: 0
    });
    expect(timeline.buckets[1]?.countsBySignal.traces).toBe(1);
  });

  it("summarizes services, providers and total counts", () => {
    const timeline = buildSignalCorrelationTimeline(evidenceEntries);

    expect(timeline.services).toEqual(["checkout-service", "payment-service"]);
    expect(timeline.providers).toEqual(["jaeger", "loki", "prometheus"]);
    expect(timeline.countsBySignal).toMatchObject({
      logs: 1,
      metrics: 1,
      traces: 1,
      apm: 0
    });
  });
});
