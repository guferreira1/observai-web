import { z } from "zod";

export const adminAuthSchema = z.object({
  token: z.string().min(1)
});

export const apiKeyScopeSchema = z.enum(["default", "admin"]);

export const issueApiKeyRequestSchema = z.object({
  name: z.string().min(1),
  scope: apiKeyScopeSchema.default("default")
});

export const issuedApiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  scope: apiKeyScopeSchema,
  secret: z.string(),
  createdAt: z.string().datetime()
});

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  scope: apiKeyScopeSchema,
  createdAt: z.string().datetime(),
  lastUsedAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional()
});

export const createWebhookRequestSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  event: z.string().min(1),
  secret: z.string().min(1)
});

export const webhookSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  event: z.string(),
  secret: z.string().optional(),
  createdAt: z.string().datetime(),
  disabledAt: z.string().datetime().optional()
});

export const auditEntrySchema = z.object({
  id: z.number().int(),
  requestId: z.string(),
  apiKeyId: z.string(),
  actor: z.string(),
  method: z.string(),
  path: z.string(),
  status: z.number().int(),
  durationMs: z.number().int(),
  remote: z.string(),
  createdAt: z.string().datetime()
});

export const auditListResponseSchema = z.object({
  items: z.array(auditEntrySchema)
});

export const purgeAnalysesResponseSchema = z.object({
  deleted: z.number().int()
});

export const emptyAdminResponseSchema = z.object({});
export const apiKeysResponseSchema = z.array(apiKeySchema);
export const webhooksResponseSchema = z.array(webhookSchema);

export type AdminAuth = z.infer<typeof adminAuthSchema>;
export type APIKeyScope = z.infer<typeof apiKeyScopeSchema>;
export type IssueAPIKeyRequest = z.infer<typeof issueApiKeyRequestSchema>;
export type IssuedAPIKey = z.infer<typeof issuedApiKeySchema>;
export type APIKey = z.infer<typeof apiKeySchema>;
export type CreateWebhookRequest = z.infer<typeof createWebhookRequestSchema>;
export type Webhook = z.infer<typeof webhookSchema>;
export type AuditEntry = z.infer<typeof auditEntrySchema>;
export type AuditListResponse = z.infer<typeof auditListResponseSchema>;
export type PurgeAnalysesResponse = z.infer<typeof purgeAnalysesResponseSchema>;
