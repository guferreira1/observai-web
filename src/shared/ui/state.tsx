"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { useI18n } from "@/shared/i18n/i18n-provider";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

type StateBlockProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

type ErrorDetail = {
  field: string;
  rule: string;
  message?: string;
};

export function EmptyState({ title, description, action }: StateBlockProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" aria-hidden="true" />
      <CardContent className="relative flex min-h-52 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full border border-primary/20 bg-primary/10 p-3 shadow-sm shadow-primary/10">
          <div className="h-2 w-14 rounded-full bg-primary/70" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

export function LoadingState({ title }: { title?: string }) {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-40 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-card/60 text-sm text-muted-foreground shadow-sm shadow-black/5 backdrop-blur-xl">
      <div className="scan-line absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/10 to-transparent" aria-hidden="true" />
      <div className="relative flex items-center gap-3">
        <span className="rounded-full border border-primary/20 bg-primary/10 p-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        </span>
        <span>{title ?? t("common.loading")}</span>
      </div>
    </div>
  );
}

type ErrorStateProps = StateBlockProps & {
  onRetry?: () => void;
  retryLabel?: string;
  code?: string;
  requestId?: string;
  details?: ErrorDetail[];
};

function ErrorDiagnostics({
  code,
  requestId,
  details
}: {
  code?: string;
  requestId?: string;
  details?: ErrorDetail[];
}) {
  const { t } = useI18n();

  if (!code && !requestId && (!details || details.length === 0)) {
    return null;
  }

  return (
    <div className="w-full max-w-xl rounded-md border bg-secondary/50 p-3 text-left text-xs text-muted-foreground shadow-sm shadow-black/5">
      <div className="grid gap-1 sm:grid-cols-2">
        {code ? (
          <div>
            <span className="font-medium text-foreground">{t("common.code")}:</span> {code}
          </div>
        ) : null}
        {requestId ? (
          <div className="break-all">
            <span className="font-medium text-foreground">{t("common.request")}:</span> {requestId}
          </div>
        ) : null}
      </div>
      {details && details.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {details.map((detail) => (
            <li key={`${detail.field}-${detail.rule}-${detail.message ?? ""}`}>
              <span className="font-medium text-foreground">{detail.field}</span>: {detail.rule}
              {detail.message ? ` (${detail.message})` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  action,
  code,
  requestId,
  details
}: ErrorStateProps) {
  const { t } = useI18n();

  return (
    <Card className="relative overflow-hidden border-destructive/25">
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-destructive/15 via-destructive/5 to-transparent" aria-hidden="true" />
      <CardContent className="relative flex min-h-40 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full border border-destructive/20 bg-destructive/10 p-2 shadow-sm shadow-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <ErrorDiagnostics code={code} requestId={requestId} details={details} />
        {onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            {retryLabel ?? t("common.retry")}
          </Button>
        ) : (
          action
        )}
      </CardContent>
    </Card>
  );
}
