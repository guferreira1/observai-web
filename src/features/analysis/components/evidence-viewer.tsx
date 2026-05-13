"use client";

import { useMemo, useState } from "react";

import type { Evidence, Signal } from "@/features/analysis/api/analysis.schemas";
import { useAnalysisQuery } from "@/features/analysis/api/analysis.queries";
import { AnalysisTabs } from "@/features/analysis/components/analysis-tabs";
import { availableSignals } from "@/features/analysis/domain/analysis.constants";
import {
  buildEvidenceFilterOptions,
  filterEvidenceEntries,
  groupEvidenceEntries,
  type EvidenceFilters,
  type EvidenceGroup
} from "@/features/analysis/domain/evidence.filters";
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

function EvidenceTimeline({ evidenceEntries }: { evidenceEntries: Evidence[] }) {
  const { formatDateTime, t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("evidence.timeline.title")}</CardTitle>
        <CardDescription>{t("evidence.timeline.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {evidenceEntries.map((evidenceEntry) => (
          <div key={`${evidenceEntry.name}-${evidenceEntry.observed}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-[180px_1fr_auto]">
            <span className="text-xs text-muted-foreground">{formatDateTime(evidenceEntry.observed)}</span>
            <span className="text-sm font-medium">{evidenceEntry.name}</span>
            <Badge variant="outline">{evidenceEntry.score}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EvidenceEntryCard({ evidenceEntry }: { evidenceEntry: Evidence }) {
  const { formatDateTime, t } = useI18n();
  const attributes = Object.entries(evidenceEntry.attributes ?? {});

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t(signalLabelKeys[evidenceEntry.signal])}</Badge>
          {evidenceEntry.provider ? <Badge variant="outline">{evidenceEntry.provider}</Badge> : null}
          <span className="text-xs text-muted-foreground">{formatDateTime(evidenceEntry.observed)}</span>
        </div>
        <CardTitle>{evidenceEntry.name}</CardTitle>
        <CardDescription>{evidenceEntry.service || t("evidence.noService")}</CardDescription>
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

function EvidenceGroupSection({ evidenceGroup }: { evidenceGroup: EvidenceGroup }) {
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
            key={`${evidenceEntry.signal}-${evidenceEntry.service}-${evidenceEntry.name}-${evidenceEntry.observed}`}
            evidenceEntry={evidenceEntry}
          />
        ))}
      </div>
    </section>
  );
}

export function EvidenceViewer({ analysisId }: EvidenceViewerProps) {
  const analysisQuery = useAnalysisQuery(analysisId);
  const { t } = useI18n();
  const [filters, setFilters] = useState<EvidenceFilters>(defaultEvidenceFilters);
  const analysis = analysisQuery.data;
  const evidenceEntries = analysis?.evidence ?? emptyEvidenceEntries;
  const filteredEvidence = useMemo(
    () => filterEvidenceEntries(evidenceEntries, filters),
    [evidenceEntries, filters]
  );
  const evidenceGroups = useMemo(
    () => groupEvidenceEntries(filteredEvidence, filters.groupBy),
    [filteredEvidence, filters.groupBy]
  );

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
              <EvidenceTimeline evidenceEntries={filteredEvidence} />
              {evidenceGroups.map((evidenceGroup) => (
                <EvidenceGroupSection key={evidenceGroup.key} evidenceGroup={evidenceGroup} />
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
    </>
  );
}
