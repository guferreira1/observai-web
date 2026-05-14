import { Suspense } from "react";

import { AnalysisWorkspace } from "@/features/analysis/components/analysis-workspace";
import { messages } from "@/shared/i18n/messages";
import { LoadingState } from "@/shared/ui/state";

export default function NewAnalysisRoute() {
  return (
    <Suspense fallback={<LoadingState title={messages.en["loading.analysisWorkspace"]} />}>
      <AnalysisWorkspace />
    </Suspense>
  );
}
