import { Suspense } from "react";
import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmployerDashboard } from "@/components/employer/EmployerDashboard";

export const metadata: Metadata = { title: "Employer Dashboard" };

function DashboardFallback() {
  return (
    <Container className="py-14">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-4 h-4 w-80" />
    </Container>
  );
}

export default function EmployerPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <EmployerDashboard />
    </Suspense>
  );
}
