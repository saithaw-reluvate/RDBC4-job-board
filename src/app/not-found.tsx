import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-fg-subtle">
        Not found
      </p>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-fg">
        We could not find that page
      </h1>
      <p className="mt-3 max-w-md text-sm text-fg-muted">
        The job may have been removed, or the link may be incorrect.
      </p>
      <Link href="/" className="mt-7">
        <Button>Browse all jobs</Button>
      </Link>
    </Container>
  );
}
