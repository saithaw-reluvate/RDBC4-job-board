import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-fg-muted transition-colors duration-150 hover:text-primary"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          {backLabel}
        </Link>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm text-fg-muted">{description}</p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}
