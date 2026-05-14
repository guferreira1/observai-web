"use client";

import { Moon, Sun } from "lucide-react";

import { useI18n } from "@/shared/i18n/i18n-provider";
import { useTheme } from "@/shared/theme/theme-provider";
import { Button } from "@/shared/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600" aria-hidden="true" />
      )}
    </Button>
  );
}
