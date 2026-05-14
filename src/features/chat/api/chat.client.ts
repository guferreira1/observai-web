import { apiEnvelopeSchema } from "@/shared/api/http.schemas";
import { ApiResponseValidationError } from "@/shared/api/errors";
import { apiFetch, apiRequest } from "@/shared/api/http-client";
import {
  chatFeedbackRequestSchema,
  chatFeedbackResponseSchema,
  chatHistoryFilterSchema,
  chatHistoryResponseSchema,
  chatRequestSchema,
  chatResponseSchema,
  type ChatFeedbackRequest,
  type ChatHistoryFilter,
  type ChatRequest,
  type ChatResponse
} from "@/features/chat/api/chat.schemas";

type ChatStreamHandlers = {
  onToken?: (token: string) => void;
  onEvidence?: (evidenceId: string) => void;
};

type ServerSentEvent = {
  event: string;
  data: string;
};

export async function getChatHistory(analysisId: string, filter: ChatHistoryFilter = {}) {
  const searchParams = chatHistoryFilterSchema.parse(filter);
  const response = await apiRequest({
    path: `/v1/analyses/${analysisId}/chat`,
    searchParams,
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

function parseStreamData(rawData: string) {
  return JSON.parse(rawData) as Record<string, unknown>;
}

function readTokenPayload(payload: Record<string, unknown>) {
  const token = payload.token ?? payload.text ?? payload.content;

  return typeof token === "string" ? token : "";
}

function readEvidencePayload(payload: Record<string, unknown>) {
  const evidenceId = payload.evidenceId ?? payload.id;

  if (typeof evidenceId === "string") {
    return [evidenceId];
  }

  if (Array.isArray(payload.evidence)) {
    return payload.evidence.filter((evidenceEntry): evidenceEntry is string => typeof evidenceEntry === "string");
  }

  if (Array.isArray(payload.evidenceIds)) {
    return payload.evidenceIds.filter((evidenceEntry): evidenceEntry is string => typeof evidenceEntry === "string");
  }

  return [];
}

function parseServerSentEvents(buffer: string) {
  const chunks = buffer.split("\n\n");
  const remainder = chunks.pop() ?? "";
  const events = chunks
    .map((chunk) => {
      const eventLine = chunk
        .split("\n")
        .find((line) => line.startsWith("event:"));
      const dataLines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trimStart());

      return {
        event: eventLine?.slice("event:".length).trim() ?? "message",
        data: dataLines.join("\n")
      };
    })
    .filter((event): event is ServerSentEvent => event.data.length > 0);

  return { events, remainder };
}

async function readJsonChatResponse(response: Response) {
  const payload = await response.json().catch(() => {
    throw new ApiResponseValidationError();
  });
  const parsedResponse = apiEnvelopeSchema(chatResponseSchema).safeParse(payload);

  if (!parsedResponse.success) {
    throw new ApiResponseValidationError();
  }

  return parsedResponse.data.data;
}

export async function askAnalysisQuestionStream(
  analysisId: string,
  request: ChatRequest,
  handlers: ChatStreamHandlers = {}
): Promise<ChatResponse> {
  const payload = chatRequestSchema.parse(request);
  const response = await apiFetch({
    path: `/v1/analyses/${analysisId}/chat`,
    method: "POST",
    body: payload,
    headers: {
      Accept: "text/event-stream"
    }
  });
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/event-stream") || !response.body) {
    return readJsonChatResponse(response);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const answerParts: string[] = [];
  const citedEvidenceIds = new Set<string>();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parsedEvents = parseServerSentEvents(buffer);
    buffer = parsedEvents.remainder;

    parsedEvents.events.forEach((event) => {
      const eventPayload = parseStreamData(event.data);

      if (event.event === "token") {
        const token = readTokenPayload(eventPayload);

        if (token) {
          answerParts.push(token);
          handlers.onToken?.(token);
        }
      }

      if (event.event === "evidence_cited") {
        readEvidencePayload(eventPayload).forEach((evidenceId) => {
          citedEvidenceIds.add(evidenceId);
          handlers.onEvidence?.(evidenceId);
        });
      }

      if (event.event === "error") {
        const message = typeof eventPayload.message === "string"
          ? eventPayload.message
          : "Streaming chat failed";

        throw new Error(message);
      }
    });
  }

  return {
    analysisId,
    answer: answerParts.join(""),
    evidence: Array.from(citedEvidenceIds)
  };
}

export async function submitChatFeedback(analysisId: string, messageId: string, request: ChatFeedbackRequest) {
  const payload = chatFeedbackRequestSchema.parse(request);
  const response = await apiRequest({
    path: `/v1/analyses/${analysisId}/chat/${messageId}/feedback`,
    method: "POST",
    body: payload,
    schema: chatFeedbackResponseSchema
  });

  return response.data;
}
