import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Price } from "@/components/ui/price";
import type { CartLine } from "@/lib/cart/storage";
import { describeVariant } from "@/lib/catalog/variants";
import { env } from "@/lib/env";

// No total: the first total the customer sees is the one the API returns (ADR 0003).
export function OrderSummary({ lines }: { lines: CartLine[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Your bag
        </CardTitle>
        <CardAction>
          <Button asChild variant="link" size="sm">
            <Link href="/cart">Edit bag</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="border-t">
          {lines.map((line) => (
            <li key={line.variantId} className="flex justify-between gap-4 border-b py-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{line.productName}</span>
                <span className="text-sm text-muted-foreground">
                  {describeVariant(line.size, line.shade)}
                </span>
              </div>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {line.quantity} × <Price amount={line.unitPrice} />
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <p>Shipping: {env.shippingNote}</p>
        <p className="text-muted-foreground">
          The total, including shipping, is confirmed when your order is placed.
        </p>
      </CardFooter>
    </Card>
  );
}
