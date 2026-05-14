import { describe, expect, it } from "vitest";

import { summarizeRuntime } from "@/features/capabilities/domain/runtime-insights";

describe("runtime insights", () => {
  it("reports supported signals from configured providers", () => {
    const summary = summarizeRuntime({
      healthStatus: "ok",
      readiness: { status: "ok", checks: [] },
      capabilities: {
        mode: "self-hosted",
        version: "1.2.3",
        llm: { provider: "ollama", model: "llama3.1" },
        observability: [
          { provider: "prometheus", signals: ["metrics"] },
          { provider: "grafana", signals: ["logs", "metrics"] }
        ],
        limits: {
          httpRequestTimeoutMs: 30_000,
          httpMaxBodyBytes: 1_048_576
        }
      }
    });

    expect(summary.status).toBe("ok");
    expect(summary.supportedSignals).toEqual(["logs", "metrics"]);
    expect(summary.issues).toEqual([]);
  });

  it("prioritizes critical runtime blockers", () => {
    const summary = summarizeRuntime({
      healthStatus: "unavailable",
      readiness: {
        status: "failed",
        checks: [{ name: "database", status: "failed", durationMs: 15, error: "connection refused" }]
      }
    });

    expect(summary.status).toBe("critical");
    expect(summary.issues.map((issue) => issue.id)).toEqual(["api-offline", "readiness-failed"]);
  });
});

