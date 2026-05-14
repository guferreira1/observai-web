import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n/i18n-provider";
import { AppShell } from "@/shared/layout/app-shell";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <I18nProvider locale="en">
      <AppShell>{children}</AppShell>
    </I18nProvider>
  );
}
