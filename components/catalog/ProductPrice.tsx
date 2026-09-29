import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import type { Money, Sale } from "@/lib/api/types";

type ProductPriceProps = {
  price: Money;
  sale: Sale | null;
  className?: string;
};

export function ProductPrice({ price, sale, className }: ProductPriceProps) {
  if (sale === null) return <Price amount={price} className={className} />;

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-1", className)}>
      <Price amount={price} />
      <s className="text-muted-foreground">
        <span className="sr-only">Was </span>
        <Price amount={sale.compareAtPrice} />
      </s>
      <Badge variant="sale" className="self-center">
        <span aria-hidden>−{sale.discountPercent}%</span>
        <span className="sr-only">{sale.discountPercent}% off</span>
      </Badge>
    </span>
  );
}
