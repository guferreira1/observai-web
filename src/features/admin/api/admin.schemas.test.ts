import { describe, expect, it } from "vitest";

import {
  apiKeysResponseSchema,
  auditListResponseSchema,
  issuedApiKeySchema,
  purgeAnalysesResponseSchema,
  webhooksResponseSchema
} from "@/features/admin/api/admin.schemas";

describe("admin schemas", () => {
  it("parses issued API keys with one-time secret", () => {
    const parsed = issuedApiKeySchema.parse({
      id: "key_1",
      name: "automation",
      scope: "admin",
      secret: "observai_secret",
      createdAt: "2026-05-14T10:00:00Z"
    });

    expect(parsed.secret).toBe("observai_secret");
  });

  it("parses admin lists returned by the backend", () => {
    expect(
      apiKeysResponseSchema.parse([
        {
          id: "key_1",
          name: "default client",
          scope: "default",
          createdAt: "2026-05-14T10:00:00Z"
        }
      ])
    ).toHaveLength(1);
    expect(
      webhooksResponseSchema.parse([
        {
          id: "webhook_1",
          name: "incident bus",
          url: "https://example.com/observai",
          event: "analysis.completed",
          createdAt: "2026-05-14T10:00:00Z"
        }
      ])
    ).toHaveLength(1);
    expect(
      auditListResponseSchema.parse({
        items: [
          {
            id: 1,
            requestId: "req_1",
            apiKeyId: "key_1",
            actor: "admin",
            method: "GET",
            path: "/v1/admin/audit",
            status: 200,
            durationMs: 12,
            remote: "127.0.0.1",
            createdAt: "2026-05-14T10:00:00Z"
          }
        ]
      }).items
    ).toHaveLength(1);
  });

  it("parses retention purge results", () => {
    expect(purgeAnalysesResponseSchema.parse({ deleted: 3 }).deleted).toBe(3);
  });
});
