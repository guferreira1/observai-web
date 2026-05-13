"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  useAnalysisJobQuery,
  useCancelAnalysisJobMutation,
  useCreateAnalysisMutation
} from "@/features/analysis/api/analysis.queries";
import { availableSignals } from "@/features/analysis/domain/analysis.constants";
import type { AnalysisJobPhase, Signal } from "@/features/analysis/api/analysis.schemas";
import { useCapabilitiesQuery } from "@/features/capabilities/api/capabilities.queries";
import {
  createDefaultTimeWindow,
  createTimeWindowFromDuration,
  isStartBeforeEnd,
  type TimeWindowPresetId,
  toIsoString
} from "@/features/analysis/domain/analysis.time-window";
import { getErrorMessage } from "@/shared/api/errors";
import { useI18n } from "@/shared/i18n/i18n-provider";
import type { TranslationKey } from "@/shared/i18n/messages";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header";
import { Textarea } from "@/shared/ui/textarea";

function createAnalysisFormSchema(t: ReturnType<typeof useI18n>["t"]) {
  return z
    .object({
      goal: z.string().min(1, t("validation.analysis.goalRequired")),
      start: z.string().min(1, t("validation.analysis.startRequired")),
      end: z.string().min(1, t("validation.analysis.endRequired")),
      affectedServices: z.string(),
      signals: z.array(z.enum(["logs", "metrics", "traces", "apm"])).min(1, t("validation.analysis.signalsRequired")),
      context: z.string()
    })
    .refine((values) => isStartBeforeEnd(values.start, values.end), {
      message: t("validation.analysis.startBeforeEnd"),
      path: ["start"]
    });
}

type AnalysisFormValues = z.infer<ReturnType<typeof createAnalysisFormSchema>>;

type TimeWindowPresetView = {
  id: TimeWindowPresetId;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  durationMs: number;
};

const timeWindowPresetViews: TimeWindowPresetView[] = [
  {
    id: "last-15-minutes",
    labelKey: "newAnalysis.timeWindow.last15.label",
    descriptionKey: "newAnalysis.timeWindow.last15.description",
    durationMs: 15 * 60 * 1_000
  },
  {
    id: "last-hour",
    labelKey: "newAnalysis.timeWindow.lastHour.label",
    descriptionKey: "newAnalysis.timeWindow.lastHour.description",
    durationMs: 60 * 60 * 1_000
  },
  {
    id: "last-6-hours",
    labelKey: "newAnalysis.timeWindow.last6h.label",
    descriptionKey: "newAnalysis.timeWindow.last6h.description",
    durationMs: 6 * 60 * 60 * 1_000
  },
  {
    id: "last-24-hours",
    labelKey: "newAnalysis.timeWindow.last24h.label",
    descriptionKey: "newAnalysis.timeWindow.last24h.description",
    durationMs: 24 * 60 * 60 * 1_000
  }
];

const contextSuggestionKeys: TranslationKey[] = [
  "newAnalysis.context.suggestion.deployment",
  "newAnalysis.context.suggestion.customerErrors",
  "newAnalysis.context.suggestion.compareSignals",
  "newAnalysis.context.suggestion.dependencies"
];

const signalLabelKeys: Record<Signal, TranslationKey> = {
  logs: "common.logs",
  metrics: "common.metrics",
  traces: "common.traces",
  apm: "common.apm"
};

const jobPhaseLabelKeys: Record<AnalysisJobPhase, TranslationKey> = {
  queued: "newAnalysis.phase.queued",
  collecting_signals: "newAnalysis.phase.collectingSignals",
  normalizing: "newAnalysis.phase.normalizing",
  calling_llm: "newAnalysis.phase.callingLlm",
  persisting: "newAnalysis.phase.persisting",
  done: "newAnalysis.phase.done"
};

function parseAffectedServices(rawServices: string) {
  return rawServices
    .split(/[\n,]/)
    .map((service) => service.trim())
    .filter(Boolean);
}

function createDefaultValues(): AnalysisFormValues {
  const timeWindow = createDefaultTimeWindow();

  return {
    goal: "",
    start: timeWindow.start,
    end: timeWindow.end,
    affectedServices: "",
    signals: ["logs", "metrics", "traces"],
    context: ""
  };
}

export function AnalysisWorkspace() {
  const router = useRouter();
  const { t, withLocalePath } = useI18n();
  const createAnalysisMutation = useCreateAnalysisMutation();
  const cancelAnalysisJobMutation = useCancelAnalysisJobMutation();
  const capabilitiesQuery = useCapabilitiesQuery();
  const [activeJobId, setActiveJobId] = useState("");
  const analysisJobQuery = useAnalysisJobQuery(activeJobId);
  const localizedAnalysisFormSchema = useMemo(() => createAnalysisFormSchema(t), [t]);
  const form = useForm<AnalysisFormValues>({
    resolver: zodResolver(localizedAnalysisFormSchema),
    defaultValues: createDefaultValues()
  });
  const activeJob = analysisJobQuery.data;
  const isJobRunning = activeJob?.status === "pending" || activeJob?.status === "running";
  const supportedSignals = useMemo(() => {
    const discoveredSignals = new Set<Signal>();

    capabilitiesQuery.data?.data.observability.forEach((provider) => {
      provider.signals.forEach((signal) => discoveredSignals.add(signal));
    });

    if (!capabilitiesQuery.isSuccess) {
      return availableSignals;
    }

    return availableSignals.filter((signal) => discoveredSignals.has(signal));
  }, [capabilitiesQuery.data?.data.observability, capabilitiesQuery.isSuccess]);
  const capabilityProviders = capabilitiesQuery.data?.data.observability ?? [];

  useEffect(() => {
    if (activeJob?.status !== "completed" || !activeJob.analysisId) {
      return;
    }

    router.push(withLocalePath(`/analyses/${activeJob.analysisId}`));
  }, [activeJob, router, withLocalePath]);

  useEffect(() => {
    if (!capabilitiesQuery.isSuccess) {
      return;
    }

    const selectedSignals = form.getValues("signals");
    const nextSignals = selectedSignals.filter((signal) => supportedSignals.includes(signal));

    if (nextSignals.length === selectedSignals.length) {
      return;
    }

    form.setValue("signals", nextSignals.length > 0 ? nextSignals : supportedSignals.slice(0, 1), {
      shouldDirty: true,
      shouldValidate: true
    });
  }, [capabilitiesQuery.isSuccess, form, supportedSignals]);

  function applyTimeWindowPreset(durationMs: number) {
    const timeWindow = createTimeWindowFromDuration(durationMs);
    form.setValue("start", timeWindow.start, { shouldDirty: true, shouldValidate: true });
    form.setValue("end", timeWindow.end, { shouldDirty: true, shouldValidate: true });
  }

  function appendContextSuggestion(suggestion: string) {
    const currentContext = form.getValues("context").trim();
    const nextContext = currentContext ? `${currentContext}\n${suggestion}` : suggestion;
    form.setValue("context", nextContext, { shouldDirty: true });
  }

  async function handleSubmit(values: AnalysisFormValues) {
    try {
      const acceptedJob = await createAnalysisMutation.mutateAsync({
        goal: values.goal,
        timeWindow: {
          start: toIsoString(values.start),
          end: toIsoString(values.end)
        },
        affectedServices: parseAffectedServices(values.affectedServices),
        signals: values.signals,
        context: values.context
      });

      setActiveJobId(acceptedJob.jobId);
    } catch {
      // Mutation state renders a safe user-facing error in the execution panel.
    }
  }

  async function handleCancelJob() {
    if (!activeJobId) {
      return;
    }

    await cancelAnalysisJobMutation.mutateAsync(activeJobId).catch(() => undefined);
  }

  return (
    <>
      <PageHeader
        title={t("newAnalysis.page.title")}
        description={t("newAnalysis.page.description")}
      />

      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("newAnalysis.form.title")}</CardTitle>
            <CardDescription>{t("newAnalysis.form.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="goal">{t("common.goal")}</Label>
              <Textarea
                id="goal"
                placeholder={t("newAnalysis.goal.placeholder")}
                {...form.register("goal")}
              />
              {form.formState.errors.goal ? (
                <p className="text-xs text-destructive">{form.formState.errors.goal.message}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">{t("common.start")}</Label>
                <Input id="start" type="datetime-local" {...form.register("start")} />
                {form.formState.errors.start ? (
                  <p className="text-xs text-destructive">{form.formState.errors.start.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">{t("common.end")}</Label>
                <Input id="end" type="datetime-local" {...form.register("end")} />
                {form.formState.errors.end ? (
                  <p className="text-xs text-destructive">{form.formState.errors.end.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("newAnalysis.timeWindow.presets")}</Label>
              <div className="grid gap-2 sm:grid-cols-4">
                {timeWindowPresetViews.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="outline"
                    className="h-auto flex-col items-start px-3 py-2"
                    onClick={() => applyTimeWindowPreset(preset.durationMs)}
                  >
                    <span>{t(preset.labelKey)}</span>
                    <span className="text-xs font-normal text-muted-foreground">{t(preset.descriptionKey)}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="affectedServices">{t("common.affectedServices")}</Label>
              <Textarea
                id="affectedServices"
                placeholder="checkout-service, payment-service"
                {...form.register("affectedServices")}
              />
              <p className="text-xs text-muted-foreground">{t("newAnalysis.affectedServices.help")}</p>
            </div>

            <div className="space-y-3">
              <Label>{t("common.signals")}</Label>
              <Controller
                control={form.control}
                name="signals"
                render={({ field }) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableSignals.map((signal) => {
                      const checked = field.value.includes(signal);
                      const disabled = capabilitiesQuery.isSuccess && !supportedSignals.includes(signal);
                      const supportingProviders = capabilityProviders
                        .filter((provider) => provider.signals.includes(signal))
                        .map((provider) => provider.provider);

                      function toggleSignal() {
                        if (disabled) {
                          return;
                        }

                        const nextSignals: Signal[] = checked
                          ? field.value.filter((selectedSignal) => selectedSignal !== signal)
                          : [...field.value, signal];
                        field.onChange(nextSignals);
                      }

                      return (
                        <label
                          key={signal}
                          className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-3 text-sm"
                        >
                          <span className="flex items-center gap-3">
                            <Checkbox checked={checked} onChange={toggleSignal} disabled={disabled} />
                            <span>{t(signalLabelKeys[signal])}</span>
                          </span>
                          {capabilitiesQuery.isSuccess ? (
                            <Badge variant={disabled ? "secondary" : "outline"}>
                              {disabled ? t("newAnalysis.signal.unavailable") : supportingProviders.join(", ")}
                            </Badge>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              {form.formState.errors.signals ? (
                <p className="text-xs text-destructive">{form.formState.errors.signals.message}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {t("newAnalysis.signalDiscovery")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">{t("common.context")}</Label>
              <Textarea
                id="context"
                placeholder={t("newAnalysis.context.placeholder")}
                {...form.register("context")}
              />
              <div className="flex flex-wrap gap-2">
                {contextSuggestionKeys.map((suggestionKey) => {
                  const suggestion = t(suggestionKey);

                  return (
                    <Button
                      key={suggestionKey}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => appendContextSuggestion(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("common.execution")}</CardTitle>
              <CardDescription>{t("newAnalysis.execution.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {createAnalysisMutation.isError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {getErrorMessage(createAnalysisMutation.error)}
                </p>
              ) : null}
              {analysisJobQuery.isError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {getErrorMessage(analysisJobQuery.error)}
                </p>
              ) : null}
              {activeJob?.status === "failed" ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {activeJob.errorMessage || t("newAnalysis.execution.failed")}
                </p>
              ) : null}
              {activeJob?.status === "canceled" ? (
                <p className="rounded-md border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  {t("newAnalysis.execution.canceled")}
                </p>
              ) : null}
              {cancelAnalysisJobMutation.isError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {getErrorMessage(cancelAnalysisJobMutation.error)}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={createAnalysisMutation.isPending || isJobRunning}>
                {createAnalysisMutation.isPending || isJobRunning
                  ? t("newAnalysis.submit.running")
                  : t("newAnalysis.submit.idle")}
              </Button>
              {isJobRunning ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={cancelAnalysisJobMutation.isPending}
                  onClick={() => void handleCancelJob()}
                >
                  {cancelAnalysisJobMutation.isPending
                    ? t("newAnalysis.cancel.running")
                    : t("newAnalysis.cancel.idle")}
                </Button>
              ) : null}
              {activeJobId ? (
                <div className="space-y-3 rounded-md border bg-secondary/40 p-3 text-xs leading-5 text-muted-foreground">
                  <div>
                    <div className="font-medium text-foreground">
                      {t("newAnalysis.execution.job", { jobId: activeJobId })}
                    </div>
                    <div>{t("common.status")}: {activeJob?.status ?? "accepted"}</div>
                    {activeJob?.phase ? (
                      <div>{t("newAnalysis.execution.phase")}: {t(jobPhaseLabelKeys[activeJob.phase])}</div>
                    ) : null}
                    {activeJob?.phaseStartedAt ? (
                      <div>{t("newAnalysis.execution.phaseStartedAt")}: {activeJob.phaseStartedAt}</div>
                    ) : null}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span>{t("newAnalysis.execution.progress")}</span>
                      <span>{activeJob?.progressPercent ?? 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${activeJob?.progressPercent ?? 0}%` }}
                      />
                    </div>
                  </div>
                  {activeJob?.attempt ? <div>{t("common.attempt")}: {activeJob.attempt}</div> : null}
                  <div>{t("newAnalysis.execution.resultOpens")}</div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </form>
    </>
  );
}
