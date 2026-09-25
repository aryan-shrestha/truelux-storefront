import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import {
  listingFacets,
  navigationBrands,
  navigationCategories,
} from "@/lib/catalog/navigation";
import { brands, categoryTree, shades, sizes } from "@/tests/fixtures/catalog";

const { listCategories, listBrands, listShades, listSizes } = vi.hoisted(() => ({
  listCategories: vi.fn(),
  listBrands: vi.fn(),
  listShades: vi.fn(),
  listSizes: vi.fn(),
}));

vi.mock("@/lib/api/catalog", () => ({ listCategories, listBrands, listShades, listSizes }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("navigationCategories", () => {
  it("returns the tree when the API answers", async () => {
    listCategories.mockResolvedValue(categoryTree);

    await expect(navigationCategories()).resolves.toEqual(categoryTree);
  });

  it("degrades to an empty menu when the API refuses or cannot be reached", async () => {
    listCategories.mockRejectedValueOnce(new ApiError("throttled", 429, {}, null, "Slow down."));
    await expect(navigationCategories()).resolves.toEqual([]);

    listCategories.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(navigationCategories()).resolves.toEqual([]);
  });
});

describe("navigationBrands", () => {
  it("degrades to no brands when the API fails", async () => {
    listBrands.mockRejectedValue(new ApiError("server_error", 500, {}, null, "Oops."));

    await expect(navigationBrands()).resolves.toEqual([]);
  });
});

describe("listingFacets", () => {
  it("gathers every filter list, and one failing list does not empty the others", async () => {
    listCategories.mockResolvedValue(categoryTree);
    listBrands.mockResolvedValue(brands);
    listShades.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));
    listSizes.mockResolvedValue(sizes);

    await expect(listingFacets()).resolves.toEqual({
      categories: categoryTree,
      brands,
      shades: [],
      sizes,
    });
  });

  it("returns the shades when that list answers", async () => {
    listCategories.mockResolvedValue([]);
    listBrands.mockResolvedValue([]);
    listShades.mockResolvedValue(shades);
    listSizes.mockResolvedValue([]);

    await expect(listingFacets()).resolves.toMatchObject({ shades });
  });
});
