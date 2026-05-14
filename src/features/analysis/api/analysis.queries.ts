import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelAnalysisJob,
  createAnalysis,
  deleteAnalysis,
  exportAnalysis,
  getAnalysis,
  getAnalysisStats,
  getAnalysisJob,
  getAnalysisTraces,
  listAnalyses,
  listServices
} from "@/features/analysis/api/analysis.client";
import type {
  AnalysisStatsFilter,
  AnalysisExportFormat,
  AnalysisListFilter,
  CreateAnalysisRequest,
  ServicesFilter
} from "@/features/analysis/api/analysis.schemas";

export const analysisQueryKeys = {
  all: ["analyses"] as const,
  list: (filter: AnalysisListFilter = {}) => [...analysisQueryKeys.all, "list", filter] as const,
  stats: (filter: AnalysisStatsFilter = {}) => [...analysisQueryKeys.all, "stats", filter] as const,
  services: (filter: ServicesFilter = {}) => [...analysisQueryKeys.all, "services", filter] as const,
  detail: (analysisId: string) => [...analysisQueryKeys.all, "detail", analysisId] as const,
  traces: (analysisId: string) => [...analysisQueryKeys.all, "traces", analysisId] as const,
  job: (jobId: string) => [...analysisQueryKeys.all, "job", jobId] as const
};

export function useAnalysesQuery(filter: AnalysisListFilter = {}) {
  return useQuery({
    queryKey: analysisQueryKeys.list(filter),
    queryFn: () => listAnalyses(filter)
  });
}

export function useAnalysisStatsQuery(filter: AnalysisStatsFilter = {}) {
  return useQuery({
    queryKey: analysisQueryKeys.stats(filter),
    queryFn: () => getAnalysisStats(filter)
  });
}

export function useServicesQuery(filter: ServicesFilter = {}) {
  return useQuery({
    queryKey: analysisQueryKeys.services(filter),
    queryFn: () => listServices(filter)
  });
}

export function useAnalysisQuery(analysisId: string) {
  return useQuery({
    queryKey: analysisQueryKeys.detail(analysisId),
    queryFn: () => getAnalysis(analysisId),
    enabled: analysisId.length > 0
  });
}

export function useAnalysisTracesQuery(analysisId: string) {
  return useQuery({
    queryKey: analysisQueryKeys.traces(analysisId),
    queryFn: () => getAnalysisTraces(analysisId),
    enabled: analysisId.length > 0
  });
}

export function useAnalysisJobQuery(jobId: string) {
  return useQuery({
    queryKey: analysisQueryKeys.job(jobId),
    queryFn: () => getAnalysisJob(jobId),
    enabled: jobId.length > 0,
    refetchInterval: (query) => {
      const job = query.state.data;

      return job?.status === "completed" || job?.status === "failed" || job?.status === "canceled"
        ? false
        : 1500;
    }
  });
}

export function useCreateAnalysisMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateAnalysisRequest) => createAnalysis(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: analysisQueryKeys.all });
    }
  });
}

export function useCancelAnalysisJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => cancelAnalysisJob(jobId),
    onSuccess: async (job) => {
      await queryClient.setQueryData(analysisQueryKeys.job(job.jobId), job);
      await queryClient.invalidateQueries({ queryKey: analysisQueryKeys.all });
    }
  });
}

export function useAnalysisExportMutation(analysisId: string) {
  return useMutation({
    mutationFn: (format: AnalysisExportFormat) => exportAnalysis(analysisId, format)
  });
}

export function useExportAnalysisMutation() {
  return useMutation({
    mutationFn: ({ analysisId, format }: { analysisId: string; format: AnalysisExportFormat }) =>
      exportAnalysis(analysisId, format)
  });
}

export function useDeleteAnalysisMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (analysisId: string) => deleteAnalysis(analysisId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: analysisQueryKeys.all });
    }
  });
}
