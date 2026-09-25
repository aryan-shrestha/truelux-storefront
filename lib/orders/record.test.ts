import { afterEach, describe, expect, it } from "vitest";

import {
  parseOrderRecords,
  readOrderRecords,
  recordOrder,
  type OrderRecord,
} from "@/lib/orders/record";

const placed: OrderRecord = {
  orderNumber: "TL-2026-000142",
  email: "customer@example.com",
  recordedAt: "2026-09-24T10:14:00.000Z",
  paymentMethod: "cod",
  amounts: { subtotal: "4500.00", shippingFee: "150.00", total: "4650.00" },
};

function stored(orders: unknown[]): string {
  return JSON.stringify({ version: 1, orders });
}

afterEach(() => {
  window.localStorage.clear();
});

describe("parseOrderRecords", () => {
  it("reads a well-formed record", () => {
    expect(parseOrderRecords(stored([placed]))).toEqual([placed]);
  });

  it("returns empty for an absent key or malformed JSON", () => {
    expect(parseOrderRecords(null)).toEqual([]);
    expect(parseOrderRecords("{not json")).toEqual([]);
  });

  it("drops an entry with a payment method the shop no longer takes, keeping the rest", () => {
    const raw = stored([
      { ...placed, orderNumber: "TL-2026-000141", paymentMethod: "khalti" },
      placed,
    ]);

    expect(parseOrderRecords(raw).map((entry) => entry.orderNumber)).toEqual(["TL-2026-000142"]);
  });

  it("drops an entry whose amounts are missing or not strings", () => {
    const raw = stored([
      { ...placed, orderNumber: "TL-2026-000140", amounts: null },
      {
        ...placed,
        orderNumber: "TL-2026-000141",
        amounts: { subtotal: 4500, shippingFee: "150.00", total: "4650.00" },
      },
      placed,
    ]);

    expect(parseOrderRecords(raw).map((entry) => entry.orderNumber)).toEqual(["TL-2026-000142"]);
  });
});

describe("recordOrder", () => {
  it("puts the newest order first", () => {
    recordOrder({ ...placed, orderNumber: "TL-2026-000141" });
    recordOrder(placed);

    expect(readOrderRecords().map((entry) => entry.orderNumber)).toEqual([
      "TL-2026-000142",
      "TL-2026-000141",
    ]);
  });

  it("keeps one entry per order number", () => {
    recordOrder({ ...placed, amounts: { ...placed.amounts, total: "1.00" } });
    recordOrder(placed);

    const orders = readOrderRecords();
    expect(orders).toHaveLength(1);
    expect(orders[0]?.amounts.total).toBe("4650.00");
  });

  it("keeps the ten most recent", () => {
    for (let n = 1; n <= 12; n += 1) {
      recordOrder({ ...placed, orderNumber: `TL-2026-${String(n).padStart(6, "0")}` });
    }

    const orders = readOrderRecords();
    expect(orders).toHaveLength(10);
    expect(orders[0]?.orderNumber).toBe("TL-2026-000012");
  });
});
