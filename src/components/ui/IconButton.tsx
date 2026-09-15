import { forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

type Variant = "ghost" | "subtle" | "danger" | "onDark";

const VARIANTS: Record<Variant, string> = {
  ghost: "text-fg-muted hover:text-fg hover:bg-surface-muted",
  subtle: "text-fg-muted bg-surface-muted hover:text-fg hover:bg-line",
  danger: "text-fg-muted hover:text-danger hover:bg-danger-soft",
  onDark: "text-fg-onDarkMuted hover:text-fg-onDark hover:bg-white/10",
};

/** Shared shape for icon-only controls, so a Link can adopt the same affordance. */
export function iconButtonClasses(variant: Variant = "ghost", className?: string): string {
  return cn(
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
    "transition-colors duration-150 ease-out",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    className,
  );
}

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only controls must always carry an accessible name. */
  label: string;
  variant?: Variant;
}

/**
 * Icon-only control. The label becomes both the accessible name and the native
 * tooltip, per the iconography rules in docs/FRONTEND.md §7.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, variant = "ghost", className, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={iconButtonClasses(variant, className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
