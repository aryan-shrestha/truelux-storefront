import { describe, expect, it } from "vitest";

import {
  colorOptions,
  findVariant,
  isEntirelySoldOut,
  onlyOption,
  sizeOptions,
  sizesOf,
  statusOf,
} from "@/lib/catalog/variants";
import { washedPocketTee } from "@/tests/fixtures/catalog";

const variants = washedPocketTee.variants;

// The fixture mirrors what seed_demo creates:
//   m/washed-indigo   in stock
//   l/washed-indigo   in stock
//   xxl/washed-indigo in stock, and priced higher
//   m/olive           in stock
//   l/olive           SOLD OUT
// xxl/olive was never made, and xl does not exist at all in this fixture.

describe("sizesOf", () => {
  it("keeps the API's order and does not repeat a size", () => {
    expect(sizesOf(variants).map((size) => size.slug)).toEqual(["m", "l", "xxl"]);
  });
});

describe("sizeOptions", () => {
  it("reports every size as available when no colour is chosen yet", () => {
    expect(sizeOptions(variants, null).map((option) => option.state)).toEqual([
      "available",
      "available",
      "available",
    ]);
  });

  it("distinguishes not-made from sold-out once a colour is chosen", () => {
    const states = Object.fromEntries(
      sizeOptions(variants, "olive").map((option) => [option.slug, option.state]),
    );

    expect(states).toEqual({
      m: "available",
      // The pairing exists and has no stock. It may come back.
      l: "sold-out",
      // This pairing was never created. It is not coming back.
      xxl: "not-made",
    });
  });
});

describe("colorOptions", () => {
  it("marks a colour not-made for a size it was never produced in", () => {
    const states = Object.fromEntries(
      colorOptions(variants, "xxl").map((option) => [option.slug, option.state]),
    );

    expect(states).toEqual({ "washed-indigo": "available", olive: "not-made" });
  });

  it("marks a colour sold out when the pairing exists with no stock", () => {
    const states = Object.fromEntries(
      colorOptions(variants, "l").map((option) => [option.slug, option.state]),
    );

    expect(states).toEqual({ "washed-indigo": "available", olive: "sold-out" });
  });
});

describe("findVariant", () => {
  it("resolves a pairing to the one variant", () => {
    expect(findVariant(variants, "xxl", "washed-indigo")?.id).toBe("v-xxl-indigo");
  });

  it("resolves the variant carrying a price override", () => {
    // The price follows the selection: showing base_price while charging the
    // override is the surprise that ends at a support message.
    expect(findVariant(variants, "xxl", "washed-indigo")?.price).toBe("2950.00");
    expect(findVariant(variants, "m", "washed-indigo")?.price).toBe("2650.00");
  });

  it("returns nothing for a pairing that was never made", () => {
    expect(findVariant(variants, "xxl", "olive")).toBeUndefined();
  });

  it("returns nothing until both halves are chosen", () => {
    expect(findVariant(variants, "m", null)).toBeUndefined();
    expect(findVariant(variants, null, "olive")).toBeUndefined();
  });
});

describe("statusOf", () => {
  it("says nothing for an available option", () => {
    expect(statusOf("available")).toBeUndefined();
  });

  it("uses different words for the two unavailable states", () => {
    expect(statusOf("sold-out")).not.toBe(statusOf("not-made"));
  });
});

describe("isEntirelySoldOut", () => {
  it("is false when anything has stock", () => {
    expect(isEntirelySoldOut(variants)).toBe(false);
  });

  it("is true when nothing does", () => {
    const gone = variants.map((variant) => ({ ...variant, inStock: false }));

    expect(isEntirelySoldOut(gone)).toBe(true);
  });

  it("is false for a product with no variants, which is a different state", () => {
    // A merchant can create a product and not finish it. That is "not set up",
    // not "sold out", and the two should not collapse.
    expect(isEntirelySoldOut([])).toBe(false);
  });
});

describe("onlyOption", () => {
  it("preselects a group of one", () => {
    expect(onlyOption([{ slug: "m", name: "M", state: "available" }])).toBe("m");
  });

  it("preselects nothing when there is a real choice", () => {
    expect(onlyOption(sizeOptions(variants, null))).toBeNull();
  });

  it("preselects nothing for an empty group", () => {
    expect(onlyOption([])).toBeNull();
  });
});
