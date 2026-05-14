import { describe, expect, it } from "vitest";

import { capabilitiesSchema } from "@/features/capabilities/api/capabilities.schemas";

describe("capabilities schemas", () => {
  it("accepts backend runtime capabilities", () => {
    const capabilities = capabilitiesSchema.parse({
      mode: "local",
      version: "dev",
      llm: {
        provider: "ollama",
        model: "llama3.1"
      },
      observability: [
        {
          provider: "prometheus",
          signals: ["metrics"]
        },
        {
          provider: "fake",
          signals: ["logs", "metrics", "traces", "apm"]
        }
      ],
      limits: {
        httpRequestTimeoutMs: 30000,
        httpMaxBodyBytes: 1048576,
        rateLimitRps: 10,
        rateLimitBurst: 20
      }
    });

    expect(capabilities.observability[0]?.signals).toEqual(["metrics"]);
  });

  it("rejects unknown provider signals", () => {
    const result = capabilitiesSchema.safeParse({
      mode: "local",
      llm: { provider: "fake" },
      observability: [{ provider: "fake", signals: ["events"] }],
      limits: {
        httpRequestTimeoutMs: 30000,
        httpMaxBodyBytes: 1048576
      }
    });

    expect(result.success).toBe(false);
  });
});
