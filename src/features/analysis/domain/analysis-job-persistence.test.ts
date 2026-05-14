import { describe, expect, it } from "vitest";

import {
  analysisJobStorageKey,
  clearPersistedAnalysisJobId,
  createAnalysisJobUrl,
  persistAnalysisJobId,
  resolvePersistedAnalysisJobId,
  type AnalysisJobPersistenceStorage
} from "@/features/analysis/domain/analysis-job-persistence";

function createMemoryStorage(initialValues: Record<string, string> = {}): AnalysisJobPersistenceStorage {
  const values = new Map(Object.entries(initialValues));

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

describe("analysis job persistence", () => {
  it("prefers the URL job id over local storage", () => {
    const searchParams = new URLSearchParams("jobId=url-job");
    const storage = createMemoryStorage({ [analysisJobStorageKey]: "stored-job" });

    expect(resolvePersistedAnalysisJobId(searchParams, storage)).toBe("url-job");
  });

  it("falls back to local storage when the URL has no job id", () => {
    const storage = createMemoryStorage({ [analysisJobStorageKey]: "stored-job" });

    expect(resolvePersistedAnalysisJobId(new URLSearchParams(), storage)).toBe("stored-job");
  });

  it("persists normalized job ids and clears blank ids", () => {
    const storage = createMemoryStorage();

    expect(persistAnalysisJobId(" job-123 ", storage)).toBe("job-123");
    expect(resolvePersistedAnalysisJobId(new URLSearchParams(), storage)).toBe("job-123");

    expect(persistAnalysisJobId(" ", storage)).toBe("");
    expect(resolvePersistedAnalysisJobId(new URLSearchParams(), storage)).toBe("");
  });

  it("removes persisted job ids", () => {
    const storage = createMemoryStorage({ [analysisJobStorageKey]: "stored-job" });

    clearPersistedAnalysisJobId(storage);

    expect(resolvePersistedAnalysisJobId(new URLSearchParams(), storage)).toBe("");
  });

  it("sets and removes the job id query parameter without dropping other parameters", () => {
    const searchParams = new URLSearchParams("tab=form&jobId=old-job");

    expect(createAnalysisJobUrl("/analyses/new", searchParams, "new-job")).toBe("/analyses/new?tab=form&jobId=new-job");
    expect(createAnalysisJobUrl("/analyses/new", searchParams, "")).toBe("/analyses/new?tab=form");
  });
});
