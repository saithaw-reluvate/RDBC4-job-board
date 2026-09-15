import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { JobMeta } from "@/components/jobs/JobMeta";
import type { Job } from "@/types/job";

export function JobCard({ job }: { job: Job }) {
  return (
    <Card as="article" interactive className="group relative flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Badge variant="category">{job.category}</Badge>
        <Badge variant={job.status === "Open" ? "open" : "closed"}>
          {job.status}
        </Badge>
      </div>

      <h3 className="mt-4 text-lg font-bold leading-snug tracking-tight text-fg">
        {/* Stretched link keeps the whole card clickable without nesting controls. */}
        <Link href={`/jobs/${job.id}`} className="before:absolute before:inset-0 before:rounded-xl">
          {job.title}
        </Link>
      </h3>

      <p className="mt-1 text-sm font-semibold text-fg-muted">
        {job.employerName}
      </p>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-fg-muted">
        {job.description}
      </p>

      <div className="mt-5 flex-1" />

      <JobMeta job={job} className="border-t border-line pt-4" />

      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        View details
        <ArrowRight
          aria-hidden
          className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
        />
      </span>
    </Card>
  );
}
