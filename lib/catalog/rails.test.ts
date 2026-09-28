import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, ApiUnreachableError } from "@/lib/api/errors";
import {
  categoryProducts,
  latestProducts,
  relatedProducts,
  saleProducts,
} from "@/lib/catalog/rails";
import { hydratingSerum, soldOutPerfume, velvetLipTint } from "@/tests/fixtures/catalog";

const { listProducts, listRelatedProducts } = vi.hoisted(() => ({
  listProducts: vi.fn(),
  listRelatedProducts: vi.fn(),
}));

vi.mock("@/lib/api/catalog", () => ({ listProducts, listRelatedProducts }));

function pageOf(results: unknown[]) {
  return { count: results.length, next: null, previous: null, results };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("latestProducts", () => {
  it("asks for the eight newest products", async () => {
    listProducts.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });

    await latestProducts();

    expect(listProducts).toHaveBeenCalledWith({ ordering: "-created_at", limit: 8 });
  });

  it("returns the results when the API answers", async () => {
    listProducts.mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [soldOutPerfume, velvetLipTint],
    });

    await expect(latestProducts()).resolves.toEqual([soldOutPerfume, velvetLipTint]);
  });

  it("degrades to nothing when the API refuses", async () => {
    listProducts.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));

    await expect(latestProducts()).resolves.toEqual([]);
  });

  it("degrades to nothing when the API cannot be reached", async () => {
    listProducts.mockRejectedValue(new ApiUnreachableError(new TypeError("Failed to fetch")));

    await expect(latestProducts()).resolves.toEqual([]);
  });

  it("lets anything that is not an API failure reach the error boundary", async () => {
    listProducts.mockRejectedValue(new TypeError("results is undefined"));

    await expect(latestProducts()).rejects.toThrow(TypeError);
  });
});

describe("saleProducts", () => {
  it("asks for eight products on sale", async () => {
    listProducts.mockResolvedValue(pageOf([velvetLipTint]));

    await expect(saleProducts()).resolves.toEqual([velvetLipTint]);
    expect(listProducts).toHaveBeenCalledWith({ onSale: true, limit: 8 });
  });

  it("degrades to no rail when the API fails", async () => {
    listProducts.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));

    await expect(saleProducts()).resolves.toEqual([]);
  });
});

describe("categoryProducts", () => {
  it("asks for eight products from the category, its children included by the API", async () => {
    listProducts.mockResolvedValue(pageOf([velvetLipTint]));

    await expect(categoryProducts("skincare")).resolves.toEqual([velvetLipTint]);
    expect(listProducts).toHaveBeenCalledWith({ category: "skincare", limit: 8 });
  });
});

describe("relatedProducts", () => {
  it("asks for the product's category and drops the product itself", async () => {
    const self = { ...velvetLipTint, id: hydratingSerum.id };
    listRelatedProducts.mockResolvedValue(pageOf([self, soldOutPerfume, velvetLipTint]));

    const related = await relatedProducts(hydratingSerum);

    expect(listRelatedProducts).toHaveBeenCalledWith({ category: "serums", limit: 9 });
    expect(related.map((product) => product.id)).toEqual([soldOutPerfume.id, velvetLipTint.id]);
  });

  it("keeps eight when the product is not among the results", async () => {
    const nine = Array.from({ length: 9 }, (_, index) => ({ ...velvetLipTint, id: `p-${index}` }));
    listRelatedProducts.mockResolvedValue(pageOf(nine));

    await expect(relatedProducts(hydratingSerum)).resolves.toHaveLength(8);
  });

  it("degrades to no rail when the API fails", async () => {
    listRelatedProducts.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));

    await expect(relatedProducts(hydratingSerum)).resolves.toEqual([]);
  });
});
