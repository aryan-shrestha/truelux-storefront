import { useEffect, useState } from "react";

import { isApiError } from "@/lib/api/errors";
import { quoteCart } from "@/lib/api/orders";
import type { CartQuote } from "@/lib/api/types";
import type { CartLine } from "@/lib/cart/storage";

const DEBOUNCE_MS = 300;

export type LineProblem = "unavailable" | "insufficient";

export const LINE_PROBLEM_COPY: Record<LineProblem, string> = {
  unavailable: "This is no longer available.",
  insufficient: "There is not enough stock for this quantity.",
};

export type QuoteState =
  | { status: "pending" }
  | { status: "ready"; quote: CartQuote }
  | { status: "problems"; problems: Record<string, LineProblem> }
  | { status: "failed" };

type Settled = { lines: CartLine[]; district: string | null; state: QuoteState };

const PENDING: QuoteState = { status: "pending" };
const FAILED: QuoteState = { status: "failed" };

function toState(error: unknown): QuoteState {
  if (!isApiError(error)) return FAILED;

  if (error.code === "variant_unavailable") {
    const ids = error.details.variant_ids;
    const variantIds = Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string")
      : [];
    if (variantIds.length === 0) return FAILED;
    return {
      status: "problems",
      problems: Object.fromEntries(variantIds.map((id) => [id, "unavailable"])),
    };
  }

  if (error.code === "insufficient_stock" && typeof error.details.variant_id === "string") {
    return { status: "problems", problems: { [error.details.variant_id]: "insufficient" } };
  }

  return FAILED;
}

/**
 * Quotes the bag after it has been still for a moment. A response is shown only
 * while the lines and district it was asked for are still the current ones.
 */
export function useQuote(lines: CartLine[], district: string | null): QuoteState {
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    if (lines.length === 0) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      quoteCart(
        {
          items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
          district: district ?? undefined,
        },
        { signal: controller.signal },
      )
        .then((quote): QuoteState => ({ status: "ready", quote }), toState)
        .then((state) => {
          if (!controller.signal.aborted) setSettled({ lines, district, state });
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [lines, district]);

  return settled !== null && settled.lines === lines && settled.district === district
    ? settled.state
    : PENDING;
}
