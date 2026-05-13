"use client";

import { Clipboard, MessageSquare, Network, Activity } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useAnalysisQuery } from "@/features/analysis/api/analysis.queries";
import { AnalysisTabs } from "@/features/analysis/components/analysis-tabs";
import { SeverityBadge } from "@/features/analysis/components/severity-badge";
import { buildAnalysisExportText } from "@/features/analysis/domain/analysis.result-export";
import { toUserFacingError } from "@/shared/api/errors";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";

type AnalysisDetailProps = {
  analysisId: string;
};

export function AnalysisDetail({ analysisId }: AnalysisDetailProps) {
  const analysisQuery = useAnalysisQuery(analysisId);
  const { formatDateTime, t, withLocalePath } = useI18n();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  if (analysisQuery.isLoading) {
    return <LoadingState title="Loading analysis" />;
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

  const analysis = analysisQuery.data;

  if (!analysis) {
    return (
      <EmptyState
        title={t("analysisDetail.notFound.title")}
        description={t("analysisDetail.notFound.description")}
      />
    );
  }

  const sortedRecommendedActions = analysis.recommendedActions.toSorted(
    (firstAction, secondAction) => firstAction.priority - secondAction.priority
  );

  async function copyAnalysisResult() {
    if (!analysis) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildAnalysisExportText(analysis));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <>
      <PageHeader
        title={t("analysisDetail.page.title")}
        description={t("analysisDetail.createdDescription", {
          createdAt: formatDateTime(analysis.createdAt),
          analysisId: analysis.id
        })}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void copyAnalysisResult()}>
              <Clipboard className="h-4 w-4" aria-hidden="true" />
              {copyStatus === "copied" ? t("common.copied") : t("analysisDetail.copyResult")}
            </Button>
            <Button asChild>
              <Link href={withLocalePath(`/analyses/${analysis.id}/chat`)}>
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                {t("analysisDetail.openChat")}
              </Link>
            </Button>
          </div>
        }
      />
      <AnalysisTabs analysisId={analysis.id} />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={analysis.severity} />
                <Badge variant="outline">{t("common.confidence")}: {analysis.confidence}</Badge>
                <Badge variant="secondary">{analysis.evidence.length} {t("common.evidenceItems")}</Badge>
              </div>
              <CardTitle className="pt-3">{t("common.summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6">{analysis.summary}</p>
              <div className="grid gap-2 md:grid-cols-3">
                <Button asChild variant="outline">
                  <Link href={withLocalePath(`/analyses/${analysis.id}/evidence`)}>
                    <Activity className="h-4 w-4" aria-hidden="true" />
                    {t("common.evidence")}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={withLocalePath(`/analyses/${analysis.id}/traces`)}>
                    <Network className="h-4 w-4" aria-hidden="true" />
                    Trace insights
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={withLocalePath(`/analyses/${analysis.id}/chat`)}>
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    {t("common.chat")}
                  </Link>
                </Button>
              </div>
              {copyStatus === "failed" ? (
                <p className="text-xs text-destructive">{t("analysisDetail.clipboardFailed")}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("analysisDetail.rootCauses.title")}</CardTitle>
              <CardDescription>{t("analysisDetail.rootCauses.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.possibleRootCauses.length > 0 ? (
                analysis.possibleRootCauses.map((rootCause) => (
                  <div key={rootCause.cause} className="rounded-md border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{rootCause.cause}</h3>
                      <Badge variant="secondary">{rootCause.confidence} {t("common.confidence").toLowerCase()}</Badge>
                    </div>
                    {rootCause.evidence.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {rootCause.evidence.map((evidence) => (
                          <li key={evidence} className="rounded-md bg-secondary/50 px-3 py-2">
                            {evidence}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("analysisDetail.rootCauses.empty")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("analysisDetail.recommendedActions.title")}</CardTitle>
              <CardDescription>{t("analysisDetail.recommendedActions.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.recommendedActions.length > 0 ? (
                sortedRecommendedActions.map((recommendation) => (
                  <div key={`${recommendation.priority}-${recommendation.action}`} className="rounded-md border p-4">
                    <div className="flex items-start gap-3">
                      <Badge variant={recommendation.priority === 1 ? "high" : "outline"}>
                        P{recommendation.priority}
                      </Badge>
                      <div>
                        <h3 className="text-sm font-semibold">{recommendation.action}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{recommendation.rationale}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("analysisDetail.recommendedActions.empty")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("analysisDetail.affectedServices.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {analysis.affectedServices.length > 0 ? (
                analysis.affectedServices.map((service) => (
                  <Badge key={service} variant="secondary">
                    {service}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("analysisDetail.affectedServices.empty")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("analysisDetail.anomalies.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.detectedAnomalies.length > 0 ? (
                <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
                  {analysis.detectedAnomalies.map((anomaly) => (
                    <li key={anomaly}>{anomaly}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t("analysisDetail.anomalies.empty")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("analysisDetail.missingEvidence.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.missingEvidence.length > 0 ? (
                <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
                  {analysis.missingEvidence.map((missingEvidence) => (
                    <li key={missingEvidence}>{missingEvidence}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t("analysisDetail.missingEvidence.empty")}</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
