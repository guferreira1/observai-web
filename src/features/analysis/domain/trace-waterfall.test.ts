import { describe, expect, it } from "vitest";

import type { TraceSpan } from "@/features/analysis/api/analysis.schemas";
import { buildTraceWaterfallRows, findTraceSpansByIds } from "@/features/analysis/domain/trace-waterfall";

const spans: TraceSpan[] = [
  {
    traceId: "trace-1",
    spanId: "root",
    service: "checkout",
    operation: "POST /checkout",
    startTime: "2026-05-13T12:00:00Z",
    durationMs: 100,
    selfTimeMs: 20,
    status: "ok"
  },
  {
    traceId: "trace-1",
    spanId: "payment",
    parentSpanId: "root",
    service: "payment",
    operation: "authorize",
    startTime: "2026-05-13T12:00:00.020Z",
    durationMs: 70,
    selfTimeMs: 70,
    status: "error"
  }
];

describe("trace waterfall", () => {
  it("builds ordered rows with timing percentages and depth", () => {
    const rows = buildTraceWaterfallRows(spans, ["root", "payment"], ["payment"]);

    expect(rows.map((row) => row.span.spanId)).toEqual(["root", "payment"]);
    expect(rows[0]?.depth).toBe(0);
    expect(rows[1]?.depth).toBe(1);
    expect(rows[1]?.isCriticalPath).toBe(true);
    expect(rows[1]?.isSlowest).toBe(true);
    expect(rows[1]?.offsetPercent).toBeGreaterThan(0);
  });

  it("selects spans in the requested id order", () => {
    const selectedSpans = findTraceSpansByIds(spans, ["payment", "missing", "root"]);

    expect(selectedSpans.map((span) => span.spanId)).toEqual(["payment", "root"]);
  });
});
