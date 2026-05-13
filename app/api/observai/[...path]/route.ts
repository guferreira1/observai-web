import { NextRequest } from "next/server";

const fallbackApiTargetUrl = "http://localhost:8080";
const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function getApiTargetUrl() {
  const configuredTargetUrl = process.env.OBSERVAI_API_URL ?? process.env.NEXT_PUBLIC_OBSERVAI_API_TARGET_URL;

  if (!configuredTargetUrl || configuredTargetUrl.startsWith("/")) {
    return fallbackApiTargetUrl;
  }

  return configuredTargetUrl;
}

function buildTargetUrl(pathSegments: string[], request: NextRequest) {
  const targetUrl = new URL(`/${pathSegments.join("/")}`, getApiTargetUrl());
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  return targetUrl;
}

function buildForwardHeaders(request: NextRequest) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  const acceptLanguage = request.headers.get("accept-language");
  const requestId = request.headers.get("x-request-id");

  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (accept) {
    headers.set("accept", accept);
  }
  if (acceptLanguage) {
    headers.set("accept-language", acceptLanguage);
  }
  if (requestId) {
    headers.set("x-request-id", requestId);
  }

  return headers;
}

function buildResponseHeaders(response: Response) {
  const headers = new Headers();

  response.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const response = await fetch(buildTargetUrl(params.path, request), {
    method: request.method,
    headers: buildForwardHeaders(request),
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store"
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: buildResponseHeaders(response)
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
