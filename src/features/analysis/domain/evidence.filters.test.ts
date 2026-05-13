import { describe, expect, it } from "vitest";

import type { Evidence } from "@/features/analysis/api/analysis.schemas";
import {
  filterEvidenceEntries,
  groupEvidenceEntries,
  type EvidenceFilters
} from "@/features/analysis/domain/evidence.filters";

const defaultFilters: EvidenceFilters = {
  signal: "",
  service: "",
  provider: "",
  minimumScore: "",
  search: "",
  groupBy: "none"
};

const evidenceEntries: Evidence[] = [
  {
    id: "evidence-1",
    signal: "logs",
    service: "checkout-service",
    source: "loki",
    provider: "loki",
    name: "error logs",
    summary: "checkout errors increased",
    observed: "2026-05-13T12:00:00Z",
    score: 12,
    attributes: {
      level: "error"
    }
  },
  {
    id: "evidence-2",
    signal: "traces",
    service: "payment-service",
    source: "jaeger",
    provider: "jaeger",
    name: "slow payment span",
    summary: "payment authorization is slow",
    observed: "2026-05-13T12:05:00Z",
    score: 430
  }
];

describe("evidence filters", () => {
  it("filters by signal, service, provider, score and text", () => {
    const filteredEvidence = filterEvidenceEntries(evidenceEntries, {
      ...defaultFilters,
      signal: "traces",
      service: "payment-service",
      provider: "jaeger",
      minimumScore: "100",
      search: "authorization"
    });

    expect(filteredEvidence).toHaveLength(1);
    expect(filteredEvidence[0]?.name).toBe("slow payment span");
  });

  it("groups evidence by service", () => {
    const evidenceGroups = groupEvidenceEntries(evidenceEntries, "service");

    expect(evidenceGroups.map((evidenceGroup) => evidenceGroup.key)).toEqual([
      "checkout-service",
      "payment-service"
    ]);
  });
});
