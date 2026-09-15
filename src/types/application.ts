import type { JobStatus } from "@/types/job";

/**
 * Fields mandated by the brief: applicant name, email, cover letter, and the
 * association with a job post.
 *
 * No `status` field: the backend does not persist one (docs/BACKEND.md §2) —
 * nothing in the frontend ever mutated the V1 mock's New/Reviewed value, so it
 * was dropped rather than shipped as a value nothing can change.
 */
export interface Application {
  id: string;
  jobId: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
  /** ISO 8601 timestamp. */
  submittedAt: string;
}

export type ApplicationInput = Pick<
  Application,
  "jobId" | "applicantName" | "applicantEmail" | "coverLetter"
>;

/** The job summary shown on a seeker's application history entry. */
export interface SeekerApplicationJob {
  id: string;
  title: string;
  employerName: string;
  location: string;
  status: JobStatus;
}

/**
 * One entry in a seeker's own application history. Deliberately not the same
 * shape as `Application` — this is read-only history for the applicant, not
 * the employer's review record, and never carries the applicant's own
 * name/email/cover letter back to them (they already know it).
 */
export interface SeekerApplication {
  id: string;
  /** ISO 8601 timestamp. */
  submittedAt: string;
  job: SeekerApplicationJob;
}
