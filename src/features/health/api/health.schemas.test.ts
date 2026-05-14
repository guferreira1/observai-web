import { describe, expect, it } from "vitest";

import { readinessResponseSchema } from "@/features/health/api/health.schemas";

describe("health schemas", () => {
  it("accepts readiness responses with dependency checks", () => {
    const readiness = readinessResponseSchema.parse({
      status: "failed",
      checks: [
        {
          name: "postgres",
          status: "ok",
          durationMs: 12
        },
        {
          name: "redis",
          status: "failed",
          error: "connection refused",
          durationMs: 4
        }
      ]
    });

    expect(readiness.checks).toHaveLength(2);
  });
});
