import type { Signal, Severity } from "@/features/analysis/api/analysis.schemas";

export const availableSignals: Signal[] = ["logs", "metrics", "traces", "apm"];

export const severityOrder: Severity[] = ["critical", "high", "medium", "low"];

export const severityLabels: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

export const signalLabels: Record<Signal, string> = {
  logs: "Logs",
  metrics: "Metrics",
  traces: "Traces",
  apm: "APM"
};
