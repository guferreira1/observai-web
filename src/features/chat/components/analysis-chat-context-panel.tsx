"use client";

import { ArrowRight, ClipboardCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { Analysis, Evidence } from "@/features/analysis/api/analysis.schemas";
import { SeverityBadge } from "@/features/analysis/components/severity-badge";
import { buildEvidenceViewerHref } from "@/features/analysis/domain/evidence.navigation";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type AnalysisChatContextPanelProps = {
  analysis: Analysis;
  nextQuestions: string[];
  onSelectQuestion: (question: string) => void;
};

const MAX_SERVICES = 6;
const MAX_EVIDENCE = 5;
const MAX_ACTIONS = 4;
const MAX_QUESTIONS = 5;

export function AnalysisChatContextPanel({
  analysis,
  nextQuestions,
  onSelectQuestion
}: AnalysisChatContextPanelProps) {
  const { t, withLocalePath } = useI18n();
  const citedEvidence = selectCitedEvidence(analysis);
  const recommendedActions = analysis.recommendedActions.toSorted(
    (firstAction, secondAction) => firstAction.priority - secondAction.priority
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={analysis.severity} />
          <Badge variant="outline">
            {t("common.confidence")}: {t(`confidence.${analysis.confidence}`)}
          </Badge>
        </div>
        <CardTitle className="pt-2">{t("chat.context.title")}</CardTitle>
        <CardDescription>{t("chat.context.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ContextSection title={t("common.summary")}>
          <p className="text-sm leading-6 text-muted-foreground">{analysis.summary}</p>
        </ContextSection>

        <ContextSection title={t("common.affectedServices")}>
          {analysis.affectedServices.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.affectedServices.slice(0, MAX_SERVICES).map((service) => (
                <Badge key={service} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>
          ) : (
            <EmptyContextText>{t("analysisDetail.affectedServices.empty")}</EmptyContextText>
          )}
        </ContextSection>

        <ContextSection title={t("chat.context.citedEvidence")}>
          {citedEvidence.length > 0 ? (
            <ul className="space-y-2">
              {citedEvidence.map((evidence) => (
                <li key={evidence.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <EvidenceReferenceLink
                      evidenceId={evidence.id}
                      href={withLocalePath(buildEvidenceViewerHref(analysis.id, evidence.id))}
                    />
                    <Badge variant="outline">{t(`common.${evidence.signal}`)}</Badge>
                    <span className="text-xs text-muted-foreground">{evidence.service}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{evidence.summary}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyContextText>{t("chat.context.citedEvidenceEmpty")}</EmptyContextText>
          )}
        </ContextSection>

        <ContextSection title={t("analysisDetail.recommendedActions.title")}>
          {recommendedActions.length > 0 ? (
            <ul className="space-y-2">
              {recommendedActions.slice(0, MAX_ACTIONS).map((recommendation) => (
                <li key={`${recommendation.priority}-${recommendation.action}`} className="rounded-md bg-secondary/50 p-3">
                  <div className="flex items-start gap-2">
                    <Badge variant={recommendation.priority === 1 ? "high" : "outline"}>
                      P{recommendation.priority}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-5">{recommendation.action}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {recommendation.rationale}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyContextText>{t("analysisDetail.recommendedActions.empty")}</EmptyContextText>
          )}
        </ContextSection>

        <ContextSection title={t("chat.nextQuestions.title")}>
          {nextQuestions.length > 0 ? (
            <div className="space-y-2">
              {nextQuestions.slice(0, MAX_QUESTIONS).map((question) => (
                <Button
                  key={question}
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start whitespace-normal py-3 text-left text-sm"
                  onClick={() => onSelectQuestion(question)}
                >
                  <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {question}
                </Button>
              ))}
            </div>
          ) : (
            <EmptyContextText>{t("chat.nextQuestions.empty")}</EmptyContextText>
          )}
        </ContextSection>
      </CardContent>
    </Card>
  );
}

function selectCitedEvidence(analysis: Analysis) {
  const evidenceById = new Map(analysis.evidence.map((evidence) => [evidence.id, evidence]));
  const citedEvidenceIds = analysis.possibleRootCauses.flatMap((rootCause) => rootCause.evidence);
  const citedEvidence = citedEvidenceIds
    .map((evidenceId) => evidenceById.get(evidenceId))
    .filter((evidence): evidence is Evidence => Boolean(evidence));
  const uniqueEvidence = Array.from(new Map(citedEvidence.map((evidence) => [evidence.id, evidence])).values());

  if (uniqueEvidence.length > 0) {
    return uniqueEvidence.slice(0, MAX_EVIDENCE);
  }

  return analysis.evidence.toSorted((firstEvidence, secondEvidence) => secondEvidence.score - firstEvidence.score).slice(0, MAX_EVIDENCE);
}

function ContextSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function EmptyContextText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function EvidenceReferenceLink({ evidenceId, href }: { evidenceId: string; href: string }) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium text-primary hover:bg-secondary hover:underline"
    >
      {evidenceId}
      <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}
