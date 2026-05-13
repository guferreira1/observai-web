"use client";

import { format, formatDistanceToNow, type Locale } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

import { messages, type TranslationKey } from "@/shared/i18n/messages";
import { defaultLocale, type AppLocale, withLocalePath } from "@/shared/i18n/locales";

type TranslationVariables = Record<string, string | number>;

type I18nContextValue = {
  locale: AppLocale;
  t: (key: TranslationKey, variables?: TranslationVariables) => string;
  formatDateTime: (value: string) => string;
  formatRelativeDate: (value: string) => string;
  withLocalePath: (pathname: string) => string;
};

const dateLocales: Record<AppLocale, Locale> = {
  en: enUS,
  "pt-BR": ptBR
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(message: string, variables?: TranslationVariables) {
  if (!variables) {
    return message;
  }

  return Object.entries(variables).reduce(
    (interpolatedMessage, [name, value]) => interpolatedMessage.replaceAll(`{${name}}`, String(value)),
    message
  );
}

export function I18nProvider({
  children,
  locale = defaultLocale
}: {
  children: ReactNode;
  locale?: AppLocale;
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, variables) => interpolate(messages[locale][key] ?? messages[defaultLocale][key], variables),
      formatDateTime: (valueToFormat) => {
        const date = new Date(valueToFormat);
        if (Number.isNaN(date.getTime())) {
          return messages[locale]["common.invalidDate"];
        }

        return format(date, "Pp", { locale: dateLocales[locale] });
      },
      formatRelativeDate: (valueToFormat) => {
        const date = new Date(valueToFormat);
        if (Number.isNaN(date.getTime())) {
          return messages[locale]["common.invalidDate"];
        }

        return formatDistanceToNow(date, { addSuffix: true, locale: dateLocales[locale] });
      },
      withLocalePath: (pathname) => withLocalePath(pathname, locale)
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
