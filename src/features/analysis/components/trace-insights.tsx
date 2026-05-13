"use client";

import { useMemo } from "react";

import type { TraceDependencyEdge, TraceSpan, TraceSpanStatus } from "@/features/analysis/api/analysis.schemas";
import { useAnalysisTracesQuery } from "@/features/analysis/api/analysis.queries";
import { AnalysisTabs } from "@/features/analysis/components/analysis-tabs";
import {
  buildTraceWaterfallRows,
  findTraceSpansByIds,
  type TraceWaterfallRow
} from "@/features/analysis/domain/trace-waterfall";
import { toUserFacingError } from "@/shared/api/errors";
import { useI18n } from "@/shared/i18n/i18n-provider";
import type { TranslationKey } from "@/shared/i18n/messages";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";

type TraceInsightsProps = {
  analysisId: string;
};

const spanStatusBadgeVariants: Record<TraceSpanStatus, "low" | "high" | "secondary"> = {
  ok: "low",
  error: "high",
  unset: "secondary"
};

const spanStatusLabelKeys: Record<TraceSpanStatus, TranslationKey> = {
  ok: "traceInsights.span.status.ok",
  error: "traceInsights.span.status.error",
  unset: "traceInsights.span.status.unset"
};

function formatDuration(durationMs: number) {
  if (durationMs >= 1000) {
    return `${(durationMs / 1000).toFixed(2)}s`;
  }

  return `${Math.round(durationMs)}ms`;
}

function SpanStatusBadge({ status }: { status: TraceSpanStatus }) {
  const { t } = useI18n();

  return <Badge variant={spanStatusBadgeVariants[status]}>{t(spanStatusLabelKeys[status])}</Badge>;
}

function TraceWaterfall({ rows }: { rows: TraceWaterfallRow[] }) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("traceInsights.waterfall.title")}</CardTitle>
        <CardDescription>{t("traceInsights.waterfall.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid min-w-[760px] grid-cols-[260px_1fr_92px] gap-3 text-xs font-medium text-muted-foreground">
          <div>{t("traceInsights.span")}</div>
          <div>{t("traceInsights.timeline")}</div>
          <div className="text-right">{t("traceInsights.duration")}</div>
        </div>
        <div className="space-y-2 overflow-x-auto">
          {rows.map((row) => (
            <div
              key={row.span.spanId}
              className="grid min-w-[760px] grid-cols-[260px_1fr_92px] items-center gap-3 rounded-md border p-3"
            >
              <div className="min-w-0" style={{ paddingLeft: `${Math.min(row.depth, 5) * 14}px` }}>
                <div className="truncate text-sm font-medium">{row.span.operation}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <span>{row.span.service}</span>
                  <SpanStatusBadge status={row.span.status} />
                  {row.isCriticalPath ? <Badge variant="info">{t("traceInsights.criticalPath.badge")}</Badge> : null}
                  {row.isSlowest ? <Badge variant="high">{t("traceInsights.slowest.badge")}</Badge> : null}
                </div>
              </div>
              <div className="relative h-6 rounded-md bg-secondary">
                <div
                  className={row.span.status === "error" ? "absolute h-6 rounded-md bg-red-500" : "absolute h-6 rounded-md bg-primary"}
                  style={{
                    left: `${row.offsetPercent}%`,
                    width: `${Math.min(row.widthPercent, 100 - row.offsetPercent)}%`
                  }}
                />
              </div>
              <div className="text-right text-sm font-medium">{formatDuration(row.span.durationMs)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SpanList({
  title,
  description,
  spans,
  emptyText
}: {
  title: string;
  description: string;
  spans: TraceSpan[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {spans.length > 0 ? (
          spans.map((span) => (
            <div key={span.spanId} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium">{span.operation}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{span.service}</p>
                </div>
                <SpanStatusBadge status={span.status} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>{formatDuration(span.durationMs)}</div>
                <div>Self {formatDuration(span.selfTimeMs)}</div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DependencyEdges({ edges }: { edges: TraceDependencyEdge[] }) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("traceInsights.dependencies.title")}</CardTitle>
        <CardDescription>{t("traceInsights.dependencies.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {edges.length > 0 ? (
          edges.map((edge) => (
            <div key={`${edge.from}-${edge.to}`} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  {edge.from} &gt; {edge.to}
                </span>
                <Badge variant="outline">{edge.callCount}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("traceInsights.dependencies.p95", { duration: formatDuration(edge.p95Ms) })}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t("traceInsights.dependencies.empty")}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function TraceInsights({ analysisId }: TraceInsightsProps) {
  const tracesQuery = useAnalysisTracesQuery(analysisId);
  const { t } = useI18n();
  const traceInsights = tracesQuery.data;
  const waterfallRows = useMemo(
    () =>
      traceInsights
        ? buildTraceWaterfallRows(
            traceInsights.spans,
            traceInsights.criticalPathSpanIds,
            traceInsights.slowestSpanIds
          )
        : [],
    [traceInsights]
  );
  const criticalPathSpans = useMemo(
    () => (traceInsights ? findTraceSpansByIds(traceInsights.spans, traceInsights.criticalPathSpanIds) : []),
    [traceInsights]
  );
  const slowestSpans = useMemo(
    () => (traceInsights ? findTraceSpansByIds(traceInsights.spans, traceInsights.slowestSpanIds) : []),
    [traceInsights]
  );

  if (tracesQuery.isLoading) {
    return <LoadingState title={t("traceInsights.loading")} />;
  }

  if (tracesQuery.isError) {
    const userFacingError = toUserFacingError(tracesQuery.error);

    return (
      <ErrorState
        title={userFacingError.title}
        description={userFacingError.description}
        code={userFacingError.code}
        requestId={userFacingError.requestId}
        details={userFacingError.details}
        retryLabel={userFacingError.retryLabel}
        onRetry={userFacingError.canRetry ? () => void tracesQuery.refetch() : undefined}
      />
    );
  }

  if (!traceInsights || traceInsights.spans.length === 0) {
    return <EmptyState title={t("traceInsights.empty.title")} description={t("traceInsights.empty.description")} />;
  }

  return (
    <>
      <PageHeader
        title={t("traceInsights.page.title")}
        description={t("traceInsights.page.description")}
      />
      <AnalysisTabs analysisId={analysisId} />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <TraceWaterfall rows={waterfallRows} />
        <aside className="space-y-4">
          <SpanList
            title={t("traceInsights.criticalPath.title")}
            description={t("traceInsights.criticalPath.description")}
            spans={criticalPathSpans}
            emptyText={t("traceInsights.criticalPath.empty")}
          />
          <SpanList
            title={t("traceInsights.slowest.title")}
            description={t("traceInsights.slowest.description")}
            spans={slowestSpans}
            emptyText={t("traceInsights.slowest.empty")}
          />
          <DependencyEdges edges={traceInsights.dependencyEdges} />
        </aside>
      </div>
    </>
  );
}
