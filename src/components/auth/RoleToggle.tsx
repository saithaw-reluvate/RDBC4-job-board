"use client";

import { Building2, UserRound } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types/user";

const OPTIONS: { value: UserRole; label: string; Icon: typeof UserRound }[] = [
  { value: "seeker", label: "Job Seeker", Icon: UserRound },
  { value: "employer", label: "Employer", Icon: Building2 },
];

interface RoleToggleProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

/** Segmented account-type control for signup. */
export function RoleToggle({ value, onChange }: RoleToggleProps) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-fg">
        I am signing up as
      </legend>

      <div
        role="radiogroup"
        aria-label="Account type"
        className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface-muted p-1"
      >
        {OPTIONS.map(({ value: option, label, Icon }) => {
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold",
                "transition-all duration-150 ease-out",
                selected
                  ? "bg-surface text-primary shadow-card"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
