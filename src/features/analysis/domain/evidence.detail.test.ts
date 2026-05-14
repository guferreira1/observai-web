import { describe, expect, it } from "vitest";

import type { Analysis, Evidence } from "@/features/analysis/api/analysis.schemas";
import {
  buildEvidenceDetail,
  buildEvidenceRawAttributes,
  findEvidenceRootCauseRelations
} from "@/features/analysis/domain/evidence.detail";

const evidenceEntry: Evidence = {
  id: "evidence-1",
  signal: "logs",
  service: "checkout-service",
  source: "loki",
  provider: "grafana",
  name: "error logs",
  summary: "checkout errors increased",
  observed: "2026-05-13T12:00:00Z",
  score: 12,
  unit: "errors",
  reference: "stream=checkout",
  query: "{service=\"checkout-service\"}",
  attributes: {
    level: "error",
    message: "payment dependency timeout"
  }
};

const analysis: Analysis = {
  id: "analysis-1",
  summary: "checkout degraded",
  severity: "high",
  confidence: "medium",
  affectedServices: ["checkout-service"],
  evidence: [evidenceEntry],
  detectedAnomalies: [],
  possibleRootCauses: [
    {
      cause: "Payment dependency timeout",
      evidence: ["evidence-1", "trace-2"],
      confidence: "high"
    },
    {
      cause: "Unrelated cache pressure",
      evidence: ["metric-3"],
      confidence: "low"
    }
  ],
  recommendedActions: [],
  codeLevelInsights: [],
  missingEvidence: [],
  createdAt: "2026-05-13T12:10:00Z"
};

describe("evidence detail", () => {
  it("sorts raw attributes for stable drill-down rendering", () => {
    expect(buildEvidenceRawAttributes(evidenceEntry).map((attribute) => attribute.name)).toEqual([
      "level",
      "message"
    ]);
  });

  it("links evidence to root cause citations", () => {
    expect(findEvidenceRootCauseRelations(analysis, "evidence-1")).toEqual([
      {
        cause: "Payment dependency timeout",
        confidence: "high",
        citations: ["evidence-1", "trace-2"]
      }
    ]);
  });

  it("builds normalized attributes and raw payload text", () => {
    const evidenceDetail = buildEvidenceDetail(analysis, evidenceEntry);

    expect(evidenceDetail.normalizedAttributes.map((attribute) => attribute.name)).toContain("provider");
    expect(evidenceDetail.rawPayload).toContain("\"id\": \"evidence-1\"");
  });
});
