import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { JobCard } from "@/components/jobs/JobCard";
import type { Job } from "@/types/job";

interface JobListProps {
  jobs: Job[];
  loading: boolean;
  filtersActive: boolean;
  onClearFilters: () => void;
}

function JobCardSkeleton() {
  return (
    <Card className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-6 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-5/6" />
      <Skeleton className="mt-6 h-4 w-2/3" />
    </Card>
  );
}

export function JobList({
  jobs,
  loading,
  filtersActive,
  onClearFilters,
}: JobListProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading jobs"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <JobCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="h-5 w-5" />}
        title="No jobs match your search"
        description={
          filtersActive
            ? "Try a different search term, or clear your filters to see everything."
            : "There are no job listings to show right now. Please check back soon."
        }
        action={
          filtersActive ? (
            <Button variant="secondary" onClick={onClearFilters}>
              Clear all filters
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
