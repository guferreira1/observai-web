import { describe, expect, it } from "vitest";

import { ApiError, NetworkError } from "@/shared/api/errors";
import { shouldRetryQuery } from "@/shared/api/retry-policy";

describe("shouldRetryQuery", () => {
  it("retries transient network and API failures", () => {
    expect(shouldRetryQuery(0, new NetworkError())).toBe(true);
    expect(shouldRetryQuery(1, new ApiError(503, { code: "unavailable", message: "Unavailable" }))).toBe(true);
    expect(shouldRetryQuery(1, new ApiError(429, { code: "rate_limited", message: "Rate limited" }))).toBe(true);
  });

  it("does not retry validation or exhausted failures", () => {
    expect(shouldRetryQuery(0, new ApiError(422, { code: "invalid", message: "Invalid request" }))).toBe(false);
    expect(shouldRetryQuery(2, new NetworkError())).toBe(false);
  });
});
