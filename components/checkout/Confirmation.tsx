"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { readOrderRecords } from "@/lib/orders/record";

const noopSubscribe = () => () => {};

// The number comes from the URL, so a refresh keeps it; the amounts come from
// this device's order record, which the server cannot read.
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
    <Link href="/orders/lookup" className="underline underline-offset-4">
      look your order up
    </Link>
  );

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Order number</p>
        <p className="font-heading text-4xl tabular-nums select-all">{orderNumber}</p>
      </div>

      {!ready && <Skeleton className="h-32 w-full" />}

      {record !== undefined && (
        <dl className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 tabular-nums">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-right">
            <Price amount={record.amounts.subtotal} />
          </dd>
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="text-right">
            <Price amount={record.amounts.shippingFee} />
          </dd>
          <Separator className="col-span-2 my-1" />
          <dt className="font-medium">Total, paid in cash on delivery</dt>
          <dd className="text-right font-medium">
            <Price amount={record.amounts.total} />
          </dd>
        </dl>
      )}

      {ready && (
        <p className="leading-relaxed">
          The shop will call you to confirm your order before it ships.{" "}
          {record === undefined ? (
            <>Keep this number: with it and the email you ordered with, you can {lookupLink}.</>
          ) : (
            // The email is best-effort, which is why the number above stays prominent.
            <>
              A confirmation is on its way to {record.email}. If it does not arrive, your order
              number and that email are all you need to {lookupLink}.
            </>
          )}
        </p>
      )}

      <Button asChild variant="outline" className="self-start">
        <Link href="/products">Continue shopping</Link>
      </Button>
    </div>
  );
}
