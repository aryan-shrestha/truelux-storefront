import { Price } from "@/components/ui/price";
import type { CartQuote } from "@/lib/api/types";
import { isZeroAmount } from "@/lib/format/money";

export function FreeShippingLine({ quote, otherwise }: { quote: CartQuote; otherwise?: string }) {
  if (quote.freeShippingRemaining !== null) {
    return (
      <p className="text-sm">
        Add <Price amount={quote.freeShippingRemaining} className="font-medium" /> more for free
        shipping
      </p>
    );
  }
  if (quote.shippingFee !== null && isZeroAmount(quote.shippingFee)) {
    return <p className="text-sm font-medium">Free shipping</p>;
  }
  return otherwise === undefined ? null : (
    <p className="text-muted-foreground text-sm">{otherwise}</p>
  );
}
