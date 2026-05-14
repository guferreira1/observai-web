import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.string()
});

export const readinessStatusSchema = z.enum(["ok", "failed"]);

export const readinessCheckSchema = z.object({
  name: z.string(),
  status: readinessStatusSchema,
  error: z.string().optional(),
  durationMs: z.number()
});

export const readinessResponseSchema = z.object({
  status: readinessStatusSchema,
  checks: z.array(readinessCheckSchema)
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ReadinessStatus = z.infer<typeof readinessStatusSchema>;
export type ReadinessCheck = z.infer<typeof readinessCheckSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
