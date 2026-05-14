import type { Evidence, Signal } from "@/features/analysis/api/analysis.schemas";
import { availableSignals } from "@/features/analysis/domain/analysis.constants";

export type SignalCounts = Record<Signal, number>;

export type SignalCorrelationBucket = {
  id: string;
  startTime: string;
  endTime: string;
  evidenceEntries: Evidence[];
  firstEvidence: Evidence;
  countsBySignal: SignalCounts;
  services: string[];
  providers: string[];
  peakScore: number;
};

export type SignalCorrelationTimeline = {
  buckets: SignalCorrelationBucket[];
  firstObservedEvidence?: Evidence;
  services: string[];
  providers: string[];
  countsBySignal: SignalCounts;
  bucketSizeMs: number;
};

type BucketSizePolicy = {
  matches: (timeSpanMs: number) => boolean;
  bucketSizeMs: number;
};

const minuteMs = 60 * 1000;
const hourMs = 60 * minuteMs;
const dayMs = 24 * hourMs;

const bucketSizePolicies: BucketSizePolicy[] = [
  { matches: (timeSpanMs) => timeSpanMs <= 30 * minuteMs, bucketSizeMs: 5 * minuteMs },
  { matches: (timeSpanMs) => timeSpanMs <= 6 * hourMs, bucketSizeMs: 30 * minuteMs },
  { matches: (timeSpanMs) => timeSpanMs <= dayMs, bucketSizeMs: hourMs },
  { matches: (timeSpanMs) => timeSpanMs <= 7 * dayMs, bucketSizeMs: 6 * hourMs }
];

function createEmptySignalCounts(): SignalCounts {
  return availableSignals.reduce(
    (countsBySignal, signal) => ({
      ...countsBySignal,
      [signal]: 0
    }),
    {} as SignalCounts
  );
}

function readObservedTime(evidenceEntry: Evidence) {
  return new Date(evidenceEntry.observed).getTime();
}

function compareEvidenceByObservedTime(firstEvidence: Evidence, secondEvidence: Evidence) {
  return readObservedTime(firstEvidence) - readObservedTime(secondEvidence);
}

function selectBucketSize(timeSpanMs: number) {
  return bucketSizePolicies.find((policy) => policy.matches(timeSpanMs))?.bucketSizeMs ?? dayMs;
}

function formatBucketId(bucketStartTime: number) {
  return new Date(bucketStartTime).toISOString();
}

function uniqueSorted(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

function countSignals(evidenceEntries: Evidence[]) {
  return evidenceEntries.reduce((countsBySignal, evidenceEntry) => {
    countsBySignal[evidenceEntry.signal] += 1;

    return countsBySignal;
  }, createEmptySignalCounts());
}

function buildBucket({
  bucketStartTime,
  bucketSizeMs,
  evidenceEntries
}: {
  bucketStartTime: number;
  bucketSizeMs: number;
  evidenceEntries: Evidence[];
}): SignalCorrelationBucket {
  const sortedEvidenceEntries = evidenceEntries.toSorted(compareEvidenceByObservedTime);

  return {
    id: formatBucketId(bucketStartTime),
    startTime: formatBucketId(bucketStartTime),
    endTime: formatBucketId(bucketStartTime + bucketSizeMs),
    evidenceEntries: sortedEvidenceEntries,
    firstEvidence: sortedEvidenceEntries[0],
    countsBySignal: countSignals(sortedEvidenceEntries),
    services: uniqueSorted(sortedEvidenceEntries.map((evidenceEntry) => evidenceEntry.service)),
    providers: uniqueSorted(sortedEvidenceEntries.map((evidenceEntry) => evidenceEntry.provider)),
    peakScore: Math.max(...sortedEvidenceEntries.map((evidenceEntry) => evidenceEntry.score))
  };
}

export function buildSignalCorrelationTimeline(evidenceEntries: Evidence[]): SignalCorrelationTimeline {
  const observedEvidenceEntries = evidenceEntries
    .filter((evidenceEntry) => !Number.isNaN(readObservedTime(evidenceEntry)))
    .toSorted(compareEvidenceByObservedTime);
  const firstObservedEvidence = observedEvidenceEntries[0];

  if (!firstObservedEvidence) {
    return {
      buckets: [],
      services: [],
      providers: [],
      countsBySignal: createEmptySignalCounts(),
      bucketSizeMs: dayMs
    };
  }

  const firstObservedTime = readObservedTime(firstObservedEvidence);
  const lastObservedTime = readObservedTime(observedEvidenceEntries[observedEvidenceEntries.length - 1]);
  const bucketSizeMs = selectBucketSize(lastObservedTime - firstObservedTime);
  const bucketEntries = new Map<number, Evidence[]>();

  observedEvidenceEntries.forEach((evidenceEntry) => {
    const observedTime = readObservedTime(evidenceEntry);
    const bucketOffset = Math.floor((observedTime - firstObservedTime) / bucketSizeMs) * bucketSizeMs;
    const bucketStartTime = firstObservedTime + bucketOffset;
    const evidenceEntriesInBucket = bucketEntries.get(bucketStartTime) ?? [];

    bucketEntries.set(bucketStartTime, [...evidenceEntriesInBucket, evidenceEntry]);
  });

  const buckets = [...bucketEntries.entries()]
    .toSorted(([firstBucketStartTime], [secondBucketStartTime]) => firstBucketStartTime - secondBucketStartTime)
    .map(([bucketStartTime, entriesInBucket]) => (
      buildBucket({
        bucketStartTime,
        bucketSizeMs,
        evidenceEntries: entriesInBucket
      })
    ));

  return {
    buckets,
    firstObservedEvidence,
    services: uniqueSorted(observedEvidenceEntries.map((evidenceEntry) => evidenceEntry.service)),
    providers: uniqueSorted(observedEvidenceEntries.map((evidenceEntry) => evidenceEntry.provider)),
    countsBySignal: countSignals(observedEvidenceEntries),
    bucketSizeMs
  };
}
