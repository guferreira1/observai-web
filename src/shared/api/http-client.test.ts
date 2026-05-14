import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError, ApiResponseValidationError, NetworkError } from "@/shared/api/errors";
import { apiRequest } from "@/shared/api/http-client";

const metadata = {
  requestId: "request-1",
  processingTimeMs: 12,
  provider: {
    mode: "test"
  }
};

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses successful API envelopes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true }, metadata }), { status: 200 })
    );

    const response = await apiRequest({
      path: "/v1/test",
      schema: z.object({ ok: z.boolean() })
    });

    expect(response.data.ok).toBe(true);
  });

  it("converts API error envelopes into ApiError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            code: "invalid_request",
            message: "Invalid request",
            details: [{ field: "goal", rule: "required" }]
          },
          metadata
        }),
        { status: 422 }
      )
    );

    let capturedError: unknown;
    try {
      await apiRequest({ path: "/v1/test", schema: z.object({ ok: z.boolean() }) });
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(ApiError);
    expect((capturedError as ApiError).requestId).toBe("request-1");
    expect((capturedError as ApiError).details?.[0]?.field).toBe("goal");
  });

  it("converts network failures into NetworkError", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(apiRequest({ path: "/v1/test", schema: z.object({ ok: z.boolean() }) })).rejects.toBeInstanceOf(
      NetworkError
    );
  });

  it("rejects invalid success envelopes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { unexpected: true }, metadata }), { status: 200 })
    );

    await expect(apiRequest({ path: "/v1/test", schema: z.object({ ok: z.boolean() }) })).rejects.toBeInstanceOf(
      ApiResponseValidationError
    );
  });
});
