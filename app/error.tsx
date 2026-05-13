"use client";

import { useEffect } from "react";

import { toUserFacingError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  const userFacingError = toUserFacingError(error);

  useEffect(() => {
    // Keep logs minimal: do not print analysis payloads or provider responses.
    console.error(error.name, error.message, error.digest);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="max-w-lg rounded-md border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">{userFacingError.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{userFacingError.description}</p>
        <Button type="button" className="mt-6" onClick={reset}>
          {userFacingError.retryLabel}
        </Button>
      </section>
    </main>
  );
}
