"use client";

import Link, { useLinkStatus } from "next/link";

import { BagSummary } from "@/components/cart/BagSummary";
import { CartLine } from "@/components/cart/CartLine";
import { CartLinesSkeleton } from "@/components/cart/CartLinesSkeleton";
import { EmptyBag } from "@/components/cart/EmptyBag";
import { useQuote } from "@/components/cart/use-quote";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCart } from "@/lib/cart/use-cart";

export function CartContents({ shippingNote }: { shippingNote: string }) {
  const { lines, ready } = useCart();
  const quote = useQuote(lines, null);

  // A skeleton rather than the empty state until storage is read: telling
  // someone with a full bag that it is empty is worse than a moment of nothing.
  if (!ready) return <CartLinesSkeleton />;

  if (lines.length === 0) return <EmptyBag description="Nothing here yet." />;

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
      <ul className="flex-1 border-t">
        {lines.map((line) => (
          <CartLine
            key={line.variantId}
            line={line}
            problem={quote.status === "problems" ? quote.problems[line.variantId] : undefined}
          />
        ))}
      </ul>

      <Card className="lg:w-80 lg:shrink-0 lg:self-start">
        <CardContent>
          <BagSummary quote={quote} shippingNote={shippingNote} />
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
