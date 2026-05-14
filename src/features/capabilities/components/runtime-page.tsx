"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleGauge,
  DatabaseZap,
  Gauge,
  RefreshCw,
  ServerCog,
  ShieldAlert,
  Signal
} from "lucide-react";

import { summarizeRuntime, type RuntimeSeverity } from "@/features/capabilities/domain/runtime-insights";
import { useCapabilitiesQuery } from "@/features/capabilities/api/capabilities.queries";
import type { CapabilityProvider } from "@/features/capabilities/api/capabilities.schemas";
import { useHealthQuery, useReadinessQuery } from "@/features/health/api/health.queries";
import type { ReadinessCheck } from "@/features/health/api/health.schemas";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { LoadingState } from "@/shared/ui/state";

const statusBadgeVariant: Record<RuntimeSeverity, "low" | "medium" | "critical"> = {
  ok: "low",
  warning: "medium",
  critical: "critical"
};

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDuration(milliseconds: number) {
  return milliseconds >= 1000 ? `${milliseconds / 1000}s` : `${milliseconds}ms`;
}

function StatusTile({
  title,
  value,
  description,
  severity
}: {
  title: string;
  value: string;
  description: string;
  severity: RuntimeSeverity;
}) {
  const severityAccent = {
    ok: "from-emerald-400/20 text-emerald-600 ring-emerald-300/30",
    warning: "from-amber-400/20 text-amber-600 ring-amber-300/30",
    critical: "from-red-400/20 text-red-600 ring-red-300/30"
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${severityAccent[severity]} to-transparent`} aria-hidden="true" />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 truncate text-2xl font-semibold tracking-normal">{value}</p>
          </div>
          <Badge variant={statusBadgeVariant[severity]}>{value}</Badge>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function ReadinessChecks({ checks }: { checks: ReadinessCheck[] }) {
  const { t } = useI18n();

  if (checks.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("runtime.readiness.empty")}</p>;
  }

  return (
    <div className="grid gap-3">
      {checks.map((check) => (
        <div key={check.name} className="inner-surface p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium">{check.name}</div>
            <Badge variant={check.status === "ok" ? "low" : "critical"}>{check.status}</Badge>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {t("runtime.readiness.duration", { duration: formatDuration(check.durationMs) })}
          </div>
          {check.error ? <div className="mt-2 text-sm text-destructive">{check.error}</div> : null}
        </div>
      ))}
    </div>
  );
}

function ProviderCard({ provider }: { provider: CapabilityProvider }) {
  return (
    <div className="inner-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium">{provider.provider}</div>
        <Badge variant="outline">{provider.signals.length}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {provider.signals.map((signal) => (
          <Badge key={signal} variant="info">
            {signal}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function RuntimePage() {
  const { t } = useI18n();
  const healthQuery = useHealthQuery();
  const readinessQuery = useReadinessQuery();
  const capabilitiesQuery = useCapabilitiesQuery();
  const capabilities = capabilitiesQuery.data?.data;
  const summary = summarizeRuntime({
    healthStatus: healthQuery.data?.status,
    readiness: readinessQuery.data,
    capabilities
  });
  const isLoading = healthQuery.isLoading || readinessQuery.isLoading || capabilitiesQuery.isLoading;

  const retryRuntime = () => {
    void healthQuery.refetch();
    void readinessQuery.refetch();
    void capabilitiesQuery.refetch();
  };

  return (
    <div className="grid gap-6">
      <div className="relative overflow-hidden rounded-lg border bg-card/70 p-6 shadow-sm shadow-black/5 backdrop-blur-xl sm:flex sm:items-start sm:justify-between sm:gap-6">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/20 via-cyan-500/10 to-transparent" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ServerCog className="h-4 w-4" aria-hidden="true" />
            {t("runtime.eyebrow")}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">{t("runtime.title")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("runtime.description")}</p>
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-2 sm:mt-0">
          <Badge variant={statusBadgeVariant[summary.status]}>{t(`runtime.status.${summary.status}`)}</Badge>
          {capabilities?.version ? <Badge variant="outline">{capabilities.version}</Badge> : null}
          <Button type="button" variant="outline" size="sm" onClick={retryRuntime}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("runtime.refresh")}
          </Button>
        </div>
      </div>

      {isLoading ? <LoadingState title={t("runtime.loading")} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile
          title={t("runtime.health.title")}
          value={healthQuery.data?.status ?? t("common.notReported")}
          severity={healthQuery.data?.status === "ok" ? "ok" : "critical"}
          description={t("runtime.health.description")}
        />
        <StatusTile
          title={t("runtime.readiness.title")}
          value={readinessQuery.data?.status ?? t("common.notReported")}
          severity={readinessQuery.data?.status === "ok" ? "ok" : readinessQuery.data?.status === "failed" ? "critical" : "warning"}
          description={t("runtime.readiness.description")}
        />
        <StatusTile
          title={t("runtime.capabilities.title")}
          value={capabilities ? t("runtime.capabilities.loaded") : t("common.notReported")}
          severity={capabilities ? "ok" : "warning"}
          description={t("runtime.capabilities.description")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DatabaseZap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle>{t("runtime.providers.title")}</CardTitle>
            </div>
            <CardDescription>{t("runtime.providers.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {capabilities?.observability.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {capabilities.observability.map((provider) => (
                  <ProviderCard key={provider.provider} provider={provider} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("runtime.providers.empty")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Signal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle>{t("runtime.signals.title")}</CardTitle>
            </div>
            <CardDescription>{t("runtime.signals.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.supportedSignals.length > 0 ? (
                summary.supportedSignals.map((signal) => (
                  <Badge key={signal} variant="info">
                    {signal}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("runtime.signals.empty")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CircleGauge className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle>{t("runtime.readiness.checks")}</CardTitle>
            </div>
            <CardDescription>{t("runtime.readiness.checksDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReadinessChecks checks={readinessQuery.data?.checks ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle>{t("runtime.llm.title")}</CardTitle>
            </div>
            <CardDescription>{t("runtime.llm.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <RuntimeField label={t("common.provider")} value={capabilities?.llm.provider} />
            <RuntimeField label={t("runtime.llm.model")} value={capabilities?.llm.model} />
            <RuntimeField label={t("common.mode")} value={capabilities?.mode} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle>{t("runtime.limits.title")}</CardTitle>
            </div>
            <CardDescription>{t("runtime.limits.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <RuntimeField
              label={t("runtime.limits.timeout")}
              value={capabilities ? formatDuration(capabilities.limits.httpRequestTimeoutMs) : undefined}
            />
            <RuntimeField
              label={t("runtime.limits.body")}
              value={capabilities ? formatBytes(capabilities.limits.httpMaxBodyBytes) : undefined}
            />
            <RuntimeField
              label={t("runtime.limits.rate")}
              value={capabilities?.limits.rateLimitRps ? `${capabilities.limits.rateLimitRps} rps` : undefined}
            />
            <RuntimeField
              label={t("runtime.limits.burst")}
              value={capabilities?.limits.rateLimitBurst ? String(capabilities.limits.rateLimitBurst) : undefined}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle>{t("runtime.issues.title")}</CardTitle>
            </div>
            <CardDescription>{t("runtime.issues.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.issues.length > 0 ? (
              <div className="grid gap-3">
                {summary.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={cn(
                      "rounded-md border p-3",
                      issue.severity === "critical" && "border-red-200 bg-red-50/60 dark:border-red-400/30 dark:bg-red-950/20",
                      issue.severity === "warning" && "border-amber-200 bg-amber-50/60 dark:border-amber-400/30 dark:bg-amber-950/20"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <div>
                        <div className="font-medium">{t(issue.titleKey)}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{t(issue.actionKey)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                {t("runtime.issues.empty")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RuntimeField({ label, value }: { label: string; value?: string | number }) {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium">{value ?? t("common.notReported")}</span>
    </div>
  );
}
