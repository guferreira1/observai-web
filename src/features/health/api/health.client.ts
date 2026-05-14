import { apiRequest, buildApiUrl } from "@/shared/api/http-client";
import { ApiResponseValidationError, NetworkError } from "@/shared/api/errors";
import {
  healthResponseSchema,
  readinessResponseSchema
} from "@/features/health/api/health.schemas";

export async function getHealth() {
  const response = await apiRequest({
    path: "/health",
    schema: healthResponseSchema
  });

  return response.data;
}

export async function getReadiness() {
  const response = await fetch(buildApiUrl("/readyz")).catch((error: unknown) => {
    if (error instanceof TypeError) {
      throw new NetworkError();
    }

    throw error;
  });
  const payload = await response.json().catch(() => {
    throw new ApiResponseValidationError();
  });
  const readiness = readinessResponseSchema.safeParse(payload);

  if (!readiness.success) {
    throw new ApiResponseValidationError();
  }

  return readiness.data;
}
