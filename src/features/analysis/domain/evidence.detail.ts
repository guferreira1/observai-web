import type { Analysis, Evidence } from "@/features/analysis/api/analysis.schemas";

export type EvidenceAttributeDetail = {
  name: string;
  value: string;
  isLong: boolean;
};

export type EvidenceRootCauseRelation = {
  cause: string;
  confidence: Analysis["possibleRootCauses"][number]["confidence"];
  citations: string[];
};

export type EvidenceDetail = {
  normalizedAttributes: EvidenceAttributeDetail[];
  rawAttributes: EvidenceAttributeDetail[];
  relatedRootCauses: EvidenceRootCauseRelation[];
  rawPayload: string;
};

const longAttributeThreshold = 120;

function createAttributeDetail(name: string, value: string): EvidenceAttributeDetail {
  return {
    name,
    value,
    isLong: value.length > longAttributeThreshold || value.includes("\n")
  };
}

function formatScore(evidenceEntry: Evidence) {
  return evidenceEntry.unit ? `${evidenceEntry.score} ${evidenceEntry.unit}` : String(evidenceEntry.score);
}

export function buildEvidenceNormalizedAttributes(evidenceEntry: Evidence) {
  return [
    createAttributeDetail("id", evidenceEntry.id),
    createAttributeDetail("signal", evidenceEntry.signal),
    createAttributeDetail("service", evidenceEntry.service),
    createAttributeDetail("provider", evidenceEntry.provider ?? ""),
    createAttributeDetail("source", evidenceEntry.source),
    createAttributeDetail("observed", evidenceEntry.observed),
    createAttributeDetail("score", formatScore(evidenceEntry)),
    createAttributeDetail("reference", evidenceEntry.reference ?? "")
  ].filter((attributeDetail) => attributeDetail.value.length > 0);
}

export function buildEvidenceRawAttributes(evidenceEntry: Evidence) {
  return Object.entries(evidenceEntry.attributes ?? {})
    .toSorted(([firstName], [secondName]) => firstName.localeCompare(secondName))
    .map(([attributeName, attributeValue]) => createAttributeDetail(attributeName, attributeValue));
}

export function findEvidenceRootCauseRelations(analysis: Analysis, evidenceId: string): EvidenceRootCauseRelation[] {
  return analysis.possibleRootCauses
    .filter((rootCause) => rootCause.evidence.includes(evidenceId))
    .map((rootCause) => ({
      cause: rootCause.cause,
      confidence: rootCause.confidence,
      citations: rootCause.evidence
    }));
}

export function buildEvidenceDetail(analysis: Analysis, evidenceEntry: Evidence): EvidenceDetail {
  return {
    normalizedAttributes: buildEvidenceNormalizedAttributes(evidenceEntry),
    rawAttributes: buildEvidenceRawAttributes(evidenceEntry),
    relatedRootCauses: findEvidenceRootCauseRelations(analysis, evidenceEntry.id),
    rawPayload: JSON.stringify(evidenceEntry, null, 2)
  };
}
