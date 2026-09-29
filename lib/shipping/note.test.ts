import { afterEach, describe, expect, it, vi } from "vitest";

import { describeShipping, shippingNote } from "@/lib/shipping/note";

const fees = { insideValleyFee: "150.00", outsideValleyFee: "250.00" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("describeShipping", () => {
  it("leads with the threshold when the merchant has set one", () => {
    expect(describeShipping({ ...fees, freeShippingThreshold: "8000.00" })).toBe(
      "Free shipping over Rs 8,000 · Cash on delivery",
    );
  });

  it("states both fees when there is no threshold", () => {
    expect(describeShipping({ ...fees, freeShippingThreshold: null })).toBe(
      "Rs 150 inside the Kathmandu valley, Rs 250 elsewhere · Cash on delivery",
    );
  });

  it("claims no fee when the settings could not be read", () => {
    expect(describeShipping(null)).toBe("Cash on delivery");
  });
});

describe("shippingNote", () => {
  it("degrades to the fee-free copy when the read fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );

    await expect(shippingNote()).resolves.toBe("Cash on delivery");
  });
});
