import { z } from "zod";

import { appConfig } from "@/shared/config/env";
import { ApiError, ApiResponseValidationError, NetworkError } from "@/shared/api/errors";
import { apiEnvelopeSchema, errorResponseSchema } from "@/shared/api/http.schemas";
import { defaultLocale, isSupportedLocale, localeCookieName } from "@/shared/i18n/locales";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions<TSchema extends z.ZodTypeAny> = {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  searchParams?: Record<string, string | number | undefined>;
  headers?: HeadersInit;
  schema: TSchema;
};

type ApiFetchOptions = Omit<RequestOptions<z.ZodTypeAny>, "schema"> & {
  headers?: HeadersInit;
};

export function buildApiUrl(path: string, searchParams?: RequestOptions<z.ZodTypeAny>["searchParams"]) {
  const baseUrl = appConfig.apiUrl;
  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = baseUrl.startsWith("http")
    ? new URL(normalizedPath, baseUrl)
    : new URL(`${normalizedBaseUrl}${normalizedPath}`, origin);

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url;
}

async function parseErrorResponse(response: Response) {
  const payload = await response.json().catch(() => null);
  const errorEnvelope = apiEnvelopeSchema(errorResponseSchema).safeParse(payload);

  if (errorEnvelope.success) {
    throw new ApiError(response.status, errorEnvelope.data.data, errorEnvelope.data.metadata);
  }

  throw new ApiError(response.status, {
    code: "http_error",
    message: `Request failed with status ${response.status}`
  });
}

function getApiLanguageHeader() {
  if (typeof document === "undefined") {
    return defaultLocale;
  }

  const localeCookie = document.cookie
    .split(";")
    .map((cookiePart) => cookiePart.trim())
    .find((cookiePart) => cookiePart.startsWith(`${localeCookieName}=`));
  const locale = localeCookie?.split("=")[1];

  return locale && isSupportedLocale(locale) ? locale : defaultLocale;
}

export async function apiFetch({
  path,
  method = "GET",
  body,
  searchParams,
  headers
}: ApiFetchOptions) {
  const requestHeaders = new Headers(headers);

  requestHeaders.set("Accept-Language", getApiLanguageHeader());

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(path, searchParams), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body)
  }).catch((error: unknown) => {
    if (error instanceof TypeError) {
      throw new NetworkError();
    }

    throw error;
  });

  if (!response.ok) {
    await parseErrorResponse(response);
  }

  return response;
}

export async function apiRequest<TSchema extends z.ZodTypeAny>({
  path,
  method = "GET",
  body,
  searchParams,
  headers,
  schema
}: RequestOptions<TSchema>) {
  const response = await apiFetch({
    path,
    method,
    body,
    searchParams,
    headers: {
      ...headers,
      Accept: "application/json"
    }
  });

  const payload = await response.json().catch(() => {
    throw new ApiResponseValidationError();
  });
  const envelope = apiEnvelopeSchema(schema).safeParse(payload);

  if (!envelope.success) {
    throw new ApiResponseValidationError();
  }

  return envelope.data;
}
