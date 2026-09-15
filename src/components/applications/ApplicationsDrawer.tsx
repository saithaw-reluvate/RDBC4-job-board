"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApplicationListItem } from "@/components/applications/ApplicationListItem";
import { listApplications } from "@/lib/data/applications";
import type { Application } from "@/types/application";
import type { Job } from "@/types/job";

interface ApplicationsDrawerProps {
  job: Job | null;
  onClose: () => void;
}

/**
 * Applications for one job, shown in a slide-over rather than on a separate
 * page, so the employer keeps the dashboard context.
 */
export function ApplicationsDrawer({ job, onClose }: ApplicationsDrawerProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!job) return;

    let active = true;
    setLoading(true);
    setError(null);

    listApplications(job.id)
      .then((result) => {
        if (active) setApplications(result);
      })
      .catch(() => {
        if (active) setError("We could not load applications for this job.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [job]);

  if (!job) return null;

  const description = loading
    ? "Loading applications…"
    : `${applications.length} ${applications.length === 1 ? "application" : "applications"}`;

  return (
    <Drawer open onClose={onClose} title={job.title} description={description}>
      {loading && (
        <div role="status" aria-label="Loading applications" className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-line p-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && applications.length === 0 && (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="No applications yet"
          description="When job seekers apply to this listing, their applications will appear here."
        />
      )}

      {!loading && !error && applications.length > 0 && (
        <ul className="space-y-3">
          {applications.map((application) => (
            <ApplicationListItem key={application.id} application={application} />
          ))}
        </ul>
      )}
    </Drawer>
  );
}
