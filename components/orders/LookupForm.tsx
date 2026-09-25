"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { flushSync } from "react-dom";

import { OrderView } from "@/components/orders/OrderView";
import { Button } from "@/components/ui/Button";
import { Field, controlClass } from "@/components/ui/Field";
import { ApiUnreachableError, isApiError } from "@/lib/api/errors";
import { lookupOrder } from "@/lib/api/orders";
import type { Order } from "@/lib/api/types";
import { readOrderRecords, type OrderRecord } from "@/lib/orders/record";

/**
 * The fallback for a customer without their email link, at twenty attempts an
 * hour — the lowest limit in the API.
 *
 * Prefilled from this device's order record, because a customer guessing which
 * address they used spends that budget without ever learning which half was
 * wrong: the API answers a wrong email and an unknown number identically.
 */

type Problem = "not_found" | "throttled" | "unreachable" | "error";

const PROBLEM_COPY: Record<Problem, string> = {
  // Never names a field. Saying which one was wrong would confirm which email
  // placed which order, and the API refuses to for exactly that reason.
  not_found:
    "We could not find an order with that number and email. Check both, including the dashes in the order number.",
  throttled:
    "There have been too many lookups from your network in the last hour. The limit is low to keep orders private; please try again later.",
  unreachable: "We could not reach the shop. Check your connection and try again.",
  error: "The shop could not look your order up just now. Please try again in a little while.",
};

const noopSubscribe = () => () => {};

function toProblem(error: unknown): Problem {
  if (error instanceof ApiUnreachableError) return "unreachable";
  if (!isApiError(error)) return "error";
  if (error.code === "not_found") return "not_found";
  if (error.code === "throttled") return "throttled";
  return "error";
}

export function LookupForm() {
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const records = ready ? readOrderRecords() : [];
  const latest = records[0];

  const [submitting, setSubmitting] = useState(false);
  // Which recent order's "View" started the lookup, so its spinner shows there
  // rather than on the form's button. Null for a lookup from the form.
  const [viewing, setViewing] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const foundHeadingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // The form and the order replace each other, so focus would otherwise fall
  // to <body> and a keyboard or screen-reader user would start again from the
  // top of the page. Synchronous, so the target exists before it is focused.
  function show(next: Order | null) {
    flushSync(() => setOrder(next));
    if (next === null) {
      formRef.current?.querySelector<HTMLInputElement>('input[name="order_number"]')?.focus();
    } else {
      foundHeadingRef.current?.focus();
    }
  }

  async function find(orderNumber: string, email: string, fromRecord = false) {
    // aria-disabled rather than disabled keeps focus on the button, so the
    // guard against a second submit lives here.
    if (submitting) return;
    setSubmitting(true);
    setViewing(fromRecord ? orderNumber : null);
    setProblem(null);
    try {
      const found = await lookupOrder({ orderNumber, email });
      setSubmitting(false);
      show(found);
    } catch (error) {
      setSubmitting(false);
      setProblem(toProblem(error));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void find(
      String(data.get("order_number") ?? "").trim(),
      String(data.get("email") ?? "").trim(),
    );
  }

  if (order !== null) {
    return (
      <div className="flex flex-col gap-10">
        <h2 ref={foundHeadingRef} tabIndex={-1} className="text-heading font-display font-semibold">
          Order found
        </h2>
        <OrderView order={order} />
        <p>
          <Button variant="ghost" className="border-ink border" onClick={() => show(null)}>
            Look up another order
          </Button>
        </p>
      </div>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-12">
      <form
        ref={formRef}
        // Keyed on the record so the prefill lands once the device's storage
        // is readable; the server renders the same form, empty.
        key={latest?.orderNumber ?? "empty"}
        onSubmit={handleSubmit}
        aria-describedby={problem === null ? undefined : "lookup-problem"}
        className="flex flex-col gap-5"
      >
        <Field label="Order number" hint="For example, TL-2026-000142.">
          {(control) => (
            <input
              {...control}
              name="order_number"
              required
              autoComplete="off"
              spellCheck={false}
              defaultValue={latest?.orderNumber}
              className={controlClass}
            />
          )}
        </Field>
        <Field label="Email" hint="The one you ordered with.">
          {(control) => (
            <input
              {...control}
              name="email"
              type="email"
              required
              autoComplete="email"
              spellCheck={false}
              defaultValue={latest?.email}
              className={controlClass}
            />
          )}
        </Field>

        {problem !== null && (
          // Assertive and attached to the form, not to either field: the API
          // does not say which one was wrong, so neither is marked invalid.
          <p
            id="lookup-problem"
            role="alert"
            className="border-ink text-ui border-l-2 pl-4 font-medium"
          >
            {PROBLEM_COPY[problem]}
          </p>
        )}

        <Button type="submit" pending={submitting && viewing === null} className="self-start">
          {submitting ? "Finding your order…" : "Find order"}
        </Button>
      </form>

      {records.length > 0 && (
        <RecentOrders
          records={records}
          viewing={submitting ? viewing : null}
          onFind={(orderNumber, email) => find(orderNumber, email, true)}
        />
      )}
    </div>
  );
}

function RecentOrders({
  records,
  viewing,
  onFind,
}: {
  records: OrderRecord[];
  viewing: string | null;
  onFind: (orderNumber: string, email: string) => void;
}) {
  return (
    <section aria-labelledby="recent-orders-heading" className="flex flex-col gap-4">
      <h2 id="recent-orders-heading" className="text-heading font-display font-semibold">
        Ordered on this device
      </h2>
      <ul className="border-wash border-t">
        {records.map((record) => (
          <li
            key={record.orderNumber}
            className="border-wash flex items-center justify-between gap-4 border-b py-2"
          >
            <span className="text-ui font-medium tabular-nums">{record.orderNumber}</span>
            <Button
              variant="ghost"
              aria-label={`View order ${record.orderNumber}`}
              pending={viewing === record.orderNumber}
              onClick={() => onFind(record.orderNumber, record.email)}
            >
              View
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
