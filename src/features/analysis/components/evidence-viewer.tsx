"use client";

import { Copy, ExternalLink, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Analysis, Evidence, Signal } from "@/features/analysis/api/analysis.schemas";
import { useAnalysisQuery } from "@/features/analysis/api/analysis.queries";
import { AnalysisTabs } from "@/features/analysis/components/analysis-tabs";
import { SignalCorrelationTimeline } from "@/features/analysis/components/signal-correlation-timeline";
import { availableSignals } from "@/features/analysis/domain/analysis.constants";
import {
  buildEvidenceDetail,
  type EvidenceAttributeDetail
} from "@/features/analysis/domain/evidence.detail";
import {
  buildEvidenceFilterOptions,
  filterEvidenceEntries,
  groupEvidenceEntries,
  type EvidenceFilters,
  type EvidenceGroup
} from "@/features/analysis/domain/evidence.filters";
import {
  buildEvidenceAnchorId,
  readFocusedEvidenceId
} from "@/features/analysis/domain/evidence.navigation";
import { toUserFacingError } from "@/shared/api/errors";
import { useI18n } from "@/shared/i18n/i18n-provider";
import type { TranslationKey } from "@/shared/i18n/messages";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header";
import { Select } from "@/shared/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";

type EvidenceViewerProps = {
  analysisId: string;
};

const defaultEvidenceFilters: EvidenceFilters = {
  signal: "",
  service: "",
  provider: "",
  minimumScore: "",
  search: "",
  groupBy: "none"
};

const emptyEvidenceEntries: Evidence[] = [];
type EvidenceCopyTarget = "query" | "reference" | "payload";

const signalLabelKeys: Record<Signal, TranslationKey> = {
  logs: "common.logs",
  metrics: "common.metrics",
  traces: "common.traces",
  apm: "common.apm"
};

function EvidenceFiltersPanel({
  filters,
  evidenceEntries,
  onFiltersChange,
  onClearFilters
}: {
  filters: EvidenceFilters;
  evidenceEntries: Evidence[];
  onFiltersChange: (filters: EvidenceFilters) => void;
  onClearFilters: () => void;
}) {
  const filterOptions = buildEvidenceFilterOptions(evidenceEntries);
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("evidence.filters.title")}</CardTitle>
        <CardDescription>{t("evidence.filters.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="evidence-search">{t("common.search")}</Label>
          <Input
            id="evidence-search"
            value={filters.search}
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
            placeholder={t("evidence.placeholder.search")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="evidence-signal">{t("common.signal")}</Label>
          <Select
            id="evidence-signal"
            value={filters.signal}
            onChange={(event) => onFiltersChange({ ...filters, signal: event.target.value as Signal | "" })}
          >
            <option value="">{t("common.allSignals")}</option>
            {availableSignals.map((signal) => (
              <option key={signal} value={signal}>
                {t(signalLabelKeys[signal])}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="evidence-service">{t("common.service")}</Label>
          <Select
            id="evidence-service"
            value={filters.service}
            onChange={(event) => onFiltersChange({ ...filters, service: event.target.value })}
          >
            <option value="">{t("common.allServices")}</option>
            {filterOptions.services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="evidence-provider">{t("common.provider")}</Label>
          <Select
            id="evidence-provider"
            value={filters.provider}
            onChange={(event) => onFiltersChange({ ...filters, provider: event.target.value })}
          >
            <option value="">{t("common.allProviders")}</option>
            {filterOptions.providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="evidence-score">{t("common.score")}</Label>
          <Input
            id="evidence-score"
            type="number"
            value={filters.minimumScore}
            onChange={(event) => onFiltersChange({ ...filters, minimumScore: event.target.value })}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="evidence-group">{t("common.groupBy")}</Label>
          <Select
            id="evidence-group"
            value={filters.groupBy}
            onChange={(event) => onFiltersChange({ ...filters, groupBy: event.target.value as EvidenceFilters["groupBy"] })}
          >
            <option value="none">{t("common.noGrouping")}</option>
            <option value="signal">{t("common.signal")}</option>
            <option value="service">{t("common.service")}</option>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" className="w-full" onClick={onClearFilters}>
            {t("common.clearFilters")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceEntryCard({
  evidenceEntry,
  isFocused,
  onSelectEvidence
}: {
  evidenceEntry: Evidence;
  isFocused: boolean;
  onSelectEvidence: (evidenceId: string) => void;
}) {
  const { formatDateTime, t } = useI18n();
  const attributes = Object.entries(evidenceEntry.attributes ?? {});

  return (
    <Card
      id={buildEvidenceAnchorId(evidenceEntry.id)}
      tabIndex={-1}
      className={cn(
        "scroll-mt-24 transition-colors",
        isFocused ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20" : ""
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isFocused ? "default" : "outline"}>{evidenceEntry.id}</Badge>
          <Badge variant="secondary">{t(signalLabelKeys[evidenceEntry.signal])}</Badge>
          {evidenceEntry.provider ? <Badge variant="outline">{evidenceEntry.provider}</Badge> : null}
          <span className="text-xs text-muted-foreground">{formatDateTime(evidenceEntry.observed)}</span>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{evidenceEntry.name}</CardTitle>
            <CardDescription>{evidenceEntry.service || t("evidence.noService")}</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <a
              href={`#${encodeURIComponent(buildEvidenceAnchorId(evidenceEntry.id))}`}
              onClick={() => onSelectEvidence(evidenceEntry.id)}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t("evidence.detail.open")}
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6">{evidenceEntry.summary}</p>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">{t("common.score")}</div>
            <div className="font-medium">
              {evidenceEntry.score}
              {evidenceEntry.unit ? ` ${evidenceEntry.unit}` : ""}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("common.source")}</div>
            <div className="font-medium">{evidenceEntry.source || t("evidence.notReported")}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("common.reference")}</div>
            <div className="break-all font-medium">{evidenceEntry.reference || t("evidence.notReported")}</div>
          </div>
        </div>
        {evidenceEntry.query ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">{t("common.query")}</div>
            <pre className="overflow-x-auto rounded-md bg-secondary p-3 text-xs">{evidenceEntry.query}</pre>
          </div>
        ) : null}
        {attributes.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">{t("evidence.attributes.title")}</div>
            <div className="grid gap-2 text-xs md:grid-cols-2">
              {attributes.map(([attribute, attributeValue]) => (
                <div key={attribute} className="rounded-md border p-2">
                  <div className="font-medium">{attribute}</div>
                  <div className="mt-1 break-all text-muted-foreground">{attributeValue}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EvidenceGroupSection({
  evidenceGroup,
  focusedEvidenceId,
  onSelectEvidence
}: {
  evidenceGroup: EvidenceGroup;
  focusedEvidenceId: string;
  onSelectEvidence: (evidenceId: string) => void;
}) {
  const { t } = useI18n();

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{evidenceGroup.label}</h2>
        <Badge variant="outline">{t("evidence.group.itemCount", { count: evidenceGroup.evidenceEntries.length })}</Badge>
      </div>
      <div className="grid gap-4">
        {evidenceGroup.evidenceEntries.map((evidenceEntry) => (
          <EvidenceEntryCard
            key={evidenceEntry.id}
            evidenceEntry={evidenceEntry}
            isFocused={focusedEvidenceId === evidenceEntry.id}
            onSelectEvidence={onSelectEvidence}
          />
        ))}
      </div>
    </section>
  );
}

function EvidenceAttributeGrid({
  attributes
}: {
  attributes: EvidenceAttributeDetail[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {attributes.map((attribute) => (
        <div
          key={attribute.name}
          className={cn(
            "min-w-0 rounded-md border p-3 text-xs",
            attribute.isLong ? "sm:col-span-2" : ""
          )}
        >
          <div className="font-medium">{attribute.name}</div>
          <div className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">
            {attribute.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function EvidenceDetailPanel({
  analysis,
  evidenceEntry,
  copyStatus,
  onClose,
  onCopy
}: {
  analysis: Analysis;
  evidenceEntry: Evidence;
  copyStatus: EvidenceCopyTarget | "failed" | "";
  onClose: () => void;
  onCopy: (textToCopy: string, copyTarget: EvidenceCopyTarget) => Promise<void>;
}) {
  const { formatDateTime, t } = useI18n();
  const evidenceDetail = buildEvidenceDetail(analysis, evidenceEntry);
  const hasRawAttributes = evidenceDetail.rawAttributes.length > 0;
  const hasRelatedRootCauses = evidenceDetail.relatedRootCauses.length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t("evidence.detail.close")}
        className="absolute inset-0 cursor-default bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-detail-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col border-l bg-background shadow-xl md:w-[760px]"
      >
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{evidenceEntry.id}</Badge>
              <Badge variant="secondary">{t(signalLabelKeys[evidenceEntry.signal])}</Badge>
              {evidenceEntry.provider ? <Badge variant="outline">{evidenceEntry.provider}</Badge> : null}
            </div>
            <h2 id="evidence-detail-title" className="break-words text-lg font-semibold">
              {evidenceEntry.name}
            </h2>
            <p className="text-sm text-muted-foreground">{formatDateTime(evidenceEntry.observed)}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t("evidence.detail.close")}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">{t("common.summary")}</h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{evidenceEntry.summary}</p>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">{t("common.provider")}</div>
                <div className="mt-1 break-words font-medium">{evidenceEntry.provider || t("evidence.notReported")}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">{t("common.source")}</div>
                <div className="mt-1 break-words font-medium">{evidenceEntry.source || t("evidence.notReported")}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">{t("common.service")}</div>
                <div className="mt-1 break-words font-medium">{evidenceEntry.service || t("evidence.noService")}</div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("evidence.detail.normalizedAttributes")}</h3>
            <EvidenceAttributeGrid attributes={evidenceDetail.normalizedAttributes} />
          </section>

          {evidenceEntry.query || evidenceEntry.reference ? (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">{t("evidence.detail.references")}</h3>
              {evidenceEntry.query ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-medium text-muted-foreground">{t("common.query")}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onCopy(evidenceEntry.query ?? "", "query")}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      {copyStatus === "query" ? t("common.copied") : t("common.copy")}
                    </Button>
                  </div>
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md bg-secondary p-3 text-xs">
                    {evidenceEntry.query}
                  </pre>
                </div>
              ) : null}
              {evidenceEntry.reference ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-medium text-muted-foreground">{t("common.reference")}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onCopy(evidenceEntry.reference ?? "", "reference")}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      {copyStatus === "reference" ? t("common.copied") : t("common.copy")}
                    </Button>
                  </div>
                  <div className="max-h-32 overflow-auto rounded-md bg-secondary p-3 text-xs">
                    <span className="break-all">{evidenceEntry.reference}</span>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("evidence.detail.rootCauses")}</h3>
            {hasRelatedRootCauses ? (
              <div className="space-y-3">
                {evidenceDetail.relatedRootCauses.map((rootCause) => (
                  <div key={rootCause.cause} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="break-words text-sm font-medium">{rootCause.cause}</h4>
                      <Badge variant="secondary">{rootCause.confidence}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rootCause.citations.map((citation) => (
                        <Badge key={citation} variant={citation === evidenceEntry.id ? "default" : "outline"}>
                          {citation}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("evidence.detail.noRootCauses")}</p>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("evidence.detail.rawAttributes")}</h3>
            {hasRawAttributes ? (
              <EvidenceAttributeGrid attributes={evidenceDetail.rawAttributes} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("evidence.detail.noRawAttributes")}</p>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">{t("evidence.detail.rawPayload")}</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCopy(evidenceDetail.rawPayload, "payload")}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                {copyStatus === "payload" ? t("common.copied") : t("common.copy")}
              </Button>
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-secondary p-3 text-xs">
              {evidenceDetail.rawPayload}
            </pre>
          </section>

          {copyStatus === "failed" ? (
            <p className="text-xs text-destructive">{t("analysisDetail.clipboardFailed")}</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export function EvidenceViewer({ analysisId }: EvidenceViewerProps) {
  const analysisQuery = useAnalysisQuery(analysisId);
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [filters, setFilters] = useState<EvidenceFilters>(defaultEvidenceFilters);
  const [hash, setHash] = useState("");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [copyStatus, setCopyStatus] = useState<EvidenceCopyTarget | "failed" | "">("");
  const analysis = analysisQuery.data;
  const evidenceEntries = analysis?.evidence ?? emptyEvidenceEntries;
  const focusedEvidenceId = readFocusedEvidenceId({
    searchParams: new URLSearchParams(searchParams.toString()),
    hash
  });
  const filteredEvidence = useMemo(
    () => filterEvidenceEntries(evidenceEntries, filters),
    [evidenceEntries, filters]
  );
  const evidenceGroups = useMemo(
    () => groupEvidenceEntries(filteredEvidence, filters.groupBy),
    [filteredEvidence, filters.groupBy]
  );
  const selectedEvidence = useMemo(
    () => evidenceEntries.find((evidenceEntry) => evidenceEntry.id === selectedEvidenceId),
    [evidenceEntries, selectedEvidenceId]
  );

  useEffect(() => {
    setHash(window.location.hash);

    function updateHash() {
      setHash(window.location.hash);
    }

    window.addEventListener("hashchange", updateHash);

    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  useEffect(() => {
    if (!focusedEvidenceId || !analysis?.evidence.some((evidenceEntry) => evidenceEntry.id === focusedEvidenceId)) {
      return;
    }

    const evidenceElement = document.getElementById(buildEvidenceAnchorId(focusedEvidenceId));

    evidenceElement?.scrollIntoView({ block: "start", behavior: "smooth" });
    evidenceElement?.focus({ preventScroll: true });
  }, [analysis?.evidence, focusedEvidenceId]);

  useEffect(() => {
    if (focusedEvidenceId && analysis?.evidence.some((evidenceEntry) => evidenceEntry.id === focusedEvidenceId)) {
      setSelectedEvidenceId(focusedEvidenceId);
    }
  }, [analysis?.evidence, focusedEvidenceId]);

  useEffect(() => {
    if (!selectedEvidence) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedEvidenceId("");
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedEvidence]);

  async function copyEvidenceText(textToCopy: string, copyTarget: EvidenceCopyTarget) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus(copyTarget);
    } catch {
      setCopyStatus("failed");
    }
  }

  function selectEvidence(evidenceId: string) {
    setSelectedEvidenceId(evidenceId);
    setCopyStatus("");
  }

  if (analysisQuery.isLoading) {
    return <LoadingState title={t("evidence.loading")} />;
  }

  if (analysisQuery.isError) {
    const userFacingError = toUserFacingError(analysisQuery.error);

    return (
      <ErrorState
        title={userFacingError.title}
        description={userFacingError.description}
        code={userFacingError.code}
        requestId={userFacingError.requestId}
        details={userFacingError.details}
        retryLabel={userFacingError.retryLabel}
        onRetry={userFacingError.canRetry ? () => void analysisQuery.refetch() : undefined}
      />
    );
  }

  if (!analysis) {
    return <EmptyState title={t("evidence.empty.notFound.title")} description={t("evidence.empty.notFound.description")} />;
  }

  return (
    <>
      <PageHeader
        title={t("evidence.page.title")}
        description={t("evidence.page.description")}
      />
      <AnalysisTabs analysisId={analysis.id} />

      {analysis.evidence.length > 0 ? (
        <div className="grid gap-4">
          <EvidenceFiltersPanel
            filters={filters}
            evidenceEntries={analysis.evidence}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters(defaultEvidenceFilters)}
          />
          {filteredEvidence.length > 0 ? (
            <>
              <SignalCorrelationTimeline
                evidenceEntries={filteredEvidence}
                focusedEvidenceId={focusedEvidenceId}
                onSelectEvidence={selectEvidence}
              />
              {evidenceGroups.map((evidenceGroup) => (
                <EvidenceGroupSection
                  key={evidenceGroup.key}
                  evidenceGroup={evidenceGroup}
                  focusedEvidenceId={focusedEvidenceId}
                  onSelectEvidence={selectEvidence}
                />
              ))}
            </>
          ) : (
            <EmptyState
              title={t("evidence.empty.filtered.title")}
              description={t("evidence.empty.filtered.description")}
            />
          )}
        </div>
      ) : (
        <EmptyState
          title={t("evidence.empty.returned.title")}
          description={t("evidence.empty.returned.description")}
        />
      )}
      {selectedEvidence ? (
        <EvidenceDetailPanel
          analysis={analysis}
          evidenceEntry={selectedEvidence}
          copyStatus={copyStatus}
          onClose={() => setSelectedEvidenceId("")}
          onCopy={copyEvidenceText}
        />
      ) : null}
    </>
  );
}
