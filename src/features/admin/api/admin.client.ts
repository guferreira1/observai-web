import { apiFetch, apiRequest } from "@/shared/api/http-client";
import {
  apiKeysResponseSchema,
  auditListResponseSchema,
  createWebhookRequestSchema,
  issueApiKeyRequestSchema,
  issuedApiKeySchema,
  purgeAnalysesResponseSchema,
  webhookSchema,
  webhooksResponseSchema,
  type CreateWebhookRequest,
  type IssueAPIKeyRequest
} from "@/features/admin/api/admin.schemas";

function adminHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`
  };
}

export async function listAPIKeys(token: string) {
  const response = await apiRequest({
    path: "/v1/admin/keys",
    headers: adminHeaders(token),
    schema: apiKeysResponseSchema
  });

  return response.data;
}

export async function issueAPIKey(token: string, request: IssueAPIKeyRequest) {
  const response = await apiRequest({
    path: "/v1/admin/keys",
    method: "POST",
    headers: adminHeaders(token),
    body: issueApiKeyRequestSchema.parse(request),
    schema: issuedApiKeySchema
  });

  return response.data;
}

export async function revokeAPIKey(token: string, keyId: string) {
  await apiFetch({
    path: `/v1/admin/keys/${keyId}`,
    method: "DELETE",
    headers: adminHeaders(token)
  });

  return {};
}

export async function listWebhooks(token: string) {
  const response = await apiRequest({
    path: "/v1/admin/webhooks",
    headers: adminHeaders(token),
    schema: webhooksResponseSchema
  });

  return response.data;
}

export async function createWebhook(token: string, request: CreateWebhookRequest) {
  const response = await apiRequest({
    path: "/v1/admin/webhooks",
    method: "POST",
    headers: adminHeaders(token),
    body: createWebhookRequestSchema.parse(request),
    schema: webhookSchema
  });

  return response.data;
}

export async function deleteWebhook(token: string, webhookId: string) {
  await apiFetch({
    path: `/v1/admin/webhooks/${webhookId}`,
    method: "DELETE",
    headers: adminHeaders(token)
  });

  return {};
}

export async function listAuditEntries(token: string) {
  const response = await apiRequest({
    path: "/v1/admin/audit",
    headers: adminHeaders(token),
    schema: auditListResponseSchema
  });

  return response.data;
}

export async function purgeAnalyses(token: string, olderThan: string) {
  const response = await apiRequest({
    path: "/v1/admin/analyses",
    method: "DELETE",
    headers: adminHeaders(token),
    searchParams: { olderThan },
    schema: purgeAnalysesResponseSchema
  });

  return response.data;
}
