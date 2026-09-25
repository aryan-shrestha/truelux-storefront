"use client";

import Link, { useLinkStatus } from "next/link";

import { CartLine } from "@/components/cart/CartLine";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useCart } from "@/lib/cart/use-cart";
import { env } from "@/lib/env";

export function CartContents() {
  const { lines, ready } = useCart();

  // A skeleton rather than the empty state: telling someone with a full bag
  // that it is empty, for the moment before storage is read, is worse than
  // showing nothing.
  if (!ready) {
    return (
      <div className="flex flex-col gap-6" aria-busy>
        <span className="sr-only" role="status">
          Loading your bag
        </span>
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          <ul className="flex-1">
            {[0, 1].map((line) => (
              <li key={line} className="border-wash flex gap-4 border-b py-6">
                <Skeleton className="aspect-[4/5] w-24 shrink-0" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex justify-between gap-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="mt-2 h-11 w-32" />
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="border-wash flex flex-col gap-4 border-t py-16">
        <h2 className="text-heading font-display font-semibold">Your bag is empty</h2>
        <p className="prose-body text-slate">Nothing here yet.</p>
        <p>
          <Link href="/products" className="decoration-indigo underline underline-offset-4">
            Shop everything
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
      <ul className="flex-1">
        {lines.map((line) => (
          <CartLine key={line.variantId} line={line} />
        ))}
      </ul>

      <aside className="lg:w-80 lg:shrink-0">
        <div className="border-wash flex flex-col gap-4 border-t pt-6 lg:border-t-0 lg:pt-0">
          {/*
            No total, and two independent reasons it cannot appear: the
            storefront performs no arithmetic on money (ADR 0003), and the
            shipping fee depends on a district collected on the next screen.
            Both must go before a figure can be shown here.
          */}
          <p className="text-ui">Shipping and the total are confirmed at checkout.</p>
          <p className="text-detail text-slate">{env.shippingNote}</p>

          <Link
            href="/checkout"
            className="bg-ink text-paper hover:bg-ink/90 text-ui relative inline-flex min-h-11 w-full items-center justify-center rounded-[2px] px-5 font-medium transition-colors"
          >
            <PendingMark />
            Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}

/**
 * Shown while the navigation to checkout is in flight — on a slow connection,
 * before the route has been prefetched. Pinned to the button's left edge and
 * faded rather than mounted, so the centred label never moves. `useLinkStatus` only
 * works inside the Link, hence a component of its own.
 */
function PendingMark() {
  const { pending } = useLinkStatus();
  return (
    <Spinner
      className={`absolute left-5 transition-opacity ${pending ? "opacity-100" : "opacity-0"}`}
    />
  );
}
