import type { JobCategory } from "@/constants/categories";

export type JobStatus = "Open" | "Closed";

export type EmploymentType =
  | "Full-time"
  | "Part-time"
  | "Contract"
  | "Internship";

export type SalaryPeriod = "year" | "month" | "hour";

export type ApplicationStatus = "New" | "Reviewed";

/**
 * Frontend domain type. This is NOT a database schema — field types, naming and
 * storage are backend decisions made in a later phase.
 *
 * Fields mandated by the brief: title, description, requirements, location,
 * status. Category and salary are mandated by implication, since the brief
 * requires filtering by category and sorting by salary.
 */
export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  status: JobStatus;
  category: JobCategory;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  salaryPeriod: SalaryPeriod;
  employmentType: EmploymentType;
  /** ISO 8601 timestamp. */
  postedAt: string;
  employerName: string;
}

/** Everything the employer supplies when posting a job. */
export type JobInput = Omit<Job, "id" | "postedAt" | "employerName">;

export type JobSort = "newest" | "relevance" | "salary";

/**
 * Query shape for listing jobs. The brief places search/filter/sort logic in the
 * backend; in V1 the mock data layer implements it, and at integration this
 * becomes the API query string without any change to the UI.
 */
export interface JobQuery {
  search?: string;
  category?: string;
  location?: string;
  sort?: JobSort;
}
