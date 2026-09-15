/**
 * Small in-house validators. Each returns an error message, or undefined when
 * the value is acceptable.
 *
 * Client-side validation is a UX affordance only. Authoritative validation will
 * belong to the backend.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function required(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required.`;
}

export function email(value: string): string | undefined {
  if (!value.trim()) return "Email address is required.";
  return EMAIL_PATTERN.test(value.trim())
    ? undefined
    : "Enter a valid email address.";
}

export function minLength(
  value: string,
  length: number,
  label: string,
): string | undefined {
  if (!value.trim()) return `${label} is required.`;
  return value.trim().length >= length
    ? undefined
    : `${label} must be at least ${length} characters.`;
}

export function maxLength(
  value: string,
  length: number,
  label: string,
): string | undefined {
  return value.trim().length <= length
    ? undefined
    : `${label} must be ${length} characters or fewer.`;
}

export function positiveNumber(
  value: string,
  label: string,
): string | undefined {
  if (!value.trim()) return `${label} is required.`;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return `${label} must be a number.`;
  return parsed > 0 ? undefined : `${label} must be greater than zero.`;
}

/** Validates that `max` is not below `min`, when both parse as numbers. */
export function notBelow(
  max: string,
  min: string,
  message: string,
): string | undefined {
  const parsedMax = Number(max);
  const parsedMin = Number(min);
  if (Number.isNaN(parsedMax) || Number.isNaN(parsedMin)) return undefined;
  return parsedMax >= parsedMin ? undefined : message;
}

export function matches(
  value: string,
  other: string,
  message: string,
): string | undefined {
  if (!value) return "Please confirm your password.";
  return value === other ? undefined : message;
}

/** Drops undefined entries so callers can test emptiness cleanly. */
export function compactErrors<T extends Record<string, string>>(
  errors: Partial<Record<keyof T, string | undefined>>,
): Partial<Record<keyof T, string>> {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as Partial<Record<keyof T, string>>;
}
