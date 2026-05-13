import { z } from "zod";

export const chatRequestSchema = z.object({
  question: z.string().trim().min(1, "Question is required")
});

export const chatResponseSchema = z.object({
  analysisId: z.string(),
  answer: z.string(),
  evidence: z.array(z.string())
});

export const chatMessageSchema = z.object({
  id: z.string(),
  analysisId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  evidence: z.array(z.string()).optional(),
  createdAt: z.string().datetime()
});

export const chatHistoryResponseSchema = z.object({
  messages: z.array(chatMessageSchema)
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
