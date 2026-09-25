"use client";

import Link from "next/link";
import { Suspense, use, useState, useSyncExternalStore } from "react";

import { OrderView } from "@/components/orders/OrderView";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiUnreachableError, isApiError } from "@/lib/api/errors";
import { getOrder } from "@/lib/api/orders";
import type { Order } from "@/lib/api/types";
import { useCart } from "@/lib/cart/use-cart";
import { takeHandoff } from "@/lib/orders/handoff";
import { readOrderRecords, recordOrder } from "@/lib/orders/record";

/**
 * The order behind an access token, fetched from the browser (ADR 0001).
 *
 * The token is a bearer credential, so it goes to `getOrder` and nowhere else:
 * not into storage, not into copy, not into an announcement.
 *
 * The fetch waits for hydration. The server renders only the loading surface,
 * so the token never reaches a server-side request.
 */

type Result =
  | { kind: "ok"; order: Order }
  | { kind: "not_found" | "throttled" | "unreachable" }
  | { kind: "error"; requestId: string | null };

type Failure = Exclude<Result["kind"], "ok">;

const FAILURE_TITLE: Record<Failure, string> = {
  // Not "that link is wrong": it may simply be somebody else's URL, and the
  // API deliberately answers an unknown token and a wrong one identically.
  not_found: "We could not find that order.",
  throttled: "The shop has had too many requests from your network in the last hour.",
  unreachable: "We could not reach the shop, so we cannot show your order right now.",
  error: "The shop could not show your order just now.",
};

const noopSubscribe = () => () => {};

async function loadOrder(accessToken: string, clearCart: () => void): Promise<Result> {
  let order: Order;
  try {
    order = await getOrder({ accessToken });
  } catch (error) {
    if (error instanceof ApiUnreachableError) return { kind: "unreachable" };
    if (!isApiError(error)) return { kind: "error", requestId: null };
    if (error.code === "not_found") return { kind: "not_found" };
    if (error.code === "throttled") return { kind: "throttled" };
    return { kind: "error", requestId: error.requestId };
  }

  // Only when this browser handed this order to Khalti. The same URL arrives
  // from the confirmation email, and opening that must not empty today's bag.
  if (takeHandoff(order.orderNumber)) clearCart();

  const existing = readOrderRecords().find((entry) => entry.orderNumber === order.orderNumber);
  recordOrder({
    orderNumber: order.orderNumber,
    email: order.email,
    recordedAt: existing?.recordedAt ?? new Date().toISOString(),
    paymentMethod: order.paymentMethod,
    amounts: { subtotal: order.subtotal, shippingFee: order.shippingFee, total: order.total },
  });

  return { kind: "ok", order };
}

export function OrderByToken({ accessToken }: { accessToken: string }) {
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [announcement, setAnnouncement] = useState("");

  return (
    <>
      {/* Mounted from the first render, so the change to it is announced. A
          region inserted together with its text is often read by nobody —
          and the person listening may have just paid. */}
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {ready ? (
        // Keyed so a second token in the same tab gets its own fetch rather
        // than the first order's promise.
        <OrderLoader key={accessToken} accessToken={accessToken} onSettled={setAnnouncement} />
      ) : (
        <Loading />
      )}
    </>
  );
}

function OrderLoader({
  accessToken,
  onSettled,
}: {
  accessToken: string;
  onSettled: (announcement: string) => void;
}) {
  const { clear } = useCart();
  // Created here, in a component that never suspends, so the promise survives
  // the Suspense retry below. Created inside the suspending child it would be
  // discarded with that render and refetched forever.
  const [result] = useState(() =>
    loadOrder(accessToken, clear).then((settled) => {
      onSettled(
        settled.kind === "ok"
          ? `Order ${settled.order.orderNumber} is shown below.`
          : FAILURE_TITLE[settled.kind],
      );
      return settled;
    }),
  );

  return (
    <Suspense fallback={<Loading />}>
      <OrderResult result={result} />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="flex max-w-2xl flex-col gap-6" aria-busy>
      {/* Worded for the customer who has just come back from paying, because
          that is who waits on this page longest. */}
      <p className="text-ui">Getting your order from the shop…</p>
      <p className="text-detail text-slate">
        If you have just paid, this is where your payment is confirmed. Please keep this page open.
      </p>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-56" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex flex-col">
        {[0, 1, 2].map((line) => (
          <div key={line} className="border-wash flex justify-between gap-4 border-b py-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderResult({ result }: { result: Promise<Result> }) {
  const settled = use(result);

  if (settled.kind === "ok") return <OrderView order={settled.order} />;

  const lookupLink = (
    <Link href="/orders/lookup" className="decoration-indigo underline underline-offset-4">
      look your order up
    </Link>
  );

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <h2 className="text-heading font-display font-semibold">{FAILURE_TITLE[settled.kind]}</h2>
      {settled.kind === "not_found" && (
        <p className="prose-body">
          With your order number and the email you ordered with, you can {lookupLink}.
        </p>
      )}
      {settled.kind === "throttled" && (
        <p className="prose-body">
          Nothing is wrong with your order. Please wait a while before refreshing this page.
        </p>
      )}
      {(settled.kind === "unreachable" || settled.kind === "error") && (
        <p className="prose-body">
          This does not mean anything is wrong with your order. Check your connection and refresh
          this page in a little while.
        </p>
      )}
      {settled.kind === "error" && settled.requestId !== null && (
        <p className="text-detail text-slate">Reference: {settled.requestId}</p>
      )}
    </div>
  );
}
