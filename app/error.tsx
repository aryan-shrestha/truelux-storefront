"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/errors";

// Shows the request id and nothing else identifying: an order's access token must never render here.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const requestId = isApiError(error) ? error.requestId : null;

  return (
    <section className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 md:px-8">
      <h1 className="text-title">This page did not load</h1>
      <p className="max-w-prose text-muted-foreground">
        The shop is still here. Try again, and if it keeps happening, get in touch and quote the
        reference below.
      </p>
      <Button onClick={reset}>Try again</Button>
      {requestId !== null && (
        <p className="text-sm text-muted-foreground">
          Reference <span className="font-medium tabular-nums">{requestId}</span>
        </p>
      )}
    </section>
  );
}
