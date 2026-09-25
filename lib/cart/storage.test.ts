import { describe, expect, it } from "vitest";

import { CART_STORAGE_KEY, countLines, parseCart, readCart } from "@/lib/cart/storage";

const line = {
  variantId: "1b7d",
  quantity: 2,
  productSlug: "silk-skin-foundation",
  productName: "Silk Skin Foundation",
  size: "30 ml",
  shade: "Warm Beige",
  unitPrice: "3200.00",
  imageUrl: null,
};

describe("parseCart", () => {
  it("reads a well-formed cart", () => {
    expect(parseCart(JSON.stringify({ version: 1, lines: [line] }))).toEqual([line]);
  });

  it("keeps a shadeless line's shade as null", () => {
    const shadeless = { ...line, shade: null };

    expect(parseCart(JSON.stringify({ version: 2, lines: [shadeless] }))).toEqual([shadeless]);
  });

  it("returns empty for an absent key", () => {
    expect(parseCart(null)).toEqual([]);
  });

  it("returns empty for malformed JSON rather than throwing", () => {
    expect(parseCart("{not json")).toEqual([]);
  });

  it("returns empty for a shape from an older version", () => {
    expect(parseCart(JSON.stringify([line]))).toEqual([]);
  });

  it("drops a line with no variant id, keeping the rest", () => {
    const raw = JSON.stringify({ version: 1, lines: [{ ...line, variantId: "" }, line] });

    expect(parseCart(raw)).toEqual([line]);
  });

  it("drops a line with a non-positive or fractional quantity", () => {
    const raw = JSON.stringify({
      version: 1,
      lines: [
        { ...line, quantity: 0 },
        { ...line, quantity: -3 },
        { ...line, quantity: 1.5 },
      ],
    });

    expect(parseCart(raw)).toEqual([]);
  });

  it("coerces missing display fields rather than dropping the line", () => {
    // Display data is stale by design; a missing name is not a reason to lose
    // the thing the customer chose.
    const raw = JSON.stringify({ version: 1, lines: [{ variantId: "1b7d", quantity: 1 }] });

    expect(parseCart(raw)).toEqual([
      {
        variantId: "1b7d",
        quantity: 1,
        productSlug: "",
        productName: "",
        size: "",
        shade: null,
        unitPrice: "0.00",
        imageUrl: null,
      },
    ]);
  });
});

describe("CART_STORAGE_KEY", () => {
  it("was bumped when colour became shade, so old carts are not read", () => {
    expect(CART_STORAGE_KEY).toBe("tl.cart.v2");
  });
});

describe("readCart", () => {
  it("returns empty when localStorage throws", () => {
    // Private-mode Safari, blocked site data and some embedded browsers throw
    // on read rather than returning null.
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("SecurityError");
      },
    });

    expect(readCart()).toEqual([]);

    if (original) Object.defineProperty(window, "localStorage", original);
  });
});

describe("countLines", () => {
  it("counts units, not rows", () => {
    expect(countLines([line, { ...line, variantId: "other", quantity: 3 }])).toBe(5);
  });

  it("counts an empty cart as zero", () => {
    expect(countLines([])).toBe(0);
  });
});
