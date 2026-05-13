import { apiRequest } from "@/shared/api/http-client";
import {
  analysisJobAcceptedSchema,
  analysisJobSchema,
  analysisListResponseSchema,
  analysisStatsResponseSchema,
  analysisSchema,
  createAnalysisRequestSchema,
  servicesResponseSchema,
  traceInsightsResponseSchema,
  type AnalysisStatsFilter,
  type AnalysisListFilter,
  type CreateAnalysisRequest,
  type ServicesFilter
} from "@/features/analysis/api/analysis.schemas";

export async function listAnalyses(filter: AnalysisListFilter = {}) {
  const response = await apiRequest({
    path: "/v1/analyses",
    searchParams: filter,
    schema: analysisListResponseSchema
  });

  return response;
}

export async function getAnalysisStats(filter: AnalysisStatsFilter = {}) {
  const response = await apiRequest({
    path: "/v1/analyses/stats",
    searchParams: filter,
    schema: analysisStatsResponseSchema
  });

  return response;
}

export async function listServices(filter: ServicesFilter = {}) {
  const response = await apiRequest({
    path: "/v1/services",
    searchParams: filter,
    schema: servicesResponseSchema
  });

  return response;
}

export async function getAnalysis(analysisId: string) {
  const response = await apiRequest({
    path: `/v1/analyses/${analysisId}`,
    schema: analysisSchema
  });

  return response.data;
}

export async function getAnalysisTraces(analysisId: string) {
  const response = await apiRequest({
    path: `/v1/analyses/${analysisId}/traces`,
    schema: traceInsightsResponseSchema
  });

  return response.data;
}

export async function createAnalysis(request: CreateAnalysisRequest) {
  const payload = createAnalysisRequestSchema.parse(request);
  const response = await apiRequest({
    path: "/v1/analyses",
    method: "POST",
    body: payload,
    schema: analysisJobAcceptedSchema
  });

  return response.data;
}

export async function getAnalysisJob(jobId: string) {
  const response = await apiRequest({
    path: `/v1/jobs/${jobId}`,
    schema: analysisJobSchema
  });

  return response.data;
}

export async function cancelAnalysisJob(jobId: string) {
  const response = await apiRequest({
    path: `/v1/jobs/${jobId}`,
    method: "DELETE",
    schema: analysisJobSchema
  });

  return response.data;
}
