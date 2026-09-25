import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, ApiUnreachableError } from "@/lib/api/errors";
import { latestProducts } from "@/lib/catalog/latest";
import { soldOutPerfume, velvetLipTint } from "@/tests/fixtures/catalog";

const listProducts = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/catalog", () => ({ listProducts }));

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
