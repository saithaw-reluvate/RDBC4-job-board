import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong",
        "bg-surface-muted/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-fg-muted shadow-card"
      >
        {icon}
      </div>
      <h3 className="text-base font-bold text-fg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-fg-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
