const evidenceQueryParameter = "evidence";
const legacyEvidenceQueryParameter = "evidenceId";

export function buildEvidenceAnchorId(evidenceId: string) {
  return `evidence-${evidenceId}`;
}

export function buildEvidenceViewerHref(analysisId: string, evidenceId: string) {
  const queryParameters = new URLSearchParams({ [evidenceQueryParameter]: evidenceId });
  const anchorId = buildEvidenceAnchorId(evidenceId);

  return `/analyses/${analysisId}/evidence?${queryParameters.toString()}#${encodeURIComponent(anchorId)}`;
}

export function readEvidenceIdFromHash(hash: string) {
  const decodedHash = decodeURIComponent(hash.replace(/^#/, ""));

  if (!decodedHash) {
    return "";
  }

  return decodedHash.startsWith("evidence-")
    ? decodedHash.slice("evidence-".length)
    : decodedHash;
}

export function readFocusedEvidenceId({
  searchParams,
  hash
}: {
  searchParams: URLSearchParams;
  hash: string;
}) {
  return (
    searchParams.get(evidenceQueryParameter) ??
    searchParams.get(legacyEvidenceQueryParameter) ??
    readEvidenceIdFromHash(hash)
  );
}
