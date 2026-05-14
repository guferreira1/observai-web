"use client";

import { Activity, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useHealthQuery } from "@/features/health/api/health.queries";
import { appConfig } from "@/shared/config/env";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { LanguageSwitcher } from "@/shared/i18n/language-switcher";
import { stripLocaleFromPathname } from "@/shared/i18n/locales";
import { cn } from "@/shared/lib/utils";
import { primaryNavigation } from "@/shared/layout/navigation";
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
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-[17rem] border-r bg-card/90 shadow-[18px_0_60px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          <div className="relative overflow-hidden border-b px-5 py-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />
            <div className="scan-line absolute left-0 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-accent/80 to-transparent" aria-hidden="true" />
            <Link href={withLocalePath("/dashboard")} className="focus-ring block rounded-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-primary/25 bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10" aria-hidden="true" />
                  <span className="relative">OA</span>
                </div>
                <div>
                  <div className="text-lg font-semibold leading-none">{appConfig.appName}</div>
                  <div className="mt-1.5 text-xs text-muted-foreground">{t("app.tagline")}</div>
                </div>
              </div>
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4" aria-label={t("navigation.primary")}>
            <div className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("navigation.workspace")}
            </div>
            <div className="space-y-1">
              {primaryNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(pathnameWithoutLocale, item.href);
                const label = t(item.labelKey);

                return (
                  <Link
                    key={item.labelKey}
                    href={withLocalePath(item.href)}
                    className={cn(
                      "focus-ring group relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-[background-color,color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-secondary/80 hover:text-foreground",
                      isActive && "bg-primary/10 text-foreground shadow-sm shadow-primary/5 ring-1 ring-primary/20"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute inset-y-2 left-0 w-1 rounded-r-full bg-transparent transition-colors",
                        isActive && "bg-primary"
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-md border border-transparent bg-background/40 transition-colors group-hover:border-border",
                        isActive && "border-primary/20 bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-70",
                        isActive && "opacity-70"
                      )}
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="border-t p-4">
            <div className="grid gap-3">
              <div className="rounded-lg border bg-background/45 p-3 shadow-sm shadow-black/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("navigation.runtime")}
                  </div>
                  <span
                    className={cn(
                      "status-pulse h-2 w-2 rounded-full",
                      healthQuery.data?.status === "ok" ? "bg-emerald-500" : "bg-amber-500"
                    )}
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Badge variant={healthQuery.data?.status === "ok" ? "low" : "outline"}>{apiStatus}</Badge>
                  <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                </div>
              </div>
              <LanguageSwitcher />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{appConfig.appEnv}</div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </aside>
      <div className="lg:pl-[17rem]">
        <header className="sticky top-0 z-20 border-b bg-card/90 px-4 py-3 shadow-sm shadow-black/5 backdrop-blur-xl lg:hidden">
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
                  isActivePath(pathnameWithoutLocale, item.href) && "bg-primary/10 text-foreground ring-1 ring-primary/15"
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 xl:py-8">{children}</main>
      </div>
    </div>
  );
}
