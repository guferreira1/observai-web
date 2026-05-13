import type { Severity } from "@/features/analysis/api/analysis.schemas";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { Badge } from "@/shared/ui/badge";

type SeverityBadgeProps = {
  severity: Severity;
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { t } = useI18n();

  return <Badge variant={severity}>{t(`severity.${severity}`)}</Badge>;
}
