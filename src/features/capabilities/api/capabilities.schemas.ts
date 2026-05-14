import { z } from "zod";

import { signalSchema } from "@/features/analysis/api/analysis.schemas";

export const capabilityLlmSchema = z.object({
  provider: z.string(),
  model: z.string().optional()
});

export const capabilityProviderSchema = z.object({
  provider: z.string(),
  signals: z.array(signalSchema)
});

export const capabilityLimitsSchema = z.object({
  httpRequestTimeoutMs: z.number(),
  httpMaxBodyBytes: z.number(),
  rateLimitRps: z.number().optional(),
  rateLimitBurst: z.number().optional()
});

export const capabilitiesSchema = z.object({
  mode: z.string(),
  version: z.string().optional(),
  llm: capabilityLlmSchema,
  observability: z.array(capabilityProviderSchema),
  limits: capabilityLimitsSchema
});

export type CapabilityProvider = z.infer<typeof capabilityProviderSchema>;
export type Capabilities = z.infer<typeof capabilitiesSchema>;
