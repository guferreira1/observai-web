import type { InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn("focus-ring h-4 w-4 rounded border-input text-primary", className)}
      {...props}
    />
  );
}
