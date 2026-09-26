import { PAYMENT_METHODS, type Money, type PaymentMethod } from "@/lib/api/types";

// A convenience, never a credential: it never holds an access token.
export const ORDER_RECORD_KEY = "tl.orders.v1";

// Enough to find last month's order again; not a history, which is Phase 2.
const MAX_RECORDS = 10;

export type OrderAmounts = {
  subtotal: Money;
  shippingFee: Money;
  total: Money;
};

export type OrderRecord = {
  orderNumber: string;
  email: string;
  /** This device's clock at placement. The API's own `placed_at` is on the order. */
  recordedAt: string;
  paymentMethod: PaymentMethod;
  amounts: OrderAmounts;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

function toAmounts(value: unknown): OrderAmounts | null {
  if (!isRecord(value)) return null;
  const { subtotal, shippingFee, total } = value;
  if (!isString(subtotal) || !isString(shippingFee) || !isString(total)) return null;
  return { subtotal, shippingFee, total };
}

function toEntry(value: unknown): OrderRecord | null {
  if (!isRecord(value)) return null;

  const { orderNumber, email, recordedAt, paymentMethod, amounts } = value;

  if (!isString(orderNumber) || !isString(email) || !isString(recordedAt)) return null;
  const method = PAYMENT_METHODS.find((candidate) => candidate === paymentMethod);
  const parsedAmounts = toAmounts(amounts);
  if (method === undefined || parsedAmounts === null) return null;

  return { orderNumber, email, recordedAt, paymentMethod: method, amounts: parsedAmounts };
}

export function parseOrderRecords(raw: string | null): OrderRecord[] {
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.orders)) return [];

  return parsed.orders.map(toEntry).filter((entry): entry is OrderRecord => entry !== null);
}

export function readOrderRecords(): OrderRecord[] {
  try {
    return parseOrderRecords(window.localStorage.getItem(ORDER_RECORD_KEY));
  } catch {
    return [];
  }
}

export function recordOrder(entry: OrderRecord): void {
  const orders = [
    entry,
    ...readOrderRecords().filter((existing) => existing.orderNumber !== entry.orderNumber),
  ].slice(0, MAX_RECORDS);

  try {
    window.localStorage.setItem(ORDER_RECORD_KEY, JSON.stringify({ version: 1, orders }));
  } catch {
    // A record that cannot be saved costs the customer a prefill, not an order.
  }
}
