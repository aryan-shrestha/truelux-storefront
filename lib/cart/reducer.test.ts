import { describe, expect, it } from "vitest";

import { cartReducer, isFull, MAX_LINES, MAX_UNITS_PER_LINE } from "@/lib/cart/reducer";
import type { CartLine } from "@/lib/cart/storage";

function line(variantId: string, quantity = 1): CartLine {
  return {
    variantId,
    quantity,
    productSlug: "boxy-logo-tee",
    productName: "Boxy Logo Tee",
    size: "M",
    color: "Black",
    unitPrice: "2400.00",
    imageUrl: null,
  };
}

describe("add", () => {
  it("appends a new variant", () => {
    const lines = cartReducer([], { type: "add", line: line("a") });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.variantId).toBe("a");
  });

  it("merges the same variant and sums the quantities", () => {
    // The checkout endpoint sums duplicates before decrementing stock, so two
    // rows displayed and one charged would be wrong even with the right total.
    const lines = cartReducer([line("a", 2)], { type: "add", line: line("a", 3) });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toBe(5);
  });

  it("keeps other lines untouched when merging", () => {
    const lines = cartReducer([line("a", 1), line("b", 1)], { type: "add", line: line("a", 1) });

    expect(lines.map((l) => [l.variantId, l.quantity])).toEqual([
      ["a", 2],
      ["b", 1],
    ]);
  });

  it("clamps a merge at the per-line cap", () => {
    const lines = cartReducer([line("a", 9)], { type: "add", line: line("a", 5) });

    expect(lines[0]?.quantity).toBe(MAX_UNITS_PER_LINE);
  });

  it("refuses a new line once the cart is full", () => {
    const full = Array.from({ length: MAX_LINES }, (_, i) => line(`v${i}`));

    expect(cartReducer(full, { type: "add", line: line("new") })).toHaveLength(MAX_LINES);
  });

  it("still merges into an existing line when the cart is full", () => {
    const full = Array.from({ length: MAX_LINES }, (_, i) => line(`v${i}`));

    const lines = cartReducer(full, { type: "add", line: line("v0") });

    expect(lines).toHaveLength(MAX_LINES);
    expect(lines[0]?.quantity).toBe(2);
  });
});

describe("setQuantity", () => {
  it("sets a quantity", () => {
    expect(
      cartReducer([line("a", 1)], { type: "setQuantity", variantId: "a", quantity: 4 })[0]
        ?.quantity,
    ).toBe(4);
  });

  it("removes the line at zero, which is how the stepper deletes", () => {
    expect(
      cartReducer([line("a", 1)], { type: "setQuantity", variantId: "a", quantity: 0 }),
    ).toEqual([]);
  });

  it("clamps above the cap rather than accepting it", () => {
    expect(
      cartReducer([line("a", 1)], { type: "setQuantity", variantId: "a", quantity: 99 })[0]
        ?.quantity,
    ).toBe(MAX_UNITS_PER_LINE);
  });

  it("never produces a fractional quantity, which the API would reject", () => {
    expect(
      cartReducer([line("a", 1)], { type: "setQuantity", variantId: "a", quantity: 2.7 })[0]
        ?.quantity,
    ).toBe(2);
  });

  it("ignores a variant that is not in the cart", () => {
    const lines = [line("a", 1)];

    expect(cartReducer(lines, { type: "setQuantity", variantId: "zzz", quantity: 5 })).toEqual(
      lines,
    );
  });
});

describe("remove and clear", () => {
  it("removes one line", () => {
    expect(cartReducer([line("a"), line("b")], { type: "remove", variantId: "a" })).toHaveLength(1);
  });

  it("clears everything, which checkout does on success", () => {
    expect(cartReducer([line("a"), line("b")], { type: "clear" })).toEqual([]);
  });
});

describe("isFull", () => {
  it("reports the cap so a caller can say why an add did nothing", () => {
    expect(isFull([])).toBe(false);
    expect(isFull(Array.from({ length: MAX_LINES }, (_, i) => line(`v${i}`)))).toBe(true);
  });
});

describe("hydrate", () => {
  it("replaces the cart wholesale, as reading storage does", () => {
    expect(
      cartReducer([line("old")], { type: "hydrate", lines: [line("a"), line("b")] }),
    ).toHaveLength(2);
  });

  it("clamps a hand-edited quantity that the storage parser let through", () => {
    const lines = cartReducer([], { type: "hydrate", lines: [line("a", 9999)] });

    expect(lines[0]?.quantity).toBe(MAX_UNITS_PER_LINE);
  });

  it("truncates a hand-edited cart longer than the cap", () => {
    const many = Array.from({ length: MAX_LINES + 5 }, (_, i) => line(`v${i}`));

    expect(cartReducer([], { type: "hydrate", lines: many })).toHaveLength(MAX_LINES);
  });
});
