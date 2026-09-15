import type { EmploymentType, JobStatus } from "@/types/job";

export const JOB_STATUSES: readonly JobStatus[] = ["Open", "Closed"] as const;

export const EMPLOYMENT_TYPES: readonly EmploymentType[] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
] as const;
