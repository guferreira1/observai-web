import { z } from "zod";

export const signalSchema = z.enum(["logs", "metrics", "traces", "apm"]);
export const severitySchema = z.enum(["info", "low", "medium", "high", "critical"]);
export const confidenceSchema = z.enum(["low", "medium", "high"]);
export const analysisJobStatusSchema = z.enum(["pending", "running", "completed", "failed", "canceled"]);
export const analysisJobPhaseSchema = z.enum([
  "queued",
  "collecting_signals",
  "normalizing",
  "calling_llm",
  "persisting",
  "done"
]);

export const timeWindowSchema = z
  .object({
    start: z.string().datetime(),
    end: z.string().datetime()
  })
  .refine((timeWindow) => new Date(timeWindow.start).getTime() < new Date(timeWindow.end).getTime(), {
    message: "Start time must be before end time",
    path: ["start"]
  });

export const createAnalysisRequestSchema = z.object({
  goal: z.string().min(1, "Goal is required"),
  timeWindow: timeWindowSchema,
  affectedServices: z.array(z.string().min(1)).default([]),
  signals: z.array(signalSchema).default([]),
  context: z.string().default("")
});

export const evidenceSchema = z.object({
  id: z.string(),
  signal: signalSchema,
  service: z.string(),
  source: z.string(),
  name: z.string(),
  summary: z.string(),
  observed: z.string().datetime(),
  score: z.number(),
  unit: z.string().optional(),
  reference: z.string().optional(),
  provider: z.string().optional(),
  query: z.string().optional(),
  attributes: z.record(z.string()).optional()
});

export const rootCauseHypothesisSchema = z.object({
  cause: z.string(),
  evidence: z.array(z.string()),
  confidence: confidenceSchema
});

export const recommendationSchema = z.object({
  action: z.string(),
  rationale: z.string(),
  priority: z.number()
});

export const analysisSchema = z.object({
  id: z.string(),
  summary: z.string(),
  severity: severitySchema,
  confidence: confidenceSchema,
  affectedServices: z.array(z.string()),
  evidence: z.array(evidenceSchema),
  detectedAnomalies: z.array(z.string()),
  possibleRootCauses: z.array(rootCauseHypothesisSchema),
  recommendedActions: z.array(recommendationSchema),
  codeLevelInsights: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  createdAt: z.string().datetime()
});

export const analysisListResponseSchema = z.object({
  items: z.array(analysisSchema)
});

export const analysisListSortSchema = z.enum(["createdAt", "severity", "confidence"]);
export const analysisListOrderSchema = z.enum(["asc", "desc"]);

export const analysisListFilterSchema = z.object({
  limit: z.number().int().min(0).optional(),
  offset: z.number().int().min(0).optional(),
  severity: severitySchema.optional(),
  service: z.string().optional(),
  signal: signalSchema.optional(),
  provider: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  q: z.string().optional(),
  sort: analysisListSortSchema.optional(),
  order: analysisListOrderSchema.optional()
});

export const servicesResponseSchema = z.object({
  items: z.array(z.string())
});

export const servicesFilterSchema = z.object({
  q: z.string().optional(),
  limit: z.number().int().min(0).optional()
});

export const analysisStatsServiceSchema = z.object({
  service: z.string(),
  count: z.number().int()
});

export const analysisStatsTrendBucketSchema = z.object({
  bucketStart: z.string().datetime(),
  count: z.number().int()
});

export const analysisStatsResponseSchema = z.object({
  total: z.number().int(),
  bySeverity: z.record(z.number().int()),
  byConfidence: z.record(z.number().int()),
  topAffectedServices: z.array(analysisStatsServiceSchema),
  trendBuckets: z.array(analysisStatsTrendBucketSchema),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

export const analysisStatsFilterSchema = z.object({
  severity: severitySchema.optional(),
  service: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

export const traceSpanStatusSchema = z.enum(["ok", "error", "unset"]);

export const traceSpanSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  parentSpanId: z.string().optional(),
  service: z.string(),
  operation: z.string(),
  startTime: z.string().datetime(),
  durationMs: z.number(),
  selfTimeMs: z.number(),
  status: traceSpanStatusSchema,
  attributes: z.record(z.string()).optional()
});

export const traceDependencyEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  callCount: z.number().int(),
  p95Ms: z.number()
});

export const traceInsightsResponseSchema = z.object({
  spans: z.array(traceSpanSchema),
  criticalPathSpanIds: z.array(z.string()),
  slowestSpanIds: z.array(z.string()),
  dependencyEdges: z.array(traceDependencyEdgeSchema)
});

export const analysisJobAcceptedSchema = z.object({
  jobId: z.string(),
  status: analysisJobStatusSchema,
  statusUrl: z.string()
});

export const analysisJobSchema = z.object({
  jobId: z.string(),
  status: analysisJobStatusSchema,
  phase: analysisJobPhaseSchema,
  progressPercent: z.number().int().min(0).max(100),
  analysisId: z.string().optional(),
  analysisUrl: z.string().optional(),
  errorMessage: z.string().optional(),
  attempt: z.number().int(),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  phaseStartedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional()
});

export type Signal = z.infer<typeof signalSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type AnalysisJobStatus = z.infer<typeof analysisJobStatusSchema>;
export type AnalysisJobPhase = z.infer<typeof analysisJobPhaseSchema>;
export type AnalysisListSort = z.infer<typeof analysisListSortSchema>;
export type AnalysisListOrder = z.infer<typeof analysisListOrderSchema>;
export type CreateAnalysisRequest = z.infer<typeof createAnalysisRequestSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type AnalysisListFilter = z.infer<typeof analysisListFilterSchema>;
export type ServicesFilter = z.infer<typeof servicesFilterSchema>;
export type ServicesResponse = z.infer<typeof servicesResponseSchema>;
export type AnalysisStatsFilter = z.infer<typeof analysisStatsFilterSchema>;
export type AnalysisStatsResponse = z.infer<typeof analysisStatsResponseSchema>;
export type TraceSpanStatus = z.infer<typeof traceSpanStatusSchema>;
export type TraceSpan = z.infer<typeof traceSpanSchema>;
export type TraceDependencyEdge = z.infer<typeof traceDependencyEdgeSchema>;
export type TraceInsightsResponse = z.infer<typeof traceInsightsResponseSchema>;
export type AnalysisJobAccepted = z.infer<typeof analysisJobAcceptedSchema>;
export type AnalysisJob = z.infer<typeof analysisJobSchema>;
