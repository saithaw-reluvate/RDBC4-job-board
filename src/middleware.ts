import { NextResponse, type NextRequest } from "next/server";

/**
 * Route guards for role-restricted areas, added once a real session and role
 * existed to check (V1 deliberately had none — docs/FRONTEND.md §13).
 *
 * Runs server-side, ahead of any component, so it works the same regardless
 * of whether a given page is a Server or Client Component — no page's
 * rendering strategy changes because of this guard.
 *
 * Approved behaviour:
 *   /employer/*     — anonymous -> /login, seeker -> /,  employer -> allowed
 *   /applications/* — anonymous -> /login, employer -> /, seeker   -> allowed
 *
 * This runs server-side inside the Next.js container, so it must reach the
 * backend directly over the Docker network -- not through Nginx, and not via
 * NEXT_PUBLIC_API_BASE_URL, which in production is a browser-relative path
 * (`/api`, proxied by Nginx) that means nothing to a server-side fetch.
 * INTERNAL_API_BASE_URL is the container-to-container address
 * (docker-compose.prod.yml sets it to http://backend:8000/api); dev never
 * sets it, so this falls back to the existing NEXT_PUBLIC_API_BASE_URL /
 * localhost default unchanged.
 */

const API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000/api";

const REQUIRED_ROLE: Record<string, "employer" | "seeker"> = {
  "/employer": "employer",
  "/applications": "seeker",
};

function matchedPrefix(pathname: string): string | undefined {
  return Object.keys(REQUIRED_ROLE).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const prefix = matchedPrefix(request.nextUrl.pathname);
  if (!prefix) return NextResponse.next();

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
  if (role !== REQUIRED_ROLE[prefix]) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/employer/:path*", "/applications/:path*"],
};
