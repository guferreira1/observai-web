"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Server } from "lucide-react";

import { useAnalysesQuery, useAnalysisStatsQuery } from "@/features/analysis/api/analysis.queries";
import type { Severity, Signal } from "@/features/analysis/api/analysis.schemas";
import { buildAnalysisDashboardMetrics } from "@/features/analysis/domain/analysis.metrics";
import { severityOrder } from "@/features/analysis/domain/analysis.constants";
import { SeverityBadge } from "@/features/analysis/components/severity-badge";
import { AnalysisList } from "@/features/analysis/components/analysis-list";
import { useCapabilitiesQuery } from "@/features/capabilities/api/capabilities.queries";
import { useHealthQuery, useReadinessQuery } from "@/features/health/api/health.queries";
import { appConfig } from "@/shared/config/env";
import { useI18n } from "@/shared/i18n/i18n-provider";
import type { TranslationKey } from "@/shared/i18n/messages";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { LoadingState } from "@/shared/ui/state";

function MetricCard({
  title,
  value,
  description
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

const signalLabelKeys: Record<Signal, TranslationKey> = {
  logs: "common.logs",
  metrics: "common.metrics",
  traces: "common.traces",
  apm: "common.apm"
};

function getApiStatusLabel({
  healthStatus,
  readinessStatus,
  t
}: {
  healthStatus?: string;
  readinessStatus?: "ok" | "failed";
  t: ReturnType<typeof useI18n>["t"];
}) {
  if (healthStatus !== "ok") {
    return t("dashboard.apiStatus.unavailable");
  }

  if (readinessStatus === "failed") {
    return t("dashboard.apiStatus.degraded");
  }

  return t("dashboard.apiStatus.online");
}

function RuntimeCapability({
  icon: Icon,
  label,
  tone = "ok"
}: {
  icon: typeof CheckCircle2;
  label: string;
  tone?: "ok" | "warning";
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        className={tone === "ok" ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-amber-600"}
        aria-hidden="true"
      />
      {label}
    </div>
  );
}

function ReadinessPanel({
  isLoading,
  isError,
  status,
  checks,
  onRetry
}: {
  isLoading: boolean;
  isError: boolean;
  status?: "ok" | "failed";
  checks: Array<{ name: string; status: "ok" | "failed"; error?: string; durationMs: number }>;
  onRetry: () => void;
}) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{t("dashboard.apiReadiness.title")}</CardTitle>
            <CardDescription>{t("dashboard.apiReadiness.description")}</CardDescription>
          </div>
          {status ? <Badge variant={status === "ok" ? "low" : "high"}>{status}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading ? <LoadingState title={t("dashboard.apiReadiness.loading")} /> : null}
        {isError ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
              <span>{t("dashboard.apiReadiness.error")}</span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {t("dashboard.apiReadiness.retry")}
            </Button>
          </div>
        ) : null}
        {!isLoading && !isError && checks.length === 0 ? (
          <p className="text-muted-foreground">{t("dashboard.apiReadiness.empty")}</p>
        ) : null}
        {checks.map((check) => (
          <div key={check.name} className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {check.status === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                )}
                <span className="font-medium">{check.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={check.status === "ok" ? "low" : "high"}>{check.status}</Badge>
                <span className="text-xs text-muted-foreground">{check.durationMs}ms</span>
              </div>
            </div>
            {check.error ? <p className="mt-2 text-xs leading-5 text-destructive">{check.error}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const healthQuery = useHealthQuery();
  const readinessQuery = useReadinessQuery();
  const { t, withLocalePath } = useI18n();
  const capabilitiesQuery = useCapabilitiesQuery();
  const analysisStatsQuery = useAnalysisStatsQuery();
  const analysesQuery = useAnalysesQuery({ limit: 25 });
  const analyses = analysesQuery.data?.data.items ?? [];
  const metrics = buildAnalysisDashboardMetrics(analyses);
  const analysisStats = analysisStatsQuery.data?.data;
  const capabilities = capabilitiesQuery.data?.data;
  const highestSeverity = severityOrder.find((severity) => (analysisStats?.bySeverity[severity] ?? 0) > 0);

  return (
    <>
      <PageHeader
        title={t("dashboard.page.title")}
        description={t("dashboard.page.description")}
        actions={
          <Button asChild>
            <Link href={withLocalePath("/analyses/new")}>{t("dashboard.action.runAnalysis")}</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("dashboard.metrics.apiStatus.title")}
          value={getApiStatusLabel({
            healthStatus: healthQuery.data?.status,
            readinessStatus: readinessQuery.data?.status,
            t
          })}
          description={appConfig.apiUrl}
        />
        <MetricCard
          title={t("dashboard.metrics.analyses.title")}
          value={String(analysisStats?.total ?? metrics.totalAnalyses)}
          description={t("dashboard.metrics.analyses.description")}
        />
        <MetricCard
          title={t("dashboard.metrics.affectedServices.title")}
          value={String(metrics.affectedServices)}
          description={t("dashboard.metrics.affectedServices.description")}
        />
        <MetricCard
          title={t("dashboard.metrics.evidenceItems.title")}
          value={String(metrics.evidenceItems)}
          description={t("dashboard.metrics.evidenceItems.description")}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_340px]">
        <AnalysisList limit={10} />
        <div className="space-y-4">
          <ReadinessPanel
            isLoading={readinessQuery.isLoading}
            isError={readinessQuery.isError}
            status={readinessQuery.data?.status}
            checks={readinessQuery.data?.checks ?? []}
            onRetry={() => void readinessQuery.refetch()}
          />

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.operationalSeverity.title")}</CardTitle>
              <CardDescription>{t("dashboard.operationalSeverity.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisStatsQuery.isLoading ? (
                <LoadingState title={t("dashboard.operationalSeverity.loading")} />
              ) : highestSeverity ? (
                <div className="space-y-4">
                  <SeverityBadge severity={highestSeverity} />
                  <div className="space-y-2 text-sm">
                    {severityOrder.map((severity) => {
                      const count = analysisStats?.bySeverity[severity] ?? 0;

                      return (
                        <div key={severity} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{t(`severity.${severity as Severity}`)}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("dashboard.operationalSeverity.empty")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>{t("dashboard.runtime.title")}</CardTitle>
                  <CardDescription>{t("dashboard.runtime.description")}</CardDescription>
                </div>
                {capabilities?.version ? <Badge variant="outline">{capabilities.version}</Badge> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {capabilitiesQuery.isLoading ? <LoadingState title={t("dashboard.runtime.loading")} /> : null}
              {capabilitiesQuery.isError ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
                    <span>{t("dashboard.runtime.error")}</span>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => void capabilitiesQuery.refetch()}>
                    {t("dashboard.runtime.retry")}
                  </Button>
                </div>
              ) : null}
              {capabilities ? (
                <>
                  <RuntimeCapability
                    icon={CheckCircle2}
                    label={t("dashboard.runtime.llm", {
                      provider: capabilities.llm.provider,
                      model: capabilities.llm.model ?? t("common.notReported")
                    })}
                  />
                  <RuntimeCapability
                    icon={Server}
                    label={t("dashboard.runtime.mode", { mode: capabilities.mode })}
                  />
                  {capabilities.observability.length > 0 ? (
                    <div className="space-y-2">
                      {capabilities.observability.map((provider) => (
                        <div key={provider.provider} className="rounded-md border p-3">
                          <div className="font-medium">{provider.provider}</div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {provider.signals.map((signal) => (
                              <Badge key={signal} variant="outline">
                                {t(signalLabelKeys[signal])}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t("dashboard.runtime.noObservability")}</p>
                  )}
                  <div className="border-t pt-3 text-xs leading-5 text-muted-foreground">
                    <div>
                      {t("dashboard.runtime.timeout")}: {capabilities.limits.httpRequestTimeoutMs}ms
                    </div>
                    <div>
                      {t("dashboard.runtime.bodyLimit")}: {capabilities.limits.httpMaxBodyBytes} bytes
                    </div>
                    {capabilities.limits.rateLimitRps ? (
                      <div>
                        {t("dashboard.runtime.rateLimit")}: {capabilities.limits.rateLimitRps} rps
                        {capabilities.limits.rateLimitBurst
                          ? ` / ${capabilities.limits.rateLimitBurst} burst`
                          : ""}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
