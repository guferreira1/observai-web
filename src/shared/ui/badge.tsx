import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        critical: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/40 dark:bg-red-950/35 dark:text-red-200",
        high: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/40 dark:bg-orange-950/35 dark:text-orange-200",
        medium: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/40 dark:bg-amber-950/35 dark:text-amber-200",
        low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-950/35 dark:text-emerald-200",
        info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/40 dark:bg-sky-950/35 dark:text-sky-200"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}
