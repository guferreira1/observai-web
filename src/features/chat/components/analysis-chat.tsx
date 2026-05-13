"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ChatRequest } from "@/features/chat/api/chat.schemas";
import {
  useAskAnalysisQuestionMutation,
  useChatHistoryQuery
} from "@/features/chat/api/chat.queries";
import { useAnalysisQuery } from "@/features/analysis/api/analysis.queries";
import { AnalysisTabs } from "@/features/analysis/components/analysis-tabs";
import { buildAnalysisFollowUpQuestions } from "@/features/analysis/domain/analysis.follow-up-suggestions";
import { getErrorMessage, toUserFacingError } from "@/shared/api/errors";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
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
  const chatHistoryQuery = useChatHistoryQuery(analysisId);
  const { formatDateTime, t } = useI18n();
  const analysisQuery = useAnalysisQuery(analysisId);
  const askQuestionMutation = useAskAnalysisQuestionMutation(analysisId);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [failedQuestion, setFailedQuestion] = useState("");
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

    try {
      await askQuestionMutation.mutateAsync({ question });
      form.reset();
      setPendingQuestion("");
    } catch {
      setFailedQuestion(question);
      setPendingQuestion("");
    }
  }

  function selectSuggestedQuestion(question: string) {
    form.setValue("question", question, { shouldDirty: true, shouldValidate: true });
  }

  const messages = chatHistoryQuery.data?.messages ?? [];
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

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
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
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                {message.evidence && message.evidence.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {message.evidence.map((evidence) => (
                      <li key={evidence}>
                        <Badge variant="outline">{evidence}</Badge>
                      </li>
                    ))}
                  </ul>
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
          </CardContent>
        </Card>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
              {askQuestionMutation.isError ? (
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
          {followUpQuestions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("chat.nextQuestions.title")}</CardTitle>
                <CardDescription>{t("chat.nextQuestions.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {followUpQuestions.map((question) => (
                  <Button
                    key={question}
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start whitespace-normal py-3 text-left"
                    onClick={() => selectSuggestedQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </form>
      </div>
    </>
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
