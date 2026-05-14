import { apiFetch, apiRequest } from "@/shared/api/http-client";
import {
  analysisJobAcceptedSchema,
  analysisJobSchema,
  analysisExportFormatSchema,
  analysisListResponseSchema,
  analysisStatsResponseSchema,
  analysisSchema,
  createAnalysisRequestSchema,
  servicesResponseSchema,
  traceInsightsResponseSchema,
  type AnalysisStatsFilter,
  type AnalysisExportFormat,
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

function getExportFilename(response: Response, analysisId: string, format: AnalysisExportFormat) {
  const contentDisposition = response.headers.get("content-disposition");
  const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);

  return filenameMatch?.[1] ?? `observai-analysis-${analysisId}.${format}`;
}

export async function exportAnalysis(analysisId: string, format: AnalysisExportFormat) {
  const exportFormat = analysisExportFormatSchema.parse(format);
  const response = await apiFetch({
    path: `/v1/analyses/${analysisId}/export`,
    searchParams: {
      format: exportFormat
    },
    headers: {
      Accept: exportFormat === "md" ? "text/markdown" : "application/json"
    }
  });

  return {
    blob: await response.blob(),
    filename: getExportFilename(response, analysisId, exportFormat)
  };
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

export async function deleteAnalysis(analysisId: string) {
  await apiFetch({
    path: `/v1/analyses/${analysisId}`,
    method: "DELETE"
  });

  return {};
}
