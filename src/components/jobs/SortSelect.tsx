"use client";

import { ArrowUpDown } from "lucide-react";

import { Select } from "@/components/ui/Select";
import { SORT_OPTIONS } from "@/constants/sortOptions";
import type { JobSort } from "@/types/job";

interface SortSelectProps {
  value: JobSort;
  onChange: (value: JobSort) => void;
  /** Relevance is only offered once there is something to be relevant to. */
  searchActive: boolean;
  className?: string;
}

export function SortSelect({
  value,
  onChange,
  searchActive,
  className,
}: SortSelectProps) {
  return (
    <Select
      aria-label="Sort jobs"
      icon={<ArrowUpDown className="h-4 w-4" />}
      value={value}
      onChange={(event) => onChange(event.target.value as JobSort)}
      className={className}
    >
      {SORT_OPTIONS.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.requiresSearch && !searchActive}
        >
          Sort: {option.label}
          {option.requiresSearch && !searchActive ? " (search first)" : ""}
        </option>
      ))}
    </Select>
  );
}
