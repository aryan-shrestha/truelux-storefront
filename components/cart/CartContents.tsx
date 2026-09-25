"use client";

import Link, { useLinkStatus } from "next/link";

import { CartLine } from "@/components/cart/CartLine";
import { CartLinesSkeleton } from "@/components/cart/CartLinesSkeleton";
import { EmptyBag } from "@/components/cart/EmptyBag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCart } from "@/lib/cart/use-cart";
import { env } from "@/lib/env";

export function CartContents() {
  const { lines, ready } = useCart();

  // A skeleton rather than the empty state until storage is read: telling
  // someone with a full bag that it is empty is worse than a moment of nothing.
  if (!ready) return <CartLinesSkeleton />;

  if (lines.length === 0) return <EmptyBag description="Nothing here yet." />;

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
      <ul className="flex-1 border-t">
        {lines.map((line) => (
          <CartLine key={line.variantId} line={line} />
        ))}
      </ul>

      <Card className="lg:w-80 lg:shrink-0 lg:self-start">
        {/* No total: the storefront does no money arithmetic (ADR 0003) and the
            shipping fee depends on the district chosen at checkout. */}
        <CardContent className="flex flex-col gap-2">
          <p>Shipping and the total are confirmed at checkout.</p>
          <p className="text-sm text-muted-foreground">{env.shippingNote}</p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/checkout">
              <PendingMark />
              Checkout
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// useLinkStatus only works inside the Link it reports on.
function PendingMark() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner data-icon="inline-start" /> : null;
}
