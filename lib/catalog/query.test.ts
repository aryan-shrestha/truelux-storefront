import { describe, expect, it } from "vitest";

import {
  hasFilters,
  hrefWith,
  PAGE_SIZE,
  toCanonicalSearch,
  toProductQuery,
  toRequestedSearch,
  withToggled,
} from "@/lib/catalog/query";

describe("toProductQuery", () => {
  it("reads the parameters it allows", () => {
    const query = toProductQuery({
      category: "serums",
      brand: "lumiere",
      size: "30-ml",
      shade: "warm-beige",
      min_price: "2000",
      max_price: "6500.50",
      in_stock: "true",
      search: "linen",
      ordering: "-created_at",
      offset: "25",
    });

    expect(query).toEqual({
      category: "serums",
      brand: ["lumiere"],
      size: "30-ml",
      shade: "warm-beige",
      minPrice: "2000",
      maxPrice: "6500.50",
      inStock: true,
      search: "linen",
      ordering: "-created_at",
      offset: 25,
      limit: PAGE_SIZE,
    });
  });

  it("drops parameters it does not know", () => {
    // The whole point: ?utm_source= must not mint a cache key.
    const query = toProductQuery({ utm_source: "instagram", fbclid: "abc", category: "tees" });

    expect(toCanonicalSearch(query)).toBe("category=tees");
  });

  it("drops a slug that is not a slug", () => {
    expect(toProductQuery({ category: "NOT A SLUG!" }).category).toBeUndefined();
    expect(toProductQuery({ size: "../../etc/passwd" }).size).toBeUndefined();
  });

  it("lowercases and trims a slug rather than rejecting it", () => {
    expect(toProductQuery({ size: " M " }).size).toBe("m");
  });

  it("drops a price that is not a number", () => {
    expect(toProductQuery({ min_price: "cheap" }).minPrice).toBeUndefined();
    expect(toProductQuery({ min_price: "-5" }).minPrice).toBeUndefined();
    expect(toProductQuery({ max_price: "1.234" }).maxPrice).toBeUndefined();
  });

  it("treats only the exact string true as in_stock", () => {
    expect(toProductQuery({ in_stock: "true" }).inStock).toBe(true);
    expect(toProductQuery({ in_stock: "false" }).inStock).toBeUndefined();
    expect(toProductQuery({ in_stock: "1" }).inStock).toBeUndefined();
  });

  it("drops an ordering the API would silently ignore", () => {
    // The API ignores an unknown ordering, so a typo would produce the default
    // order with nothing to say why.
    expect(toProductQuery({ ordering: "-price" }).ordering).toBeUndefined();
    expect(toProductQuery({ ordering: "base_price" }).ordering).toBe("base_price");
  });

  it("drops an empty or whitespace search", () => {
    expect(toProductQuery({ search: "" }).search).toBeUndefined();
    expect(toProductQuery({ search: "   " }).search).toBeUndefined();
  });

  it("caps a very long search rather than forwarding it", () => {
    expect(toProductQuery({ search: "x".repeat(500) }).search).toHaveLength(100);
  });

  it("accepts only whole-page offsets", () => {
    expect(toProductQuery({ offset: "25" }).offset).toBe(25);
    expect(toProductQuery({ offset: "7" }).offset).toBeUndefined();
    expect(toProductQuery({ offset: "-25" }).offset).toBeUndefined();
    expect(toProductQuery({ offset: "0" }).offset).toBeUndefined();
  });

  it("keeps the first value of a repeated single-valued parameter", () => {
    expect(toProductQuery({ size: ["30-ml", "50-ml"] }).size).toBe("30-ml");
  });

  it("no longer reads the retired colour parameter", () => {
    expect(toCanonicalSearch(toProductQuery({ color: "black" }))).toBe("");
  });
});

describe("brand filters", () => {
  it("keeps every valid brand, sorted and deduplicated", () => {
    expect(toProductQuery({ brand: ["verde", "lumiere", "verde"] }).brand).toEqual([
      "lumiere",
      "verde",
    ]);
  });

  it("drops a brand that is not a slug, and the whole filter when none is left", () => {
    expect(toProductQuery({ brand: ["lumiere", "NOT A SLUG!"] }).brand).toEqual(["lumiere"]);
    expect(toProductQuery({ brand: "../etc" }).brand).toBeUndefined();
  });

  it("caps the number of brands so a URL cannot mint unbounded cache keys", () => {
    const many = Array.from({ length: 15 }, (_, index) => `brand-${String(index).padStart(2, "0")}`);

    expect(toProductQuery({ brand: many }).brand).toHaveLength(10);
  });

  it("round-trips several brands through the canonical search", () => {
    const canonical = toCanonicalSearch(toProductQuery({ brand: ["verde", "lumiere"] }));

    expect(canonical).toBe("brand=lumiere&brand=verde");
    expect(toRequestedSearch({ brand: ["lumiere", "verde"] })).toBe(canonical);
    expect(toRequestedSearch({ brand: ["verde", "lumiere"] })).not.toBe(canonical);
  });

  it("toggles a brand on and off", () => {
    const query = toProductQuery({ brand: "lumiere" });

    expect(withToggled(query.brand, "verde")).toEqual(["lumiere", "verde"]);
    expect(withToggled(query.brand, "lumiere")).toBeUndefined();
  });
});

describe("skin type filters", () => {
  it("reads ?skin_type= as a repeatable filter, sorted and deduplicated", () => {
    expect(toProductQuery({ skin_type: ["oily", "dry", "oily"] }).skinType).toEqual([
      "dry",
      "oily",
    ]);
    expect(toProductQuery({ skin_type: "Sensitive" }).skinType).toEqual(["sensitive"]);
  });

  it("drops a value that is not a slug, and the whole filter when none is left", () => {
    expect(toProductQuery({ skin_type: ["dry", "<script>"] }).skinType).toEqual(["dry"]);
    expect(toProductQuery({ skin_type: "" }).skinType).toBeUndefined();
  });

  it("caps the number of skin types so a URL cannot mint unbounded cache keys", () => {
    const many = Array.from({ length: 15 }, (_, index) => `type-${String(index).padStart(2, "0")}`);

    expect(toProductQuery({ skin_type: many }).skinType).toHaveLength(10);
  });

  it("writes skin types after the shade in the canonical search, and counts as a filter", () => {
    const query = toProductQuery({ skin_type: ["oily", "dry"], shade: "ivory", brand: "verde" });

    expect(toCanonicalSearch(query)).toBe("brand=verde&shade=ivory&skin_type=dry&skin_type=oily");
    expect(hasFilters(toProductQuery({ skin_type: "dry" }))).toBe(true);
  });

  it("toggles a skin type on and off, returning to page one", () => {
    const query = toProductQuery({ skin_type: "dry", offset: "25" });

    expect(hrefWith(query, { skinType: withToggled(query.skinType, "oily") })).toBe(
      "/products?skin_type=dry&skin_type=oily",
    );
    expect(hrefWith(query, { skinType: withToggled(query.skinType, "dry") })).toBe("/products");
  });
});

describe("toCanonicalSearch", () => {
  it("orders fields the same way whatever order they arrived in", () => {
    const a = toProductQuery({ size: "m", category: "tees" });
    const b = toProductQuery({ category: "tees", size: "m" });

    expect(toCanonicalSearch(a)).toBe(toCanonicalSearch(b));
    expect(toCanonicalSearch(a)).toBe("category=tees&size=m");
  });

  it("omits limit, which is fixed rather than client-controlled", () => {
    expect(toCanonicalSearch(toProductQuery({}))).toBe("");
  });

  it("is idempotent, so a redirect cannot loop", () => {
    const once = toCanonicalSearch(toProductQuery({ category: "tees", offset: "50" }));
    const twice = toCanonicalSearch(
      toProductQuery(Object.fromEntries(new URLSearchParams(once).entries())),
    );

    expect(twice).toBe(once);
  });
});

describe("toRequestedSearch", () => {
  it("differs from canonical when an unknown parameter is present", () => {
    const raw = { category: "tees", utm_source: "ig" };

    expect(toRequestedSearch(raw)).not.toBe(toCanonicalSearch(toProductQuery(raw)));
  });

  it("differs from canonical when the order is wrong", () => {
    const raw = { size: "m", category: "tees" };

    expect(toRequestedSearch(raw)).not.toBe(toCanonicalSearch(toProductQuery(raw)));
  });

  it("matches canonical for an already-canonical URL", () => {
    const raw = { category: "tees", size: "m" };

    expect(toRequestedSearch(raw)).toBe(toCanonicalSearch(toProductQuery(raw)));
  });
});

describe("hasFilters", () => {
  it("is false for a bare listing and for search or sort alone", () => {
    expect(hasFilters(toProductQuery({}))).toBe(false);
    expect(hasFilters(toProductQuery({ search: "tee", ordering: "name" }))).toBe(false);
  });

  it("is true once a filter narrows the set", () => {
    expect(hasFilters(toProductQuery({ size: "m" }))).toBe(true);
    expect(hasFilters(toProductQuery({ shade: "porcelain" }))).toBe(true);
    expect(hasFilters(toProductQuery({ brand: "lumiere" }))).toBe(true);
    expect(hasFilters(toProductQuery({ in_stock: "true" }))).toBe(true);
  });
});

describe("hrefWith", () => {
  it("adds a filter", () => {
    expect(hrefWith(toProductQuery({}), { size: "m" })).toBe("/products?size=m");
  });

  it("removes a filter", () => {
    expect(hrefWith(toProductQuery({ size: "m", category: "tees" }), { size: undefined })).toBe(
      "/products?category=tees",
    );
  });

  it("returns to page one when a filter changes", () => {
    // Staying on page 3 of a narrower set lands on an empty page.
    const query = toProductQuery({ offset: "50" });

    expect(hrefWith(query, { size: "m" })).toBe("/products?size=m");
  });

  it("keeps the offset when paginating", () => {
    const query = toProductQuery({ category: "tees" });

    expect(hrefWith(query, { offset: 25 }, { keepOffset: true })).toBe(
      "/products?category=tees&offset=25",
    );
  });

  it("builds links under another path, for the brand pages", () => {
    expect(hrefWith(toProductQuery({}), { shade: "porcelain" }, { pathname: "/brands/lumiere" })).toBe(
      "/brands/lumiere?shade=porcelain",
    );
  });

  it("returns the bare path when nothing is applied", () => {
    expect(hrefWith(toProductQuery({ size: "m" }), { size: undefined })).toBe("/products");
  });
});
