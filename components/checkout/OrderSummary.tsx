import Link from "next/link";

import { Price } from "@/components/ui/Price";
import type { CartLine } from "@/lib/cart/storage";
import { env } from "@/lib/env";

/**
 * The bag beside the form, with line prices and **no total**.
 *
 * ADR 0003 forbids the arithmetic, and the shipping fee is decided by the
 * backend from the district at placement. The first total the customer sees is
 * the one the API returns.
 */
export function OrderSummary({ lines }: { lines: CartLine[] }) {
  return (
    <section aria-labelledby="order-summary-heading" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="order-summary-heading" className="text-heading font-display font-semibold">
          Your bag
        </h2>
        <Link href="/cart" className="text-detail decoration-indigo underline underline-offset-4">
          Edit bag
        </Link>
      </div>

      <ul className="border-wash border-t">
        {lines.map((line) => (
          <li key={line.variantId} className="border-wash flex justify-between gap-4 border-b py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-ui font-medium">{line.productName}</span>
              <span className="text-detail text-slate">
                {line.size} · {line.color}
              </span>
            </div>
            {/* Quantity and unit price side by side, never multiplied (ADR 0003). */}
            <span className="text-ui text-slate shrink-0 tabular-nums">
              {line.quantity} × <Price amount={line.unitPrice} />
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1">
        <p className="text-ui">Shipping</p>
        <p className="text-detail text-slate">{env.shippingNote}</p>
      </div>
      <p className="text-ui">
        The total, including shipping, is confirmed when your order is placed.
      </p>
    </section>
  );
}
