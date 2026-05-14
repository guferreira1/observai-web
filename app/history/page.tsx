import { Suspense } from "react";

import { HistoryPage } from "@/features/history/components/history-page";
import { messages } from "@/shared/i18n/messages";
import { LoadingState } from "@/shared/ui/state";

export default function HistoryRoute() {
  return (
    <Suspense fallback={<LoadingState title={messages.en["loading.historyFilters"]} />}>
      <HistoryPage />
    </Suspense>
  );
}
