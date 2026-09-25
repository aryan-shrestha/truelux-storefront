"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

import { discardHandoff } from "@/lib/orders/handoff";
import { readOrderRecords } from "@/lib/orders/record";

const noopSubscribe = () => () => {};

/**
 * The failure landing's route back to the order, which the backend's redirect
 * does not name. Only this device's record can, and the server has no copy of
 * it — so this fills in after hydration.
 */
export function RecentOrder() {
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const latest = ready ? readOrderRecords()[0] : undefined;

  // The handoff is over and it did not end in a payment. Left in place, the
  // marker would clear the bag the day this order's email link is opened.
  useEffect(() => {
    discardHandoff();
  }, []);

  const lookupLink = (text: string) => (
    <Link href="/orders/lookup" className="decoration-indigo underline underline-offset-4">
      {text}
    </Link>
  );

  if (latest === undefined) {
    return (
      <p className="prose-body">
        Your order number is in your confirmation email. With it and the email you ordered with, you
        can {lookupLink("look your order up")}.
      </p>
    );
  }

  return (
    <p className="prose-body">
      The latest order from this device is{" "}
      <span className="font-medium tabular-nums select-all">{latest.orderNumber}</span>.{" "}
      {lookupLink("See its status")}.
    </p>
  );
}
