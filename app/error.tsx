"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { isApiError } from "@/lib/api/errors";

/**
 * The generic failure boundary.
 *
 * It states what happened and offers a way forward. It does not apologise and
 * it does not say "something went wrong" — and it never renders an order's
 * access token, which is why the request id is the only identifier here.
 */
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
    <section className="mx-auto max-w-[1600px] px-4 py-24 sm:px-8">
      <h1 className="text-title font-display font-semibold">This page did not load</h1>
      <p className="prose-body text-slate mt-4">
        The shop is still here. Try again, and if it keeps happening, get in touch and quote the
        reference below.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
      </div>

      {requestId !== null && (
        <p className="text-detail text-slate mt-8">
          Reference <span className="font-medium tabular-nums">{requestId}</span>
        </p>
      )}
    </section>
  );
}
