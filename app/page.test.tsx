import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { ApiError } from "@/lib/api/errors";
import type { ProductSummary } from "@/lib/api/types";
import { brands, categoryTree, velvetLipTint } from "@/tests/fixtures/catalog";

const { listProducts, listCategories, listBrands } = vi.hoisted(() => ({
  listProducts: vi.fn(),
  listCategories: vi.fn(),
  listBrands: vi.fn(),
}));

vi.mock("@/lib/api/catalog", () => ({ listProducts, listCategories, listBrands }));

function pageOf(results: ProductSummary[]) {
  return { count: results.length, next: null, previous: null, results };
}

function productsNamed(count: number): ProductSummary[] {
  return Array.from({ length: count }, (_, index) => ({
    ...velvetLipTint,
    id: `product-${index}`,
    name: `Product ${index}`,
    slug: `product-${index}`,
  }));
}

async function renderHome() {
  render(await Home());
}

function section(name: RegExp) {
  return screen.getByRole("region", { name });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("/", () => {
  it("shows the newest products as new arrivals, asking for eight", async () => {
    listProducts.mockResolvedValue(pageOf(productsNamed(8)));
    listCategories.mockResolvedValue(categoryTree);
    listBrands.mockResolvedValue(brands);

    await renderHome();

    expect(listProducts).toHaveBeenCalledWith({ ordering: "-created_at", limit: 8 });
    const arrivals = section(/New arrivals/);
    expect(within(arrivals).getByRole("link", { name: "Product 0" })).toHaveAttribute(
      "href",
      "/products/product-0",
    );
    expect(within(arrivals).getAllByRole("article")).toHaveLength(8);
  });

  it("links each category to its filter and each brand to its page", async () => {
    listProducts.mockResolvedValue(pageOf([]));
    listCategories.mockResolvedValue(categoryTree);
    listBrands.mockResolvedValue(brands);

    await renderHome();

    expect(within(section(/Shop by category/)).getByRole("link", { name: "Fragrance" })).toHaveAttribute(
      "href",
      "/products?category=fragrance",
    );
    expect(within(section(/Our brands/)).getByRole("link", { name: "Verde" })).toHaveAttribute(
      "href",
      "/brands/verde",
    );
  });

  it("promises cash on delivery, authentic products and delivery", async () => {
    listProducts.mockResolvedValue(pageOf([]));
    listCategories.mockResolvedValue([]);
    listBrands.mockResolvedValue([]);

    await renderHome();

    const promises = section(/Why shop with us/);
    expect(promises).toHaveTextContent("Cash on delivery");
    expect(promises).toHaveTextContent("Authentic products");
    expect(promises).toHaveTextContent("Delivery across Nepal");
  });

  it("keeps the hero and says the shelves are empty when the catalogue fails", async () => {
    listProducts.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));
    listCategories.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));
    listBrands.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));

    await renderHome();

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("The shelves are being stocked")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Our brands/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Shop by category/ })).not.toBeInTheDocument();
  });
});
