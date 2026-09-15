"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { ApplicationsDrawer } from "@/components/applications/ApplicationsDrawer";
import { EmployerJobList } from "@/components/employer/EmployerJobList";
import { EmployerStats } from "@/components/employer/EmployerStats";
import { useAuth } from "@/components/auth/AuthProvider";
import { countApplicationsByJob } from "@/lib/data/applications";
import { deleteJob, listEmployerJobs, setJobStatus } from "@/lib/data/jobs";
import type { Job } from "@/types/job";

export function EmployerDashboard() {
  const searchParams = useSearchParams();
  const { employerName } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [drawerJob, setDrawerJob] = useState<Job | null>(null);

  const postedTitle = searchParams.get("posted");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([listEmployerJobs(), countApplicationsByJob()])
      .then(([jobsResult, countsResult]) => {
        if (!active) return;
        setJobs(jobsResult);
        setCounts(countsResult);
      })
      .catch(() => {
        if (active) setError("We could not load your jobs. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleToggleStatus = useCallback(async (job: Job) => {
    setBusyJobId(job.id);
    setError(null);

    try {
      const updated = await setJobStatus(
        job.id,
        job.status === "Open" ? "Closed" : "Open",
      );
      setJobs((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      setError("We could not update that job. Please try again.");
    } finally {
      setBusyJobId(null);
    }
  }, []);

  const handleDelete = useCallback(
    async (job: Job) => {
      setBusyJobId(job.id);
      setError(null);

      try {
        await deleteJob(job.id);
        setJobs((current) => current.filter((item) => item.id !== job.id));
        setCounts((current) => {
          const { [job.id]: _removed, ...rest } = current;
          return rest;
        });
        if (drawerJob?.id === job.id) setDrawerJob(null);
      } catch {
        setError("We could not delete that job. Please try again.");
      } finally {
        setBusyJobId(null);
      }
    },
    [drawerJob],
  );

  const openJobs = jobs.filter((job) => job.status === "Open").length;
  const totalApplications = jobs.reduce(
    (total, job) => total + (counts[job.id] ?? 0),
    0,
  );

  return (
    <>
      <section className="surface-dark">
        <Container className="py-12 sm:py-14">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-fg-onDarkMuted">
                Employer dashboard
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-fg-onDark sm:text-4xl">
                {employerName}
              </h1>
              <p className="mt-2 text-sm text-fg-onDarkMuted">
                Manage your listings and review the people applying to them.
              </p>
            </div>

            <Link href="/employer/jobs/new">
              <Button variant="onDark" size="lg">
                <Plus aria-hidden className="h-4 w-4" />
                Post a Job
              </Button>
            </Link>
          </div>

          <div className="mt-9">
            <EmployerStats
              totalJobs={jobs.length}
              openJobs={openJobs}
              totalApplications={totalApplications}
              loading={loading}
            />
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        <div className="space-y-5">
          {postedTitle && (
            <Alert variant="success">
              “{postedTitle}” is now live on the job board.
            </Alert>
          )}

          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold tracking-tight text-fg">
              Your job posts
            </h2>
            {!loading && jobs.length > 0 && (
              <p className="text-sm text-fg-muted">
                {jobs.length} {jobs.length === 1 ? "listing" : "listings"}
              </p>
            )}
          </div>

          <EmployerJobList
            jobs={jobs}
            applicationCounts={counts}
            loading={loading}
            busyJobId={busyJobId}
            onViewApplications={setDrawerJob}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />
        </div>
      </Container>

      <ApplicationsDrawer job={drawerJob} onClose={() => setDrawerJob(null)} />
    </>
  );
}
