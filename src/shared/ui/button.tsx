import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium shadow-sm shadow-black/5 transition-[background-color,border-color,color,box-shadow,transform] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-primary/20 bg-primary text-primary-foreground hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/15",
        destructive:
          "border border-destructive/20 bg-destructive text-destructive-foreground hover:-translate-y-0.5 hover:bg-destructive/90",
        outline: "border border-border/80 bg-card/80 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-secondary/80",
        secondary: "border border-border/60 bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary/80",
        ghost: "shadow-none hover:bg-secondary",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5",
        icon: "h-10 w-10 px-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return <Component className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
