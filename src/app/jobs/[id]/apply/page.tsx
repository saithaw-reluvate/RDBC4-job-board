"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, MapPin } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Container } from "@/components/layout/Container";
import { ApplicationForm } from "@/components/applications/ApplicationForm";
import { getJob } from "@/lib/data/jobs";
import { formatSalaryRange } from "@/lib/utils/formatSalary";
import type { Job } from "@/types/job";

export default function ApplyPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getJob(params.id)
      .then((result) => {
        if (!active) return;
        if (!result) setMissing(true);
        else setJob(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  if (missing) notFound();

  return (
    <div className="bg-surface-muted">
      <Container className="max-w-2xl py-10 sm:py-14">
        <Link
          href={`/jobs/${params.id}`}
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-fg-muted transition-colors duration-150 hover:text-primary"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to job
        </Link>

        <Card className="mt-6 p-6 sm:p-8">
          {loading && (
            <div role="status" aria-label="Loading job">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <Skeleton className="mt-8 h-11 w-full" />
              <Skeleton className="mt-5 h-11 w-full" />
              <Skeleton className="mt-5 h-36 w-full" />
            </div>
          )}

          {!loading && job && !submitted && (
            <>
              <header className="border-b border-line pb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-fg-subtle">
                  Applying for
                </p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-fg">
                  {job.title}
                </h1>
                <p className="mt-1 text-sm font-semibold text-fg-muted">
                  {job.employerName}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fg-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin aria-hidden className="h-4 w-4 text-fg-subtle" />
                    {job.location}
                  </span>
                  <span className="tabular-nums">{formatSalaryRange(job)}</span>
                  <Badge variant="category">{job.category}</Badge>
                </div>
              </header>

              {job.status === "Closed" ? (
                <div className="pt-6">
                  <Alert variant="error">
                    This job is no longer accepting applications.
                  </Alert>
                  <Link href="/" className="mt-5 block">
                    <Button variant="secondary" fullWidth>
                      Browse other jobs
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="pt-6">
                  <ApplicationForm
                    jobId={job.id}
                    onSubmitted={() => setSubmitted(true)}
                  />
                </div>
              )}
            </>
          )}

          {!loading && job && submitted && (
            <div className="py-6 text-center">
              <div
                aria-hidden
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success"
              >
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-fg">
                Application submitted
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-fg-muted">
                Your application for{" "}
                <span className="font-semibold text-fg">{job.title}</span> at{" "}
                <span className="font-semibold text-fg">{job.employerName}</span>{" "}
                has been sent. The employer will contact you by email if they
                would like to take it further.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/">
                  <Button size="lg">Browse more jobs</Button>
                </Link>
                <Link href={`/jobs/${job.id}`}>
                  <Button size="lg" variant="secondary">
                    Back to job
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </Container>
    </div>
  );
}
