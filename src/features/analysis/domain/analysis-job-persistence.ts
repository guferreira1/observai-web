export const analysisJobQueryParam = "jobId";
export const analysisJobStorageKey = "observai.activeAnalysisJobId";

export type AnalysisJobPersistenceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function normalizeJobId(jobId: string | null | undefined) {
  const normalizedJobId = jobId?.trim() ?? "";

  return normalizedJobId.length > 0 ? normalizedJobId : "";
}

export function resolvePersistedAnalysisJobId(searchParams: URLSearchParams, storage: AnalysisJobPersistenceStorage) {
  const urlJobId = normalizeJobId(searchParams.get(analysisJobQueryParam));

  if (urlJobId) {
    return urlJobId;
  }

  return normalizeJobId(storage.getItem(analysisJobStorageKey));
}

export function persistAnalysisJobId(jobId: string, storage: AnalysisJobPersistenceStorage) {
  const normalizedJobId = normalizeJobId(jobId);

  if (!normalizedJobId) {
    storage.removeItem(analysisJobStorageKey);
    return "";
  }

  storage.setItem(analysisJobStorageKey, normalizedJobId);

  return normalizedJobId;
}

export function clearPersistedAnalysisJobId(storage: AnalysisJobPersistenceStorage) {
  storage.removeItem(analysisJobStorageKey);
}

export function createAnalysisJobUrl(pathname: string, currentSearchParams: URLSearchParams, jobId: string) {
  const nextSearchParams = new URLSearchParams(currentSearchParams.toString());
  const normalizedJobId = normalizeJobId(jobId);

  if (normalizedJobId) {
    nextSearchParams.set(analysisJobQueryParam, normalizedJobId);
  } else {
    nextSearchParams.delete(analysisJobQueryParam);
  }

  const queryString = nextSearchParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}
