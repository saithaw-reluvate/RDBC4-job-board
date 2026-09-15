import { seedApplications } from "@/lib/mock/applications.mock";
import { seedJobs } from "@/lib/mock/jobs.mock";
import type { Application } from "@/types/application";
import type { Job } from "@/types/job";

/**
 * In-memory mock store. State lives for the lifetime of the page — a refresh
 * resets it to the seed data, which is expected behaviour for V1, not a bug
 * (docs/FRONTEND.md §10). There is deliberately no persistence layer.
 *
 * Nothing outside `lib/data/` may import this module.
 */
let jobs: Job[] = [...seedJobs];
let applications: Application[] = [...seedApplications];

export const mockStore = {
  getJobs: (): Job[] => jobs,

  getJob: (id: string): Job | undefined => jobs.find((job) => job.id === id),

  addJob: (job: Job): void => {
    jobs = [job, ...jobs];
  },

  updateJob: (id: string, patch: Partial<Job>): Job | undefined => {
    let updated: Job | undefined;
    jobs = jobs.map((job) => {
      if (job.id !== id) return job;
      updated = { ...job, ...patch };
      return updated;
    });
    return updated;
  },

  removeJob: (id: string): void => {
    jobs = jobs.filter((job) => job.id !== id);
    applications = applications.filter((application) => application.jobId !== id);
  },

  getApplications: (): Application[] => applications,

  addApplication: (application: Application): void => {
    applications = [application, ...applications];
  },
};

/** Mock id generator. Real ids are a backend concern. */
export function mockId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
