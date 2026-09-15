"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { FilterGroup } from "@/components/jobs/FilterGroup";
import { SortSelect } from "@/components/jobs/SortSelect";
import { cn } from "@/lib/utils/cn";
import type { JobSort } from "@/types/job";

export interface JobFiltersState {
  search: string;
  category: string;
  location: string;
  sort: JobSort;
}

interface JobToolbarProps {
  filters: JobFiltersState;
  onChange: (patch: Partial<JobFiltersState>) => void;
  onClearAll: () => void;
  resultCount: number;
  loading: boolean;
}

/** Only the text filters produce a removable chip; sort is not a filter. */
type ChipKey = "search" | "category" | "location";

interface Chip {
  key: ChipKey;
  label: string;
}

/**
 * Filter, sort, and active-filter chips for the job list.
 * Below `md` the controls collapse behind a filter button into a bottom sheet.
 */
export function JobToolbar({
  filters,
  onChange,
  onClearAll,
  resultCount,
  loading,
}: JobToolbarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSheetOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [sheetOpen]);

  const chips = [
    filters.search ? { key: "search", label: `“${filters.search}”` } : null,
    filters.category ? { key: "category", label: filters.category } : null,
    filters.location ? { key: "location", label: filters.location } : null,
  ].filter((chip): chip is Chip => chip !== null);

  const filtersActive = chips.length > 0;
  const activeFilterCount = [filters.category, filters.location].filter(Boolean).length;

  function clearChip(key: ChipKey) {
    const patch: Partial<JobFiltersState> = { [key]: "" };
    // Relevance is meaningless without a search term — fall back to newest.
    if (key === "search" && filters.sort === "relevance") patch.sort = "newest";
    onChange(patch);
  }

  const controls = (
    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
      <FilterGroup
        className="md:contents"
        category={filters.category}
        location={filters.location}
        onCategoryChange={(category) => onChange({ category })}
        onLocationChange={(location) => onChange({ location })}
      />
      <SortSelect
        value={filters.sort}
        searchActive={Boolean(filters.search.trim())}
        onChange={(sort) => onChange({ sort })}
        className="md:w-56"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          aria-live="polite"
          className="text-sm font-semibold text-fg-muted"
        >
          {loading
            ? "Searching jobs…"
            : `${resultCount} ${resultCount === 1 ? "job" : "jobs"} found`}
        </p>

        <Button
          variant="secondary"
          size="sm"
          className="md:hidden"
          onClick={() => setSheetOpen(true)}
          aria-expanded={sheetOpen}
        >
          <SlidersHorizontal aria-hidden className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-fg">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      <div className="hidden md:block">{controls}</div>

      {filtersActive && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-fg-subtle">
            Active
          </span>

          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full border border-brand-600/15 bg-primary-soft py-1 pl-3 pr-1 text-xs font-semibold text-brand-700"
            >
              {chip.label}
              <IconButton
                label={`Remove ${chip.label} filter`}
                variant="ghost"
                onClick={() => clearChip(chip.key)}
                className="h-5 w-5 rounded-full hover:bg-brand-600/10 hover:text-brand-700"
              >
                <X aria-hidden className="h-3 w-3" />
              </IconButton>
            </span>
          ))}

          <button
            type="button"
            onClick={onClearAll}
            className="rounded px-1.5 text-xs font-semibold text-fg-muted underline underline-offset-2 transition-colors hover:text-primary"
          >
            Clear all
          </button>
        </div>
      )}

      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            aria-hidden
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 animate-fade-in bg-navy-900/45"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter and sort jobs"
            className={cn(
              "absolute inset-x-0 bottom-0 animate-slide-up rounded-t-xl bg-surface p-5 shadow-panel",
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-fg">Filter &amp; sort</h2>
              <IconButton
                label="Close filters"
                variant="subtle"
                onClick={() => setSheetOpen(false)}
              >
                <X aria-hidden className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="space-y-3">{controls}</div>

            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  onClearAll();
                  setSheetOpen(false);
                }}
              >
                Clear all
              </Button>
              <Button fullWidth onClick={() => setSheetOpen(false)}>
                Show {resultCount} {resultCount === 1 ? "job" : "jobs"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
