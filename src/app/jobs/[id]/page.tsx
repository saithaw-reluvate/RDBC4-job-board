"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  CalendarDays,
  Check,
  MapPin,
  Tags,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Container } from "@/components/layout/Container";
import { getJob } from "@/lib/data/jobs";
import { formatAbsoluteDate, formatRelativeDate } from "@/lib/utils/formatDate";
import { formatSalaryRange } from "@/lib/utils/formatSalary";
import type { Job } from "@/types/job";

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading job">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-6 h-10 w-3/4" />
      <Skeleton className="mt-3 h-5 w-40" />
      <Skeleton className="mt-8 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
    </div>
  );
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getJob(params.id)
      .then((result) => {
        if (!active) return;
        if (!result) setMissing(true);
        else setJob(result);
      })
      .catch(() => {
        if (active) setError("We could not load this job. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  if (missing) notFound();

  if (loading) {
    return (
      <Container className="py-10 sm:py-14">
        <DetailSkeleton />
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container className="py-14">
        <Alert variant="error">{error ?? "This job is unavailable."}</Alert>
      </Container>
    );
  }

  const isOpen = job.status === "Open";

  const summary = [
    { Icon: Banknote, label: "Salary", value: formatSalaryRange(job) },
    { Icon: MapPin, label: "Location", value: job.location },
    { Icon: Tags, label: "Category", value: job.category },
    { Icon: Briefcase, label: "Employment type", value: job.employmentType },
    {
      Icon: CalendarDays,
      label: "Date posted",
      value: formatAbsoluteDate(job.postedAt),
    },
  ];

  return (
    <>
      <Container className="py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-fg-muted transition-colors duration-150 hover:text-primary"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          All jobs
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
          <article className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="category">{job.category}</Badge>
              <Badge variant={isOpen ? "open" : "closed"}>{job.status}</Badge>
              <span className="text-sm text-fg-muted">
                Posted {formatRelativeDate(job.postedAt)}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-fg sm:text-4xl">
              {job.title}
            </h1>

            <p className="mt-2 text-base font-semibold text-fg-muted">
              {job.employerName}
            </p>

            <section className="mt-10">
              <h2 className="text-lg font-bold tracking-tight text-fg">
                About this role
              </h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-fg-muted">
                {job.description}
              </p>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-bold tracking-tight text-fg">
                Requirements
              </h2>
              <ul className="mt-4 space-y-3">
                {job.requirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-brand-700"
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-[15px] leading-relaxed text-fg-muted">
                      {requirement}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-fg-subtle">
                Job summary
              </h2>

              <dl className="mt-4 space-y-4">
                {summary.map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold text-fg-subtle">
                        {label}
                      </dt>
                      <dd className="text-sm font-semibold text-fg">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-6 border-t border-line pt-6">
                {isOpen ? (
                  <Link href={`/jobs/${job.id}/apply`} className="block">
                    <Button size="lg" fullWidth>
                      Apply Now
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button size="lg" fullWidth disabled>
                      Applications closed
                    </Button>
                    <p className="mt-3 text-center text-xs text-fg-muted">
                      This employer is no longer accepting applications.
                    </p>
                  </>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </Container>

      {/* Mobile: keep the primary action reachable without scrolling back up. */}
      {isOpen && (
        <div className="sticky bottom-0 z-30 border-t border-line bg-surface/95 px-5 py-3 backdrop-blur-md lg:hidden">
          <Link href={`/jobs/${job.id}/apply`} className="block">
            <Button size="lg" fullWidth>
              Apply Now
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
