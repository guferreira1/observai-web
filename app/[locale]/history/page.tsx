import { Suspense } from "react";

import { HistoryPage } from "@/features/history/components/history-page";
import { isSupportedLocale } from "@/shared/i18n/locales";
import { messages } from "@/shared/i18n/messages";
import { LoadingState } from "@/shared/ui/state";

type LocalizedHistoryRouteProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedHistoryRoute({ params }: LocalizedHistoryRouteProps) {
  const { locale } = await params;
  const routeMessages = isSupportedLocale(locale) ? messages[locale] : messages.en;

  return (
    <Suspense fallback={<LoadingState title={routeMessages["loading.historyFilters"]} />}>
      <HistoryPage />
    </Suspense>
  );
}
