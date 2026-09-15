import Link from "next/link";

import { cn } from "@/lib/utils/cn";

/** Wordmark. `onDark` inverts it for the footer and dark panels. */
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 rounded"
      aria-label="Northwind Jobs — home"
    >
      <span
        aria-hidden
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold",
          "transition-transform duration-150 ease-out group-hover:-rotate-6",
          onDark ? "bg-white text-navy-900" : "surface-dark text-white",
        )}
      >
        N
      </span>
      <span
        className={cn(
          "text-[15px] font-extrabold tracking-tight",
          onDark ? "text-fg-onDark" : "text-fg",
        )}
      >
        Northwind<span className="text-primary">Jobs</span>
      </span>
    </Link>
  );
}
