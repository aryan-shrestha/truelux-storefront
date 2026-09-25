import { afterEach, describe, expect, it, vi } from "vitest";

import { getProduct, listCategories, listProducts } from "@/lib/api/catalog";

function stubJson(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
      Promise.resolve(
        new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } }),
      ),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listProducts", () => {
  it("maps the wire's snake_case onto the storefront's camelCase", async () => {
    stubJson({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: "abc",
          name: "Boxy Logo Tee",
          slug: "boxy-logo-tee",
          base_price: "2400.00",
          category: { name: "Tees", slug: "tees" },
          primary_image: { url: "/media/products/tee.jpg", alt_text: "Front" },
          in_stock: true,
        },
      ],
    });

    const page = await listProducts({ category: "tees" });

    expect(page.count).toBe(1);
    expect(page.results[0]).toEqual({
      id: "abc",
      name: "Boxy Logo Tee",
      slug: "boxy-logo-tee",
      basePrice: "2400.00",
      category: { name: "Tees", slug: "tees" },
      // Resolved against the API: local development serves a relative path.
      primaryImage: {
        url: "http://127.0.0.1:8000/media/products/tee.jpg",
        altText: "Front",
      },
      inStock: true,
    });
  });

  it("keeps a null primary_image as null rather than inventing an image", async () => {
    stubJson({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: "abc",
          name: "Pleated Wide Short",
          slug: "pleated-wide-short",
          base_price: "3200.00",
          category: { name: "Shorts", slug: "shorts" },
          primary_image: null,
          in_stock: true,
        },
      ],
    });

    const page = await listProducts();

    expect(page.results[0]?.primaryImage).toBeNull();
  });
});

describe("getProduct", () => {
  it("maps variants, keeping a price override distinct from the base price", async () => {
    stubJson({
      id: "abc",
      name: "Washed Pocket Tee",
      slug: "washed-pocket-tee",
      base_price: "2650.00",
      category: { name: "Tees", slug: "tees" },
      primary_image: null,
      in_stock: true,
      description: "Garment-dyed.",
      images: [],
      variants: [
        {
          id: "v1",
          size: { name: "XXL", slug: "xxl" },
          color: { name: "Washed Indigo", slug: "washed-indigo" },
          price: "2950.00",
          in_stock: true,
        },
      ],
    });

    const product = await getProduct({ slug: "washed-pocket-tee" });

    expect(product.basePrice).toBe("2650.00");
    expect(product.variants[0]?.price).toBe("2950.00");
    expect(product.variants[0]?.inStock).toBe(true);
  });
});

describe("listCategories", () => {
  it("reads a bare array, not a pagination envelope", async () => {
    stubJson([
      { name: "Tops", slug: "tops", children: [{ name: "Tees", slug: "tees" }] },
      { name: "Bottoms", slug: "bottoms", children: [] },
    ]);

    const categories = await listCategories();

    expect(categories).toHaveLength(2);
    expect(categories[0]?.children[0]?.slug).toBe("tees");
    expect(categories[1]?.children).toEqual([]);
  });
});
