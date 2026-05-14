"use client";

import { Clipboard, Copy, ShieldAlert, TimerReset } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import type { Analysis } from "@/features/analysis/api/analysis.schemas";
import {
  type ActionPlanItem,
  type ActionPlanStatus,
  type ActionPlanStatusById,
  buildActionPlan,
  buildActionPlanItemClipboardText,
  countCompletedActionPlanItems,
  loadActionPlanStatuses,
  saveActionPlanStatuses
} from "@/features/analysis/domain/action-plan";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Select } from "@/shared/ui/select";

type ActionPlanProps = {
  analysis: Analysis;
};

type CopyState = "idle" | "copied" | "failed";

const statusOptions: ActionPlanStatus[] = ["todo", "in_progress", "done", "blocked"];

const urgencyBadgeVariant: Record<ActionPlanItem["urgency"], "critical" | "high" | "medium" | "low"> = {
  critical: "critical",
  high: "high",
  low: "low",
  medium: "medium"
};

export function ActionPlan({ analysis }: ActionPlanProps) {
  const { t } = useI18n();
  const statusLabels: Record<ActionPlanStatus, string> = useMemo(
    () => ({
      blocked: t("actionPlan.status.blocked"),
      done: t("actionPlan.status.done"),
      in_progress: t("actionPlan.status.inProgress"),
      todo: t("actionPlan.status.todo")
    }),
    [t]
  );
  const actionPlanCopy = useMemo(
    () => ({
      affectedServicesFallback: t("actionPlan.validation.affectedServicesFallback"),
      statusLabels,
      clipboardLabels: {
        rationale: t("common.rationale"),
        status: t("common.status"),
        suggestedValidation: t("actionPlan.suggestedValidation")
      },
      validation: {
        alert: t("actionPlan.validation.alert"),
        cache: t("actionPlan.validation.cache"),
        capacity: (services: string) => t("actionPlan.validation.capacity", { services }),
        database: t("actionPlan.validation.database"),
        fallback: (services: string) => t("actionPlan.validation.fallback", { services }),
        release: (services: string) => t("actionPlan.validation.release", { services })
      }
    }),
    [statusLabels, t]
  );
  const actionPlanItems = useMemo(() => buildActionPlan(analysis, actionPlanCopy), [actionPlanCopy, analysis]);
  const [statusesById, setStatusesById] = useState<ActionPlanStatusById>({});
  const [copyStateById, setCopyStateById] = useState<Record<string, CopyState>>({});
  const [loadedAnalysisId, setLoadedAnalysisId] = useState<string>();

  useEffect(() => {
    setStatusesById(loadActionPlanStatuses(analysis.id, window.localStorage));
    setLoadedAnalysisId(analysis.id);
  }, [analysis.id]);

  useEffect(() => {
    if (loadedAnalysisId !== analysis.id) {
      return;
    }

    saveActionPlanStatuses(analysis.id, statusesById, window.localStorage);
  }, [analysis.id, loadedAnalysisId, statusesById]);

  const completedItemCount = countCompletedActionPlanItems(actionPlanItems, statusesById);
  const progressPercentage =
    actionPlanItems.length > 0 ? Math.round((completedItemCount / actionPlanItems.length) * 100) : 0;

  function updateStatus(itemId: string, status: ActionPlanStatus) {
    setStatusesById((currentStatuses) => ({
      ...currentStatuses,
      [itemId]: status
    }));
  }

  async function copyActionPlanItem(item: ActionPlanItem) {
    const status = statusesById[item.id] ?? "todo";

    try {
      await navigator.clipboard.writeText(buildActionPlanItemClipboardText(item, status, actionPlanCopy));
      setCopyStateById((currentCopyState) => ({ ...currentCopyState, [item.id]: "copied" }));
    } catch {
      setCopyStateById((currentCopyState) => ({ ...currentCopyState, [item.id]: "failed" }));
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-400/15 via-accent/5 to-transparent" aria-hidden="true" />
      <CardHeader>
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{t("actionPlan.title")}</CardTitle>
            <CardDescription>{t("actionPlan.description")}</CardDescription>
          </div>
          <Badge variant="outline">
            {t("actionPlan.itemComplete", { completed: completedItemCount, total: actionPlanItems.length })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {actionPlanItems.length > 0 ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("actionPlan.planProgress")}</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-accent transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {actionPlanItems.map((item) => {
                const status = statusesById[item.id] ?? "todo";
                const isDone = status === "done";
                const copyState = copyStateById[item.id] ?? "idle";

                return (
                  <article
                    key={item.id}
                    className={cn(
                      "group relative overflow-hidden rounded-lg border bg-background/45 p-4 shadow-sm shadow-black/5 transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md hover:shadow-primary/10",
                      isDone
                        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-400/30 dark:bg-emerald-950/20"
                        : ""
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 w-1 bg-primary/40 transition-colors",
                        item.urgency === "critical" && "bg-red-500",
                        item.urgency === "high" && "bg-orange-500",
                        item.urgency === "medium" && "bg-amber-500",
                        item.urgency === "low" && "bg-emerald-500"
                      )}
                      aria-hidden="true"
                    />
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          className="mt-1"
                          checked={isDone}
                          aria-label={t("actionPlan.markDone", { action: item.action })}
                          onChange={(event) => updateStatus(item.id, event.currentTarget.checked ? "done" : "todo")}
                        />
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={urgencyBadgeVariant[item.urgency]}>{item.priorityLabel}</Badge>
                            <Badge variant="outline">{statusLabels[status]}</Badge>
                          </div>
                          <div>
                            <h3 className={cn("text-sm font-semibold leading-6", isDone ? "line-through" : "")}>
                              {item.action}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.rationale}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Select
                          value={status}
                          aria-label={t("actionPlan.statusFor", { action: item.action })}
                          onChange={(event) => updateStatus(item.id, event.currentTarget.value as ActionPlanStatus)}
                        >
                          {statusOptions.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusLabels[statusOption]}
                            </option>
                          ))}
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void copyActionPlanItem(item)}
                        >
                          <Copy className="h-4 w-4" aria-hidden="true" />
                          {copyState === "copied" ? t("common.copied") : t("actionPlan.copyAction")}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-3">
                      <ActionPlanSignal
                        icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
                        label={t("actionPlan.priority")}
                        value={`${item.priorityLabel} ${item.urgency}`}
                      />
                      <ActionPlanSignal
                        icon={<TimerReset className="h-4 w-4" aria-hidden="true" />}
                        label={t("actionPlan.suggestedValidation")}
                        value={item.suggestedValidation}
                        className="md:col-span-2"
                      />
                    </div>

                    {copyState === "failed" ? (
                      <p className="mt-3 text-xs text-destructive">{t("actionPlan.clipboardFailed")}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            <Clipboard className="h-4 w-4" aria-hidden="true" />
            {t("actionPlan.empty")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActionPlanSignal({
  icon,
  label,
  value,
  className
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border bg-secondary/45 p-3 shadow-sm shadow-black/5", className)}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  );
}
