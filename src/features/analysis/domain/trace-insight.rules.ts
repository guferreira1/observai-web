import type { Evidence, TraceSpan } from "@/features/analysis/api/analysis.schemas";

export type TraceInsightCategoryId = "performance" | "network" | "database" | "code";

export type TraceInsight = {
  id: string;
  message: string;
  spanIds: string[];
};

export type TraceInsightCategory = {
  id: TraceInsightCategoryId;
  label: string;
  insights: TraceInsight[];
};

export type TraceInsightSource = {
  spans: TraceSpan[];
  codeLevelInsights?: string[];
};

type TraceInsightRule = {
  id: TraceInsightCategoryId;
  label: string;
  keywords: string[];
};

type SpanInsightRule = {
  categoryId: TraceInsightCategoryId;
  test: (span: TraceSpan, normalizedAttributes: string) => boolean;
  buildMessage: (span: TraceSpan) => string;
};

const traceInsightRules: TraceInsightRule[] = [
  {
    id: "performance",
    label: "Performance",
    keywords: ["latency", "slow", "duration", "bottleneck", "timeout", "p95", "p99"]
  },
  {
    id: "network",
    label: "Network",
    keywords: ["network", "http", "external", "dependency", "hop", "upstream", "grpc", "rpc"]
  },
  {
    id: "database",
    label: "Database",
    keywords: ["database", "sql", "query", "n+1", "postgres", "mysql", "mongo", "redis", "db."]
  },
  {
    id: "code",
    label: "Code",
    keywords: ["code", "function", "method", "thread", "async", "synchronous", "lock", "retry", "exception", "n+1"]
  }
];

const spanInsightRules: SpanInsightRule[] = [
  {
    categoryId: "performance",
    test: (span) => span.durationMs >= 1000 || span.selfTimeMs >= 500,
    buildMessage: (span) =>
      `${span.service} ${span.operation} is a slow span (${Math.round(span.durationMs)}ms duration, ${Math.round(
        span.selfTimeMs
      )}ms self time).`
  },
  {
    categoryId: "network",
    test: (span, normalizedAttributes) =>
      hasAny(normalizedAttributes, ["http.", "net.peer", "server.address", "peer.service", "rpc.", "grpc"]) ||
      hasAny(normalizeSearchText(span.operation), ["http", "grpc", "rpc"]),
    buildMessage: (span) => `${span.service} ${span.operation} looks network-bound from span metadata.`
  },
  {
    categoryId: "database",
    test: (span, normalizedAttributes) =>
      hasAny(normalizedAttributes, ["db.", "sql", "postgres", "mysql", "mongo", "redis"]) ||
      hasAny(normalizeSearchText(span.operation), ["select ", "insert ", "update ", "delete ", "query"]),
    buildMessage: (span) => `${span.service} ${span.operation} includes database indicators.`
  },
  {
    categoryId: "code",
    test: (span, normalizedAttributes) =>
      span.status === "error" ||
      hasAny(normalizedAttributes, ["code.", "exception", "error.", "retry", "thread", "lock", "n+1", "nplus1"]),
    buildMessage: (span) => `${span.service} ${span.operation} has code, retry or error indicators.`
  }
];

function normalizeSearchText(value: string) {
  return value.toLowerCase();
}

function hasAny(value: string, candidates: string[]) {
  return candidates.some((candidate) => value.includes(candidate));
}

function normalizeSpanAttributes(span: TraceSpan) {
  return Object.entries(span.attributes ?? {})
    .flatMap(([attributeName, attributeValue]) => [attributeName, attributeValue])
    .join(" ")
    .toLowerCase();
}

function matchesTraceInsightRule(insight: string, rule: TraceInsightRule) {
  const normalizedInsight = normalizeSearchText(insight);

  return rule.keywords.some((keyword) => normalizedInsight.includes(keyword));
}

function createTextInsight(message: string, index: number): TraceInsight {
  return {
    id: `text-${index}-${message}`,
    message,
    spanIds: []
  };
}

function buildTextInsights(insights: string[]) {
  return traceInsightRules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    insights: insights
      .filter((insight) => matchesTraceInsightRule(insight, rule))
      .map((insight, index) => createTextInsight(insight, index))
  }));
}

function buildSpanInsights(source: TraceInsightSource) {
  const codeLevelInsights = source.codeLevelInsights ?? [];
  const textCategories = buildTextInsights(codeLevelInsights);
  const categoriesById = new Map<TraceInsightCategoryId, TraceInsightCategory>(
    textCategories.map((category) => [category.id, category])
  );

  source.spans.forEach((span) => {
    const normalizedAttributes = normalizeSpanAttributes(span);

    spanInsightRules.forEach((spanRule) => {
      if (!spanRule.test(span, normalizedAttributes)) {
        return;
      }

      categoriesById.get(spanRule.categoryId)?.insights.push({
        id: `${spanRule.categoryId}-${span.spanId}`,
        message: spanRule.buildMessage(span),
        spanIds: [span.spanId]
      });
    });
  });

  return textCategories;
}

export function categorizeTraceInsights(source: string[] | TraceInsightSource): TraceInsightCategory[] {
  if (Array.isArray(source)) {
    return buildTextInsights(source);
  }

  return buildSpanInsights(source);
}

export function findSlowTraceEvidence(traceEvidence: Evidence[]) {
  return traceEvidence.toSorted((firstEvidence, secondEvidence) => secondEvidence.score - firstEvidence.score).slice(0, 5);
}
