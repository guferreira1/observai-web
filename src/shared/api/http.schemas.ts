import { z } from "zod";

export const providerSummarySchema = z.object({
  observability: z.array(z.string()).optional(),
  llm: z.string().optional(),
  mode: z.string()
});

export const paginationSchema = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
  next: z.string().optional()
});

export const responseMetadataSchema = z.object({
  requestId: z.string(),
  processingTimeMs: z.number(),
  provider: providerSummarySchema,
  warnings: z.array(z.string()).optional(),
  pagination: paginationSchema.optional().nullable()
});

export const errorFieldDetailSchema = z.object({
  field: z.string(),
  rule: z.string(),
  message: z.string().optional()
});

export const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(errorFieldDetailSchema).optional()
});

export function apiEnvelopeSchema<TSchema extends z.ZodTypeAny>(dataSchema: TSchema) {
  return z.object({
    data: dataSchema,
    metadata: responseMetadataSchema
  });
}

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type ErrorFieldDetail = z.infer<typeof errorFieldDetailSchema>;
export type ResponseMetadata = z.infer<typeof responseMetadataSchema>;
