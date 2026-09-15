import { forwardRef } from "react";

import { controlClasses } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, rows = 6, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(controlClasses, "resize-y border-line-control py-2.5", className)}
        {...props}
      />
    );
  },
);
