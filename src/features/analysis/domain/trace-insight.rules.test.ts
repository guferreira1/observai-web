import { describe, expect, it } from "vitest";

import { categorizeTraceInsights } from "@/features/analysis/domain/trace-insight.rules";
import type { TraceSpan } from "@/features/analysis/api/analysis.schemas";

describe("categorizeTraceInsights", () => {
  it("classifies insight text into trace categories", () => {
    const categories = categorizeTraceInsights([
      "p95 latency increased in checkout",
      "database query is slow",
      "external HTTP dependency retries amplified latency",
      "synchronous code path blocks the request"
    ]);

    expect(categories.find((category) => category.id === "performance")?.insights).toHaveLength(3);
    expect(categories.find((category) => category.id === "database")?.insights).toHaveLength(1);
    expect(categories.find((category) => category.id === "network")?.insights).toHaveLength(1);
    expect(categories.find((category) => category.id === "code")?.insights).toHaveLength(1);
  });

  it("classifies spans by performance, network, database and code signals", () => {
    const spans: TraceSpan[] = [
      {
        traceId: "trace-1",
        spanId: "root",
        service: "checkout-service",
        operation: "POST /checkout",
        startTime: "2026-05-13T12:00:00Z",
        durationMs: 1800,
        selfTimeMs: 120,
        status: "ok",
        attributes: {
          "http.method": "POST",
          "server.address": "checkout.internal"
        }
      },
      {
        traceId: "trace-1",
        spanId: "db",
        parentSpanId: "root",
        service: "checkout-service",
        operation: "SELECT orders",
        startTime: "2026-05-13T12:00:00.200Z",
        durationMs: 700,
        selfTimeMs: 650,
        status: "ok",
        attributes: {
          "db.system": "postgresql",
          "db.statement": "select * from orders"
        }
      },
      {
        traceId: "trace-1",
        spanId: "retry",
        parentSpanId: "root",
        service: "payment-service",
        operation: "authorize",
        startTime: "2026-05-13T12:00:00.400Z",
        durationMs: 300,
        selfTimeMs: 300,
        status: "error",
        attributes: {
          "retry.count": "3",
          "exception.type": "TimeoutError"
        }
      }
    ];

    const categories = categorizeTraceInsights({
      spans,
      codeLevelInsights: ["Potential N+1 query pattern in checkout repository"]
    });

    expect(categories.find((category) => category.id === "performance")?.insights).toEqual(
      expect.arrayContaining([expect.objectContaining({ spanIds: ["root"] }), expect.objectContaining({ spanIds: ["db"] })])
    );
    expect(categories.find((category) => category.id === "network")?.insights).toEqual(
      expect.arrayContaining([expect.objectContaining({ spanIds: ["root"] })])
    );
    expect(categories.find((category) => category.id === "database")?.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "Potential N+1 query pattern in checkout repository" }),
        expect.objectContaining({ spanIds: ["db"] })
      ])
    );
    expect(categories.find((category) => category.id === "code")?.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "Potential N+1 query pattern in checkout repository" }),
        expect.objectContaining({ spanIds: ["retry"] })
      ])
    );
  });
});
