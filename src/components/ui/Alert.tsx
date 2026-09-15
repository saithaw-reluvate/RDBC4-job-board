import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Variant = "error" | "success" | "info";

const VARIANTS: Record<Variant, { wrapper: string; Icon: typeof Info }> = {
  error: {
    wrapper: "border-danger/25 bg-danger-soft text-danger",
    Icon: AlertCircle,
  },
  success: {
    wrapper: "border-success/25 bg-success-soft text-success",
    Icon: CheckCircle2,
  },
  info: {
    wrapper: "border-brand-600/20 bg-primary-soft text-brand-700",
    Icon: Info,
  },
};

interface AlertProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = "info", children, className }: AlertProps) {
  const { wrapper, Icon } = VARIANTS[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm font-medium",
        wrapper,
        className,
      )}
    >
      <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
