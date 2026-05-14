"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, RotateCcw, Send, ThumbsDown, ThumbsUp, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ChatRequest } from "@/features/chat/api/chat.schemas";
import {
  useAskAnalysisQuestionStreamMutation,
  useChatFeedbackMutation,
  useChatHistoryInfiniteQuery
} from "@/features/chat/api/chat.queries";
import { AnalysisChatContextPanel } from "@/features/chat/components/analysis-chat-context-panel";
import { ChatMarkdown } from "@/features/chat/components/chat-markdown";
import { useAnalysisQuery } from "@/features/analysis/api/analysis.queries";
import { AnalysisTabs } from "@/features/analysis/components/analysis-tabs";
import { buildAnalysisFollowUpQuestions } from "@/features/analysis/domain/analysis.follow-up-suggestions";
import { buildEvidenceViewerHref } from "@/features/analysis/domain/evidence.navigation";
import { ApiError, getErrorMessage, toUserFacingError } from "@/shared/api/errors";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header";
import { Textarea } from "@/shared/ui/textarea";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";

type AnalysisChatProps = {
  analysisId: string;
};

function createChatRequestFormSchema(t: ReturnType<typeof useI18n>["t"]) {
  return z.object({
    question: z.string().trim().min(1, t("validation.chat.questionRequired"))
  });
}

export function AnalysisChat({ analysisId }: AnalysisChatProps) {
  const chatHistoryQuery = useChatHistoryInfiniteQuery(analysisId);
  const { formatDateTime, t, withLocalePath } = useI18n();
  const analysisQuery = useAnalysisQuery(analysisId);
  const askQuestionMutation = useAskAnalysisQuestionStreamMutation(analysisId);
  const chatFeedbackMutation = useChatFeedbackMutation(analysisId);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [failedQuestion, setFailedQuestion] = useState("");
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [streamingEvidenceIds, setStreamingEvidenceIds] = useState<string[]>([]);
  const [feedbackByMessageId, setFeedbackByMessageId] = useState<Record<string, boolean>>({});
  const [negativeFeedbackMessageId, setNegativeFeedbackMessageId] = useState<string | null>(null);
  const [feedbackReasonByMessageId, setFeedbackReasonByMessageId] = useState<Record<string, string>>({});
  const chatRequestFormSchema = useMemo(() => createChatRequestFormSchema(t), [t]);
  const form = useForm<ChatRequest>({
    resolver: zodResolver(chatRequestFormSchema),
    defaultValues: {
      question: ""
    }
  });

  async function handleSubmit(values: ChatRequest) {
    const question = values.question.trim();

    if (!question) {
      return;
    }

    setPendingQuestion(question);
    setFailedQuestion("");
    setStreamingAnswer("");
    setStreamingEvidenceIds([]);

    try {
      await askQuestionMutation.mutateAsync({
        request: { question },
        onToken: (token) => setStreamingAnswer((currentAnswer) => `${currentAnswer}${token}`),
        onEvidence: (evidenceId) =>
          setStreamingEvidenceIds((currentEvidenceIds) =>
            currentEvidenceIds.includes(evidenceId)
              ? currentEvidenceIds
              : [...currentEvidenceIds, evidenceId]
          )
      });
      form.reset();
      setPendingQuestion("");
      setStreamingAnswer("");
      setStreamingEvidenceIds([]);
    } catch {
      setFailedQuestion(question);
      setPendingQuestion("");
      setStreamingAnswer("");
      setStreamingEvidenceIds([]);
    }
  }

  function selectSuggestedQuestion(question: string) {
    form.setValue("question", question, { shouldDirty: true, shouldValidate: true });
  }

  function handleUsefulFeedback(messageId: string) {
    setNegativeFeedbackMessageId(null);
    setFeedbackByMessageId((currentFeedback) => ({ ...currentFeedback, [messageId]: true }));
    void chatFeedbackMutation.mutateAsync({
      messageId,
      feedback: { useful: true }
    });
  }

  function openNegativeFeedback(messageId: string) {
    setNegativeFeedbackMessageId(messageId);
    setFeedbackByMessageId((currentFeedback) => ({ ...currentFeedback, [messageId]: false }));
  }

  function handleNegativeFeedbackSubmit(messageId: string) {
    const reason = feedbackReasonByMessageId[messageId]?.trim();

    void chatFeedbackMutation.mutateAsync({
      messageId,
      feedback: reason ? { useful: false, reason } : { useful: false }
    });
    setNegativeFeedbackMessageId(null);
  }

  function updateFeedbackReason(messageId: string, reason: string) {
    setFeedbackReasonByMessageId((currentReasons) => ({ ...currentReasons, [messageId]: reason }));
  }

  const messages = chatHistoryQuery.data?.pages.toReversed().flatMap((page) => page.messages) ?? [];
  const followUpQuestions = analysisQuery.data
    ? buildAnalysisFollowUpQuestions(analysisQuery.data, {
        affectedServiceFallback: t("chat.question.affectedServiceFallback"),
        inspectFirst: (service) => t("chat.question.inspectFirst", { service }),
        validateAction: (action) => t("chat.question.validateAction", { action }),
        prioritizeNext: t("chat.question.prioritizeNext"),
        bestEvidence: t("chat.question.bestEvidence"),
        additionalTelemetry: t("chat.question.additionalTelemetry")
      })
    : [];

  return (
    <>
      <PageHeader
        title={t("chat.page.title")}
        description={t("chat.page.description")}
      />
      <AnalysisTabs analysisId={analysisId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="min-h-[560px]">
          <CardHeader>
            <CardTitle>{t("common.conversation")}</CardTitle>
            <CardDescription>{t("chat.history.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chatHistoryQuery.isLoading ? <LoadingState title={t("chat.loading")} /> : null}
            {chatHistoryQuery.isError ? (
              <ChatHistoryError error={chatHistoryQuery.error} onRetry={() => void chatHistoryQuery.refetch()} />
            ) : null}
            {chatHistoryQuery.hasNextPage ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={chatHistoryQuery.isFetchingNextPage}
                onClick={() => void chatHistoryQuery.fetchNextPage()}
              >
                {chatHistoryQuery.isFetchingNextPage ? t("chat.history.loadingOlder") : t("chat.history.loadOlder")}
              </Button>
            ) : null}
            {!chatHistoryQuery.isLoading && !chatHistoryQuery.isError && messages.length === 0 ? (
              <EmptyState
                title={t("chat.empty.title")}
                description={t("chat.empty.description")}
              />
            ) : null}
            {messages.map((message) => (
              <article
                key={message.id}
                className={cn(
                  "rounded-md border p-4",
                  message.role === "assistant" ? "bg-secondary/50" : "bg-card"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">
                    {message.role === "assistant" ? t("common.assistant") : t("common.user")}
                  </h3>
                  <span className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</span>
                </div>
                {message.role === "assistant" ? (
                  <ChatMarkdown content={message.content} className="mt-3" />
                ) : (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                )}
                {message.evidence && message.evidence.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {message.evidence.map((evidence) => (
                      <li key={evidence}>
                        <EvidenceReferenceLink
                          evidenceId={evidence}
                          href={withLocalePath(buildEvidenceViewerHref(analysisId, evidence))}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {message.citations && message.citations.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {message.citations.map((citation, citationIndex) => (
                      <li
                        key={`${message.id}-${citation.evidenceId}-${citationIndex}`}
                        className="rounded-md border bg-card px-3 py-2"
                      >
                        <EvidenceReferenceLink
                          evidenceId={citation.evidenceId}
                          href={withLocalePath(buildEvidenceViewerHref(analysisId, citation.evidenceId))}
                        />
                        {citation.snippet ? <span className="ml-2">{citation.snippet}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {message.role === "assistant" ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant={feedbackByMessageId[message.id] === true ? "secondary" : "outline"}
                      size="sm"
                      disabled={chatFeedbackMutation.isPending}
                      onClick={() => handleUsefulFeedback(message.id)}
                    >
                      <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                      {t("chat.feedback.useful")}
                    </Button>
                    <Button
                      type="button"
                      variant={feedbackByMessageId[message.id] === false ? "secondary" : "outline"}
                      size="sm"
                      disabled={chatFeedbackMutation.isPending}
                      onClick={() => openNegativeFeedback(message.id)}
                    >
                      <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                      {t("chat.feedback.notUseful")}
                    </Button>
                  </div>
                ) : null}
                {negativeFeedbackMessageId === message.id ? (
                  <div className="mt-3 rounded-md border bg-card p-3">
                    <Label htmlFor={`feedback-reason-${message.id}`}>{t("chat.feedback.reasonLabel")}</Label>
                    <Textarea
                      id={`feedback-reason-${message.id}`}
                      className="mt-2 min-h-20"
                      placeholder={t("chat.feedback.reasonPlaceholder")}
                      value={feedbackReasonByMessageId[message.id] ?? ""}
                      onChange={(event) => updateFeedbackReason(message.id, event.target.value)}
                    />
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={chatFeedbackMutation.isPending}
                        onClick={() => setNegativeFeedbackMessageId(null)}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        {t("chat.feedback.cancel")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={chatFeedbackMutation.isPending}
                        onClick={() => handleNegativeFeedbackSubmit(message.id)}
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        {t("chat.feedback.send")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
            {pendingQuestion ? (
              <article className="rounded-md border border-dashed bg-card p-4 opacity-80">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{t("common.user")}</h3>
                  <span className="text-xs text-muted-foreground">{t("common.sending")}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{pendingQuestion}</p>
              </article>
            ) : null}
            {streamingAnswer ? (
              <article className="rounded-md border bg-secondary/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{t("common.assistant")}</h3>
                  <span className="text-xs text-muted-foreground">{t("chat.streaming")}</span>
                </div>
                <ChatMarkdown content={streamingAnswer} className="mt-3" />
                {streamingEvidenceIds.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {streamingEvidenceIds.map((evidenceId) => (
                      <li key={evidenceId}>
                        <EvidenceReferenceLink
                          evidenceId={evidenceId}
                          href={withLocalePath(buildEvidenceViewerHref(analysisId, evidenceId))}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ) : null}
          </CardContent>
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>{t("chat.ask.title")}</CardTitle>
                <CardDescription>{t("chat.ask.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={t("chat.ask.placeholder")}
                  {...form.register("question")}
                />
                {form.formState.errors.question ? (
                  <p className="text-xs text-destructive">{form.formState.errors.question.message}</p>
                ) : null}
                {isQuestionOutOfScopeError(askQuestionMutation.error) ? (
                  <QuestionOutOfScopeNotice
                    description={getErrorMessage(askQuestionMutation.error)}
                    suggestedQuestions={followUpQuestions}
                    onSelectQuestion={selectSuggestedQuestion}
                  />
                ) : askQuestionMutation.isError ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {getErrorMessage(askQuestionMutation.error)}
                  </p>
                ) : null}
                {failedQuestion ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={askQuestionMutation.isPending}
                    onClick={() => void handleSubmit({ question: failedQuestion })}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    {t("chat.retryLastQuestion")}
                  </Button>
                ) : null}
                <Button type="submit" className="w-full" disabled={askQuestionMutation.isPending}>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {askQuestionMutation.isPending ? t("common.asking") : t("chat.ask.submit")}
                </Button>
              </CardContent>
            </Card>
          </form>

          {analysisQuery.isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <LoadingState title={t("chat.context.loading")} />
              </CardContent>
            </Card>
          ) : null}
          {analysisQuery.isError ? (
            <AnalysisContextError error={analysisQuery.error} onRetry={() => void analysisQuery.refetch()} />
          ) : null}
          {analysisQuery.data ? (
            <AnalysisChatContextPanel
              analysis={analysisQuery.data}
              nextQuestions={followUpQuestions}
              onSelectQuestion={selectSuggestedQuestion}
            />
          ) : null}
        </aside>
      </div>
    </>
  );
}

function isQuestionOutOfScopeError(error: unknown) {
  return error instanceof ApiError && error.code === "question_out_of_scope";
}

function QuestionOutOfScopeNotice({
  description,
  suggestedQuestions,
  onSelectQuestion
}: {
  description: string;
  suggestedQuestions: string[];
  onSelectQuestion: (question: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="space-y-2">
          <p className="font-medium text-foreground">{t("chat.outOfScope.title")}</p>
          <p className="text-muted-foreground">{description}</p>
          <p className="text-muted-foreground">{t("chat.outOfScope.description")}</p>
        </div>
      </div>
      {suggestedQuestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedQuestions.slice(0, 2).map((question) => (
            <Button
              key={question}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto whitespace-normal py-2 text-left"
              onClick={() => onSelectQuestion(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EvidenceReferenceLink({ evidenceId, href }: { evidenceId: string; href: string }) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium text-primary hover:bg-secondary hover:underline"
    >
      {evidenceId}
    </Link>
  );
}

function ChatHistoryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const userFacingError = toUserFacingError(error);

  return (
    <ErrorState
      title={userFacingError.title}
      description={userFacingError.description}
      code={userFacingError.code}
      requestId={userFacingError.requestId}
      details={userFacingError.details}
      retryLabel={userFacingError.retryLabel}
      onRetry={userFacingError.canRetry ? onRetry : undefined}
    />
  );
}

function AnalysisContextError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const userFacingError = toUserFacingError(error);

  return (
    <Card>
      <CardContent className="pt-6">
        <ErrorState
          title={userFacingError.title}
          description={userFacingError.description}
          code={userFacingError.code}
          requestId={userFacingError.requestId}
          details={userFacingError.details}
          retryLabel={userFacingError.retryLabel}
          onRetry={userFacingError.canRetry ? onRetry : undefined}
        />
      </CardContent>
    </Card>
  );
}
