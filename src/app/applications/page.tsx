import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApplicationHistoryList } from "@/components/applications/ApplicationHistoryList";

export const metadata: Metadata = { title: "My Applications" };

export default function MyApplicationsPage() {
  return (
    <Container className="py-10 sm:py-12">
      <PageHeader
        title="My Applications"
        description="Every job you have applied to, most recent first."
      />

      <div className="mt-8">
        <ApplicationHistoryList />
      </div>
    </Container>
  );
}
