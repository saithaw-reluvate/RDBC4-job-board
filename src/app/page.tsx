"use client";

import { useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Container } from "@/components/layout/Container";
import { JobList } from "@/components/jobs/JobList";
import { JobToolbar, type JobFiltersState } from "@/components/jobs/JobToolbar";
import { SearchInput } from "@/components/jobs/SearchInput";
import { JOB_CATEGORIES } from "@/constants/categories";
import { DEFAULT_SORT } from "@/constants/sortOptions";
import { listJobs } from "@/lib/data/jobs";
import { cn } from "@/lib/utils/cn";
import type { Job } from "@/types/job";

const INITIAL_FILTERS: JobFiltersState = {
  search: "",
  category: "",
  location: "",
  sort: DEFAULT_SORT,
};

const QUICK_CATEGORIES = JOB_CATEGORIES.slice(0, 4);

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFiltersState>(INITIAL_FILTERS);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    // Debounced so typing does not fire a request per keystroke.
    const timer = setTimeout(() => {
      listJobs(filters)
        .then((result) => {
          if (active) setJobs(result);
        })
        .catch(() => {
          if (active) setError("We could not load jobs. Please try again.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters]);

  const updateFilters = useCallback((patch: Partial<JobFiltersState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const clearFilters = useCallback(() => setFilters(INITIAL_FILTERS), []);

  const filtersActive =
    Boolean(filters.search) || Boolean(filters.category) || Boolean(filters.location);

  return (
    <>
      <section className="surface-dark">
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-fg-onDarkMuted">
              {jobs.length > 0 || loading ? "Now hiring" : "Job board"}
            </p>

            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-fg-onDark sm:text-5xl lg:text-6xl">
              Find the role
              <br className="hidden sm:block" /> that fits you.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-fg-onDarkMuted sm:text-lg">
              Search openings from employers hiring right now. No account needed
              to browse or apply.
            </p>

            <SearchInput
              variant="hero"
              value={filters.search}
              onChange={(search) => updateFilters({ search })}
              className="mx-auto mt-9 max-w-2xl"
            />

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-semibold text-fg-onDarkMuted">
                Popular:
              </span>
              {QUICK_CATEGORIES.map((category) => {
                const selected = filters.category === category;

                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      updateFilters({ category: selected ? "" : category })
                    }
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-semibold",
                      "transition-colors duration-150 ease-out",
                      selected
                        ? "border-white bg-white text-navy-900"
                        : "border-white/25 text-fg-onDark hover:border-white/60 hover:bg-white/10",
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      <div className="border-b border-line bg-surface/90 backdrop-blur-md md:sticky md:top-16 md:z-30">
        <Container className="py-5">
          <JobToolbar
            filters={filters}
            onChange={updateFilters}
            onClearAll={clearFilters}
            resultCount={jobs.length}
            loading={loading}
          />
        </Container>
      </div>

      <Container className="py-10 sm:py-12">
        {error ? (
          <Alert variant="error">{error}</Alert>
        ) : (
          <JobList
            jobs={jobs}
            loading={loading}
            filtersActive={filtersActive}
            onClearFilters={clearFilters}
          />
        )}
      </Container>
    </>
  );
}
