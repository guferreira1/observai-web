import { ApiError, NetworkError } from "@/shared/api/errors";

const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2) {
    return false;
  }

  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof ApiError) {
    return retryableStatuses.has(error.status);
  }

  return false;
}

export function getRetryDelay(attemptIndex: number) {
  return Math.min(1_000 * 2 ** attemptIndex, 8_000);
}
