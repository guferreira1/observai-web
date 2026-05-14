"use client";

import Link from "next/link";
import { AlertCircle, BarChart3, CheckCircle2, Layers3, RadioTower, Server, type LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useAnalysesQuery, useAnalysisStatsQuery } from "@/features/analysis/api/analysis.queries";
import type { Confidence, Severity, Signal } from "@/features/analysis/api/analysis.schemas";
import {
  buildAnalysisDashboardMetrics,
  buildConfidenceDistribution,
  buildSeverityDistribution,
  buildTopAffectedServiceMetrics,
  buildTrendMetrics,
  hasMetricCounts,
  type AnalysisStatsCountMetric
} from "@/features/analysis/domain/analysis.metrics";
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
  description,
  icon: Icon,
  tone
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone: "primary" | "accent" | "emerald" | "slate";
}) {
  const toneClasses = {
    primary: "from-cyan-500/20 via-primary/10 to-transparent text-primary ring-primary/20",
    accent: "from-amber-400/20 via-accent/10 to-transparent text-amber-600 ring-amber-300/30",
    emerald: "from-emerald-400/20 via-emerald-500/10 to-transparent text-emerald-600 ring-emerald-300/30",
    slate: "from-slate-400/20 via-slate-500/10 to-transparent text-slate-600 ring-slate-300/30 dark:text-slate-300"
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${toneClasses[tone]}`} aria-hidden="true" />
      <CardHeader className="pb-3">
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-2 truncate text-3xl">{value}</CardTitle>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background/70 ring-1 ${toneClasses[tone]}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
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

const confidenceLabelKeys: Record<Confidence, TranslationKey> = {
  high: "confidence.high",
  medium: "confidence.medium",
  low: "confidence.low"
};

const severityChartColors: Record<Severity, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#d97706",
  low: "#059669"
};

const confidenceChartColors: Record<Confidence, string> = {
  high: "#0891b2",
  medium: "#7c3aed",
  low: "#64748b"
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

function formatTrendBucket(bucketStart: string) {
  const bucketDate = new Date(bucketStart);

  if (Number.isNaN(bucketDate.getTime())) {
    return bucketStart;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit"
  }).format(bucketDate);
}

function renderChartState({
  isLoading,
  isError,
  isEmpty,
  loadingTitle,
  emptyTitle,
  errorTitle,
  retryTitle,
  onRetry
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  loadingTitle: string;
  emptyTitle: string;
  errorTitle: string;
  retryTitle: string;
  onRetry: () => void;
}) {
  if (isLoading) {
    return <LoadingState title={loadingTitle} />;
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
          <span>{errorTitle}</span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {retryTitle}
        </Button>
      </div>
    );
  }

  if (isEmpty) {
    return <p className="text-sm text-muted-foreground">{emptyTitle}</p>;
  }

  return null;
}

function TrendBucketsChart({
  buckets,
  isLoading,
  isError,
  onRetry
}: {
  buckets: Array<{ bucketStart: string; count: number }>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const chartState = renderChartState({
    isLoading,
    isError,
    isEmpty: buckets.length === 0,
    loadingTitle: t("dashboard.analytics.loading"),
    emptyTitle: t("dashboard.analytics.empty"),
    errorTitle: t("dashboard.analytics.error"),
    retryTitle: t("common.retry"),
    onRetry
  });

  if (chartState) {
    return chartState;
  }

  const chartBuckets = buckets.map((bucket) => ({
    ...bucket,
    label: formatTrendBucket(bucket.bucketStart)
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartBuckets} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#0891b2"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DistributionChart<TCategory extends Severity | Confidence>({
  metrics,
  labelByCategory,
  colorByCategory,
  isLoading,
  isError,
  onRetry
}: {
  metrics: Array<AnalysisStatsCountMetric<TCategory>>;
  labelByCategory: Record<TCategory, string>;
  colorByCategory: Record<TCategory, string>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const chartState = renderChartState({
    isLoading,
    isError,
    isEmpty: !hasMetricCounts(metrics),
    loadingTitle: t("dashboard.analytics.loading"),
    emptyTitle: t("dashboard.analytics.empty"),
    errorTitle: t("dashboard.analytics.error"),
    retryTitle: t("common.retry"),
    onRetry
  });

  if (chartState) {
    return chartState;
  }

  const chartMetrics = metrics.map((metric) => ({
    ...metric,
    label: labelByCategory[metric.category]
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartMetrics} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {metrics.map((metric) => (
              <Cell key={metric.category} fill={colorByCategory[metric.category]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopServicesPanel({
  services,
  isLoading,
  isError,
  onRetry
}: {
  services: Array<{ service: string; count: number; percentage: number }>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const chartState = renderChartState({
    isLoading,
    isError,
    isEmpty: services.length === 0,
    loadingTitle: t("dashboard.analytics.loading"),
    emptyTitle: t("dashboard.analytics.empty"),
    errorTitle: t("dashboard.analytics.error"),
    retryTitle: t("common.retry"),
    onRetry
  });

  if (chartState) {
    return chartState;
  }

  return (
    <div className="space-y-3">
      {services.map((serviceMetric) => (
        <div key={serviceMetric.service} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{serviceMetric.service}</span>
            <span className="shrink-0 text-muted-foreground">
              {serviceMetric.count} / {serviceMetric.percentage}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${serviceMetric.percentage}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      ))}
    </div>
  );
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
  const trendMetrics = buildTrendMetrics(analysisStats);
  const severityDistribution = buildSeverityDistribution(analysisStats);
  const confidenceDistribution = buildConfidenceDistribution(analysisStats);
  const topAffectedServices = buildTopAffectedServiceMetrics(analysisStats);
  const severityLabelsByCategory: Record<Severity, string> = {
    critical: t("severity.critical"),
    high: t("severity.high"),
    medium: t("severity.medium"),
    low: t("severity.low")
  };
  const confidenceLabelsByCategory: Record<Confidence, string> = {
    high: t(confidenceLabelKeys.high),
    medium: t(confidenceLabelKeys.medium),
    low: t(confidenceLabelKeys.low)
  };
  const retryAnalysisStats = () => void analysisStatsQuery.refetch();

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
          icon={RadioTower}
          tone="primary"
        />
        <MetricCard
          title={t("dashboard.metrics.analyses.title")}
          value={String(analysisStats?.total ?? metrics.totalAnalyses)}
          description={t("dashboard.metrics.analyses.description")}
          icon={BarChart3}
          tone="accent"
        />
        <MetricCard
          title={t("dashboard.metrics.affectedServices.title")}
          value={String(metrics.affectedServices)}
          description={t("dashboard.metrics.affectedServices.description")}
          icon={Server}
          tone="emerald"
        />
        <MetricCard
          title={t("dashboard.metrics.evidenceItems.title")}
          value={String(metrics.evidenceItems)}
          description={t("dashboard.metrics.evidenceItems.description")}
          icon={Layers3}
          tone="slate"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.analytics.trend.title")}</CardTitle>
            <CardDescription>{t("dashboard.analytics.trend.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendBucketsChart
              buckets={trendMetrics}
              isLoading={analysisStatsQuery.isLoading}
              isError={analysisStatsQuery.isError}
              onRetry={retryAnalysisStats}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.analytics.services.title")}</CardTitle>
            <CardDescription>{t("dashboard.analytics.services.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <TopServicesPanel
              services={topAffectedServices}
              isLoading={analysisStatsQuery.isLoading}
              isError={analysisStatsQuery.isError}
              onRetry={retryAnalysisStats}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.analytics.severity.title")}</CardTitle>
            <CardDescription>{t("dashboard.analytics.severity.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionChart
              metrics={severityDistribution}
              labelByCategory={severityLabelsByCategory}
              colorByCategory={severityChartColors}
              isLoading={analysisStatsQuery.isLoading}
              isError={analysisStatsQuery.isError}
              onRetry={retryAnalysisStats}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.analytics.confidence.title")}</CardTitle>
            <CardDescription>{t("dashboard.analytics.confidence.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionChart
              metrics={confidenceDistribution}
              labelByCategory={confidenceLabelsByCategory}
              colorByCategory={confidenceChartColors}
              isLoading={analysisStatsQuery.isLoading}
              isError={analysisStatsQuery.isError}
              onRetry={retryAnalysisStats}
            />
          </CardContent>
        </Card>
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
