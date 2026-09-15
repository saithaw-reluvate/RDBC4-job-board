import type { JobSort } from "@/types/job";

export interface SortOption {
  value: JobSort;
  label: string;
  /** Relevance is only meaningful alongside a search term. */
  requiresSearch?: boolean;
}

/**
 * The brief mandates sorting by date posted, relevance, and salary.
 * The authoritative definition of "relevance" is a backend decision; V1 uses a
 * weighted text match (see src/lib/data/jobs.ts).
 */
export const SORT_OPTIONS: readonly SortOption[] = [
  { value: "newest", label: "Date posted" },
  { value: "relevance", label: "Relevance", requiresSearch: true },
  { value: "salary", label: "Salary" },
] as const;

export const DEFAULT_SORT: JobSort = "newest";
