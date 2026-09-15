"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Menu } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { MobileNav } from "@/components/layout/MobileNav";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/", label: "Find Jobs" },
  { href: "/employer", label: "For Employers" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, signedIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isEmployer = user?.role === "employer";
  // Seekers get seeker-only navigation; anonymous and employer keep the
  // existing public link set (employer-only items only hide for seekers).
  const links = signedIn && !isEmployer ? LINKS.filter((link) => link.href !== "/employer") : LINKS;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 bg-surface/85 backdrop-blur-md transition-shadow duration-200",
          scrolled ? "border-b border-line shadow-card" : "border-b border-transparent",
        )}
      >
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <Logo />

              <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
                {links.map((link) => {
                  const active =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150",
                        active
                          ? "text-primary"
                          : "text-fg-muted hover:bg-surface-muted hover:text-fg",
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="hidden items-center gap-2.5 md:flex">
              {signedIn ? (
                <>
                  <span className="max-w-[12rem] truncate text-sm font-semibold text-fg-muted">
                    {user?.name}
                  </span>
                  {isEmployer && (
                    <Link href="/employer">
                      <Button variant="secondary" size="sm">
                        <LayoutGrid aria-hidden className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={signOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>

            <IconButton
              label="Open menu"
              variant="subtle"
              className="md:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <Menu aria-hidden className="h-5 w-5" />
            </IconButton>
          </div>
        </Container>
      </header>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
