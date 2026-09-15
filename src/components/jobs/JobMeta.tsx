import { Banknote, Briefcase, CalendarDays, MapPin } from "lucide-react";

import { formatRelativeDate } from "@/lib/utils/formatDate";
import { formatSalaryRange } from "@/lib/utils/formatSalary";
import { cn } from "@/lib/utils/cn";
import type { Job } from "@/types/job";

/** Icon + text meta row shared by the job card and the job detail page. */
export function JobMeta({ job, className }: { job: Job; className?: string }) {
  const items = [
    { Icon: MapPin, label: job.location },
    { Icon: Banknote, label: formatSalaryRange(job) },
    { Icon: Briefcase, label: job.employmentType },
    { Icon: CalendarDays, label: formatRelativeDate(job.postedAt) },
  ];

  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-muted",
        className,
      )}
    >
      {items.map(({ Icon, label }) => (
        <li key={label} className="inline-flex items-center gap-1.5">
          <Icon aria-hidden className="h-4 w-4 shrink-0 text-fg-subtle" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
