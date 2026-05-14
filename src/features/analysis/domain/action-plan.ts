import type { Analysis } from "@/features/analysis/api/analysis.schemas";

export type ActionPlanStatus = "todo" | "in_progress" | "done" | "blocked";

export type ActionPlanStatusById = Record<string, ActionPlanStatus>;

export type ActionPlanItem = {
  id: string;
  action: string;
  rationale: string;
  priority: number;
  priorityLabel: string;
  urgency: "critical" | "high" | "medium" | "low";
  suggestedValidation: string;
};

type RecommendedAction = Analysis["recommendedActions"][number];

type ValidationRule = {
  matches: (recommendation: RecommendedAction) => boolean;
  buildValidation: (recommendation: RecommendedAction, analysis: Analysis, copy: ActionPlanCopy) => string;
};

export type ActionPlanCopy = {
  affectedServicesFallback: string;
  statusLabels: Record<ActionPlanStatus, string>;
  clipboardLabels: {
    rationale: string;
    status: string;
    suggestedValidation: string;
  };
  validation: {
    alert: string;
    cache: string;
    capacity: (services: string) => string;
    database: string;
    fallback: (services: string) => string;
    release: (services: string) => string;
  };
};

const storagePrefix = "observai.analysis.actionPlan";

const validationRules: ValidationRule[] = [
  {
    matches: (recommendation) => includesAny(recommendation, ["rollback", "revert", "deploy", "release"]),
    buildValidation: (_recommendation, analysis, copy) =>
      copy.validation.release(formatAffectedServices(analysis, copy))
  },
  {
    matches: (recommendation) => includesAny(recommendation, ["scale", "capacity", "replica", "cpu", "memory"]),
    buildValidation: (_recommendation, analysis, copy) =>
      copy.validation.capacity(formatAffectedServices(analysis, copy))
  },
  {
    matches: (recommendation) => includesAny(recommendation, ["database", "db", "query", "index", "lock"]),
    buildValidation: (_recommendation, _analysis, copy) => copy.validation.database
  },
  {
    matches: (recommendation) => includesAny(recommendation, ["cache", "redis", "ttl"]),
    buildValidation: (_recommendation, _analysis, copy) => copy.validation.cache
  },
  {
    matches: (recommendation) => includesAny(recommendation, ["alert", "monitor", "dashboard", "slo"]),
    buildValidation: (_recommendation, _analysis, copy) => copy.validation.alert
  }
];

const fallbackValidationRule: ValidationRule = {
  matches: () => true,
  buildValidation: (_recommendation, analysis, copy) =>
    copy.validation.fallback(formatAffectedServices(analysis, copy))
};

const defaultActionPlanCopy: ActionPlanCopy = {
  affectedServicesFallback: "the affected services",
  statusLabels: {
    blocked: "Blocked",
    done: "Done",
    in_progress: "In progress",
    todo: "To do"
  },
  clipboardLabels: {
    rationale: "Rationale",
    status: "Status",
    suggestedValidation: "Suggested validation"
  },
  validation: {
    alert: "Validate the signal with a known-good query and confirm the alert would have detected this incident.",
    cache: "Verify cache hit ratio, backend request volume and stale response rate after mitigation.",
    capacity: (services) =>
      `Watch utilization, queue depth and p95 latency for ${services} for at least one full traffic cycle.`,
    database: "Compare slow query rate, lock waits and downstream timeout counts before and after the database change.",
    fallback: (services) =>
      `Re-run the investigation or inspect fresh evidence for ${services} and confirm the original symptom is no longer present.`,
    release: (services) =>
      `Confirm error rate, latency and saturation returned to baseline for ${services} after the change window.`
  }
};

export function buildActionPlan(analysis: Analysis, copy: ActionPlanCopy = defaultActionPlanCopy): ActionPlanItem[] {
  return analysis.recommendedActions
    .toSorted((firstAction, secondAction) => firstAction.priority - secondAction.priority)
    .map((recommendation, index) => ({
      id: buildActionPlanItemId(analysis.id, recommendation, index),
      action: recommendation.action,
      rationale: recommendation.rationale,
      priority: recommendation.priority,
      priorityLabel: `P${recommendation.priority}`,
      urgency: getPriorityUrgency(recommendation.priority),
      suggestedValidation: selectValidationRule(recommendation).buildValidation(recommendation, analysis, copy)
    }));
}

export function buildActionPlanStorageKey(analysisId: string) {
  return `${storagePrefix}.${analysisId}`;
}

export function loadActionPlanStatuses(analysisId: string, localStorageApi: Storage): ActionPlanStatusById {
  try {
    return parseStatusRecord(localStorageApi.getItem(buildActionPlanStorageKey(analysisId)));
  } catch {
    return {};
  }
}

export function saveActionPlanStatuses(
  analysisId: string,
  statuses: ActionPlanStatusById,
  localStorageApi: Storage
) {
  try {
    localStorageApi.setItem(buildActionPlanStorageKey(analysisId), JSON.stringify(statuses));
  } catch {
    // Browsers can reject localStorage in private sessions or when quota is exceeded.
  }
}

export function buildActionPlanItemClipboardText(
  item: ActionPlanItem,
  status: ActionPlanStatus,
  copy: ActionPlanCopy = defaultActionPlanCopy
) {
  return [
    `${item.priorityLabel} ${item.action}`,
    `${copy.clipboardLabels.status}: ${formatActionPlanStatus(status, copy)}`,
    `${copy.clipboardLabels.rationale}: ${item.rationale}`,
    `${copy.clipboardLabels.suggestedValidation}: ${item.suggestedValidation}`
  ].join("\n");
}

export function formatActionPlanStatus(status: ActionPlanStatus, copy: ActionPlanCopy = defaultActionPlanCopy) {
  return copy.statusLabels[status];
}

export function countCompletedActionPlanItems(items: ActionPlanItem[], statuses: ActionPlanStatusById) {
  return items.filter((item) => statuses[item.id] === "done").length;
}

function buildActionPlanItemId(analysisId: string, recommendation: RecommendedAction, index: number) {
  return `${analysisId}:${index}:${slugify(`${recommendation.priority}-${recommendation.action}`)}`;
}

function getPriorityUrgency(priority: number): ActionPlanItem["urgency"] {
  if (priority <= 1) {
    return "critical";
  }

  if (priority === 2) {
    return "high";
  }

  if (priority === 3) {
    return "medium";
  }

  return "low";
}

function selectValidationRule(recommendation: RecommendedAction) {
  return validationRules.find((rule) => rule.matches(recommendation)) ?? fallbackValidationRule;
}

function includesAny(recommendation: RecommendedAction, terms: string[]) {
  const searchableText = `${recommendation.action} ${recommendation.rationale}`.toLowerCase();

  return terms.some((term) => searchableText.includes(term));
}

function formatAffectedServices(analysis: Analysis, copy: ActionPlanCopy) {
  return analysis.affectedServices.length > 0 ? analysis.affectedServices.join(", ") : copy.affectedServicesFallback;
}

function parseStatusRecord(serializedStatuses: string | null): ActionPlanStatusById {
  if (!serializedStatuses) {
    return {};
  }

  const parsedStatuses: unknown = JSON.parse(serializedStatuses);

  if (!parsedStatuses || typeof parsedStatuses !== "object" || Array.isArray(parsedStatuses)) {
    return {};
  }

  return Object.entries(parsedStatuses).reduce<ActionPlanStatusById>((statuses, [itemId, status]) => {
    if (isActionPlanStatus(status)) {
      statuses[itemId] = status;
    }

    return statuses;
  }, {});
}

function isActionPlanStatus(status: unknown): status is ActionPlanStatus {
  return status === "todo" || status === "in_progress" || status === "done" || status === "blocked";
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
