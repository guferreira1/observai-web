import type { Evidence } from "@/features/analysis/api/analysis.schemas";

export type TraceInsightCategoryId = "performance" | "network" | "database" | "code";

export type TraceInsightCategory = {
  id: TraceInsightCategoryId;
  label: string;
  insights: string[];
};

type TraceInsightRule = {
  id: TraceInsightCategoryId;
  label: string;
  keywords: string[];
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
    keywords: ["network", "http", "external", "dependency", "retry", "hop", "upstream"]
  },
  {
    id: "database",
    label: "Database",
    keywords: ["database", "sql", "query", "n+1", "postgres", "mysql", "mongo", "redis"]
  },
  {
    id: "code",
    label: "Code",
    keywords: ["code", "function", "method", "thread", "async", "synchronous", "lock"]
  }
];

function matchesTraceInsightRule(insight: string, rule: TraceInsightRule) {
  const normalizedInsight = insight.toLowerCase();

  return rule.keywords.some((keyword) => normalizedInsight.includes(keyword));
}

export function categorizeTraceInsights(insights: string[]): TraceInsightCategory[] {
  return traceInsightRules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    insights: insights.filter((insight) => matchesTraceInsightRule(insight, rule))
  }));
}

export function findSlowTraceEvidence(traceEvidence: Evidence[]) {
  return traceEvidence.toSorted((firstEvidence, secondEvidence) => secondEvidence.score - firstEvidence.score).slice(0, 5);
}
