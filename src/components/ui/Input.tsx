import { forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

export const controlClasses = [
  "w-full rounded-lg border bg-surface px-3.5 text-sm text-fg",
  "placeholder:text-fg-subtle",
  "transition-colors duration-150 ease-out",
  "hover:border-fg-subtle",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:hover:border-danger",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-muted",
].join(" ");

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(controlClasses, "h-11 border-line-control", className)}
      {...props}
    />
  );
});
