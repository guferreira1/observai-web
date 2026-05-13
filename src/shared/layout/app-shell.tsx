"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { appConfig } from "@/shared/config/env";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { LanguageSwitcher } from "@/shared/i18n/language-switcher";
import { stripLocaleFromPathname } from "@/shared/i18n/locales";
import { cn } from "@/shared/lib/utils";
import { primaryNavigation } from "@/shared/layout/navigation";
import { useHealthQuery } from "@/features/health/api/health.queries";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { Badge } from "@/shared/ui/badge";

type AppShellProps = {
  children: ReactNode;
};

function isActivePath(currentPath: string, itemPath: string) {
  if (itemPath === "/dashboard") {
    return currentPath === itemPath;
  }

  return currentPath.startsWith(itemPath);
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const healthQuery = useHealthQuery();
  const { t, withLocalePath } = useI18n();
  const pathnameWithoutLocale = stripLocaleFromPathname(pathname);
  const apiStatus = healthQuery.data?.status === "ok" ? t("app.apiOnline") : t("app.apiUnavailable");

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b px-5 py-5">
            <Link href={withLocalePath("/dashboard")} className="focus-ring block rounded-sm">
              <div className="text-lg font-semibold">{appConfig.appName}</div>
              <div className="mt-1 text-xs text-muted-foreground">{t("app.tagline")}</div>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4" aria-label={t("navigation.primary")}>
            {primaryNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(pathnameWithoutLocale, item.href);
              const label = t(item.labelKey);

              return (
                <Link
                  key={item.labelKey}
                  href={withLocalePath(item.href)}
                  className={cn(
                    "focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground",
                    isActive && "bg-secondary text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-4">
            <div className="grid gap-3">
              <LanguageSwitcher />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{appConfig.appEnv}</div>
                  <Badge className="mt-2" variant={healthQuery.data?.status === "ok" ? "low" : "outline"}>
                    {apiStatus}
                  </Badge>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link href={withLocalePath("/dashboard")} className="font-semibold">
              {appConfig.appName}
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Badge variant={healthQuery.data?.status === "ok" ? "low" : "outline"}>{apiStatus}</Badge>
              <ThemeToggle />
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label={t("navigation.mobile")}>
            {primaryNavigation.map((item) => (
              <Link
                key={item.labelKey}
                href={withLocalePath(item.href)}
                className={cn(
                  "focus-ring whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium text-muted-foreground",
                  isActivePath(pathnameWithoutLocale, item.href) && "bg-secondary text-foreground"
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
