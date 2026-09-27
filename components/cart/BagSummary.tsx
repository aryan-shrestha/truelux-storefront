import type { QuoteState } from "@/components/cart/use-quote";
import { FreeShippingLine } from "@/components/cart/FreeShippingLine";
import { Price } from "@/components/ui/price";
import { Skeleton } from "@/components/ui/skeleton";

export function BagSummary({ quote, shippingNote }: { quote: QuoteState; shippingNote: string }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div aria-live="polite" className="flex flex-col gap-2">
        <Subtotal quote={quote} />
      </div>
      <p className="text-muted-foreground text-sm">{shippingNote}</p>
    </div>
  );
}

function Subtotal({ quote }: { quote: QuoteState }) {
  switch (quote.status) {
    case "pending":
      return (
        <div aria-busy className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <span>Subtotal</span>
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
      );
    case "ready":
      return (
        <>
          <dl className="flex justify-between gap-4">
            <dt>Subtotal</dt>
            <dd className="font-medium tabular-nums">
              <Price amount={quote.quote.subtotal} />
            </dd>
          </dl>
          <FreeShippingLine quote={quote.quote} otherwise="Shipping calculated at checkout" />
        </>
      );
    case "problems":
      return <p>Remove or change the marked items to see your subtotal.</p>;
    case "failed":
      return <p className="text-muted-foreground text-sm">Shipping calculated at checkout</p>;
  }
}
