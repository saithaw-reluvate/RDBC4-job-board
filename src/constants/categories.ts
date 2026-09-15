/**
 * Job categories are a fixed frontend constant for V1. How categories are stored
 * is a backend decision (docs/FRONTEND.md §4).
 */
export const JOB_CATEGORIES = [
  "Engineering",
  "Design",
  "Product",
  "Data",
  "Marketing",
  "Sales",
  "Operations",
  "Customer Support",
  "Finance",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];
