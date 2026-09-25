import type { Money } from "@/lib/api/types";
import { formatPrice } from "@/lib/format/money";

/**
 * The only component that renders an amount.
 *
 * Amounts are decimal strings end to end (ADR 0003); this renders one and never
 * computes with it. There is no `total` prop and no `quantity` prop, because
 * multiplying here is exactly the mistake the ADR exists to prevent.
 */
export function Price({ amount, className }: { amount: Money; className?: string }) {
  return <span className={className}>{formatPrice(amount)}</span>;
}
