import { cn } from "@/lib/utils/cn";

interface FieldProps {
  /** Must match the control's id. */
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + control + message wrapper. The message ids follow the convention
 * `${id}-error` / `${id}-hint`, which is what `useFormState.fieldProps` points
 * `aria-describedby` at.
 */
export function Field({
  id,
  label,
  error,
  hint,
  required = false,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-fg"
      >
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-danger">
            *
          </span>
        )}
        {!required && (
          <span className="ml-1.5 text-xs font-medium text-fg-subtle">
            Optional
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-fg-muted">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs font-medium text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
