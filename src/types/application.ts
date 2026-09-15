import type { ApplicationStatus } from "@/types/job";

/**
 * Fields mandated by the brief: applicant name, email, cover letter, and the
 * association with a job post. `status` is a V1 dashboard-only addition.
 */
export interface Application {
  id: string;
  jobId: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
  /** ISO 8601 timestamp. */
  submittedAt: string;
  status: ApplicationStatus;
}

export type ApplicationInput = Pick<
  Application,
  "jobId" | "applicantName" | "applicantEmail" | "coverLetter"
>;
