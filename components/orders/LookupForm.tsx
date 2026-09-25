"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { flushSync } from "react-dom";

import { OrderView } from "@/components/orders/OrderView";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ApiUnreachableError, isApiError } from "@/lib/api/errors";
import { lookupOrder } from "@/lib/api/orders";
import type { Order } from "@/lib/api/types";
import { readOrderRecords, type OrderRecord } from "@/lib/orders/record";

// Prefilled from this device's record: the API answers a wrong email and an
// unknown number identically, at twenty attempts an hour.

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
  const [viewing, setViewing] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const foundHeadingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // The form and the order replace each other; without this, focus falls to <body>.
  function show(next: Order | null) {
    flushSync(() => setOrder(next));
    if (next === null) {
      formRef.current?.querySelector<HTMLInputElement>('input[name="order_number"]')?.focus();
    } else {
      foundHeadingRef.current?.focus();
    }
  }

  async function find(orderNumber: string, email: string, fromRecord = false) {
    // The button stays focusable while busy, so the guard lives here.
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
        <h2 ref={foundHeadingRef} tabIndex={-1} className="text-2xl">
          Order found
        </h2>
        <OrderView order={order} />
        <Button variant="outline" className="self-start" onClick={() => show(null)}>
          Look up another order
        </Button>
      </div>
    );
  }

  const formBusy = submitting && viewing === null;

  return (
    <div className="flex max-w-xl flex-col gap-12">
      <form
        ref={formRef}
        // Keyed so the prefill lands once storage is readable; the server renders it empty.
        key={latest?.orderNumber ?? "empty"}
        onSubmit={handleSubmit}
        aria-describedby={problem === null ? undefined : "lookup-problem"}
        className="flex flex-col gap-6"
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="order_number">Order number</FieldLabel>
            <Input
              id="order_number"
              name="order_number"
              aria-describedby="order_number-hint"
              required
              autoComplete="off"
              spellCheck={false}
              defaultValue={latest?.orderNumber}
            />
            <FieldDescription id="order_number-hint">For example, TL-2026-000142.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="lookup-email">Email</FieldLabel>
            <Input
              id="lookup-email"
              name="email"
              type="email"
              aria-describedby="lookup-email-hint"
              required
              autoComplete="email"
              spellCheck={false}
              defaultValue={latest?.email}
            />
            <FieldDescription id="lookup-email-hint">The one you ordered with.</FieldDescription>
          </Field>
        </FieldGroup>

        {problem !== null && (
          // Attached to the form, not a field: the API does not say which one was wrong.
          <Alert id="lookup-problem" variant="destructive">
            <AlertDescription>{PROBLEM_COPY[problem]}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" aria-disabled={formBusy || undefined} className="self-start">
          {formBusy && <Spinner data-icon="inline-start" aria-hidden />}
          {formBusy ? "Finding your order…" : "Find order"}
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
      <h2 id="recent-orders-heading" className="text-2xl">
        Ordered on this device
      </h2>
      <Separator />
      <ul>
        {records.map((record) => {
          const busy = viewing === record.orderNumber;
          return (
            <li
              key={record.orderNumber}
              className="flex items-center justify-between gap-4 border-b py-2"
            >
              <span className="font-medium tabular-nums">{record.orderNumber}</span>
              <Button
                variant="ghost"
                aria-label={`View order ${record.orderNumber}`}
                aria-disabled={busy || undefined}
                onClick={() => onFind(record.orderNumber, record.email)}
              >
                {busy && <Spinner data-icon="inline-start" aria-hidden />}
                View
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
