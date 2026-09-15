import { cn } from "@/lib/utils/cn";

type Variant = "neutral" | "category" | "open" | "closed" | "new";

const VARIANTS: Record<Variant, string> = {
  neutral: "bg-surface-muted text-fg-muted border-line",
  category: "bg-primary-soft text-brand-700 border-brand-600/15",
  open: "bg-success-soft text-success border-success/20",
  closed: "bg-surface-muted text-fg-muted border-line-strong",
  new: "bg-primary-soft text-brand-700 border-brand-600/15",
};

/** Small filled marker, used alongside status labels (never colour alone). */
const MARKERS: Partial<Record<Variant, string>> = {
  open: "bg-success",
  closed: "bg-fg-subtle",
  new: "bg-brand-600",
};

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  const marker = MARKERS[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-xs font-semibold",
        VARIANTS[variant],
        className,
      )}
    >
      {marker && (
        <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", marker)} />
      )}
      {children}
    </span>
  );
}
