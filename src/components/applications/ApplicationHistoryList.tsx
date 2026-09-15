"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, CalendarDays, MapPin } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { listMyApplications } from "@/lib/data/applications";
import { formatAbsoluteDate } from "@/lib/utils/formatDate";
import type { SeekerApplication } from "@/types/application";

function ApplicationRowSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="mt-3 h-4 w-80" />
    </Card>
  );
}

/** A seeker's own application history — read-only, no status, no actions. */
export function ApplicationHistoryList() {
  const [applications, setApplications] = useState<SeekerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listMyApplications()
      .then((result) => {
        if (active) setApplications(result);
      })
      .catch(() => {
        if (active) {
          setError("We could not load your applications. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) return <Alert variant="error">{error}</Alert>;

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading your applications"
        className="space-y-4"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <ApplicationRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="h-5 w-5" />}
        title="You have not applied to any jobs yet"
        description="When you apply to a job, it will appear here."
        action={
          <Link href="/">
            <Button>Browse jobs</Button>
          </Link>
        }
      />
    );
  }

  return (
    <ul className="space-y-4">
      {applications.map(({ id, submittedAt, job }) => (
        <li key={id}>
          <Card as="article" interactive className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-fg">
                  <Link href={`/jobs/${job.id}`} className="hover:text-primary">
                    {job.title}
                  </Link>
                </h2>
                <p className="mt-0.5 text-sm font-semibold text-fg-muted">
                  {job.employerName}
                </p>
              </div>
              <Badge variant={job.status === "Open" ? "open" : "closed"}>
                {job.status}
              </Badge>
            </div>

            <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-fg-muted">
              <li className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden className="h-4 w-4 text-fg-subtle" />
                {job.location}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden className="h-4 w-4 text-fg-subtle" />
                Applied {formatAbsoluteDate(submittedAt)}
              </li>
            </ul>
          </Card>
        </li>
      ))}
    </ul>
  );
}
