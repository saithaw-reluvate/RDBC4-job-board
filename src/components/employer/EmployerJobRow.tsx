"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  Lock,
  MapPin,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton, iconButtonClasses } from "@/components/ui/IconButton";
import { formatRelativeDate } from "@/lib/utils/formatDate";
import { formatSalaryRange } from "@/lib/utils/formatSalary";
import type { Job } from "@/types/job";

interface EmployerJobRowProps {
  job: Job;
  applicationCount: number;
  busy: boolean;
  onViewApplications: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export function EmployerJobRow({
  job,
  applicationCount,
  busy,
  onViewApplications,
  onToggleStatus,
  onDelete,
}: EmployerJobRowProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isOpen = job.status === "Open";

  return (
    <Card as="article" className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-fg">{job.title}</h3>
            <Badge variant={isOpen ? "open" : "closed"}>{job.status}</Badge>
            <Badge variant="category">{job.category}</Badge>
          </div>

          <ul className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-fg-muted">
            <li className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden className="h-4 w-4 text-fg-subtle" />
              {job.location}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden className="h-4 w-4 text-fg-subtle" />
              Posted {formatRelativeDate(job.postedAt)}
            </li>
            <li className="tabular-nums">{formatSalaryRange(job)}</li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onViewApplications}>
            <Users aria-hidden className="h-4 w-4" />
            Applications
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-soft px-1.5 text-xs font-bold tabular-nums text-brand-700">
              {applicationCount}
            </span>
          </Button>

          <Link
            href={`/jobs/${job.id}`}
            aria-label="View public listing"
            title="View public listing"
            className={iconButtonClasses("subtle")}
          >
            <ExternalLink aria-hidden className="h-4 w-4" />
          </Link>

          <IconButton
            label={isOpen ? "Close this job" : "Reopen this job"}
            variant="subtle"
            disabled={busy}
            onClick={onToggleStatus}
          >
            {isOpen ? (
              <Lock aria-hidden className="h-4 w-4" />
            ) : (
              <Unlock aria-hidden className="h-4 w-4" />
            )}
          </IconButton>

          <IconButton
            label="Delete this job"
            variant="danger"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 aria-hidden className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {confirmingDelete && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3">
          <p className="text-sm font-semibold text-danger">
            Delete “{job.title}”? Its applications will be removed too.
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={busy}
              onClick={() => {
                setConfirmingDelete(false);
                onDelete();
              }}
            >
              Delete job
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
