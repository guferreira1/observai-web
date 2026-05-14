"use client";

import { useMemo, useState } from "react";

import type { TraceDependencyEdge, TraceSpan, TraceSpanStatus } from "@/features/analysis/api/analysis.schemas";
import { useAnalysisQuery, useAnalysisTracesQuery } from "@/features/analysis/api/analysis.queries";
import { AnalysisTabs } from "@/features/analysis/components/analysis-tabs";
import {
  categorizeTraceInsights,
  type TraceInsightCategory
} from "@/features/analysis/domain/trace-insight.rules";
import {
  buildTraceWaterfallRows,
  findTraceSpansByIds,
  type TraceWaterfallRow
} from "@/features/analysis/domain/trace-waterfall";
import { ApiError, toUserFacingError } from "@/shared/api/errors";
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

function TraceWaterfall({
  rows,
  selectedSpanId,
  onSelectSpan
}: {
  rows: TraceWaterfallRow[];
  selectedSpanId?: string;
  onSelectSpan: (span: TraceSpan) => void;
}) {
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
          {rows.map((row) => {
            const isSelected = row.span.spanId === selectedSpanId;

            return (
              <button
                key={row.span.spanId}
                type="button"
                className={`grid min-w-[760px] grid-cols-[260px_1fr_92px] items-center gap-3 rounded-md border p-3 text-left transition hover:bg-secondary/60 ${
                  isSelected ? "border-primary bg-secondary" : ""
                }`}
                onClick={() => onSelectSpan(row.span)}
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
                    className={
                      row.span.status === "error" ? "absolute h-6 rounded-md bg-red-500" : "absolute h-6 rounded-md bg-primary"
                    }
                    style={{
                      left: `${row.offsetPercent}%`,
                      width: `${Math.min(row.widthPercent, 100 - row.offsetPercent)}%`
                    }}
                  />
                </div>
                <div className="text-right text-sm font-medium">{formatDuration(row.span.durationMs)}</div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SpanList({
  title,
  description,
  spans,
  emptyText,
  selectedSpanId,
  onSelectSpan
}: {
  title: string;
  description: string;
  spans: TraceSpan[];
  emptyText: string;
  selectedSpanId?: string;
  onSelectSpan: (span: TraceSpan) => void;
}) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {spans.length > 0 ? (
          spans.map((span) => {
            const isSelected = span.spanId === selectedSpanId;

            return (
              <button
                key={span.spanId}
                type="button"
                className={`w-full rounded-md border p-3 text-left transition hover:bg-secondary/60 ${
                  isSelected ? "border-primary bg-secondary" : ""
                }`}
                onClick={() => onSelectSpan(span)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">{span.operation}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{span.service}</p>
                  </div>
                  <SpanStatusBadge status={span.status} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>{formatDuration(span.durationMs)}</div>
                  <div>{t("traceInsights.selfTime")} {formatDuration(span.selfTimeMs)}</div>
                </div>
              </button>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}

function TraceInsightCategories({
  categories,
  spansById,
  onSelectSpan
}: {
  categories: TraceInsightCategory[];
  spansById: Map<string, TraceSpan>;
  onSelectSpan: (span: TraceSpan) => void;
}) {
  const { t } = useI18n();
  const hasInsights = categories.some((category) => category.insights.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("traceInsights.categories.title")}</CardTitle>
        <CardDescription>{t("traceInsights.categories.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasInsights ? (
          categories.map((category) => (
            <section key={category.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">{t(`traceInsights.category.${category.id}`)}</h3>
                <Badge variant="outline">{category.insights.length}</Badge>
              </div>
              {category.insights.length > 0 ? (
                <ul className="space-y-2">
                  {category.insights.map((insight) => {
                    const firstSpan = insight.spanIds.length > 0 ? spansById.get(insight.spanIds[0] ?? "") : undefined;

                    return (
                      <li key={insight.id} className="rounded-md border p-3 text-sm">
                        <p>{insight.message}</p>
                        {firstSpan ? (
                          <button
                            type="button"
                            className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
                            onClick={() => onSelectSpan(firstSpan)}
                          >
                            {t("traceInsights.span.select", { span: firstSpan.operation })}
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("traceInsights.categories.emptyCategory", { category: category.label })}
                </p>
              )}
            </section>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t("traceInsights.categories.empty")}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SelectedSpanDetails({ span }: { span?: TraceSpan }) {
  const { t } = useI18n();
  const attributes = Object.entries(span?.attributes ?? {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("traceInsights.selectedSpan.title")}</CardTitle>
        <CardDescription>
          {span ? t("traceInsights.selectedSpan.description") : t("traceInsights.selectedSpan.empty")}
        </CardDescription>
      </CardHeader>
      {span ? (
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">{span.operation}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{span.service}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("traceInsights.duration")}</p>
              <p className="font-medium">{formatDuration(span.durationMs)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("traceInsights.selfTime")}</p>
              <p className="font-medium">{formatDuration(span.selfTimeMs)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SpanStatusBadge status={span.status} />
            <Badge variant="outline">{span.spanId}</Badge>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">{t("common.attributes")}</h4>
            {attributes.length > 0 ? (
              <dl className="mt-2 space-y-2 text-xs">
                {attributes.slice(0, 8).map(([attributeName, attributeValue]) => (
                  <div key={attributeName} className="grid grid-cols-[120px_1fr] gap-2 rounded-md bg-secondary/50 p-2">
                    <dt className="truncate font-medium">{attributeName}</dt>
                    <dd className="break-words text-muted-foreground">{attributeValue}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t("traceInsights.selectedSpan.noAttributes")}</p>
            )}
          </div>
        </CardContent>
      ) : null}
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
  const analysisQuery = useAnalysisQuery(analysisId);
  const { t } = useI18n();
  const [selectedSpanId, setSelectedSpanId] = useState<string>();
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
  const spansById = useMemo(
    () => new Map((traceInsights?.spans ?? []).map((span) => [span.spanId, span])),
    [traceInsights]
  );
  const effectiveSelectedSpanId = selectedSpanId ?? slowestSpans[0]?.spanId ?? waterfallRows[0]?.span.spanId;
  const selectedSpan = effectiveSelectedSpanId ? spansById.get(effectiveSelectedSpanId) : undefined;
  const traceInsightCategories = useMemo(
    () =>
      traceInsights
        ? categorizeTraceInsights({
            spans: traceInsights.spans,
            codeLevelInsights: analysisQuery.data?.codeLevelInsights ?? []
          })
        : [],
    [analysisQuery.data?.codeLevelInsights, traceInsights]
  );
  const handleSelectSpan = (span: TraceSpan) => setSelectedSpanId(span.spanId);

  if (tracesQuery.isLoading) {
    return <LoadingState title={t("traceInsights.loading")} />;
  }

  if (tracesQuery.isError) {
    if (
      tracesQuery.error instanceof ApiError &&
      (tracesQuery.error.status === 404 || tracesQuery.error.code === "not_found")
    ) {
      return (
        <EmptyState
          title={t("traceInsights.providerMissing.title")}
          description={t("traceInsights.providerMissing.description")}
        />
      );
    }

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
        <TraceWaterfall rows={waterfallRows} selectedSpanId={effectiveSelectedSpanId} onSelectSpan={handleSelectSpan} />
        <aside className="space-y-4">
          <SelectedSpanDetails span={selectedSpan} />
          <TraceInsightCategories
            categories={traceInsightCategories}
            spansById={spansById}
            onSelectSpan={handleSelectSpan}
          />
          <SpanList
            title={t("traceInsights.criticalPath.title")}
            description={t("traceInsights.criticalPath.description")}
            spans={criticalPathSpans}
            emptyText={t("traceInsights.criticalPath.empty")}
            selectedSpanId={effectiveSelectedSpanId}
            onSelectSpan={handleSelectSpan}
          />
          <SpanList
            title={t("traceInsights.slowest.title")}
            description={t("traceInsights.slowest.description")}
            spans={slowestSpans}
            emptyText={t("traceInsights.slowest.empty")}
            selectedSpanId={effectiveSelectedSpanId}
            onSelectSpan={handleSelectSpan}
          />
          <DependencyEdges edges={traceInsights.dependencyEdges} />
        </aside>
      </div>
    </>
  );
}
