import { afterEach, describe, expect, it, vi } from "vitest";

import sitemap from "@/app/sitemap";
import { ApiError } from "@/lib/api/errors";
import type { ProductSummary } from "@/lib/api/types";
import { brands, velvetLipTint } from "@/tests/fixtures/catalog";

const { listProducts, listBrands } = vi.hoisted(() => ({
  listProducts: vi.fn(),
  listBrands: vi.fn(),
}));

vi.mock("@/lib/api/catalog", () => ({ listProducts, listBrands }));

function product(slug: string): ProductSummary {
  return { ...velvetLipTint, id: slug, slug };
}

function page(slugs: string[], next: string | null) {
  return { count: 0, next, previous: null, results: slugs.map(product) };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("sitemap", () => {
  it("lists home, the listing, the brands and every product, fetching 100 at a time", async () => {
    listBrands.mockResolvedValue(brands);
    listProducts
      .mockResolvedValueOnce(page(["a", "b"], "http://api/next"))
      .mockResolvedValueOnce(page(["c"], null));

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toEqual([
      "http://localhost:3000",
      "http://localhost:3000/products",
      "http://localhost:3000/brands",
      "http://localhost:3000/brands/lumiere",
      "http://localhost:3000/brands/verde",
      "http://localhost:3000/products/a",
      "http://localhost:3000/products/b",
      "http://localhost:3000/products/c",
    ]);
    expect(listProducts).toHaveBeenNthCalledWith(1, { limit: 100, offset: 0 });
    expect(listProducts).toHaveBeenNthCalledWith(2, { limit: 100, offset: 100 });
  });

  it("keeps the fixed pages when the API fails, rather than failing the build", async () => {
    listProducts.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));
    listBrands.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toEqual([
      "http://localhost:3000",
      "http://localhost:3000/products",
      "http://localhost:3000/brands",
    ]);
  });
});
