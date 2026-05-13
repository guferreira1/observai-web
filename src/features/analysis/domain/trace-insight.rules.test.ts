import { describe, expect, it } from "vitest";

import { categorizeTraceInsights } from "@/features/analysis/domain/trace-insight.rules";

describe("categorizeTraceInsights", () => {
  it("classifies insight text into trace categories", () => {
    const categories = categorizeTraceInsights([
      "p95 latency increased in checkout",
      "database query is slow",
      "external HTTP dependency retries amplified latency",
      "synchronous code path blocks the request"
    ]);

    expect(categories.find((category) => category.id === "performance")?.insights).toHaveLength(3);
    expect(categories.find((category) => category.id === "database")?.insights).toHaveLength(1);
    expect(categories.find((category) => category.id === "network")?.insights).toHaveLength(1);
    expect(categories.find((category) => category.id === "code")?.insights).toHaveLength(1);
  });
});
