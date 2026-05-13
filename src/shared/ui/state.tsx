import { AlertCircle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

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
    <Card>
      <CardContent className="flex min-h-52 flex-col items-center justify-center gap-4 text-center">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

export function LoadingState({ title = "Loading" }: { title?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{title}</span>
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
  if (!code && !requestId && (!details || details.length === 0)) {
    return null;
  }

  return (
    <div className="w-full max-w-xl rounded-md border bg-secondary/40 p-3 text-left text-xs text-muted-foreground">
      <div className="grid gap-1 sm:grid-cols-2">
        {code ? (
          <div>
            <span className="font-medium text-foreground">Code:</span> {code}
          </div>
        ) : null}
        {requestId ? (
          <div className="break-all">
            <span className="font-medium text-foreground">Request:</span> {requestId}
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
  retryLabel = "Retry",
  action,
  code,
  requestId,
  details
}: ErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex min-h-40 flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
        <ErrorDiagnostics code={code} requestId={requestId} details={details} />
        {onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : (
          action
        )}
      </CardContent>
    </Card>
  );
}
