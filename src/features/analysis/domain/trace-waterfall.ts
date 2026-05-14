import type { TraceSpan } from "@/features/analysis/api/analysis.schemas";

export type TraceWaterfallRow = {
  span: TraceSpan;
  depth: number;
  offsetPercent: number;
  widthPercent: number;
  isCriticalPath: boolean;
  isSlowest: boolean;
};

function toTimestamp(value: string) {
  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function buildDepthBySpanId(spans: TraceSpan[]) {
  const bySpanId = new Map(spans.map((span) => [span.spanId, span]));
  const depths = new Map<string, number>();

  function resolveDepth(span: TraceSpan, visitedSpanIds: Set<string>): number {
    const cachedDepth = depths.get(span.spanId);
    if (cachedDepth !== undefined) {
      return cachedDepth;
    }

    if (!span.parentSpanId || visitedSpanIds.has(span.parentSpanId)) {
      depths.set(span.spanId, 0);
      return 0;
    }

    const parentSpan = bySpanId.get(span.parentSpanId);
    if (!parentSpan) {
      depths.set(span.spanId, 0);
      return 0;
    }

    const nextVisitedSpanIds = new Set(visitedSpanIds);
    nextVisitedSpanIds.add(span.spanId);
    const depth = resolveDepth(parentSpan, nextVisitedSpanIds) + 1;
    depths.set(span.spanId, depth);
    return depth;
  }

  spans.forEach((span) => resolveDepth(span, new Set()));

  return depths;
}

export function buildTraceWaterfallRows(
  spans: TraceSpan[],
  criticalPathSpanIds: string[],
  slowestSpanIds: string[]
): TraceWaterfallRow[] {
  if (spans.length === 0) {
    return [];
  }

  const sortedSpans = spans.toSorted((firstSpan, secondSpan) => {
    const startDifference = toTimestamp(firstSpan.startTime) - toTimestamp(secondSpan.startTime);

    return startDifference === 0 ? secondSpan.durationMs - firstSpan.durationMs : startDifference;
  });
  const traceStartMs = Math.min(...sortedSpans.map((span) => toTimestamp(span.startTime)));
  const traceEndMs = Math.max(...sortedSpans.map((span) => toTimestamp(span.startTime) + span.durationMs));
  const traceDurationMs = Math.max(traceEndMs - traceStartMs, 1);
  const depths = buildDepthBySpanId(sortedSpans);
  const criticalPathSpanIdSet = new Set(criticalPathSpanIds);
  const slowestSpanIdSet = new Set(slowestSpanIds);

  return sortedSpans.map((span) => {
    const offsetMs = Math.max(toTimestamp(span.startTime) - traceStartMs, 0);

    return {
      span,
      depth: depths.get(span.spanId) ?? 0,
      offsetPercent: Math.min((offsetMs / traceDurationMs) * 100, 100),
      widthPercent: Math.max((span.durationMs / traceDurationMs) * 100, 1),
      isCriticalPath: criticalPathSpanIdSet.has(span.spanId),
      isSlowest: slowestSpanIdSet.has(span.spanId)
    };
  });
}

export function findTraceSpansByIds(spans: TraceSpan[], spanIds: string[]) {
  const bySpanId = new Map(spans.map((span) => [span.spanId, span]));

  return spanIds.map((spanId) => bySpanId.get(spanId)).filter((span): span is TraceSpan => Boolean(span));
}
