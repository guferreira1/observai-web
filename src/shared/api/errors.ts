import type { ErrorFieldDetail, ErrorResponse, ResponseMetadata } from "@/shared/api/http.schemas";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErrorResponse["details"];
  readonly requestId?: string;
  readonly metadata?: ResponseMetadata;

  constructor(status: number, response: ErrorResponse, metadata?: ResponseMetadata) {
    super(response.message);
    this.name = "ApiError";
    this.status = status;
    this.code = response.code;
    this.details = response.details;
    this.requestId = metadata?.requestId;
    this.metadata = metadata;
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Unable to reach ObservAI API");
    this.name = "NetworkError";
  }
}

export class ApiResponseValidationError extends Error {
  constructor() {
    super("ObservAI API returned an unexpected response shape");
    this.name = "ApiResponseValidationError";
  }
}

export type UserFacingError = {
  title: string;
  description: string;
  retryLabel: string;
  canRetry: boolean;
  code?: string;
  requestId?: string;
  details?: ErrorFieldDetail[];
};

function isRetryableApiStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

export function toUserFacingError(error: unknown): UserFacingError {
  if (error instanceof NetworkError) {
    return {
      title: "Network connection failed",
      description: "Check that ObservAI API is running and reachable from the browser.",
      retryLabel: "Try connection again",
      canRetry: true
    };
  }

  if (error instanceof ApiResponseValidationError) {
    return {
      title: "API contract changed",
      description: "The response did not match the frontend contract. Check the API version before retrying.",
      retryLabel: "Reload data",
      canRetry: true
    };
  }

  if (error instanceof ApiError) {
    const diagnostics = {
      code: error.code,
      requestId: error.requestId,
      details: error.details
    };

    if (error.code === "question_out_of_scope") {
      return {
        title: "Question outside this analysis",
        description: error.message,
        retryLabel: "Ask another question",
        canRetry: false,
        ...diagnostics
      };
    }

    if (error.code === "request_body_too_large") {
      return {
        title: "Request is too large",
        description: "Reduce the investigation context or remove unnecessary payload details before submitting again.",
        retryLabel: "Submit again",
        canRetry: false,
        ...diagnostics
      };
    }

    if (error.code === "request_timeout") {
      return {
        title: "API request timed out",
        description: "ObservAI API exceeded its processing budget. Retry with a narrower time window or fewer signals.",
        retryLabel: "Retry request",
        canRetry: true,
        ...diagnostics
      };
    }

    if (error.code === "analysis_job_not_found") {
      return {
        title: "Analysis job not found",
        description: "The submitted analysis job is no longer available. Start a new analysis request.",
        retryLabel: "Reload",
        canRetry: false,
        ...diagnostics
      };
    }

    if (error.status === 404) {
      return {
        title: "Record not found",
        description: "The requested analysis was not returned by ObservAI API.",
        retryLabel: "Reload",
        canRetry: false,
        ...diagnostics
      };
    }

    if (error.status === 400 || error.status === 422) {
      return {
        title: "Request needs attention",
        description: error.message,
        retryLabel: "Submit again",
        canRetry: false,
        ...diagnostics
      };
    }

    return {
      title: isRetryableApiStatus(error.status) ? "API temporarily unavailable" : "API request failed",
      description: error.message,
      retryLabel: error.status === 429 ? "Retry after a moment" : "Retry request",
      canRetry: isRetryableApiStatus(error.status),
      ...diagnostics
    };
  }

  if (error instanceof Error) {
    return {
      title: "Unexpected error",
      description: error.message,
      retryLabel: "Try again",
      canRetry: true
    };
  }

  return {
    title: "Unexpected error",
    description: "The operation could not be completed.",
    retryLabel: "Try again",
    canRetry: true
  };
}

export function getErrorMessage(error: unknown) {
  return toUserFacingError(error).description;
}
