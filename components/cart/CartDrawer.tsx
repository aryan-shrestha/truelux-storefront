"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import { BagSummary } from "@/components/cart/BagSummary";
import { CartLine } from "@/components/cart/CartLine";
import { CartLinesSkeleton } from "@/components/cart/CartLinesSkeleton";
import { EmptyBag } from "@/components/cart/EmptyBag";
import { useQuote } from "@/components/cart/use-quote";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart/use-cart";

export function CartDrawer({
  shippingNote,
  onNavigate,
}: {
  shippingNote: string;
  onNavigate: () => void;
}) {
  const { lines, ready } = useCart();
  const quote = useQuote(lines, null);

  // Any link in the sheet leaves the page it was opened over, so the sheet closes with it.
  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("a[href]")) onNavigate();
  }

  if (!ready) {
    return (
      <div className="px-4">
        <CartLinesSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" onClickCapture={handleClickCapture}>
      {lines.length === 0 ? (
        <EmptyBag description="Nothing here yet." />
      ) : (
        <>
          <ul className="min-h-0 flex-1 overflow-y-auto border-t px-4">
            {lines.map((line) => (
              <CartLine
                key={line.variantId}
                line={line}
                problem={quote.status === "problems" ? quote.problems[line.variantId] : undefined}
              />
            ))}
          </ul>
          <SheetFooter className="border-t">
            <BagSummary quote={quote} shippingNote={shippingNote} />
            <Button asChild className="mt-2 w-full">
              <Link href="/checkout">Checkout</Link>
            </Button>
            <Button asChild variant="link">
              <Link href="/cart">View bag</Link>
            </Button>
          </SheetFooter>
        </>
      )}
    </div>
  );
}
