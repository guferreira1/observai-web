import type { z } from "zod";

import type { signalSchema } from "@/features/analysis/api/analysis.schemas";
import type { Capabilities } from "@/features/capabilities/api/capabilities.schemas";
import type { ReadinessResponse } from "@/features/health/api/health.schemas";

export type RuntimeSeverity = "ok" | "warning" | "critical";
type Signal = z.infer<typeof signalSchema>;

export type RuntimeIssue = {
  id: string;
  severity: Exclude<RuntimeSeverity, "ok">;
  titleKey: "runtime.issue.apiOffline" | "runtime.issue.readinessFailed" | "runtime.issue.noProviders" | "runtime.issue.noSignals" | "runtime.issue.noLlmModel";
  actionKey:
    | "runtime.issue.apiOffline.action"
    | "runtime.issue.readinessFailed.action"
    | "runtime.issue.noProviders.action"
    | "runtime.issue.noSignals.action"
    | "runtime.issue.noLlmModel.action";
};

export type RuntimeSummary = {
  status: RuntimeSeverity;
  supportedSignals: Signal[];
  issues: RuntimeIssue[];
};

type RuntimeContext = {
  healthStatus?: string;
  readiness?: ReadinessResponse;
  capabilities?: Capabilities;
};

type RuntimeIssuePolicy = {
  evaluate: (context: RuntimeContext) => RuntimeIssue | null;
};

const issuePolicies: RuntimeIssuePolicy[] = [
  {
    evaluate: ({ healthStatus }) =>
      healthStatus && healthStatus !== "ok"
        ? {
            id: "api-offline",
            severity: "critical",
            titleKey: "runtime.issue.apiOffline",
            actionKey: "runtime.issue.apiOffline.action"
          }
        : null
  },
  {
    evaluate: ({ readiness }) =>
      readiness?.status === "failed"
        ? {
            id: "readiness-failed",
            severity: "critical",
            titleKey: "runtime.issue.readinessFailed",
            actionKey: "runtime.issue.readinessFailed.action"
          }
        : null
  },
  {
    evaluate: ({ capabilities }) =>
      capabilities && capabilities.observability.length === 0
        ? {
            id: "no-providers",
            severity: "warning",
            titleKey: "runtime.issue.noProviders",
            actionKey: "runtime.issue.noProviders.action"
          }
        : null
  },
  {
    evaluate: ({ capabilities }) =>
      capabilities && getSupportedSignals(capabilities).length === 0
        ? {
            id: "no-signals",
            severity: "warning",
            titleKey: "runtime.issue.noSignals",
            actionKey: "runtime.issue.noSignals.action"
          }
        : null
  },
  {
    evaluate: ({ capabilities }) =>
      capabilities && !capabilities.llm.model
        ? {
            id: "no-llm-model",
            severity: "warning",
            titleKey: "runtime.issue.noLlmModel",
            actionKey: "runtime.issue.noLlmModel.action"
          }
        : null
  }
];

export function getSupportedSignals(capabilities: Capabilities): Signal[] {
  return [...new Set(capabilities.observability.flatMap((provider) => provider.signals))].sort();
}

export function summarizeRuntime(context: RuntimeContext): RuntimeSummary {
  const issues = issuePolicies
    .map((policy) => policy.evaluate(context))
    .filter((issue): issue is RuntimeIssue => Boolean(issue));
  const hasCriticalIssue = issues.some((issue) => issue.severity === "critical");

  return {
    status: hasCriticalIssue ? "critical" : issues.length > 0 ? "warning" : "ok",
    supportedSignals: context.capabilities ? getSupportedSignals(context.capabilities) : [],
    issues
  };
}
