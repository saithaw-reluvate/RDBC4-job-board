"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/components/auth/AuthProvider";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

/** Slide-in navigation panel for viewports below `md`. */
export function MobileNav({ open, onClose }: MobileNavProps) {
  const { user, signedIn, signOut } = useAuth();
  // Seekers get seeker-only navigation; anonymous and employer keep the
  // existing "For Employers" link (for an employer it is their dashboard entry).
  const showEmployerLink = !signedIn || user?.role === "employer";

  useEffect(() => {
    if (!open) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-navy-900/45"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] animate-slide-in-right flex-col bg-surface shadow-panel"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Logo />
          <IconButton label="Close menu" variant="subtle" onClick={onClose}>
            <X aria-hidden className="h-4 w-4" />
          </IconButton>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          <Link
            href="/"
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-fg hover:bg-surface-muted"
          >
            Find Jobs
          </Link>
          {showEmployerLink && (
            <Link
              href="/employer"
              onClick={onClose}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-fg hover:bg-surface-muted"
            >
              For Employers
            </Link>
          )}
        </nav>

        <div className="mt-auto space-y-2.5 border-t border-line px-5 py-5">
          {signedIn ? (
            <>
              <p className="text-sm text-fg-muted">
                Signed in as{" "}
                <span className="font-semibold text-fg">{user?.name}</span>
              </p>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  signOut();
                  onClose();
                }}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={onClose} className="block">
                <Button variant="secondary" fullWidth>
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" onClick={onClose} className="block">
                <Button fullWidth>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
