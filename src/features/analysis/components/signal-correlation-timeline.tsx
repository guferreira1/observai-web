"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { Evidence, Signal } from "@/features/analysis/api/analysis.schemas";
import { availableSignals } from "@/features/analysis/domain/analysis.constants";
import { buildEvidenceAnchorId } from "@/features/analysis/domain/evidence.navigation";
import {
  buildSignalCorrelationTimeline,
  type SignalCorrelationBucket
} from "@/features/analysis/domain/signal-correlation";
import { useI18n } from "@/shared/i18n/i18n-provider";
import type { TranslationKey } from "@/shared/i18n/messages";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type SignalCorrelationTimelineProps = {
  evidenceEntries: Evidence[];
  focusedEvidenceId: string;
  onSelectEvidence: (evidenceId: string) => void;
};

const signalLabelKeys: Record<Signal, TranslationKey> = {
  logs: "common.logs",
  metrics: "common.metrics",
  traces: "common.traces",
  apm: "common.apm"
};

const signalChartColors: Record<Signal, string> = {
  logs: "#0891b2",
  metrics: "#059669",
  traces: "#7c3aed",
  apm: "#ea580c"
};

function formatCompactTime(timestamp: string) {
  const observedDate = new Date(timestamp);

  if (Number.isNaN(observedDate.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(observedDate);
}

function formatBucketWindow(bucket: SignalCorrelationBucket) {
  return `${formatCompactTime(bucket.startTime)} - ${formatCompactTime(bucket.endTime)}`;
}

function bucketContainsFocusedEvidence(bucket: SignalCorrelationBucket, focusedEvidenceId: string) {
  return bucket.evidenceEntries.some((evidenceEntry) => evidenceEntry.id === focusedEvidenceId);
}

function buildSignalSummary(bucket: SignalCorrelationBucket, t: ReturnType<typeof useI18n>["t"]) {
  return availableSignals
    .filter((signal) => bucket.countsBySignal[signal] > 0)
    .map((signal) => ({
      signal,
      label: t(signalLabelKeys[signal]),
      count: bucket.countsBySignal[signal]
    }));
}

function CorrelationChart({ buckets }: { buckets: SignalCorrelationBucket[] }) {
  const { t } = useI18n();
  const chartBuckets = buckets.map((bucket) => ({
    label: formatBucketWindow(bucket),
    logs: bucket.countsBySignal.logs,
    metrics: bucket.countsBySignal.metrics,
    traces: bucket.countsBySignal.traces,
    apm: bucket.countsBySignal.apm
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartBuckets} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip />
          <Legend formatter={(signal) => t(signalLabelKeys[signal as Signal])} />
          {availableSignals.map((signal) => (
            <Bar
              key={signal}
              dataKey={signal}
              stackId="signals"
              fill={signalChartColors[signal]}
              radius={signal === "apm" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function FirstObservedSignal({
  evidenceEntry,
  onSelectEvidence
}: {
  evidenceEntry: Evidence;
  onSelectEvidence: (evidenceId: string) => void;
}) {
  const { formatDateTime, t } = useI18n();

  return (
    <a
      href={`#${encodeURIComponent(buildEvidenceAnchorId(evidenceEntry.id))}`}
      onClick={() => onSelectEvidence(evidenceEntry.id)}
      className="focus-ring block rounded-lg border border-primary/30 bg-primary/5 p-3 shadow-sm shadow-primary/10 transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/15"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{t("evidence.correlation.firstSignal")}</Badge>
        <Badge variant="secondary">{t(signalLabelKeys[evidenceEntry.signal])}</Badge>
        {evidenceEntry.provider ? <Badge variant="outline">{evidenceEntry.provider}</Badge> : null}
      </div>
      <div className="mt-2 text-sm font-medium">{evidenceEntry.name}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        {evidenceEntry.service || t("evidence.noService")} - {formatDateTime(evidenceEntry.observed)}
      </div>
    </a>
  );
}

function BucketFocusRow({
  bucket,
  focusedEvidenceId,
  onSelectEvidence
}: {
  bucket: SignalCorrelationBucket;
  focusedEvidenceId: string;
  onSelectEvidence: (evidenceId: string) => void;
}) {
  const { t } = useI18n();
  const signalSummary = buildSignalSummary(bucket, t);
  const isFocused = bucketContainsFocusedEvidence(bucket, focusedEvidenceId);

  return (
    <a
      href={`#${encodeURIComponent(buildEvidenceAnchorId(bucket.firstEvidence.id))}`}
      onClick={() => onSelectEvidence(bucket.firstEvidence.id)}
      className={cn(
        "focus-ring group grid gap-3 rounded-lg border bg-background/45 p-3 shadow-sm shadow-black/5 transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-secondary/50 md:grid-cols-[140px_1fr_auto]",
        isFocused ? "border-primary bg-primary/5 shadow-primary/10" : ""
      )}
    >
      <div>
        <div className="text-xs font-medium text-muted-foreground">{formatBucketWindow(bucket)}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("evidence.correlation.bucketCount", { count: bucket.evidenceEntries.length })}
        </div>
      </div>
      <div className="min-w-0 space-y-2">
        <div className="truncate text-sm font-medium">{bucket.firstEvidence.name}</div>
        <div className="flex flex-wrap gap-2">
          {signalSummary.map((signalMetric) => (
            <Badge key={signalMetric.signal} variant="secondary">
              {signalMetric.label} {signalMetric.count}
            </Badge>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {bucket.services.join(", ") || t("evidence.noService")}
          {bucket.providers.length > 0 ? ` - ${bucket.providers.join(", ")}` : ""}
        </div>
      </div>
      <Badge variant="outline">
        {t("evidence.correlation.peakScore", { score: bucket.peakScore })}
      </Badge>
    </a>
  );
}

export function SignalCorrelationTimeline({
  evidenceEntries,
  focusedEvidenceId,
  onSelectEvidence
}: SignalCorrelationTimelineProps) {
  const { t } = useI18n();
  const timeline = useMemo(() => buildSignalCorrelationTimeline(evidenceEntries), [evidenceEntries]);

  if (!timeline.firstObservedEvidence || timeline.buckets.length === 0) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-cyan-500/15 via-primary/5 to-transparent" aria-hidden="true" />
      <CardHeader>
        <div className="relative">
          <CardTitle>{t("evidence.correlation.title")}</CardTitle>
          <CardDescription>{t("evidence.correlation.description")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <CorrelationChart buckets={timeline.buckets} />
          <div className="space-y-3">
            <FirstObservedSignal evidenceEntry={timeline.firstObservedEvidence} onSelectEvidence={onSelectEvidence} />
            <div className="inner-surface p-3">
              <div className="text-xs font-medium text-muted-foreground">{t("evidence.correlation.scope")}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableSignals.map((signal) => (
                  <Badge key={signal} variant="outline">
                    {t(signalLabelKeys[signal])} {timeline.countsBySignal[signal]}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {timeline.services.join(", ") || t("evidence.noService")}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold">{t("evidence.correlation.buckets")}</div>
          {timeline.buckets.map((bucket) => (
            <BucketFocusRow
              key={bucket.id}
              bucket={bucket}
              focusedEvidenceId={focusedEvidenceId}
              onSelectEvidence={onSelectEvidence}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
