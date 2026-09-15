import Link from "next/link";

import { Logo } from "@/components/layout/Logo";

interface AuthCardProps {
  title: string;
  subtitle: string;
  footerPrompt: string;
  footerLinkLabel: string;
  footerLinkHref: string;
  children: React.ReactNode;
}

/** Shared frame for the login and signup screens. */
export function AuthCard({
  title,
  subtitle,
  footerPrompt,
  footerLinkLabel,
  footerLinkHref,
  children,
}: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-surface-muted px-5 py-14">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-xl border border-line bg-surface p-7 shadow-lift sm:p-8">
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-fg">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-fg-muted">{subtitle}</p>
          </div>

          {children}
        </div>

        <p className="mt-6 text-center text-sm text-fg-muted">
          {footerPrompt}{" "}
          <Link
            href={footerLinkHref}
            className="rounded font-semibold text-primary hover:underline"
          >
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
