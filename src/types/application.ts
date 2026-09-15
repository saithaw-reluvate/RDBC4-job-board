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
