import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { ApiError } from "@/lib/api/errors";
import type { ProductSummary } from "@/lib/api/types";
import { boxyLogoTee, categoryTree } from "@/tests/fixtures/catalog";

const { listProducts, listCategories } = vi.hoisted(() => ({
  listProducts: vi.fn(),
  listCategories: vi.fn(),
}));

vi.mock("@/lib/api/catalog", () => ({ listProducts, listCategories }));

function pageOf(results: ProductSummary[]) {
  return { count: results.length, next: null, previous: null, results };
}

function productsNamed(count: number): ProductSummary[] {
  return Array.from({ length: count }, (_, index) => ({
    ...boxyLogoTee,
    id: `product-${index}`,
    name: `Product ${index}`,
    slug: `product-${index}`,
  }));
}

function tileLinks(section: HTMLElement) {
  return within(section)
    .getAllByRole("listitem")
    .map((item) => item.querySelector("a")?.getAttribute("href"));
}

async function renderHome() {
  render(await Home());
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("/", () => {
  it("shows the six newest in the rail and the oldest three in the collection", async () => {
    listProducts.mockResolvedValue(pageOf(productsNamed(9)));
    listCategories.mockResolvedValue(categoryTree);

    await renderHome();

    const rail = screen.getByRole("region", { name: /New this week/ });
    expect(tileLinks(rail)).toEqual([0, 1, 2, 3, 4, 5].map((i) => `/products/product-${i}`));
    expect(within(rail).getByRole("heading", { level: 2 })).toHaveTextContent("(6)");

    const collection = screen.getByRole("region", { name: /Collections/ });
    const grid = within(collection).getAllByRole("list").at(-1)!;
    expect(tileLinks(grid)).toEqual([6, 7, 8].map((i) => `/products/product-${i}`));
  });

  it("keeps the hero and says the shop is not open when the catalogue is empty", async () => {
    listProducts.mockResolvedValue(pageOf([]));
    listCategories.mockResolvedValue([]);

    await renderHome();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/New\s*collection/i);
    expect(screen.getByText("The shop is not open yet")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /New this week/ })).not.toBeInTheDocument();
  });

  it("renders the same state rather than failing when the product fetch fails", async () => {
    listProducts.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));
    listCategories.mockResolvedValue(categoryTree);

    await renderHome();

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("The shop is not open yet")).toBeInTheDocument();
  });

  it("links each root category to its own filter", async () => {
    listProducts.mockResolvedValue(pageOf(productsNamed(3)));
    listCategories.mockResolvedValue(categoryTree);

    await renderHome();

    const nav = screen.getByRole("navigation", { name: "Categories" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/products?category=tops", "/products?category=bottoms"]);
  });

  it("searches through the listing with a plain form", async () => {
    listProducts.mockResolvedValue(pageOf([]));
    listCategories.mockResolvedValue([]);

    await renderHome();

    const input = screen.getByRole("searchbox", { name: "Search the shop" });
    expect(input).toHaveAttribute("name", "search");
    expect(input.closest("form")).toHaveAttribute("action", "/products");
  });

  it("sorts by price through the listing's own ordering", async () => {
    listProducts.mockResolvedValue(pageOf(productsNamed(3)));
    listCategories.mockResolvedValue(categoryTree);

    await renderHome();

    expect(screen.getByRole("link", { name: "Price, Less to more" })).toHaveAttribute(
      "href",
      "/products?ordering=base_price",
    );
    expect(screen.getByRole("link", { name: "Price, More to Less" })).toHaveAttribute(
      "href",
      "/products?ordering=-base_price",
    );
  });
});
