import { apiClient, ApiError } from "@/lib/data/client";
import type { EmployerJob, Job, JobInput, JobQuery, JobStatus } from "@/types/job";

/**
 * Data access for jobs. This module is the ONLY place that knows where job data
 * comes from. Components call these functions and never reach past them.
 *
 * Search, filter, and sort are the backend's job (docs/BACKEND.md §5,
 * `jobs/queries.py`) — this module only builds the query string.
 */

function buildQueryString(query: JobQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.location) params.set("location", query.location);
  if (query.sort) params.set("sort", query.sort);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Search, filter and sort the public job list. */
export async function listJobs(query: JobQuery = {}): Promise<Job[]> {
  return apiClient.get<Job[]>(`/jobs/${buildQueryString(query)}`);
}

export async function getJob(id: string): Promise<Job | null> {
  try {
    return await apiClient.get<Job>(`/jobs/${id}/`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Jobs belonging to the signed-in employer, with their application counts. */
export async function listEmployerJobs(): Promise<EmployerJob[]> {
  return apiClient.get<EmployerJob[]>("/employer/jobs/");
}

export async function createJob(input: JobInput): Promise<Job> {
  return apiClient.post<Job>("/jobs/", input);
}

export async function setJobStatus(id: string, status: JobStatus): Promise<Job> {
  return apiClient.patch<Job>(`/employer/jobs/${id}/`, { status });
}

export async function deleteJob(id: string): Promise<void> {
  return apiClient.delete(`/employer/jobs/${id}/`);
}
