import { apiRequest } from "@/shared/api/http-client";
import {
  chatHistoryResponseSchema,
  chatRequestSchema,
  chatResponseSchema,
  type ChatRequest
} from "@/features/chat/api/chat.schemas";

export async function getChatHistory(analysisId: string) {
  const response = await apiRequest({
    path: `/v1/analyses/${analysisId}/chat`,
    schema: chatHistoryResponseSchema
  });

  return response.data;
}

export async function askAnalysisQuestion(analysisId: string, request: ChatRequest) {
  const payload = chatRequestSchema.parse(request);
  const response = await apiRequest({
    path: `/v1/analyses/${analysisId}/chat`,
    method: "POST",
    body: payload,
    schema: chatResponseSchema
  });

  return response.data;
}
