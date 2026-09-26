import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import {
  findCategory,
  listingFacets,
  navigationBrands,
  navigationCategories,
  shopMenu,
} from "@/lib/catalog/navigation";
import { brands, categoryTree, shades, sizes, skinTypes } from "@/tests/fixtures/catalog";

const { listCategories, listBrands, listShades, listSizes, listSkinTypes } = vi.hoisted(() => ({
  listCategories: vi.fn(),
  listBrands: vi.fn(),
  listShades: vi.fn(),
  listSizes: vi.fn(),
  listSkinTypes: vi.fn(),
}));

vi.mock("@/lib/api/catalog", () => ({
  listCategories,
  listBrands,
  listShades,
  listSizes,
  listSkinTypes,
}));

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
    listSkinTypes.mockResolvedValue(skinTypes);

    await expect(listingFacets()).resolves.toEqual({
      categories: categoryTree,
      brands,
      shades: [],
      sizes,
      skinTypes,
    });
  });

  it("returns the shades when that list answers", async () => {
    listCategories.mockResolvedValue([]);
    listBrands.mockResolvedValue([]);
    listShades.mockResolvedValue(shades);
    listSizes.mockResolvedValue([]);
    listSkinTypes.mockRejectedValue(new ApiError("not_found", 404, {}, null, "No route."));

    await expect(listingFacets()).resolves.toMatchObject({ shades, skinTypes: [] });
  });
});

describe("shopMenu", () => {
  it("builds a column per root category, opening with Shop all for the root", () => {
    const [skincare] = shopMenu(categoryTree, []);

    expect(skincare).toEqual({
      title: "Skincare",
      links: [
        { label: "Shop all", href: "/products?category=skincare" },
        { label: "Cleansers", href: "/products?category=cleansers" },
        { label: "Serums", href: "/products?category=serums" },
      ],
    });
  });

  it("puts the skin-type column after the first root, linking each to ?skin_type=", () => {
    const columns = shopMenu(categoryTree, skinTypes);

    expect(columns.map((column) => column.title)).toEqual(["Skincare", "Skin type", "Fragrance"]);
    expect(columns[1]?.links[0]).toEqual({ label: "Dry", href: "/products?skin_type=dry" });
  });

  it("gives a root with no children only its Shop all link", () => {
    const fragrance = shopMenu(categoryTree, skinTypes).at(-1);

    expect(fragrance?.links).toEqual([{ label: "Shop all", href: "/products?category=fragrance" }]);
  });

  it("leaves the skin-type column out when the API lists none, and is empty with no categories", () => {
    expect(shopMenu(categoryTree, []).map((column) => column.title)).toEqual([
      "Skincare",
      "Fragrance",
    ]);
    expect(shopMenu([], skinTypes).map((column) => column.title)).toEqual(["Skin type"]);
  });
});

describe("findCategory", () => {
  it("finds a root with no child, and a child with its root", () => {
    expect(findCategory(categoryTree, "skincare")).toMatchObject({
      root: { slug: "skincare" },
      child: null,
    });
    expect(findCategory(categoryTree, "serums")).toMatchObject({
      root: { slug: "skincare" },
      child: { slug: "serums" },
    });
  });

  it("is null for no slug and for a slug outside the tree", () => {
    expect(findCategory(categoryTree, undefined)).toBeNull();
    expect(findCategory(categoryTree, "haircare")).toBeNull();
  });
});
