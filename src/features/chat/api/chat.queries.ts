import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  askAnalysisQuestion,
  getChatHistory
} from "@/features/chat/api/chat.client";
import type { ChatRequest } from "@/features/chat/api/chat.schemas";

export const chatQueryKeys = {
  history: (analysisId: string) => ["analyses", "detail", analysisId, "chat"] as const
};

export function useChatHistoryQuery(analysisId: string) {
  return useQuery({
    queryKey: chatQueryKeys.history(analysisId),
    queryFn: () => getChatHistory(analysisId),
    enabled: analysisId.length > 0
  });
}

export function useAskAnalysisQuestionMutation(analysisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ChatRequest) => askAnalysisQuestion(analysisId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.history(analysisId) });
    }
  });
}
