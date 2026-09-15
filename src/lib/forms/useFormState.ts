"use client";

import { useCallback, useRef, useState } from "react";

export type FormValues = Record<string, string>;
export type FieldErrors<T extends FormValues> = Partial<Record<keyof T, string>>;
export type ValidateFn<T extends FormValues> = (values: T) => FieldErrors<T>;

interface UseFormStateOptions<T extends FormValues> {
  initialValues: T;
  validate: ValidateFn<T>;
  onSubmit: (values: T) => Promise<void> | void;
}

interface FieldPropsOptions {
  /** Set when the field renders a persistent hint alongside its error slot. */
  hasHint?: boolean;
}

/**
 * Minimal form state: values, blur/submit validation, submitting state, and a
 * single submit-level error slot. Deliberately not a form library — V1 has four
 * small forms and the backend will own real validation (docs/FRONTEND.md §11).
 */
export function useFormState<T extends FormValues>({
  initialValues,
  validate,
  onSubmit,
}: UseFormStateOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const setValue = useCallback(
    (name: keyof T, value: string) => {
      setValues((current) => {
        const next = { ...current, [name]: value };
        // Clear a field's error as soon as it becomes valid again.
        setErrors((currentErrors) => {
          if (!currentErrors[name]) return currentErrors;
          const revalidated = validate(next);
          if (revalidated[name]) return currentErrors;
          const { [name]: _cleared, ...rest } = currentErrors;
          return rest as FieldErrors<T>;
        });
        return next;
      });
      setSubmitError(null);
    },
    [validate],
  );

  const validateField = useCallback(
    (name: keyof T) => {
      const fieldErrors = validate(values);
      setErrors((current) => ({ ...current, [name]: fieldErrors[name] }));
    },
    [validate, values],
  );

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((current) => ({ ...current, [name]: true }));
      validateField(name);
    },
    [validateField],
  );

  const errorFor = useCallback(
    (name: keyof T): string | undefined =>
      touched[name] ? errors[name] : undefined,
    [errors, touched],
  );

  const fieldProps = useCallback(
    (name: keyof T & string, options: FieldPropsOptions = {}) => {
      const message = errorFor(name);
      const describedBy = [
        message ? `${name}-error` : null,
        options.hasHint ? `${name}-hint` : null,
      ]
        .filter(Boolean)
        .join(" ");

      return {
        id: name,
        name,
        value: values[name],
        onChange: (
          event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >,
        ) => setValue(name, event.target.value),
        onBlur: () => handleBlur(name),
        "aria-invalid": Boolean(message),
        "aria-describedby": describedBy || undefined,
      };
    },
    [errorFor, handleBlur, setValue, values],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitError(null);

      const nextErrors = validate(values);
      const allTouched = Object.keys(values).reduce(
        (accumulator, key) => ({ ...accumulator, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>,
      );

      setTouched(allTouched);
      setErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        // Move focus to the first field in error.
        requestAnimationFrame(() => {
          const firstInvalid = formRef.current?.querySelector<HTMLElement>(
            '[aria-invalid="true"]',
          );
          firstInvalid?.focus();
        });
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, validate, values],
  );

  return {
    values,
    errors,
    touched,
    submitting,
    submitError,
    formRef,
    setValue,
    handleBlur,
    handleSubmit,
    errorFor,
    fieldProps,
    setValues,
  };
}
