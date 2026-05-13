import {
  Gauge,
  History,
  SearchCode
} from "lucide-react";

import type { TranslationKey } from "@/shared/i18n/messages";

export const primaryNavigation = [
  {
    labelKey: "navigation.dashboard",
    href: "/dashboard",
    icon: Gauge
  },
  {
    labelKey: "navigation.newAnalysis",
    href: "/analyses/new",
    icon: SearchCode
  },
  {
    labelKey: "navigation.analysisHistory",
    href: "/history",
    icon: History
  }
] satisfies Array<{
  labelKey: TranslationKey;
  href: string;
  icon: typeof Gauge;
}>;
