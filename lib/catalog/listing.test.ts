import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { listingPage } from "@/lib/catalog/listing";

const listProducts = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/catalog", () => ({ listProducts }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("listingPage", () => {
  it("returns the page the API answered with", async () => {
    const page = { count: 0, next: null, previous: null, results: [] };
    listProducts.mockResolvedValue(page);

    await expect(listingPage({ brand: ["lumiere"] })).resolves.toBe(page);
  });

  it("treats a rejected filter, such as an unknown brand, as no results", async () => {
    listProducts.mockRejectedValue(new ApiError("validation_error", 400, {}, null, "Bad brand."));

    await expect(listingPage({ brand: ["gone"] })).resolves.toBeNull();
  });

  it("lets any other failure reach the error boundary", async () => {
    listProducts.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));

    await expect(listingPage({})).rejects.toMatchObject({ code: "throttled" });
  });
});
