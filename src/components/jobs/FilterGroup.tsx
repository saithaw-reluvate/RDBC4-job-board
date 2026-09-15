"use client";

import { MapPin, Tags } from "lucide-react";

import { Select } from "@/components/ui/Select";
import { JOB_CATEGORIES } from "@/constants/categories";
import { JOB_LOCATIONS } from "@/constants/locations";
import { cn } from "@/lib/utils/cn";

interface FilterGroupProps {
  category: string;
  location: string;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  className?: string;
}

/** Category and location filters — both mandated by the brief. */
export function FilterGroup({
  category,
  location,
  onCategoryChange,
  onLocationChange,
  className,
}: FilterGroupProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <Select
        aria-label="Filter by category"
        icon={<Tags className="h-4 w-4" />}
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
      >
        <option value="">All categories</option>
        {JOB_CATEGORIES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by location"
        icon={<MapPin className="h-4 w-4" />}
        value={location}
        onChange={(event) => onLocationChange(event.target.value)}
      >
        <option value="">All locations</option>
        {JOB_LOCATIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  );
}
