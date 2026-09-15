"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { JobForm } from "@/components/employer/JobForm";
import type { Job } from "@/types/job";

export default function NewJobPage() {
  const router = useRouter();

  const handleCreated = useCallback(
    (job: Job) => {
      router.push(`/employer?posted=${encodeURIComponent(job.title)}`);
    },
    [router],
  );

  return (
    <div className="bg-surface-muted">
      <Container className="max-w-3xl py-10 sm:py-14">
        <PageHeader
          title="Post a job"
          description="Publish a role to the job board. Everything here is shown to job seekers and used for search, filtering, and sorting."
          backHref="/employer"
          backLabel="Back to dashboard"
        />

        <Card className="mt-8 p-6 sm:p-8">
          <JobForm onCreated={handleCreated} />
        </Card>
      </Container>
    </div>
  );
}
