import { delay } from "@/lib/mock/latency";
import { mockId, mockStore } from "@/lib/mock/store";
import type { Application, ApplicationInput } from "@/types/application";

/**
 * Data access for applications. As with jobs, this module is the only place that
 * knows where the data comes from (see ./jobs.ts).
 */

function byNewest(a: Application, b: Application): number {
  return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
}

/** Applications for one job, most recent first. */
export async function listApplications(jobId: string): Promise<Application[]> {
  await delay();
  return mockStore
    .getApplications()
    .filter((application) => application.jobId === jobId)
    .sort(byNewest);
}

/** Application counts keyed by job id, for the employer dashboard. */
export async function countApplicationsByJob(): Promise<Record<string, number>> {
  await delay(120, 240);

  return mockStore.getApplications().reduce<Record<string, number>>(
    (counts, application) => {
      counts[application.jobId] = (counts[application.jobId] ?? 0) + 1;
      return counts;
    },
    {},
  );
}

export async function submitApplication(
  input: ApplicationInput,
): Promise<Application> {
  await delay(400, 700);

  const application: Application = {
    ...input,
    id: mockId("app"),
    submittedAt: new Date().toISOString(),
    status: "New",
  };

  mockStore.addApplication(application);
  return application;
}
