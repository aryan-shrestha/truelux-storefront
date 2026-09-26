"use client";

import Image from "next/image";
import Link from "next/link";

import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { MAX_UNITS_PER_LINE } from "@/lib/cart/reducer";
import type { CartLine as Line } from "@/lib/cart/storage";
import { useCart } from "@/lib/cart/use-cart";
import { describeVariant } from "@/lib/catalog/variants";

export function CartLine({ line }: { line: Line }) {
  const { setQuantity, remove } = useCart();

  return (
    <li className="flex gap-4 border-b py-6">
      <Link
        href={`/products/${line.productSlug}`}
        tabIndex={-1}
        aria-hidden
        className="bg-muted relative aspect-4/5 w-20 shrink-0 overflow-hidden"
      >
        {line.imageUrl !== null && (
          <Image src={line.imageUrl} alt="" fill sizes="80px" className="object-cover" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Link href={`/products/${line.productSlug}`} className="font-medium">
            {line.productName}
          </Link>
          {/* The unit price, never a line total (ADR 0003). */}
          <Price amount={line.unitPrice} className="text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">{describeVariant(line.size, line.shade)}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <QuantityStepper
            itemName={line.productName}
            value={line.quantity}
            min={1}
            max={MAX_UNITS_PER_LINE}
            onChange={(quantity) => setQuantity(line.variantId, quantity)}
          />
          <Button variant="link" size="sm" onClick={() => remove(line.variantId)}>
            Remove<span className="sr-only"> {line.productName}</span>
          </Button>
        </div>
      </div>
    </li>
  );
}
