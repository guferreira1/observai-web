import { AnalysisDetail } from "@/features/analysis/components/analysis-detail";

type AnalysisRouteProps = {
  params: Promise<{
    analysisId: string;
  }>;
};

export default async function LocalizedAnalysisRoute({ params }: AnalysisRouteProps) {
  const { analysisId } = await params;

  return <AnalysisDetail analysisId={analysisId} />;
}
