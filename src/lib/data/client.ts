/**
 * The one fetch wrapper. This is the only module that knows the API is HTTP,
 * JSON, camelCase, cookie-authenticated, and CSRF-protected — the three
 * `lib/data/*` modules above it stay in domain terms (docs/BACKEND.md §9).
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

/** Thrown on any non-2xx response. Carries the status so callers can branch
 * on it (e.g. treating 404/403 as "not found" rather than an error). */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * DRF error bodies come as `{"detail": "..."}` or `{"field": ["msg", ...]}`.
 * Flattened into one message for the existing form Alert/submitError slots.
 */
function flattenErrorBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;

  if (typeof record.detail === "string") return record.detail;

  const messages = Object.values(record).flatMap((value) => {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string") return [value];
    return [];
  });

  return messages.length > 0 ? messages.join(" ") : undefined;
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function request<T>(
  path: string,
  { method = "GET", body }: { method?: Method; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  let payload: string | undefined;

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  // Only authenticated writes are actually CSRF-checked (docs/BACKEND.md §3),
  // but attaching the token on every non-GET call is harmless and needs no
  // per-call knowledge of auth state.
  if (method !== "GET") {
    const csrfToken = readCookie("csrftoken");
    if (csrfToken) headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    body: payload,
  });

  if (response.status === 204) return undefined as T;

  const hasBody = response.headers.get("content-length") !== "0";
  const data = hasBody ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    throw new ApiError(
      flattenErrorBody(data) ?? `Request failed (${response.status}).`,
      response.status,
    );
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
};

/** GET /api/auth/csrf/ — sets the csrftoken cookie before the first write. */
export async function ensureCsrfCookie(): Promise<void> {
  await apiClient.get("/auth/csrf/");
}
