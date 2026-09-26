import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getBrand,
  getProduct,
  listBrands,
  listCategories,
  listProducts,
  listRelatedProducts,
  listShades,
  listSizes,
  listSkinTypes,
} from "@/lib/api/catalog";

function stubJson(body: unknown) {
  const fetchMock = vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
    Promise.resolve(
      new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestedUrl(fetchMock: ReturnType<typeof stubJson>): URL {
  return new URL(String(fetchMock.mock.calls[0]?.[0]));
}

const noSkinCare = { skin_types: [], skin_feel: "", key_ingredients: "" };

const rawSummary = {
  id: "abc",
  name: "Velvet Lip Tint",
  slug: "velvet-lip-tint",
  base_price: "1800.00",
  brand: { name: "Lumière", slug: "lumiere" },
  category: { name: "Lips", slug: "lips" },
  primary_image: { url: "/media/products/tint.jpg", alt_text: "Uncapped" },
  in_stock: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listProducts", () => {
  it("maps the wire's snake_case onto the storefront's camelCase, brand included", async () => {
    stubJson({ count: 1, next: null, previous: null, results: [rawSummary] });

    const page = await listProducts({ category: "lips" });

    expect(page.results[0]).toEqual({
      id: "abc",
      name: "Velvet Lip Tint",
      slug: "velvet-lip-tint",
      basePrice: "1800.00",
      brand: { name: "Lumière", slug: "lumiere" },
      category: { name: "Lips", slug: "lips" },
      primaryImage: {
        url: "http://127.0.0.1:8000/media/products/tint.jpg",
        altText: "Uncapped",
      },
      inStock: true,
    });
  });

  it("repeats ?brand= once per brand and sends shade and size", async () => {
    const fetchMock = stubJson({ count: 0, next: null, previous: null, results: [] });

    await listProducts({ brand: ["lumiere", "verde"], shade: "warm-beige", size: "30-ml" });

    const params = requestedUrl(fetchMock).searchParams;
    expect(params.getAll("brand")).toEqual(["lumiere", "verde"]);
    expect(params.get("shade")).toBe("warm-beige");
    expect(params.get("size")).toBe("30-ml");
    expect(params.has("color")).toBe(false);
  });

  it("repeats ?skin_type= once per skin type", async () => {
    const fetchMock = stubJson({ count: 0, next: null, previous: null, results: [] });

    await listProducts({ skinType: ["dry", "oily"] });

    expect(requestedUrl(fetchMock).searchParams.getAll("skin_type")).toEqual(["dry", "oily"]);
  });

  it("keeps a null primary_image as null", async () => {
    stubJson({
      count: 1,
      next: null,
      previous: null,
      results: [{ ...rawSummary, primary_image: null }],
    });

    const page = await listProducts();

    expect(page.results[0]?.primaryImage).toBeNull();
  });
});

describe("getProduct", () => {
  it("maps a shade with its hex code, and keeps a price override distinct", async () => {
    stubJson({
      ...rawSummary,
      base_price: "3200.00",
      description: "Satin finish.",
      images: [],
      ...noSkinCare,
      variants: [
        {
          id: "v1",
          size: { name: "50 ml", slug: "50-ml" },
          shade: { name: "Warm Beige", slug: "warm-beige", hex_code: "#D8A47F" },
          price: "4400.00",
          in_stock: true,
        },
      ],
    });

    const product = await getProduct({ slug: "silk-skin-foundation" });

    expect(product.basePrice).toBe("3200.00");
    expect(product.variants[0]?.price).toBe("4400.00");
    expect(product.variants[0]?.shade).toEqual({
      name: "Warm Beige",
      slug: "warm-beige",
      hexCode: "#D8A47F",
    });
  });

  it("keeps a shadeless variant's shade as null", async () => {
    stubJson({
      ...rawSummary,
      description: "",
      images: [],
      ...noSkinCare,
      variants: [
        {
          id: "v1",
          size: { name: "15 ml", slug: "15-ml" },
          shade: null,
          price: "2900.00",
          in_stock: true,
        },
      ],
    });

    const product = await getProduct({ slug: "hydrating-serum" });

    expect(product.variants[0]?.shade).toBeNull();
  });

  it("maps skin types, skin feel and key ingredients", async () => {
    stubJson({
      ...rawSummary,
      description: "",
      images: [],
      variants: [],
      skin_types: [{ name: "Combination", slug: "combination" }],
      skin_feel: "Soothed, balanced, refreshed",
      key_ingredients: "Water (Aqua), Niacinamide",
    });

    const product = await getProduct({ slug: "balancing-toner" });

    expect(product.skinTypes).toEqual([{ name: "Combination", slug: "combination" }]);
    expect(product.skinFeel).toBe("Soothed, balanced, refreshed");
    expect(product.keyIngredients).toBe("Water (Aqua), Niacinamide");
  });
});

describe("listRelatedProducts", () => {
  it("asks for one category with a limit, revalidating hourly", async () => {
    const fetchMock = stubJson({ count: 1, next: null, previous: null, results: [rawSummary] });

    const page = await listRelatedProducts({ category: "lips", limit: 8 });

    const url = requestedUrl(fetchMock);
    expect(url.searchParams.toString()).toBe("category=lips&limit=8");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ next: { revalidate: 3600 } });
    expect(page.results[0]?.basePrice).toBe("1800.00");
  });
});

describe("listSkinTypes", () => {
  it("reads the facet as a bare array", async () => {
    const fetchMock = stubJson([{ name: "Dry", slug: "dry" }]);

    await expect(listSkinTypes()).resolves.toEqual([{ name: "Dry", slug: "dry" }]);
    expect(requestedUrl(fetchMock).pathname).toBe("/api/v1/skin-types/");
  });
});

describe("listCategories", () => {
  it("reads a bare array, not a pagination envelope", async () => {
    stubJson([
      { name: "Skincare", slug: "skincare", children: [{ name: "Serums", slug: "serums" }] },
      { name: "Fragrance", slug: "fragrance", children: [] },
    ]);

    const categories = await listCategories();

    expect(categories[0]?.children[0]?.slug).toBe("serums");
    expect(categories[1]?.children).toEqual([]);
  });
});

describe("brands", () => {
  const rawBrand = {
    name: "Lumière",
    slug: "lumiere",
    description: "French-inspired complexion care.",
    logo_url: "/media/brands/lumiere.png",
    product_count: 6,
  };

  it("lists brands from a bare array, resolving a relative logo", async () => {
    const fetchMock = stubJson([rawBrand, { ...rawBrand, slug: "verde", logo_url: null }]);

    const brands = await listBrands();

    expect(requestedUrl(fetchMock).pathname).toBe("/api/v1/brands/");
    expect(brands[0]).toMatchObject({
      slug: "lumiere",
      logoUrl: "http://127.0.0.1:8000/media/brands/lumiere.png",
      productCount: 6,
    });
    expect(brands[1]?.logoUrl).toBeNull();
  });

  it("reads one brand by slug", async () => {
    const fetchMock = stubJson(rawBrand);

    const brand = await getBrand({ slug: "lumiere" });

    expect(requestedUrl(fetchMock).pathname).toBe("/api/v1/brands/lumiere/");
    expect(brand.description).toBe("French-inspired complexion care.");
  });
});

describe("shade and size lists", () => {
  it("maps shades with their hex codes", async () => {
    stubJson([{ name: "Warm Beige", slug: "warm-beige", hex_code: "#D8A47F" }]);

    await expect(listShades()).resolves.toEqual([
      { name: "Warm Beige", slug: "warm-beige", hexCode: "#D8A47F" },
    ]);
  });

  it("maps sizes", async () => {
    const fetchMock = stubJson([{ name: "50 ml", slug: "50-ml" }]);

    await expect(listSizes()).resolves.toEqual([{ name: "50 ml", slug: "50-ml" }]);
    expect(requestedUrl(fetchMock).pathname).toBe("/api/v1/sizes/");
  });
});
