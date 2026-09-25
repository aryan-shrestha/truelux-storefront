import type { Money } from "@/lib/api/types";
import { formatPrice } from "@/lib/format/money";

export function Price({ amount, className }: { amount: Money; className?: string }) {
  return <span className={className}>{formatPrice(amount)}</span>;
}
