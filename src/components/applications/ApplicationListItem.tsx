"use client";

import { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";

import { formatAbsoluteDate } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils/cn";
import type { Application } from "@/types/application";

/** One applicant, expanding to reveal their email and full cover letter. */
export function ApplicationListItem({
  application,
}: {
  application: Application;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = `application-${application.id}`;

  return (
    <li className="rounded-lg border border-line bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="flex w-full items-start gap-3 rounded-lg px-4 py-3.5 text-left transition-colors duration-150 hover:bg-surface-muted"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-fg">
              {application.applicantName}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-fg-muted">
            Applied {formatAbsoluteDate(application.submittedAt)}
          </p>
        </div>

        <ChevronDown
          aria-hidden
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-fg-muted transition-transform duration-150 ease-out",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div id={contentId} className="space-y-3 border-t border-line px-4 py-4">
          <a
            href={`mailto:${application.applicantEmail}`}
            className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-primary hover:underline"
          >
            <Mail aria-hidden className="h-4 w-4" />
            {application.applicantEmail}
          </a>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-fg-subtle">
              Cover letter
            </h4>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-fg-muted">
              {application.coverLetter}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}
