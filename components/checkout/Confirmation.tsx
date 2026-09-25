"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Price } from "@/components/ui/Price";
import { Skeleton } from "@/components/ui/Skeleton";
import { readOrderRecords } from "@/lib/orders/record";

const noopSubscribe = () => () => {};

/**
 * The cash-on-delivery confirmation: the only place a COD customer sees their
 * order number on screen.
 *
 * The number comes from the URL, so a refresh keeps it. Everything else comes
 * from this device's order record, which the server does not have — so it
 * fills in after hydration, and a second device simply shows the number.
 */
export function Confirmation({ orderNumber }: { orderNumber: string }) {
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const record = ready
    ? readOrderRecords().find((entry) => entry.orderNumber === orderNumber)
    : undefined;

  const lookupLink = (
    <Link href="/orders/lookup" className="decoration-indigo underline underline-offset-4">
      look your order up
    </Link>
  );

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <p className="text-detail text-slate">Order number</p>
        {/* Selectable text, never an image: it is what the customer copies. */}
        <p className="text-title font-display font-semibold tabular-nums select-all">
          {orderNumber}
        </p>
      </div>

      {!ready && <Skeleton className="h-32 w-full" />}

      {record?.amounts != null && (
        // Exactly as the API returned them at placement. Nothing here is
        // computed (ADR 0003).
        <dl className="border-wash text-ui grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 border-t pt-4 tabular-nums">
          <dt className="text-slate">Subtotal</dt>
          <dd className="text-right">
            <Price amount={record.amounts.subtotal} />
          </dd>
          <dt className="text-slate">Shipping</dt>
          <dd className="text-right">
            <Price amount={record.amounts.shippingFee} />
          </dd>
          <dt className="font-medium">Total, paid in cash on delivery</dt>
          <dd className="text-right font-medium">
            <Price amount={record.amounts.total} />
          </dd>
        </dl>
      )}

      {ready &&
        (record === undefined ? (
          <p className="prose-body">
            Keep this number. With it and the email you ordered with, you can {lookupLink}.
          </p>
        ) : (
          // The send is best-effort and silent on failure, which is why the
          // number above stays prominent rather than deferring to the email.
          <p className="prose-body">
            A confirmation is on its way to {record.email}. If it does not arrive, your order number
            and that email are all you need to {lookupLink}.
          </p>
        ))}

      <p>
        <Link href="/products" className="decoration-indigo underline underline-offset-4">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}
