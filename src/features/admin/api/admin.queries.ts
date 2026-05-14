import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createWebhook,
  deleteWebhook,
  issueAPIKey,
  listAPIKeys,
  listAuditEntries,
  listWebhooks,
  purgeAnalyses,
  revokeAPIKey
} from "@/features/admin/api/admin.client";
import type { CreateWebhookRequest, IssueAPIKeyRequest } from "@/features/admin/api/admin.schemas";
import { analysisQueryKeys } from "@/features/analysis/api/analysis.queries";

export const adminQueryKeys = {
  all: ["admin"] as const,
  keys: (token: string) => [...adminQueryKeys.all, "keys", token] as const,
  webhooks: (token: string) => [...adminQueryKeys.all, "webhooks", token] as const,
  audit: (token: string) => [...adminQueryKeys.all, "audit", token] as const
};

export function useAPIKeysQuery(token: string) {
  return useQuery({
    queryKey: adminQueryKeys.keys(token),
    queryFn: () => listAPIKeys(token),
    enabled: token.length > 0
  });
}

export function useWebhooksQuery(token: string) {
  return useQuery({
    queryKey: adminQueryKeys.webhooks(token),
    queryFn: () => listWebhooks(token),
    enabled: token.length > 0
  });
}

export function useAuditEntriesQuery(token: string) {
  return useQuery({
    queryKey: adminQueryKeys.audit(token),
    queryFn: () => listAuditEntries(token),
    enabled: token.length > 0
  });
}

export function useIssueAPIKeyMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: IssueAPIKeyRequest) => issueAPIKey(token, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.keys(token) });
    }
  });
}

export function useRevokeAPIKeyMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string) => revokeAPIKey(token, keyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.keys(token) });
    }
  });
}

export function useCreateWebhookMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateWebhookRequest) => createWebhook(token, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.webhooks(token) });
    }
  });
}

export function useDeleteWebhookMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookId: string) => deleteWebhook(token, webhookId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.webhooks(token) });
    }
  });
}

export function usePurgeAnalysesMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (olderThan: string) => purgeAnalyses(token, olderThan),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: analysisQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.audit(token) });
    }
  });
}
