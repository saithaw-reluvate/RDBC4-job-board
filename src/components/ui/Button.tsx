import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "onDark";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-fg hover:bg-primary-hover shadow-card hover:shadow-lift",
  secondary:
    "bg-surface text-fg border border-line-strong hover:border-primary hover:text-primary",
  ghost: "text-fg-muted hover:text-fg hover:bg-surface-muted",
  danger: "bg-surface text-danger border border-danger/30 hover:bg-danger-soft",
  onDark: "bg-white text-navy-900 hover:bg-brand-50 shadow-card",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold",
          "transition-all duration-150 ease-out",
          "disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none",
          VARIANTS[variant],
          SIZES[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
