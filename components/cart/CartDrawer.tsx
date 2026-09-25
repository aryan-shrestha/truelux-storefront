"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import { CartLine } from "@/components/cart/CartLine";
import { CartLinesSkeleton } from "@/components/cart/CartLinesSkeleton";
import { EmptyBag } from "@/components/cart/EmptyBag";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart/use-cart";
import { env } from "@/lib/env";

export function CartDrawer({ onNavigate }: { onNavigate: () => void }) {
  const { lines, ready } = useCart();

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
              <CartLine key={line.variantId} line={line} />
            ))}
          </ul>
          <SheetFooter className="border-t">
            <p className="text-sm">Shipping and the total are confirmed at checkout.</p>
            <p className="text-sm text-muted-foreground">{env.shippingNote}</p>
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
