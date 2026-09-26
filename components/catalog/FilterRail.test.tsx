import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FilterRail } from "@/components/catalog/FilterRail";
import type { ListingFacets } from "@/lib/catalog/navigation";
import { brands, categoryTree, shades, sizes, skinTypes } from "@/tests/fixtures/catalog";

const facets: ListingFacets = { categories: categoryTree, brands, shades, sizes, skinTypes };

describe("FilterRail", () => {
  it("links categories and their children, marking the applied one", () => {
    render(<FilterRail facets={facets} query={{ category: "serums" }} />);

    expect(screen.getByRole("link", { name: "Fragrance" })).toHaveAttribute(
      "href",
      "/products?category=fragrance",
    );
    expect(screen.getByRole("link", { name: "Serums" })).toHaveAttribute("aria-current", "true");
  });

  it("adds a brand to the ones already applied, and removes an applied one", () => {
    render(<FilterRail facets={facets} query={{ brand: ["verde"] }} />);

    expect(screen.getByRole("link", { name: "Lumière" })).toHaveAttribute(
      "href",
      "/products?brand=lumiere&brand=verde",
    );
    const verde = screen.getByRole("link", { name: "Verde" });
    expect(verde).toHaveAttribute("aria-current", "true");
    expect(verde).toHaveAttribute("href", "/products");
  });

  it("offers shades as named swatch links carrying ?shade=", () => {
    render(<FilterRail facets={facets} query={{}} />);

    expect(screen.getByRole("link", { name: "Warm Beige" })).toHaveAttribute(
      "href",
      "/products?shade=warm-beige",
    );
  });

  it("offers sizes as links carrying ?size=, and toggles an applied one off", () => {
    render(<FilterRail facets={facets} query={{ size: "30-ml" }} />);

    expect(screen.getByRole("link", { name: "50 ml" })).toHaveAttribute(
      "href",
      "/products?size=50-ml",
    );
    expect(screen.getByRole("link", { name: "30 ml" })).toHaveAttribute("href", "/products");
  });

  it("hides the brand group on a brand page and builds links under that page", () => {
    render(
      <FilterRail facets={facets} query={{}} pathname="/brands/lumiere" showBrands={false} />,
    );

    expect(screen.queryByRole("link", { name: "Verde" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Porcelain" })).toHaveAttribute(
      "href",
      "/brands/lumiere?shade=porcelain",
    );
  });

  it("leaves out a group the API returned nothing for", () => {
    render(<FilterRail facets={{ ...facets, shades: [], sizes: [] }} query={{}} />);

    expect(screen.queryByRole("button", { name: "Shade" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Size" })).not.toBeInTheDocument();
  });
});
