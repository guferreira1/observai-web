import { Suspense } from "react";

import { AnalysisWorkspace } from "@/features/analysis/components/analysis-workspace";
import { isSupportedLocale } from "@/shared/i18n/locales";
import { messages } from "@/shared/i18n/messages";
import { LoadingState } from "@/shared/ui/state";

type LocalizedNewAnalysisRouteProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedNewAnalysisRoute({ params }: LocalizedNewAnalysisRouteProps) {
  const { locale } = await params;
  const routeMessages = isSupportedLocale(locale) ? messages[locale] : messages.en;

  return (
    <Suspense fallback={<LoadingState title={routeMessages["loading.analysisWorkspace"]} />}>
      <AnalysisWorkspace />
    </Suspense>
  );
}
