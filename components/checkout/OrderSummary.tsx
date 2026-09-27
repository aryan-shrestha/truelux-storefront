import { cn } from "cn";
import Link from "next/link";
import type { ReactNode } from "react";

import { FreeShippingLine } from "@/components/cart/FreeShippingLine";
import { LINE_PROBLEM_COPY, type QuoteState } from "@/components/cart/use-quote";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Price } from "@/components/ui/price";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { CartQuote } from "@/lib/api/types";
import type { CartLine } from "@/lib/cart/storage";
import { describeVariant } from "@/lib/catalog/variants";
import { isZeroAmount } from "@/lib/format/money";

export function OrderSummary({ lines, quote }: { lines: CartLine[]; quote: QuoteState }) {
  const problems = quote.status === "problems" ? quote.problems : {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your bag</CardTitle>
        <CardAction>
          <Button asChild variant="link" size="sm">
            <Link href="/cart">Edit bag</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="border-t">
          {lines.map((line) => {
            const problem = problems[line.variantId];
            return (
              <li key={line.variantId} className="flex justify-between gap-4 border-b py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{line.productName}</span>
                  <span className="text-muted-foreground text-sm">
                    {describeVariant(line.size, line.shade)}
                  </span>
                  {problem !== undefined && (
                    <span className="text-destructive text-sm font-medium">
                      {LINE_PROBLEM_COPY[problem]}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {line.quantity} × <Price amount={line.unitPrice} />
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
      <CardFooter aria-live="polite" className="flex-col items-stretch gap-2 text-sm">
        <Totals quote={quote} />
      </CardFooter>
    </Card>
  );
}

function Totals({ quote }: { quote: QuoteState }) {
  switch (quote.status) {
    case "pending":
      return (
        <div aria-busy className="flex flex-col gap-2">
          <dl className="flex flex-col gap-2">
            <Row label="Subtotal">
              <Skeleton className="h-4 w-20" />
            </Row>
            <Row label="Shipping">
              <Skeleton className="h-4 w-16" />
            </Row>
          </dl>
          <Separator />
          <dl>
            <Row label="Total" strong>
              <Skeleton className="h-5 w-24" />
            </Row>
          </dl>
        </div>
      );
    case "ready":
      return <QuotedTotals quote={quote.quote} />;
    case "problems":
      return <p>Remove or change the marked items to see your total.</p>;
    case "failed":
      return (
        <p className="text-muted-foreground">
          The total, including shipping, is confirmed when your order is placed.
        </p>
      );
  }
}

function QuotedTotals({ quote }: { quote: CartQuote }) {
  return (
    <>
      <dl className="flex flex-col gap-2">
        <Row label="Subtotal">
          <Price amount={quote.subtotal} />
        </Row>
        {!isZeroAmount(quote.discount) && (
          <Row label="Discount">
            −<Price amount={quote.discount} />
          </Row>
        )}
        <Row label="Shipping">
          {quote.shippingFee === null ? (
            <span className="text-muted-foreground">Choose a district</span>
          ) : isZeroAmount(quote.shippingFee) ? (
            "Free"
          ) : (
            <Price amount={quote.shippingFee} />
          )}
        </Row>
      </dl>
      <Separator />
      <dl>
        <Row label="Total" strong>
          {quote.total === null ? (
            <span className="text-muted-foreground">After shipping</span>
          ) : (
            <Price amount={quote.total} />
          )}
        </Row>
      </dl>
      {quote.freeShippingRemaining !== null && <FreeShippingLine quote={quote} />}
    </>
  );
}

function Row({
  label,
  strong = false,
  children,
}: {
  label: string;
  strong?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("flex items-center justify-between gap-4", strong && "text-base font-medium")}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}
