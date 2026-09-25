import { describe, expect, it } from "vitest";

import {
  describeVariant,
  findVariant,
  hasShades,
  isEntirelySoldOut,
  onlyOption,
  shadeOptions,
  sizeOptions,
  statusOf,
} from "@/lib/catalog/variants";
import { hydratingSerum, silkFoundation } from "@/tests/fixtures/catalog";

// silkFoundation:
//   30 ml / porcelain   in stock
//   30 ml / warm-beige  in stock
//   50 ml / warm-beige  in stock, priced higher
//   30 ml / deep-mocha  SOLD OUT
// 50 ml in porcelain or deep-mocha was never made.
const variants = silkFoundation.variants;

function statesOf(options: Array<{ slug: string; state: string }>) {
  return Object.fromEntries(options.map((option) => [option.slug, option.state]));
}

describe("sizeOptions", () => {
  it("keeps the API's order and reports every size available before a shade is chosen", () => {
    expect(statesOf(sizeOptions(variants, null))).toEqual({
      "30-ml": "available",
      "50-ml": "available",
    });
  });

  it("distinguishes not-made from sold-out once a shade is chosen", () => {
    expect(statesOf(sizeOptions(variants, "deep-mocha"))).toEqual({
      "30-ml": "sold-out",
      "50-ml": "not-made",
    });
  });
});

describe("shadeOptions", () => {
  it("carries each shade's swatch colour", () => {
    expect(shadeOptions(variants, null).map((option) => option.hexCode)).toEqual([
      "#F3DCC8",
      "#D8A47F",
      "#6B432C",
    ]);
  });

  it("marks a shade not-made for a size it was never produced in", () => {
    expect(statesOf(shadeOptions(variants, "50-ml"))).toEqual({
      porcelain: "not-made",
      "warm-beige": "available",
      "deep-mocha": "not-made",
    });
  });

  it("is empty for a shadeless product", () => {
    expect(shadeOptions(hydratingSerum.variants, null)).toEqual([]);
  });
});

describe("hasShades", () => {
  it("tells a shaded product from a shadeless one", () => {
    expect(hasShades(variants)).toBe(true);
    expect(hasShades(hydratingSerum.variants)).toBe(false);
  });
});

describe("findVariant", () => {
  it("resolves a shade and a size to the one variant, with its own price", () => {
    expect(findVariant(variants, "50-ml", "warm-beige")).toMatchObject({
      id: "v-50-warm-beige",
      price: "4400.00",
    });
  });

  it("returns nothing for a pairing that was never made", () => {
    expect(findVariant(variants, "50-ml", "porcelain")).toBeUndefined();
  });

  it("returns nothing until both halves of a shaded product are chosen", () => {
    expect(findVariant(variants, "30-ml", null)).toBeUndefined();
    expect(findVariant(variants, null, "porcelain")).toBeUndefined();
  });

  it("resolves a shadeless product from its size alone", () => {
    expect(findVariant(hydratingSerum.variants, "15-ml", null)?.id).toBe("v-15-serum");
  });
});

describe("statusOf", () => {
  it("says nothing for an available option and different words for the two unavailable states", () => {
    expect(statusOf("available")).toBeUndefined();
    expect(statusOf("sold-out")).not.toBe(statusOf("not-made"));
  });
});

describe("isEntirelySoldOut", () => {
  it("is true only when every variant is out of stock", () => {
    expect(isEntirelySoldOut(variants)).toBe(false);
    expect(isEntirelySoldOut(variants.map((variant) => ({ ...variant, inStock: false })))).toBe(
      true,
    );
  });

  it("is false for a product with no variants, which is unfinished rather than sold out", () => {
    expect(isEntirelySoldOut([])).toBe(false);
  });
});

describe("onlyOption", () => {
  it("preselects a group of one and nothing otherwise", () => {
    expect(onlyOption([{ slug: "50-ml" }])).toBe("50-ml");
    expect(onlyOption(sizeOptions(variants, null))).toBeNull();
    expect(onlyOption([])).toBeNull();
  });
});

describe("describeVariant", () => {
  it("reads size and shade, or the size alone", () => {
    expect(describeVariant("30 ml", "Warm Beige")).toBe("30 ml · Warm Beige");
    expect(describeVariant("15 ml", null)).toBe("15 ml");
  });
});
