import { afterEach, describe, expect, it, vi } from "vitest";

import { navigationCategories } from "@/lib/catalog/navigation";
import { ApiError } from "@/lib/api/errors";
import { categoryTree } from "@/tests/fixtures/catalog";

const listCategories = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/catalog", () => ({ listCategories }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("navigationCategories", () => {
  it("returns the tree when the API answers", async () => {
    listCategories.mockResolvedValue(categoryTree);

    await expect(navigationCategories()).resolves.toEqual(categoryTree);
  });

  it("degrades to an empty menu when the API fails", async () => {
    // The one place in the storefront that swallows an ApiError. Without it a
    // navigation menu takes down every page in the shop.
    listCategories.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));

    await expect(navigationCategories()).resolves.toEqual([]);
  });

  it("degrades when the API cannot be reached at all", async () => {
    listCategories.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(navigationCategories()).resolves.toEqual([]);
  });
});
