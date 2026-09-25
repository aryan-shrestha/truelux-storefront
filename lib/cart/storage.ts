import type { Money } from "@/lib/api/types";

// Bumped on a schema change, never migrated (convention.md).
export const CART_STORAGE_KEY = "tl.cart.v2";

// The native `storage` event does not fire in the tab that wrote.
export const CART_CHANGED_EVENT = "tl:cart-changed";

export type CartLine = {
  variantId: string;
  quantity: number;
  productSlug: string;
  productName: string;
  size: string;
  shade: string | null;
  /** Captured when the line was added. Knowingly stale; the backend re-resolves it. */
  unitPrice: Money;
  imageUrl: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toLine(value: unknown): CartLine | null {
  if (!isRecord(value)) return null;

  const { variantId, quantity, productSlug, productName, size, shade, unitPrice, imageUrl } = value;

  if (typeof variantId !== "string" || variantId === "") return null;
  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) return null;

  return {
    variantId,
    quantity,
    productSlug: typeof productSlug === "string" ? productSlug : "",
    productName: typeof productName === "string" ? productName : "",
    size: typeof size === "string" ? size : "",
    shade: typeof shade === "string" ? shade : null,
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

  return parsed.lines.map(toLine).filter((line): line is CartLine => line !== null);
}

export function readCart(): CartLine[] {
  // localStorage throws in private-mode Safari and under blocked site data.
  try {
    return parseCart(window.localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 2, lines }));
    window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
  } catch {
    // An unsaved cart is a worse experience, not a broken page.
  }
}

export function countLines(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}
