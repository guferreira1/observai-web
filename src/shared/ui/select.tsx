import type { SelectHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "focus-ring flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
