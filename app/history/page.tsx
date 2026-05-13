import { Suspense } from "react";

import { HistoryPage } from "@/features/history/components/history-page";
import { LoadingState } from "@/shared/ui/state";

export default function HistoryRoute() {
  return (
    <Suspense fallback={<LoadingState title="Loading history filters" />}>
      <HistoryPage />
    </Suspense>
  );
}
