import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { CategoryRail } from "@/components/home/CategoryRail";
import { ApiError } from "@/lib/api/errors";
import type { ProductSummary } from "@/lib/api/types";
import { brands, categoryTree, discountedCream, velvetLipTint } from "@/tests/fixtures/catalog";

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
    listCategories.mockResolvedValue([]);
    listBrands.mockResolvedValue(brands);

    await renderHome();

    expect(listProducts).toHaveBeenCalledWith({ ordering: "-created_at", limit: 8 });
    const arrivals = section(/^New arrivals$/);
    expect(within(arrivals).getByRole("link", { name: "Product 0" })).toHaveAttribute(
      "href",
      "/products/product-0",
    );
    expect(within(arrivals).getAllByRole("article")).toHaveLength(8);
  });

  it("shows what is on sale in its own rail, linking to the sale listing", async () => {
    listProducts.mockImplementation((query: { onSale?: boolean }) =>
      Promise.resolve(pageOf(query.onSale ? [discountedCream] : productsNamed(2))),
    );
    listCategories.mockResolvedValue([]);
    listBrands.mockResolvedValue([]);

    await renderHome();

    expect(listProducts).toHaveBeenCalledWith({ onSale: true, limit: 8 });
    const rail = section(/^On sale$/);
    expect(within(rail).getAllByRole("article")).toHaveLength(1);
    expect(within(rail).getByText("15% off")).toBeInTheDocument();
    expect(within(rail).getByRole("link", { name: /Everything on sale/ })).toHaveAttribute(
      "href",
      "/products?on_sale=true",
    );
  });

  it("hides the sale rail when nothing is on sale", async () => {
    listProducts.mockImplementation((query: { onSale?: boolean }) =>
      Promise.resolve(pageOf(query.onSale ? [] : productsNamed(2))),
    );
    listCategories.mockResolvedValue([]);
    listBrands.mockResolvedValue([]);

    await renderHome();

    expect(section(/^New arrivals$/)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /On sale/ })).not.toBeInTheDocument();
  });

  it("points the editorial at the first root category", async () => {
    listProducts.mockResolvedValue(pageOf([]));
    listCategories.mockResolvedValue(categoryTree);
    listBrands.mockResolvedValue([]);

    await renderHome();

    expect(
      within(section(/Care matched to how your skin behaves/)).getByRole("link", {
        name: /Discover more/,
      }),
    ).toHaveAttribute("href", "/products?category=skincare");
  });

  it("links each brand to its page", async () => {
    listProducts.mockResolvedValue(pageOf([]));
    listCategories.mockResolvedValue([]);
    listBrands.mockResolvedValue(brands);

    await renderHome();

    expect(within(section(/Our brands/)).getByRole("link", { name: /Verde/ })).toHaveAttribute(
      "href",
      "/brands/verde",
    );
  });

  it("gives the header's Journal and About links something to land on", async () => {
    listProducts.mockResolvedValue(pageOf([]));
    listCategories.mockResolvedValue([]);
    listBrands.mockResolvedValue([]);

    await renderHome();

    expect(section(/Our journal/)).toHaveAttribute("id", "journal");
    const about = screen.getByRole("list", { name: "Why shop with us" });
    expect(about.closest("section")).toHaveAttribute("id", "about");
    expect(about).toHaveTextContent("Cash on delivery");
    expect(about).toHaveTextContent("Authentic products");
    expect(about).toHaveTextContent("Delivery across Nepal");
  });

  it("keeps the hero and drops the rails and brands when the catalogue fails", async () => {
    listProducts.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));
    listCategories.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));
    listBrands.mockRejectedValue(new ApiError("throttled", 429, {}, null, "Slow down."));

    await renderHome();

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /New arrivals/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Our brands/ })).not.toBeInTheDocument();
    expect(
      within(section(/Care matched to how your skin behaves/)).getByRole("link", {
        name: /Discover more/,
      }),
    ).toHaveAttribute("href", "/products");
  });
});

describe("CategoryRail", () => {
  it("shows the category's products, its children included, and links to all of them", async () => {
    listProducts.mockResolvedValue(pageOf(productsNamed(3)));
    const [skincare] = categoryTree;
    if (skincare === undefined) throw new Error("fixture");

    render(await CategoryRail({ category: skincare }));

    expect(listProducts).toHaveBeenCalledWith({ category: "skincare", limit: 8 });
    const rail = section(/^The skincare shelf$/);
    expect(within(rail).getAllByRole("article")).toHaveLength(3);
    expect(within(rail).getByRole("link", { name: /All skincare/ })).toHaveAttribute(
      "href",
      "/products?category=skincare",
    );
  });

  it("renders nothing when the category has no products", async () => {
    listProducts.mockResolvedValue(pageOf([]));
    const [skincare] = categoryTree;
    if (skincare === undefined) throw new Error("fixture");

    const { container } = render(await CategoryRail({ category: skincare }));

    expect(container).toBeEmptyDOMElement();
  });
});
