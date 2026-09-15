import { NextResponse, type NextRequest } from "next/server";

/**
 * Route guard for /employer/*, added this phase now that a real session and
 * role exist to check (V1 deliberately had none — docs/FRONTEND.md §13).
 *
 * Runs server-side, ahead of any component, so it works the same regardless
 * of whether a given page is a Server or Client Component — no page's
 * rendering strategy changes because of this guard.
 *
 * Approved behaviour:
 *   anonymous -> /login
 *   seeker    -> /
 *   employer  -> allowed
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export async function middleware(request: NextRequest) {
  const cookie = request.headers.get("cookie") ?? "";

  let role: string | null = null;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: { cookie },
    });
    if (response.ok) {
      const user = (await response.json()) as { role?: string };
      role = user.role ?? null;
    }
  } catch {
    // Backend unreachable: fail closed to /login rather than blocking the
    // request some other way.
  }

  if (role === null) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (role === "seeker") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/employer/:path*"],
};
