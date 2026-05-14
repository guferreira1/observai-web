import { z } from "zod";

export const chatRequestSchema = z.object({
  question: z.string().trim().min(1, "Question is required")
});

export const chatCitationSchema = z.object({
  evidenceId: z.string(),
  snippet: z.string().optional()
});

export const chatResponseSchema = z.object({
  analysisId: z.string(),
  answer: z.string(),
  evidence: z.array(z.string()),
  citations: z.array(chatCitationSchema).optional()
});

export const chatMessageSchema = z.object({
  id: z.string(),
  analysisId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  evidence: z.array(z.string()).optional(),
  citations: z.array(chatCitationSchema).optional(),
  createdAt: z.string().datetime()
});

export const chatHistoryResponseSchema = z.object({
  messages: z.array(chatMessageSchema)
});

export const chatHistoryFilterSchema = z.object({
  limit: z.number().int().min(0).optional(),
  before: z.string().datetime().optional()
});

export const chatFeedbackRequestSchema = z.object({
  useful: z.boolean(),
  reason: z.preprocess(
    (reason) => (typeof reason === "string" && reason.trim().length === 0 ? undefined : reason),
    z.string().trim().optional()
  )
});

export const chatFeedbackResponseSchema = z.object({
  analysisId: z.string(),
  messageId: z.string(),
  useful: z.boolean(),
  reason: z.string().optional(),
  createdAt: z.string().datetime()
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type ChatCitation = z.infer<typeof chatCitationSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatHistoryFilter = z.infer<typeof chatHistoryFilterSchema>;
export type ChatFeedbackRequest = z.infer<typeof chatFeedbackRequestSchema>;
export type ChatFeedbackResponse = z.infer<typeof chatFeedbackResponseSchema>;
