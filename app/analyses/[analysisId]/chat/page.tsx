import { AnalysisChat } from "@/features/chat/components/analysis-chat";

type AnalysisChatRouteProps = {
  params: Promise<{
    analysisId: string;
  }>;
};

export default async function AnalysisChatRoute({ params }: AnalysisChatRouteProps) {
  const { analysisId } = await params;

  return <AnalysisChat analysisId={analysisId} />;
}
