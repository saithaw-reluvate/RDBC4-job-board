"use client";

import { useCallback } from "react";
import { Send } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { submitApplication } from "@/lib/data/applications";
import { useFormState } from "@/lib/forms/useFormState";
import {
  compactErrors,
  email as validateEmail,
  maxLength,
  minLength,
  required,
} from "@/lib/forms/validators";
import type { Application } from "@/types/application";

const COVER_LETTER_MIN = 50;
const COVER_LETTER_MAX = 2000;

interface ApplicationFormValues {
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
  [key: string]: string;
}

const INITIAL_VALUES: ApplicationFormValues = {
  applicantName: "",
  applicantEmail: "",
  coverLetter: "",
};

interface ApplicationFormProps {
  jobId: string;
  onSubmitted: (application: Application) => void;
}

/** Applicant name, email, and cover letter — the fields mandated by the brief. */
export function ApplicationForm({ jobId, onSubmitted }: ApplicationFormProps) {
  const validate = useCallback(
    (values: ApplicationFormValues) =>
      compactErrors<ApplicationFormValues>({
        applicantName: required(values.applicantName, "Full name"),
        applicantEmail: validateEmail(values.applicantEmail),
        coverLetter:
          minLength(values.coverLetter, COVER_LETTER_MIN, "Cover letter") ??
          maxLength(values.coverLetter, COVER_LETTER_MAX, "Cover letter"),
      }),
    [],
  );

  const onSubmit = useCallback(
    async (values: ApplicationFormValues) => {
      const application = await submitApplication({
        jobId,
        applicantName: values.applicantName.trim(),
        applicantEmail: values.applicantEmail.trim(),
        coverLetter: values.coverLetter.trim(),
      });
      onSubmitted(application);
    },
    [jobId, onSubmitted],
  );

  const form = useFormState<ApplicationFormValues>({
    initialValues: INITIAL_VALUES,
    validate,
    onSubmit,
  });

  const coverLetterLength = form.values.coverLetter.trim().length;

  return (
    <form ref={form.formRef} onSubmit={form.handleSubmit} noValidate className="space-y-5">
      <Field
        id="applicantName"
        label="Full name"
        required
        error={form.errorFor("applicantName")}
      >
        <Input
          {...form.fieldProps("applicantName")}
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
        />
      </Field>

      <Field
        id="applicantEmail"
        label="Email address"
        required
        hint="The employer will use this to contact you."
        error={form.errorFor("applicantEmail")}
      >
        <Input
          {...form.fieldProps("applicantEmail", { hasHint: true })}
          type="email"
          autoComplete="email"
          placeholder="jane@example.com"
        />
      </Field>

      <Field
        id="coverLetter"
        label="Cover letter"
        required
        hint={`Tell the employer why you are a good fit. Minimum ${COVER_LETTER_MIN} characters.`}
        error={form.errorFor("coverLetter")}
      >
        <Textarea
          {...form.fieldProps("coverLetter", { hasHint: true })}
          rows={9}
          maxLength={COVER_LETTER_MAX}
          placeholder="I am applying because…"
        />
        <p className="text-right text-xs tabular-nums text-fg-subtle">
          {coverLetterLength} / {COVER_LETTER_MAX}
        </p>
      </Field>

      {form.submitError && <Alert variant="error">{form.submitError}</Alert>}

      <Button type="submit" size="lg" fullWidth loading={form.submitting}>
        {!form.submitting && <Send aria-hidden className="h-4 w-4" />}
        {form.submitting ? "Submitting…" : "Submit Application"}
      </Button>
    </form>
  );
}
