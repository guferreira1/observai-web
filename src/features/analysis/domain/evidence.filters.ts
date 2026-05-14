import type { Evidence, Signal } from "@/features/analysis/api/analysis.schemas";

export type EvidenceGroupBy = "none" | "signal" | "service";

export type EvidenceFilters = {
  signal: Signal | "";
  service: string;
  provider: string;
  minimumScore: string;
  search: string;
  groupBy: EvidenceGroupBy;
};

export type EvidenceFilterOptions = {
  services: string[];
  providers: string[];
};

export type EvidenceGroup = {
  key: string;
  label: string;
  evidenceEntries: Evidence[];
};

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function evidenceMatchesSearch(evidenceEntry: Evidence, search: string) {
  if (!search) {
    return true;
  }

  const attributesText = Object.entries(evidenceEntry.attributes ?? {})
    .map(([attribute, attributeValue]) => `${attribute} ${attributeValue}`)
    .join(" ");
  const searchableText = [
    evidenceEntry.name,
    evidenceEntry.summary,
    evidenceEntry.service,
    evidenceEntry.source,
    evidenceEntry.provider,
    evidenceEntry.reference,
    evidenceEntry.query,
    attributesText
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(search);
}

function evidenceMatchesMinimumScore(evidenceEntry: Evidence, minimumScore: string) {
  if (!minimumScore) {
    return true;
  }

  return evidenceEntry.score >= Number(minimumScore);
}

function isNonEmptyString(value: string | undefined): value is string {
  return Boolean(value);
}

export function buildEvidenceFilterOptions(evidenceEntries: Evidence[]): EvidenceFilterOptions {
  return {
    services: [...new Set(evidenceEntries.map((evidenceEntry) => evidenceEntry.service).filter(isNonEmptyString))].sort(),
    providers: [...new Set(evidenceEntries.map((evidenceEntry) => evidenceEntry.provider).filter(isNonEmptyString))].sort()
  };
}

export function filterEvidenceEntries(evidenceEntries: Evidence[], filters: EvidenceFilters) {
  const normalizedSearch = normalizeSearchText(filters.search);

  return evidenceEntries
    .filter((evidenceEntry) => !filters.signal || evidenceEntry.signal === filters.signal)
    .filter((evidenceEntry) => !filters.service || evidenceEntry.service === filters.service)
    .filter((evidenceEntry) => !filters.provider || evidenceEntry.provider === filters.provider)
    .filter((evidenceEntry) => evidenceMatchesMinimumScore(evidenceEntry, filters.minimumScore))
    .filter((evidenceEntry) => evidenceMatchesSearch(evidenceEntry, normalizedSearch))
    .toSorted((firstEvidence, secondEvidence) => (
      new Date(firstEvidence.observed).getTime() - new Date(secondEvidence.observed).getTime()
    ));
}

export function groupEvidenceEntries(evidenceEntries: Evidence[], groupBy: EvidenceGroupBy): EvidenceGroup[] {
  if (groupBy === "none") {
    return [
      {
        key: "all",
        label: "All evidence",
        evidenceEntries
      }
    ];
  }

  const groupedEvidence = new Map<string, Evidence[]>();

  evidenceEntries.forEach((evidenceEntry) => {
    const groupKey = groupBy === "signal" ? evidenceEntry.signal : evidenceEntry.service || "Unassigned service";
    groupedEvidence.set(groupKey, [...(groupedEvidence.get(groupKey) ?? []), evidenceEntry]);
  });

  return [...groupedEvidence.entries()].map(([key, groupedEntries]) => ({
    key,
    label: key,
    evidenceEntries: groupedEntries
  }));
}
