import { EvidenceViewer } from "@/features/analysis/components/evidence-viewer";

type EvidenceRouteProps = {
  params: Promise<{
    analysisId: string;
  }>;
};

export default async function EvidenceRoute({ params }: EvidenceRouteProps) {
  const { analysisId } = await params;

  return <EvidenceViewer analysisId={analysisId} />;
}
