"use client";

import { useEffect } from "react";

import { defaultLocale, isSupportedLocale, localeCookieName, type AppLocale } from "@/shared/i18n/locales";
import { messages } from "@/shared/i18n/messages";
import { Button } from "@/shared/ui/button";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function getBrowserLocale(): AppLocale {
  if (typeof document === "undefined") {
    return defaultLocale;
  }

  const cookieLocale = document.cookie
    .split(";")
    .map((cookiePart) => cookiePart.trim())
    .find((cookiePart) => cookiePart.startsWith(`${localeCookieName}=`))
    ?.split("=")[1];

  return cookieLocale && isSupportedLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const copy = messages[getBrowserLocale()];

  useEffect(() => {
    console.error(error.name, error.message, error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
          <section className="max-w-lg rounded-md border bg-card p-6 text-center shadow-sm">
            <h1 className="text-xl font-semibold">{copy["globalError.title"]}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {copy["globalError.description"]}
            </p>
            <Button type="button" className="mt-6" onClick={reset}>
              {copy["globalError.reload"]}
            </Button>
          </section>
        </main>
      </body>
    </html>
  );
}
