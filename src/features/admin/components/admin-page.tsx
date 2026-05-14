"use client";

import { KeyRound, PlugZap, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  useAPIKeysQuery,
  useAuditEntriesQuery,
  useCreateWebhookMutation,
  useDeleteWebhookMutation,
  useIssueAPIKeyMutation,
  usePurgeAnalysesMutation,
  useRevokeAPIKeyMutation,
  useWebhooksQuery
} from "@/features/admin/api/admin.queries";
import type { APIKeyScope } from "@/features/admin/api/admin.schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header";
import { Select } from "@/shared/ui/select";

export function AdminPage() {
  const { formatDateTime, t } = useI18n();
  const [token, setToken] = useState("");
  const [keyName, setKeyName] = useState("");
  const [keyScope, setKeyScope] = useState<APIKeyScope>("default");
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvent, setWebhookEvent] = useState("analysis.completed");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [olderThan, setOlderThan] = useState("720h");
  const [issuedSecret, setIssuedSecret] = useState("");
  const adminToken = token.trim();
  const keysQuery = useAPIKeysQuery(adminToken);
  const webhooksQuery = useWebhooksQuery(adminToken);
  const auditQuery = useAuditEntriesQuery(adminToken);
  const issueKeyMutation = useIssueAPIKeyMutation(adminToken);
  const revokeKeyMutation = useRevokeAPIKeyMutation(adminToken);
  const createWebhookMutation = useCreateWebhookMutation(adminToken);
  const deleteWebhookMutation = useDeleteWebhookMutation(adminToken);
  const purgeAnalysesMutation = usePurgeAnalysesMutation(adminToken);

  async function issueKey() {
    const issued = await issueKeyMutation.mutateAsync({ name: keyName, scope: keyScope });
    setIssuedSecret(issued.secret);
    setKeyName("");
  }

  async function createWebhookSubscription() {
    await createWebhookMutation.mutateAsync({
      name: webhookName,
      url: webhookUrl,
      event: webhookEvent,
      secret: webhookSecret
    });
    setWebhookName("");
    setWebhookUrl("");
    setWebhookSecret("");
  }

  async function purgeOldAnalyses() {
    const confirmed = window.confirm(t("admin.retention.confirm", { olderThan }));

    if (!confirmed) {
      return;
    }

    await purgeAnalysesMutation.mutateAsync(olderThan);
  }

  function refreshAdminData() {
    void keysQuery.refetch();
    void webhooksQuery.refetch();
    void auditQuery.refetch();
  }

  const adminError =
    keysQuery.error ??
    webhooksQuery.error ??
    auditQuery.error ??
    issueKeyMutation.error ??
    revokeKeyMutation.error ??
    createWebhookMutation.error ??
    deleteWebhookMutation.error ??
    purgeAnalysesMutation.error;

  return (
    <>
      <PageHeader
        title={t("admin.title")}
        description={t("admin.description")}
        actions={
          <Button type="button" variant="outline" onClick={refreshAdminData} disabled={!adminToken}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("common.retry")}
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle>{t("admin.auth.title")}</CardTitle>
            </div>
            <CardDescription>{t("admin.auth.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder={t("admin.auth.placeholder")}
              autoComplete="off"
            />
            <Badge variant={adminToken ? "low" : "outline"}>
              {adminToken ? t("admin.auth.ready") : t("admin.auth.required")}
            </Badge>
            {adminError ? (
              <p className="md:col-span-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {getErrorMessage(adminError)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
                <CardTitle>{t("admin.keys.title")}</CardTitle>
              </div>
              <CardDescription>{t("admin.keys.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_150px_auto]">
                <Input
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                  placeholder={t("admin.keys.namePlaceholder")}
                />
                <Select value={keyScope} onChange={(event) => setKeyScope(event.target.value as APIKeyScope)}>
                  <option value="default">{t("admin.keys.scope.default")}</option>
                  <option value="admin">{t("admin.keys.scope.admin")}</option>
                </Select>
                <Button
                  type="button"
                  disabled={!adminToken || !keyName || issueKeyMutation.isPending}
                  onClick={() => void issueKey()}
                >
                  {t("admin.keys.issue")}
                </Button>
              </div>
              {issuedSecret ? (
                <div className="rounded-md border border-amber-300/50 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
                  <div className="font-medium">{t("admin.keys.secretTitle")}</div>
                  <code className="mt-2 block break-all rounded-md bg-background/80 p-2 text-xs">{issuedSecret}</code>
                </div>
              ) : null}
              <div className="space-y-2">
                {(keysQuery.data ?? []).map((apiKey) => (
                  <div key={apiKey.id} className="inner-surface flex flex-wrap items-center justify-between gap-3 p-3">
                    <div>
                      <div className="font-medium">{apiKey.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {apiKey.id} · {formatDateTime(apiKey.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apiKey.scope === "admin" ? "high" : "outline"}>{apiKey.scope}</Badge>
                      {apiKey.revokedAt ? <Badge variant="secondary">{t("admin.keys.revoked")}</Badge> : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!adminToken || Boolean(apiKey.revokedAt) || revokeKeyMutation.isPending}
                        onClick={() => void revokeKeyMutation.mutateAsync(apiKey.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        {t("admin.keys.revoke")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PlugZap className="h-4 w-4 text-primary" aria-hidden="true" />
                <CardTitle>{t("admin.webhooks.title")}</CardTitle>
              </div>
              <CardDescription>{t("admin.webhooks.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Input value={webhookName} onChange={(event) => setWebhookName(event.target.value)} placeholder={t("admin.webhooks.namePlaceholder")} />
                <Input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://example.com/observai/webhook" />
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <Input value={webhookEvent} onChange={(event) => setWebhookEvent(event.target.value)} />
                  <Input type="password" value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} placeholder={t("admin.webhooks.secretPlaceholder")} />
                  <Button
                    type="button"
                    disabled={!adminToken || !webhookName || !webhookUrl || !webhookSecret || createWebhookMutation.isPending}
                    onClick={() => void createWebhookSubscription()}
                  >
                    {t("admin.webhooks.create")}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {(webhooksQuery.data ?? []).map((webhook) => (
                  <div key={webhook.id} className="inner-surface flex flex-wrap items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <div className="font-medium">{webhook.name}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">{webhook.url}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{webhook.event}</Badge>
                      {webhook.disabledAt ? <Badge variant="secondary">{t("admin.webhooks.disabled")}</Badge> : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!adminToken || Boolean(webhook.disabledAt) || deleteWebhookMutation.isPending}
                        onClick={() => void deleteWebhookMutation.mutateAsync(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        {t("admin.webhooks.delete")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.retention.title")}</CardTitle>
              <CardDescription>{t("admin.retention.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="olderThan">{t("admin.retention.olderThan")}</Label>
              <div className="flex gap-2">
                <Input id="olderThan" value={olderThan} onChange={(event) => setOlderThan(event.target.value)} />
                <Button type="button" variant="destructive" disabled={!adminToken || !olderThan || purgeAnalysesMutation.isPending} onClick={() => void purgeOldAnalyses()}>
                  {t("admin.retention.purge")}
                </Button>
              </div>
              {purgeAnalysesMutation.data ? (
                <p className="text-sm text-muted-foreground">
                  {t("admin.retention.deleted", { count: purgeAnalysesMutation.data.deleted })}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("admin.audit.title")}</CardTitle>
              <CardDescription>{t("admin.audit.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(auditQuery.data?.items ?? []).slice(0, 12).map((entry) => (
                <div key={entry.id} className="inner-surface grid gap-2 p-3 text-sm md:grid-cols-[90px_1fr_90px_120px]">
                  <Badge variant={entry.status >= 400 ? "high" : "outline"}>{entry.method}</Badge>
                  <div className="min-w-0 truncate font-medium">{entry.path}</div>
                  <div className="text-muted-foreground">{entry.status}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
