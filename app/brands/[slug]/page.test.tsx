import { render, screen } from "@testing-library/react";
import { isValidElement, type ComponentProps, type ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import BrandPage from "@/app/brands/[slug]/page";
import type { ProductListing } from "@/components/catalog/ProductListing";
import { ApiError } from "@/lib/api/errors";
import { brands } from "@/tests/fixtures/catalog";

const { getBrand, redirect, notFound } = vi.hoisted(() => ({
  getBrand: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("not-found");
  }),
}));

vi.mock("@/lib/api/catalog", () => ({
  getBrand,
  listCategories: vi.fn().mockResolvedValue([]),
  listBrands: vi.fn().mockResolvedValue([]),
  listShades: vi.fn().mockResolvedValue([]),
  listSizes: vi.fn().mockResolvedValue([]),
  listSkinTypes: vi.fn().mockResolvedValue([]),
}));
vi.mock("next/navigation", () => ({ redirect, notFound }));

type ListingElement = ReactElement<ComponentProps<typeof ProductListing>>;

async function renderPage(searchParams: Record<string, string | string[]> = {}) {
  const element = await BrandPage({
    params: Promise.resolve({ slug: "lumiere" }),
    searchParams: Promise.resolve(searchParams),
  });
  if (!isValidElement(element)) throw new Error("BrandPage returned no element");
  return element as ListingElement;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("/brands/[slug]", () => {
  it("renders the brand header above the listing, filtered to the brand", async () => {
    getBrand.mockResolvedValue(brands[0]);

    const listing = await renderPage({ shade: "porcelain" });

    expect(listing.props.lockedBrand).toBe("lumiere");
    expect(listing.props.pathname).toBe("/brands/lumiere");
    expect(listing.props.query).toMatchObject({ shade: "porcelain", brand: undefined });

    render(listing.props.heading);
    expect(screen.getByRole("heading", { level: 1, name: "Lumière" })).toBeInTheDocument();
    expect(screen.getByText("French-inspired complexion care.")).toBeInTheDocument();
  });

  it("drops a ?brand= from the URL, because the brand is the path", async () => {
    getBrand.mockResolvedValue(brands[0]);

    await expect(renderPage({ brand: "verde" })).rejects.toThrow("redirect:/brands/lumiere");
  });

  it("renders not-found for an unknown or inactive brand", async () => {
    getBrand.mockRejectedValue(new ApiError("not_found", 404, {}, null, "Not found."));

    await expect(renderPage()).rejects.toThrow("not-found");
  });
});
