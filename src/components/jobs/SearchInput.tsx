"use client";

import { Search, X } from "lucide-react";

import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** `hero` is the large variant used on the home hero. */
  variant?: "hero" | "default";
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  variant = "default",
  placeholder = "Search by job title, skill, or company",
  className,
}: SearchInputProps) {
  const isHero = variant === "hero";

  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted",
          isHero ? "h-5 w-5" : "h-4 w-4",
        )}
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search jobs"
        className={cn(
          "w-full rounded-xl border border-line-control bg-surface text-fg shadow-card",
          "placeholder:text-fg-subtle",
          "transition-shadow duration-150 ease-out focus:shadow-lift",
          "[&::-webkit-search-cancel-button]:appearance-none",
          isHero ? "h-14 pl-12 pr-14 text-base" : "h-11 pl-10 pr-11 text-sm",
        )}
      />

      {value && (
        <IconButton
          label="Clear search"
          variant="subtle"
          onClick={() => onChange("")}
          className={cn(
            "absolute top-1/2 -translate-y-1/2",
            isHero ? "right-2.5 h-10 w-10" : "right-1.5 h-8 w-8",
          )}
        >
          <X aria-hidden className="h-4 w-4" />
        </IconButton>
      )}
    </div>
  );
}
