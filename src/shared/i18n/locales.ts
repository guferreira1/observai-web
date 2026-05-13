export const supportedLocales = ["en", "pt-BR"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const defaultLocale: AppLocale = "en";

export const localeLabels: Record<AppLocale, string> = {
  en: "English",
  "pt-BR": "Português"
};

export const localeCookieName = "NEXT_LOCALE";

export function isSupportedLocale(value: string): value is AppLocale {
  return supportedLocales.includes(value as AppLocale);
}

export function getLocaleFromPathname(pathname: string): AppLocale | null {
  const [, maybeLocale] = pathname.split("/");

  return maybeLocale && isSupportedLocale(maybeLocale) ? maybeLocale : null;
}

export function stripLocaleFromPathname(pathname: string) {
  const locale = getLocaleFromPathname(pathname);

  if (!locale) {
    return pathname || "/";
  }

  const pathWithoutLocale = pathname.slice(locale.length + 1);

  return pathWithoutLocale || "/";
}

export function withLocalePath(pathname: string, locale: AppLocale) {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const pathWithoutLocale = stripLocaleFromPathname(normalizedPathname);

  return `/${locale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
}
