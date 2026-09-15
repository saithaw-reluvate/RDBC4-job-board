"use client";

import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmployerJobRow } from "@/components/employer/EmployerJobRow";
import type { Job } from "@/types/job";

interface EmployerJobListProps {
  jobs: Job[];
  applicationCounts: Record<string, number>;
  loading: boolean;
  busyJobId: string | null;
  onViewApplications: (job: Job) => void;
  onToggleStatus: (job: Job) => void;
  onDelete: (job: Job) => void;
}

export function EmployerJobList({
  jobs,
  applicationCounts,
  loading,
  busyJobId,
  onViewApplications,
  onToggleStatus,
  onDelete,
}: EmployerJobListProps) {
  if (loading) {
    return (
      <div role="status" aria-label="Loading your jobs" className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="mt-3 h-4 w-80" />
          </Card>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="h-5 w-5" />}
        title="You have not posted any jobs yet"
        description="Post your first role and it will appear here, along with every application it receives."
        action={
          <Link href="/employer/jobs/new">
            <Button>
              <Plus aria-hidden className="h-4 w-4" />
              Post a Job
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <EmployerJobRow
          key={job.id}
          job={job}
          applicationCount={applicationCounts[job.id] ?? 0}
          busy={busyJobId === job.id}
          onViewApplications={() => onViewApplications(job)}
          onToggleStatus={() => onToggleStatus(job)}
          onDelete={() => onDelete(job)}
        />
      ))}
    </div>
  );
}
