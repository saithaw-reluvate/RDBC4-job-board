"use client";

import { useCallback } from "react";
import { Check } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { JOB_CATEGORIES, type JobCategory } from "@/constants/categories";
import { JOB_LOCATIONS } from "@/constants/locations";
import { EMPLOYMENT_TYPES, JOB_STATUSES } from "@/constants/statuses";
import { createJob } from "@/lib/data/jobs";
import { useFormState } from "@/lib/forms/useFormState";
import {
  compactErrors,
  minLength,
  notBelow,
  positiveNumber,
  required,
} from "@/lib/forms/validators";
import type {
  EmploymentType,
  Job,
  JobStatus,
  SalaryPeriod,
} from "@/types/job";

const CURRENCIES = ["USD", "GBP", "EUR"] as const;
const PERIODS: { value: SalaryPeriod; label: string }[] = [
  { value: "year", label: "Per year" },
  { value: "month", label: "Per month" },
  { value: "hour", label: "Per hour" },
];

interface JobFormValues {
  title: string;
  category: string;
  location: string;
  employmentType: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryPeriod: string;
  description: string;
  requirements: string;
  status: string;
  [key: string]: string;
}

const INITIAL_VALUES: JobFormValues = {
  title: "",
  category: JOB_CATEGORIES[0],
  location: JOB_LOCATIONS[0],
  employmentType: EMPLOYMENT_TYPES[0],
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "USD",
  salaryPeriod: "year",
  description: "",
  requirements: "",
  status: "Open",
};

/** Section wrapper — keeps the form legible without repeating markup. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 border-t border-line pt-7 first:border-0 first:pt-0">
      <div>
        <h2 className="text-base font-bold text-fg">{title}</h2>
        <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function JobForm({ onCreated }: { onCreated: (job: Job) => void }) {
  const validate = useCallback(
    (values: JobFormValues) =>
      compactErrors<JobFormValues>({
        title: required(values.title, "Job title"),
        description: minLength(values.description, 40, "Description"),
        requirements: required(values.requirements, "Requirements"),
        salaryMin: positiveNumber(values.salaryMin, "Minimum salary"),
        salaryMax:
          positiveNumber(values.salaryMax, "Maximum salary") ??
          notBelow(
            values.salaryMax,
            values.salaryMin,
            "Maximum salary cannot be lower than the minimum.",
          ),
      }),
    [],
  );

  const onSubmit = useCallback(
    async (values: JobFormValues) => {
      const job = await createJob({
        title: values.title.trim(),
        description: values.description.trim(),
        requirements: values.requirements
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        location: values.location,
        status: values.status as JobStatus,
        category: values.category as JobCategory,
        salaryMin: Number(values.salaryMin),
        salaryMax: Number(values.salaryMax),
        salaryCurrency: values.salaryCurrency,
        salaryPeriod: values.salaryPeriod as SalaryPeriod,
        employmentType: values.employmentType as EmploymentType,
      });
      onCreated(job);
    },
    [onCreated],
  );

  const form = useFormState<JobFormValues>({
    initialValues: INITIAL_VALUES,
    validate,
    onSubmit,
  });

  return (
    <form ref={form.formRef} onSubmit={form.handleSubmit} noValidate className="space-y-7">
      <FormSection
        title="Basics"
        description="How the role appears in search results and listings."
      >
        <Field id="title" label="Job title" required error={form.errorFor("title")}>
          <Input
            {...form.fieldProps("title")}
            type="text"
            placeholder="Senior Frontend Engineer"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="category" label="Category" required>
            <Select {...form.fieldProps("category")}>
              {JOB_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="location" label="Location" required>
            <Select {...form.fieldProps("location")}>
              {JOB_LOCATIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field id="employmentType" label="Employment type" required>
          <Select {...form.fieldProps("employmentType")}>
            {EMPLOYMENT_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>

      <FormSection
        title="Compensation"
        description="Used to sort listings by salary, so a range is required."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="salaryMin"
            label="Minimum salary"
            required
            error={form.errorFor("salaryMin")}
          >
            <Input
              {...form.fieldProps("salaryMin")}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="120000"
            />
          </Field>

          <Field
            id="salaryMax"
            label="Maximum salary"
            required
            error={form.errorFor("salaryMax")}
          >
            <Input
              {...form.fieldProps("salaryMax")}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="160000"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="salaryCurrency" label="Currency" required>
            <Select {...form.fieldProps("salaryCurrency")}>
              {CURRENCIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="salaryPeriod" label="Pay period" required>
            <Select {...form.fieldProps("salaryPeriod")}>
              {PERIODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Details"
        description="What the role involves and what you are looking for."
      >
        <Field
          id="description"
          label="Description"
          required
          hint="Describe the role, the team, and what success looks like."
          error={form.errorFor("description")}
        >
          <Textarea
            {...form.fieldProps("description", { hasHint: true })}
            rows={7}
            placeholder="We are looking for…"
          />
        </Field>

        <Field
          id="requirements"
          label="Requirements"
          required
          hint="One requirement per line."
          error={form.errorFor("requirements")}
        >
          <Textarea
            {...form.fieldProps("requirements", { hasHint: true })}
            rows={6}
            placeholder={"5+ years of React experience\nStrong TypeScript fundamentals"}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Status"
        description="Open jobs accept applications. Closed jobs stay visible but cannot be applied to."
      >
        <Field id="status" label="Status" required>
          <Select {...form.fieldProps("status")} className="sm:max-w-xs">
            {JOB_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>

      {form.submitError && <Alert variant="error">{form.submitError}</Alert>}

      <div className="flex justify-end border-t border-line pt-6">
        <Button type="submit" size="lg" loading={form.submitting}>
          {!form.submitting && <Check aria-hidden className="h-4 w-4" />}
          {form.submitting ? "Publishing…" : "Publish Job"}
        </Button>
      </div>
    </form>
  );
}
