import type { Money } from "@/lib/api/types";

/**
 * The cart lives in the browser, because the API has no cart (ADR 0002).
 *
 * Everything read from here is untrusted input: it may be absent, truncated,
 * hand-edited, or written by an older version of this code. It is parsed and
 * validated rather than cast, and any failure resets to empty — a storefront
 * that crashes because it could not read a cart is worse than one with an empty
 * cart.
 */

/** Bumped rather than migrated. A lost cart costs less than untested migration code. */
export const CART_STORAGE_KEY = "tl.cart.v1";

/** Fired on the same tab, where the native `storage` event does not reach. */
export const CART_CHANGED_EVENT = "tl:cart-changed";

export type CartLine = {
  variantId: string;
  quantity: number;
  productSlug: string;
  productName: string;
  size: string;
  color: string;
  /** Captured when the line was added. Knowingly stale; the backend re-resolves it. */
  unitPrice: Money;
  imageUrl: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toLine(value: unknown): CartLine | null {
  if (!isRecord(value)) return null;

  const { variantId, quantity, productSlug, productName, size, color, unitPrice, imageUrl } = value;

  if (typeof variantId !== "string" || variantId === "") return null;
  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) return null;

  return {
    variantId,
    quantity,
    productSlug: typeof productSlug === "string" ? productSlug : "",
    productName: typeof productName === "string" ? productName : "",
    size: typeof size === "string" ? size : "",
    color: typeof color === "string" ? color : "",
    unitPrice: typeof unitPrice === "string" ? unitPrice : "0.00",
    imageUrl: typeof imageUrl === "string" ? imageUrl : null,
  };
}

export function parseCart(raw: string | null): CartLine[] {
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.lines)) return [];

  // A line that fails validation is dropped rather than failing the whole cart:
  // one corrupt entry should not lose the other four.
  return parsed.lines.map(toLine).filter((line): line is CartLine => line !== null);
}

export function readCart(): CartLine[] {
  // localStorage throws, not merely returns null, in private-mode Safari, under
  // blocked site data, and inside some embedded browsers.
  try {
    return parseCart(window.localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, lines }));
    window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
  } catch {
    // A cart that cannot be saved is a worse experience, not a broken page.
  }
}

export function countLines(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}
