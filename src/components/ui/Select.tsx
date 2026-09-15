import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

import { controlClasses } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Optional leading icon, used by the job filters. */
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, icon, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      {icon && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
        >
          {icon}
        </span>
      )}

      <select
        ref={ref}
        className={cn(
          controlClasses,
          "h-11 cursor-pointer appearance-none border-line-control pr-9",
          icon && "pl-9",
          className,
        )}
        {...props}
      >
        {children}
      </select>

      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
      />
    </div>
  );
});
