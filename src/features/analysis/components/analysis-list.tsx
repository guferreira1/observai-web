"use client";

import Link from "next/link";

import { useAnalysesQuery } from "@/features/analysis/api/analysis.queries";
import { SeverityBadge } from "@/features/analysis/components/severity-badge";
import { toUserFacingError } from "@/shared/api/errors";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";

type AnalysisListProps = {
  limit?: number;
};

export function AnalysisList({ limit = 10 }: AnalysisListProps) {
  const analysesQuery = useAnalysesQuery({ limit });
  const { formatRelativeDate, t, withLocalePath } = useI18n();

  if (analysesQuery.isLoading) {
    return <LoadingState title="Loading analyses" />;
  }

  if (analysesQuery.isError) {
    const userFacingError = toUserFacingError(analysesQuery.error);

    return (
      <ErrorState
        title={userFacingError.title}
        description={userFacingError.description}
        code={userFacingError.code}
        requestId={userFacingError.requestId}
        details={userFacingError.details}
        retryLabel={userFacingError.retryLabel}
        onRetry={userFacingError.canRetry ? () => void analysesQuery.refetch() : undefined}
      />
    );
  }

  const analyses = analysesQuery.data?.data.items ?? [];

  if (analyses.length === 0) {
    return (
      <EmptyState
        title="No analyses found"
        description="Run an analysis to create an investigation record connected to evidence, root causes and recommendations."
        action={
          <Button asChild>
            <Link href={withLocalePath("/analyses/new")}>Start analysis</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent analyses</CardTitle>
        <CardDescription>Live results returned by the ObservAI API.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {analyses.map((analysis) => (
          <Link
            key={analysis.id}
            href={withLocalePath(`/analyses/${analysis.id}`)}
            className="focus-ring grid gap-3 px-5 py-4 hover:bg-secondary/70 md:grid-cols-[1fr_auto]"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={analysis.severity} />
                <span className="text-xs text-muted-foreground">{formatRelativeDate(analysis.createdAt)}</span>
              </div>
              <h3 className="mt-2 line-clamp-2 text-sm font-medium">{analysis.summary}</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                {analysis.affectedServices.length > 0
                  ? analysis.affectedServices.join(", ")
                  : "No affected services reported"}
              </p>
            </div>
            <div className="text-left text-xs text-muted-foreground md:text-right">
              <div>{analysis.evidence.length} {t("common.evidence").toLowerCase()}</div>
              <div>{analysis.recommendedActions.length} actions</div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
