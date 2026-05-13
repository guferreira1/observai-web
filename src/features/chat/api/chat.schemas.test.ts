import { describe, expect, it } from "vitest";

import { chatRequestSchema } from "@/features/chat/api/chat.schemas";

describe("chatRequestSchema", () => {
  it("trims questions before sending them", () => {
    expect(chatRequestSchema.parse({ question: "  What changed first?  " }).question).toBe("What changed first?");
  });

  it("rejects blank questions", () => {
    expect(chatRequestSchema.safeParse({ question: "   " }).success).toBe(false);
  });
});
