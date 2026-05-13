import { TraceInsights } from "@/features/analysis/components/trace-insights";

type TraceInsightsRouteProps = {
  params: Promise<{
    analysisId: string;
  }>;
};

export default async function LocalizedTraceInsightsRoute({ params }: TraceInsightsRouteProps) {
  const { analysisId } = await params;

  return <TraceInsights analysisId={analysisId} />;
}
