"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced for the developer; users never see internal detail.
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight text-fg">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-fg-muted">
        An unexpected error stopped this page from loading. Trying again will
        usually fix it.
      </p>
      <Button onClick={reset} className="mt-7">
        <RotateCcw aria-hidden className="h-4 w-4" />
        Try again
      </Button>
    </Container>
  );
}
