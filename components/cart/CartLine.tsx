"use client";

import Image from "next/image";
import Link from "next/link";

import { Price } from "@/components/ui/Price";
import { Quantity } from "@/components/ui/Quantity";
import { MAX_UNITS_PER_LINE } from "@/lib/cart/reducer";
import type { CartLine as Line } from "@/lib/cart/storage";
import { useCart } from "@/lib/cart/use-cart";

export function CartLine({ line }: { line: Line }) {
  const { setQuantity, remove } = useCart();

  return (
    <li className="border-wash flex gap-4 border-b py-6">
      <Link
        href={`/products/${line.productSlug}`}
        className="bg-wash relative aspect-[4/5] w-24 shrink-0"
      >
        {line.imageUrl !== null && (
          <Image
            src={line.imageUrl}
            // Decorative here: the product name is the adjacent link text, so
            // describing the photograph again is noise.
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Link href={`/products/${line.productSlug}`} className="text-ui font-medium">
            {line.productName}
          </Link>
          {/* The line's price, not a line total: the storefront performs no
              arithmetic on money (ADR 0003). */}
          <Price amount={line.unitPrice} className="text-ui text-slate" />
        </div>

        <p className="text-detail text-slate">
          {line.size} · {line.color}
        </p>

        <div className="mt-2 flex items-center gap-4">
          <Quantity
            itemName={line.productName}
            value={line.quantity}
            min={1}
            max={MAX_UNITS_PER_LINE}
            onChange={(quantity) => setQuantity(line.variantId, quantity)}
          />
          <button
            type="button"
            onClick={() => remove(line.variantId)}
            className="text-detail text-slate hover:text-ink underline underline-offset-4"
          >
            Remove
            <span className="sr-only"> {line.productName}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
