import { describe, expect, it } from "vitest";

import { ApiError, toUserFacingError } from "@/shared/api/errors";

describe("toUserFacingError", () => {
  it("keeps API diagnostics for user-facing error states", () => {
    const error = new ApiError(
      400,
      {
        code: "invalid_request",
        message: "request validation failed",
        details: [{ field: "goal", rule: "required" }]
      },
      {
        requestId: "request-1",
        processingTimeMs: 5,
        provider: { mode: "local" }
      }
    );

    const userFacingError = toUserFacingError(error);

    expect(userFacingError.code).toBe("invalid_request");
    expect(userFacingError.requestId).toBe("request-1");
    expect(userFacingError.details?.[0]?.field).toBe("goal");
  });

  it("uses specific guidance for timeout errors", () => {
    const error = new ApiError(504, {
      code: "request_timeout",
      message: "request exceeded the server-side processing budget"
    });

    const userFacingError = toUserFacingError(error);

    expect(userFacingError.title).toBe("API request timed out");
    expect(userFacingError.canRetry).toBe(true);
  });
});
