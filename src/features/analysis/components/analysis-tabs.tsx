"use client";

import { Activity, FileText, MessageSquare, Network } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/shared/i18n/i18n-provider";
import { stripLocaleFromPathname } from "@/shared/i18n/locales";
import { cn } from "@/shared/lib/utils";

type AnalysisTabsProps = {
  analysisId: string;
};

export function AnalysisTabs({ analysisId }: AnalysisTabsProps) {
  const pathname = usePathname();
  const { t, withLocalePath } = useI18n();
  const pathnameWithoutLocale = stripLocaleFromPathname(pathname);
  const tabs = [
    { label: t("common.summary"), href: `/analyses/${analysisId}`, icon: FileText },
    { label: t("common.evidence"), href: `/analyses/${analysisId}/evidence`, icon: Activity },
    { label: t("traceInsights.page.title"), href: `/analyses/${analysisId}/traces`, icon: Network },
    { label: t("chat.page.title"), href: `/analyses/${analysisId}/chat`, icon: MessageSquare }
  ];

  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto border-b" aria-label={t("analysisTabs.sections")}>
      {tabs.map((tab) => {
        const TabIcon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={withLocalePath(tab.href)}
            className={cn(
              "focus-ring -mb-px inline-flex whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground",
              pathnameWithoutLocale === tab.href && "border-primary text-foreground"
            )}
          >
            <TabIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
