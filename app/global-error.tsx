"use client";

import { useEffect } from "react";

import { Button } from "@/shared/ui/button";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error.name, error.message, error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
          <section className="max-w-lg rounded-md border bg-card p-6 text-center shadow-sm">
            <h1 className="text-xl font-semibold">ObservAI Web could not render</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Reload the application. If the issue persists, check the frontend build and API contract.
            </p>
            <Button type="button" className="mt-6" onClick={reset}>
              Reload application
            </Button>
          </section>
        </main>
      </body>
    </html>
  );
}
