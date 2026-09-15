import { Briefcase, CheckCircle2, Users } from "lucide-react";

import { Skeleton } from "@/components/ui/Skeleton";

interface EmployerStatsProps {
  totalJobs: number;
  openJobs: number;
  totalApplications: number;
  loading: boolean;
}

export function EmployerStats({
  totalJobs,
  openJobs,
  totalApplications,
  loading,
}: EmployerStatsProps) {
  const stats = [
    { Icon: Briefcase, label: "Jobs posted", value: totalJobs },
    { Icon: CheckCircle2, label: "Currently open", value: openJobs },
    { Icon: Users, label: "Applications", value: totalApplications },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {stats.map(({ Icon, label, value }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5"
        >
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-fg-onDark"
          >
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-fg-onDarkMuted">
              {label}
            </dt>
            <dd className="text-xl font-extrabold tabular-nums text-fg-onDark">
              {loading ? <Skeleton className="h-6 w-10 bg-white/20" /> : value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
