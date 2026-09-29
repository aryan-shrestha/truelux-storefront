import { getShipping } from "@/lib/api/catalog";
import type { ShippingSettings } from "@/lib/api/types";
import { formatPrice } from "@/lib/format/money";

export function describeShipping(settings: ShippingSettings | null): string {
  if (settings === null) return "Cash on delivery";

  const fees =
    settings.freeShippingThreshold === null
      ? `${formatPrice(settings.insideValleyFee)} inside the Kathmandu valley, ${formatPrice(settings.outsideValleyFee)} elsewhere`
      : `Free shipping over ${formatPrice(settings.freeShippingThreshold)}`;
  return `${fees} · Cash on delivery`;
}

// Shown on every page, so a failed read degrades the copy rather than the page.
export async function shippingNote(): Promise<string> {
  try {
    return describeShipping(await getShipping());
  } catch {
    return describeShipping(null);
  }
}
