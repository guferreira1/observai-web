"use client";

import { usePathname, useRouter } from "next/navigation";
import { useId } from "react";

import {
  isSupportedLocale,
  localeCookieName,
  localeLabels,
  supportedLocales,
  withLocalePath
} from "@/shared/i18n/locales";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { Select } from "@/shared/ui/select";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const languageSwitcherId = useId();
  const { locale, t } = useI18n();

  function changeLocale(nextLocale: string) {
    if (!isSupportedLocale(nextLocale)) {
      return;
    }

    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(withLocalePath(pathname, nextLocale));
  }

  return (
    <label className="grid gap-1 text-xs text-muted-foreground" htmlFor={languageSwitcherId}>
      <span>{t("language.switcher.label")}</span>
      <Select
        id={languageSwitcherId}
        value={locale}
        className="h-9 text-xs"
        onChange={(event) => changeLocale(event.target.value)}
      >
        {supportedLocales.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {localeLabels[supportedLocale]}
          </option>
        ))}
      </Select>
    </label>
  );
}
