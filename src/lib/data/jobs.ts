import { delay } from "@/lib/mock/latency";
import { DEMO_EMPLOYER } from "@/lib/mock/jobs.mock";
import { mockId, mockStore } from "@/lib/mock/store";
import type { Job, JobInput, JobQuery, JobSort, JobStatus } from "@/types/job";

/**
 * Data access for jobs. This module is the ONLY place that knows where job data
 * comes from. Components call these functions and never reach past them.
 *
 * The brief places search, filter and sort logic in the backend API. In V1 that
 * logic is implemented here against the mock store; at integration each function
 * body becomes an HTTP call carrying the same JobQuery as query parameters, and
 * no UI code changes.
 */

/**
 * V1 definition of "relevance": a weighted text match, title first.
 * The brief mandates relevance sorting without defining it — the authoritative
 * definition is a backend planning decision (CLAUDE.md §1, "Open by design").
 */
function relevanceScore(job: Job, term: string): number {
  const needle = term.trim().toLowerCase();
  if (!needle) return 0;

  let score = 0;
  if (job.title.toLowerCase().includes(needle)) score += 10;
  if (job.category.toLowerCase().includes(needle)) score += 5;
  if (job.location.toLowerCase().includes(needle)) score += 5;
  if (job.employerName.toLowerCase().includes(needle)) score += 3;
  if (job.description.toLowerCase().includes(needle)) score += 2;
  if (job.requirements.join(" ").toLowerCase().includes(needle)) score += 1;
  return score;
}

function byNewest(a: Job, b: Job): number {
  return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
}

function sortJobs(jobs: Job[], sort: JobSort, search: string): Job[] {
  const sorted = [...jobs];

  switch (sort) {
    case "salary":
      // Highest ceiling first; ties fall back to most recent.
      return sorted.sort(
        (a, b) => b.salaryMax - a.salaryMax || byNewest(a, b),
      );
    case "relevance":
      // Only meaningful with a search term; otherwise behaves as newest.
      if (!search.trim()) return sorted.sort(byNewest);
      return sorted.sort(
        (a, b) =>
          relevanceScore(b, search) - relevanceScore(a, search) || byNewest(a, b),
      );
    case "newest":
    default:
      return sorted.sort(byNewest);
  }
}

/** Search, filter and sort the public job list. */
export async function listJobs(query: JobQuery = {}): Promise<Job[]> {
  await delay();

  const search = query.search?.trim() ?? "";
  const matches = mockStore.getJobs().filter((job) => {
    if (query.category && job.category !== query.category) return false;
    if (query.location && job.location !== query.location) return false;
    if (search && relevanceScore(job, search) === 0) return false;
    return true;
  });

  return sortJobs(matches, query.sort ?? "newest", search);
}

export async function getJob(id: string): Promise<Job | null> {
  await delay();
  return mockStore.getJob(id) ?? null;
}

/** Jobs belonging to the signed-in employer. */
export async function listEmployerJobs(): Promise<Job[]> {
  await delay();
  return mockStore
    .getJobs()
    .filter((job) => job.employerName === DEMO_EMPLOYER)
    .sort(byNewest);
}

export async function createJob(input: JobInput): Promise<Job> {
  await delay();

  const job: Job = {
    ...input,
    id: mockId("job"),
    postedAt: new Date().toISOString(),
    employerName: DEMO_EMPLOYER,
  };

  mockStore.addJob(job);
  return job;
}

export async function setJobStatus(id: string, status: JobStatus): Promise<Job> {
  await delay(120, 240);

  const updated = mockStore.updateJob(id, { status });
  if (!updated) throw new Error("That job could not be found.");
  return updated;
}

export async function deleteJob(id: string): Promise<void> {
  await delay(120, 240);
  mockStore.removeJob(id);
}
