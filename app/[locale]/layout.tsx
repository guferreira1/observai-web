import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n/i18n-provider";
import { isSupportedLocale, supportedLocales } from "@/shared/i18n/locales";
import { AppShell } from "@/shared/layout/app-shell";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return (
    <I18nProvider locale={locale}>
      <AppShell>{children}</AppShell>
    </I18nProvider>
  );
}
