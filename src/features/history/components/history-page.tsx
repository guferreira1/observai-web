"use client";

import { Activity, Copy, Download, FileText, MessageSquare, Network, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { AnalysisListOrder, AnalysisListSort, Severity, Signal } from "@/features/analysis/api/analysis.schemas";
import {
  useAnalysesQuery,
  useDeleteAnalysisMutation,
  useExportAnalysisMutation,
  useServicesQuery
} from "@/features/analysis/api/analysis.queries";
import { SeverityBadge } from "@/features/analysis/components/severity-badge";
import { availableSignals, severityOrder } from "@/features/analysis/domain/analysis.constants";
import { useCapabilitiesQuery } from "@/features/capabilities/api/capabilities.queries";
import { toUserFacingError } from "@/shared/api/errors";
import { useI18n } from "@/shared/i18n/i18n-provider";
import type { TranslationKey } from "@/shared/i18n/messages";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header";
import { Select } from "@/shared/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";

const historyPageLimit = 25;
const historySortOptions: AnalysisListSort[] = ["createdAt", "severity", "confidence"];
const historyOrderOptions: AnalysisListOrder[] = ["desc", "asc"];
const signalLabelKeys: Record<Signal, TranslationKey> = {
  logs: "common.logs",
  metrics: "common.metrics",
  traces: "common.traces",
  apm: "common.apm"
};

function parseSeverity(value: string | null): Severity | "" {
  if (severityOrder.includes(value as Severity)) {
    return value as Severity;
  }

  return "";
}

function parseOffset(value: string | null) {
  const offset = Number(value ?? 0);

  return Number.isFinite(offset) && offset > 0 ? offset : 0;
}

function parseSignal(value: string | null): Signal | "" {
  if (availableSignals.includes(value as Signal)) {
    return value as Signal;
  }

  return "";
}

function parseSort(value: string | null): AnalysisListSort {
  if (historySortOptions.includes(value as AnalysisListSort)) {
    return value as AnalysisListSort;
  }

  return "createdAt";
}

function parseOrder(value: string | null): AnalysisListOrder {
  if (historyOrderOptions.includes(value as AnalysisListOrder)) {
    return value as AnalysisListOrder;
  }

  return "desc";
}

function toRfc3339DateTime(value: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function HistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { formatDateTime, t, withLocalePath } = useI18n();
  const severity = parseSeverity(searchParams.get("severity"));
  const service = searchParams.get("service") ?? "";
  const signal = parseSignal(searchParams.get("signal"));
  const provider = searchParams.get("provider") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const query = searchParams.get("q") ?? "";
  const sort = parseSort(searchParams.get("sort"));
  const order = parseOrder(searchParams.get("order"));
  const offset = parseOffset(searchParams.get("offset"));
  const capabilitiesQuery = useCapabilitiesQuery();
  const servicesQuery = useServicesQuery({ q: service || undefined, limit: 10 });
  const analysesQuery = useAnalysesQuery({
    limit: historyPageLimit,
    offset,
    severity: severity || undefined,
    service: service || undefined,
    signal: signal || undefined,
    provider: provider || undefined,
    from: toRfc3339DateTime(from),
    to: toRfc3339DateTime(to),
    q: query || undefined,
    sort,
    order
  });
  const exportAnalysisMutation = useExportAnalysisMutation();
  const deleteAnalysisMutation = useDeleteAnalysisMutation();
  const analyses = useMemo(() => analysesQuery.data?.data.items ?? [], [analysesQuery.data?.data.items]);
  const capabilities = capabilitiesQuery.data?.data;
  const providerOptions = capabilities?.observability.map((capability) => capability.provider) ?? [];
  const serviceOptions = servicesQuery.data?.data.items ?? [];
  const pagination = analysesQuery.data?.metadata.pagination;
  const total = pagination?.total ?? analyses.length;
  const hasNextPage = Boolean(analysesQuery.data?.metadata.pagination?.next);

  function replaceHistoryUrl(nextSearchParams: URLSearchParams) {
    const queryString = nextSearchParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function updateSearchParam(name: string, value: string) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("offset");

    if (value) {
      nextSearchParams.set(name, value);
    } else {
      nextSearchParams.delete(name);
    }

    replaceHistoryUrl(nextSearchParams);
  }

  function movePage(nextOffset: number) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (nextOffset > 0) {
      nextSearchParams.set("offset", String(nextOffset));
    } else {
      nextSearchParams.delete("offset");
    }

    replaceHistoryUrl(nextSearchParams);
  }

  async function copyAnalysisLink(analysisId: string) {
    const analysisPath = withLocalePath(`/analyses/${analysisId}`);
    const analysisUrl = new URL(analysisPath, window.location.origin);

    await navigator.clipboard.writeText(analysisUrl.toString()).catch(() => undefined);
  }

  async function downloadAnalysisMarkdown(analysisId: string) {
    const exportedAnalysis = await exportAnalysisMutation.mutateAsync({
      analysisId,
      format: "md"
    });
    const objectUrl = URL.createObjectURL(exportedAnalysis.blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = exportedAnalysis.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  async function deleteStoredAnalysis(analysisId: string) {
    const confirmed = window.confirm(t("history.actions.deleteConfirm"));

    if (!confirmed) {
      return;
    }

    await deleteAnalysisMutation.mutateAsync(analysisId).catch(() => undefined);
  }

  return (
    <>
      <PageHeader
        title={t("history.title")}
        description={t("history.description")}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t("common.filters")}</CardTitle>
          <CardDescription>{t("history.filters.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="severity">{t("common.severity")}</Label>
            <Select
              id="severity"
              value={severity}
              onChange={(event) => updateSearchParam("severity", event.target.value)}
            >
              <option value="">{t("common.allSeverities")}</option>
              {severityOrder.map((severityOption) => (
                <option key={severityOption} value={severityOption}>
                  {t(`severity.${severityOption}`)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="service">{t("common.service")}</Label>
            <Input
              id="service"
              list="history-service-options"
              value={service}
              onChange={(event) => updateSearchParam("service", event.target.value)}
              placeholder="checkout-service"
            />
            <datalist id="history-service-options">
              {serviceOptions.map((serviceOption) => (
                <option key={serviceOption} value={serviceOption} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signal">{t("common.signal")}</Label>
            <Select
              id="signal"
              value={signal}
              onChange={(event) => updateSearchParam("signal", event.target.value)}
            >
              <option value="">{t("common.allSignals")}</option>
              {availableSignals.map((signalOption) => (
                <option key={signalOption} value={signalOption}>
                  {t(signalLabelKeys[signalOption])}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider">{t("common.provider")}</Label>
            <Select
              id="provider"
              value={provider}
              onChange={(event) => updateSearchParam("provider", event.target.value)}
            >
              <option value="">{t("common.allProviders")}</option>
              {providerOptions.map((providerOption) => (
                <option key={providerOption} value={providerOption}>
                  {providerOption}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from">{t("history.from")}</Label>
            <Input
              id="from"
              type="datetime-local"
              value={from}
              onChange={(event) => updateSearchParam("from", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">{t("history.to")}</Label>
            <Input
              id="to"
              type="datetime-local"
              value={to}
              onChange={(event) => updateSearchParam("to", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="search">{t("common.search")}</Label>
            <Input
              id="search"
              value={query}
              onChange={(event) => updateSearchParam("q", event.target.value)}
              placeholder={t("history.placeholder.search")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sort">{t("history.sort")}</Label>
              <Select id="sort" value={sort} onChange={(event) => updateSearchParam("sort", event.target.value)}>
                {historySortOptions.map((sortOption) => (
                  <option key={sortOption} value={sortOption}>
                    {t(`history.sort.${sortOption}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">{t("history.order")}</Label>
              <Select id="order" value={order} onChange={(event) => updateSearchParam("order", event.target.value)}>
                {historyOrderOptions.map((orderOption) => (
                  <option key={orderOption} value={orderOption}>
                    {t(`history.order.${orderOption}`)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {analysesQuery.isLoading ? <LoadingState title={t("history.loading")} /> : null}
      {analysesQuery.isError ? (
        <HistoryError error={analysesQuery.error} onRetry={() => void analysesQuery.refetch()} />
      ) : null}
      {!analysesQuery.isLoading && !analysesQuery.isError && analyses.length === 0 ? (
        <EmptyState title={t("history.empty.title")} description={t("history.empty.description")} />
      ) : null}

      {analyses.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.metrics.analyses.title")}</CardTitle>
            <CardDescription>
              {t("history.recordsShown", { count: analyses.length, total })}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid gap-3 p-4 md:hidden">
              {analyses.map((analysis) => (
                <article key={analysis.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <SeverityBadge severity={analysis.severity} />
                    <span className="text-xs text-muted-foreground">{formatDateTime(analysis.createdAt)}</span>
                  </div>
                  <Link
                    href={withLocalePath(`/analyses/${analysis.id}`)}
                    className="focus-ring mt-3 block rounded-sm text-sm font-semibold leading-6 hover:underline"
                  >
                    {analysis.summary}
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {analysis.affectedServices.map((affectedService) => (
                      <Badge key={affectedService} variant="secondary">
                        {affectedService}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {analysis.evidence.length} {t("common.evidenceItems")}
                  </div>
                  <AnalysisHistoryActions
                    analysisId={analysis.id}
                    exportDisabled={exportAnalysisMutation.isPending}
                    onCopyLink={copyAnalysisLink}
                    onDownloadMarkdown={downloadAnalysisMarkdown}
                    onDeleteAnalysis={deleteStoredAnalysis}
                  />
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="border-b bg-secondary text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">{t("common.created")}</th>
                  <th className="px-5 py-3 font-medium">{t("common.severity")}</th>
                  <th className="px-5 py-3 font-medium">{t("common.summary")}</th>
                  <th className="px-5 py-3 font-medium">{t("common.services")}</th>
                  <th className="px-5 py-3 font-medium">{t("common.evidence")}</th>
                  <th className="px-5 py-3 text-right font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-secondary/60">
                    <td className="px-5 py-4 text-muted-foreground">{formatDateTime(analysis.createdAt)}</td>
                    <td className="px-5 py-4">
                      <SeverityBadge severity={analysis.severity} />
                    </td>
                    <td className="px-5 py-4">
                      <Link href={withLocalePath(`/analyses/${analysis.id}`)} className="focus-ring rounded-sm font-medium hover:underline">
                        {analysis.summary}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {analysis.affectedServices.map((affectedService) => (
                          <Badge key={affectedService} variant="secondary">
                            {affectedService}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{analysis.evidence.length}</td>
                    <td className="px-5 py-4">
                      <AnalysisHistoryActions
                        analysisId={analysis.id}
                        exportDisabled={exportAnalysisMutation.isPending}
                        onCopyLink={copyAnalysisLink}
                        onDownloadMarkdown={downloadAnalysisMarkdown}
                        onDeleteAnalysis={deleteStoredAnalysis}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
              <p className="text-xs text-muted-foreground">
                {t("history.pagination", {
                  from: total === 0 ? 0 : offset + 1,
                  to: Math.min(offset + historyPageLimit, total),
                  total
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={offset === 0}
                  onClick={() => movePage(Math.max(0, offset - historyPageLimit))}
                >
                  {t("common.previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasNextPage}
                  onClick={() => movePage(offset + historyPageLimit)}
                >
                  {t("common.next")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function AnalysisHistoryActions({
  analysisId,
  exportDisabled,
  onCopyLink,
  onDownloadMarkdown,
  onDeleteAnalysis
}: {
  analysisId: string;
  exportDisabled: boolean;
  onCopyLink: (analysisId: string) => Promise<void>;
  onDownloadMarkdown: (analysisId: string) => Promise<void>;
  onDeleteAnalysis: (analysisId: string) => Promise<void>;
}) {
  const { t, withLocalePath } = useI18n();

  return (
    <div className="mt-3 flex flex-wrap gap-2 md:mt-0 md:justify-end">
      <Button asChild variant="outline" size="sm">
        <Link href={withLocalePath(`/analyses/${analysisId}`)}>
          <FileText className="h-4 w-4" aria-hidden="true" />
          {t("history.actions.open")}
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={withLocalePath(`/analyses/${analysisId}/evidence`)}>
          <Activity className="h-4 w-4" aria-hidden="true" />
          {t("common.evidence")}
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={withLocalePath(`/analyses/${analysisId}/traces`)}>
          <Network className="h-4 w-4" aria-hidden="true" />
          {t("common.traces")}
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={withLocalePath(`/analyses/${analysisId}/chat`)}>
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          {t("common.chat")}
        </Link>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => void onCopyLink(analysisId)}>
        <Copy className="h-4 w-4" aria-hidden="true" />
        {t("history.actions.copyLink")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={exportDisabled}
        onClick={() => void onDownloadMarkdown(analysisId)}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {t("history.actions.exportMarkdown")}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => void onDeleteAnalysis(analysisId)}>
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {t("history.actions.delete")}
      </Button>
    </div>
  );
}

function HistoryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const userFacingError = toUserFacingError(error);

  return (
    <ErrorState
      title={userFacingError.title}
      description={userFacingError.description}
      code={userFacingError.code}
      requestId={userFacingError.requestId}
      details={userFacingError.details}
      retryLabel={userFacingError.retryLabel}
      onRetry={userFacingError.canRetry ? onRetry : undefined}
    />
  );
}
