import { describe, expect, it } from "vitest";

import type { Analysis } from "@/features/analysis/api/analysis.schemas";
import {
  buildActionPlan,
  buildActionPlanItemClipboardText,
  countCompletedActionPlanItems,
  loadActionPlanStatuses,
  saveActionPlanStatuses
} from "@/features/analysis/domain/action-plan";

function createAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: "analysis-1",
    summary: "checkout-service latency increased",
    severity: "high",
    confidence: "high",
    affectedServices: ["checkout-service"],
    evidence: [],
    detectedAnomalies: [],
    possibleRootCauses: [],
    recommendedActions: [],
    codeLevelInsights: [],
    missingEvidence: [],
    createdAt: "2026-05-13T12:00:00Z",
    ...overrides
  };
}

describe("buildActionPlan", () => {
  it("sorts recommended actions and derives operational metadata", () => {
    const actionPlan = buildActionPlan(
      createAnalysis({
        recommendedActions: [
          {
            action: "Add dashboard coverage for checkout saturation",
            rationale: "The team needs monitor visibility.",
            priority: 3
          },
          {
            action: "Rollback the checkout-service deployment",
            rationale: "Errors started after the release.",
            priority: 1
          }
        ]
      })
    );

    expect(actionPlan.map((item) => item.priorityLabel)).toEqual(["P1", "P3"]);
    expect(actionPlan[0]).toMatchObject({
      action: "Rollback the checkout-service deployment",
      urgency: "critical"
    });
    expect(actionPlan[0]?.suggestedValidation).toContain("checkout-service");
    expect(actionPlan[1]?.suggestedValidation).toContain("alert would have detected this incident");
  });

  it("builds copy text with status, rationale and suggested validation", () => {
    const [item] = buildActionPlan(
      createAnalysis({
        recommendedActions: [
          {
            action: "Scale checkout-service replicas",
            rationale: "CPU saturation is high.",
            priority: 2
          }
        ]
      })
    );

    expect(buildActionPlanItemClipboardText(item!, "in_progress")).toContain("Status: In progress");
    expect(buildActionPlanItemClipboardText(item!, "in_progress")).toContain("Rationale: CPU saturation is high.");
  });
});

describe("action plan status persistence", () => {
  it("round-trips only supported statuses", () => {
    const localStorageApi = new MapBackedStorage();

    saveActionPlanStatuses(
      "analysis-1",
      {
        "action-1": "done",
        "action-2": "blocked"
      },
      localStorageApi
    );

    expect(loadActionPlanStatuses("analysis-1", localStorageApi)).toEqual({
      "action-1": "done",
      "action-2": "blocked"
    });

    localStorageApi.setItem(
      "observai.analysis.actionPlan.analysis-1",
      JSON.stringify({ "action-1": "done", "action-2": "invalid" })
    );

    expect(loadActionPlanStatuses("analysis-1", localStorageApi)).toEqual({
      "action-1": "done"
    });
  });

  it("counts completed items from local statuses", () => {
    const actionPlan = buildActionPlan(
      createAnalysis({
        recommendedActions: [
          { action: "First action", rationale: "Needed.", priority: 1 },
          { action: "Second action", rationale: "Needed.", priority: 2 }
        ]
      })
    );

    expect(countCompletedActionPlanItems(actionPlan, { [actionPlan[0]!.id]: "done" })).toBe(1);
  });
});

class MapBackedStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}
