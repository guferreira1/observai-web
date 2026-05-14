import { describe, expect, it } from "vitest";

import {
  chatFeedbackRequestSchema,
  chatHistoryFilterSchema,
  chatMessageSchema,
  chatRequestSchema,
  chatResponseSchema
} from "@/features/chat/api/chat.schemas";

describe("chatRequestSchema", () => {
  it("trims questions before sending them", () => {
    expect(chatRequestSchema.parse({ question: "  What changed first?  " }).question).toBe("What changed first?");
  });

  it("rejects blank questions", () => {
    expect(chatRequestSchema.safeParse({ question: "   " }).success).toBe(false);
  });

  it("accepts chat responses with citations", () => {
    const parsedResponse = chatResponseSchema.parse({
      analysisId: "analysis-123",
      answer: "The database span is the bottleneck.",
      evidence: ["evidence-1"],
      citations: [
        {
          evidenceId: "evidence-1",
          snippet: "p95 latency increased"
        }
      ]
    });

    expect(parsedResponse.citations?.[0]?.evidenceId).toBe("evidence-1");
  });

  it("accepts persisted chat messages with citations", () => {
    const parsedMessage = chatMessageSchema.parse({
      id: "message-1",
      analysisId: "analysis-123",
      role: "assistant",
      content: "Inspect payment-service first.",
      evidence: ["evidence-1"],
      citations: [{ evidenceId: "evidence-1" }],
      createdAt: "2026-05-13T12:00:00Z"
    });

    expect(parsedMessage.role).toBe("assistant");
  });

  it("accepts chat history pagination filters", () => {
    const parsedFilter = chatHistoryFilterSchema.parse({
      limit: 50,
      before: "2026-05-13T12:00:00Z"
    });

    expect(parsedFilter.limit).toBe(50);
  });

  it("accepts chat feedback requests", () => {
    const parsedFeedback = chatFeedbackRequestSchema.parse({
      useful: false,
      reason: "missed the cited trace"
    });

    expect(parsedFeedback.reason).toBe("missed the cited trace");
  });

  it("omits blank optional feedback reasons", () => {
    const parsedFeedback = chatFeedbackRequestSchema.parse({
      useful: false,
      reason: "   "
    });

    expect(parsedFeedback.reason).toBeUndefined();
  });
});
