import { apiClient } from "@/lib/data/client";
import type {
  Application,
  ApplicationInput,
  SeekerApplication,
} from "@/types/application";

/**
 * Data access for applications. As with jobs, this module is the only place
 * that knows where the data comes from (see ./jobs.ts).
 */

/** Applications for one job, most recent first. Employer-scoped by the API. */
export async function listApplications(jobId: string): Promise<Application[]> {
  const applications = await apiClient.get<Omit<Application, "jobId">[]>(
    `/employer/jobs/${jobId}/applications/`,
  );
  // The API scopes by jobId in the URL and doesn't echo it in the body; the
  // frontend's Application type wants it on each record, so it's attached
  // here — the adapter this data-access layer exists for.
  return applications.map((application) => ({ ...application, jobId }));
}

export async function submitApplication(
  input: ApplicationInput,
): Promise<Application> {
  const { jobId, ...body } = input;
  const created = await apiClient.post<Omit<Application, "jobId">>(
    `/jobs/${jobId}/applications/`,
    body,
  );
  return { ...created, jobId };
}

/** The signed-in seeker's own application history, newest first. */
export async function listMyApplications(): Promise<SeekerApplication[]> {
  return apiClient.get<SeekerApplication[]>("/seeker/applications/");
}
