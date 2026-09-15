"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils/cn";

interface AudienceAction {
  prompt: string;
  label: string;
  href: string;
}

const SEEKER_ACTION: AudienceAction = {
  prompt: "Looking for your next opportunity?",
  label: "Browse Jobs",
  href: "/",
};

const EMPLOYER_ACTION: AudienceAction = {
  prompt: "Hiring talent?",
  label: "Post a Job",
  href: "/employer/jobs/new",
};

const AUTH_ROUTES = ["/login", "/signup"];

/**
 * One audience action at a time, chosen by route — never both.
 * Authentication pages show none, leaving the brand side on its own.
 */
function actionFor(pathname: string): AudienceAction | null {
  if (AUTH_ROUTES.includes(pathname)) return null;
  if (pathname.startsWith("/employer")) return EMPLOYER_ACTION;
  return SEEKER_ACTION;
}

/**
 * Two-column brand footer: identity on the left, a single context-aware audience
 * action on the right. Deliberately not a navigation footer — the header already
 * provides navigation.
 */
export function SiteFooter() {
  const pathname = usePathname();
  const action = actionFor(pathname);

  return (
    <footer className="mt-auto bg-navy-900 text-fg-onDark">
      <Container>
        <div
          className={cn(
            "flex flex-col gap-12 py-14",
            action && "md:flex-row md:items-start md:justify-between md:gap-16",
          )}
        >
          <div>
            <Logo onDark />

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-fg-onDarkMuted">
              Connecting talent with opportunities that matter.
            </p>

            <p className="mt-7 text-xs text-fg-onDarkMuted">
              © 2026 NorthwindJobs
            </p>
          </div>

          {action && (
            <div className="md:shrink-0">
              <p className="text-sm font-semibold leading-snug text-fg-onDark">
                {action.prompt}
              </p>

              <Link href={action.href} className="mt-4 inline-block">
                <Button variant="onDark" size="sm">
                  {action.label}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Container>
    </footer>
  );
}
