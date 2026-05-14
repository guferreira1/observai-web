import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  askAnalysisQuestion,
  askAnalysisQuestionStream,
  submitChatFeedback,
  getChatHistory
} from "@/features/chat/api/chat.client";
import type { ChatFeedbackRequest, ChatHistoryFilter, ChatRequest } from "@/features/chat/api/chat.schemas";

export const chatQueryKeys = {
  history: (analysisId: string, filter: ChatHistoryFilter = {}) => ["analyses", "detail", analysisId, "chat", filter] as const
};

const chatHistoryPageLimit = 50;

export function useChatHistoryQuery(analysisId: string, filter: ChatHistoryFilter = {}) {
  return useQuery({
    queryKey: chatQueryKeys.history(analysisId, filter),
    queryFn: () => getChatHistory(analysisId, filter),
    enabled: analysisId.length > 0
  });
}

export function useChatHistoryInfiniteQuery(analysisId: string) {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.history(analysisId, { limit: chatHistoryPageLimit }),
    queryFn: ({ pageParam }) =>
      getChatHistory(analysisId, {
        limit: chatHistoryPageLimit,
        before: pageParam
      }),
    initialPageParam: undefined as string | undefined,
    enabled: analysisId.length > 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.messages.length < chatHistoryPageLimit) {
        return undefined;
      }

      return lastPage.messages[0]?.createdAt;
    }
  });
}

export function useAskAnalysisQuestionMutation(analysisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ChatRequest) => askAnalysisQuestion(analysisId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["analyses", "detail", analysisId, "chat"] });
    }
  });
}

export function useAskAnalysisQuestionStreamMutation(analysisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      request,
      onToken,
      onEvidence
    }: {
      request: ChatRequest;
      onToken?: (token: string) => void;
      onEvidence?: (evidenceId: string) => void;
    }) => askAnalysisQuestionStream(analysisId, request, { onToken, onEvidence }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["analyses", "detail", analysisId, "chat"] });
    }
  });
}

export function useChatFeedbackMutation(analysisId: string) {
  return useMutation({
    mutationFn: ({ messageId, feedback }: { messageId: string; feedback: ChatFeedbackRequest }) =>
      submitChatFeedback(analysisId, messageId, feedback)
  });
}
