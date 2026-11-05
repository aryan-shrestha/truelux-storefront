import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FilterPanel } from "@/components/catalog/FilterPanel";
import type { ProductQuery } from "@/lib/api/types";
import { brands, shades, sizes, skinTypes } from "@/tests/fixtures/catalog";

const facets = { brands, shades, sizes, skinTypes };

function renderPanel(query: ProductQuery, props: { pathname?: string; showBrands?: boolean } = {}) {
  render(<FilterPanel facets={facets} query={query} {...props} />);
}

describe("FilterPanel", () => {
  it("toggles skin types as a repeatable filter, keeping the category", () => {
    renderPanel({ category: "serums", skinType: ["dry"] });

    expect(screen.getByRole("link", { name: "Oily" })).toHaveAttribute(
      "href",
      "/products?category=serums&skin_type=dry&skin_type=oily",
    );
    const dry = screen.getByRole("link", { name: "Dry" });
    expect(dry).toHaveAttribute("aria-current", "true");
    expect(dry).toHaveAttribute("href", "/products?category=serums");
  });

  it("adds a brand to the ones already applied, and removes an applied one", () => {
    renderPanel({ brand: ["verde"] });

    expect(screen.getByRole("link", { name: "Lumière" })).toHaveAttribute(
      "href",
      "/products?brand=lumiere&brand=verde",
    );
    const verde = screen.getByRole("link", { name: "Verde" });
    expect(verde).toHaveAttribute("aria-current", "true");
    expect(verde).toHaveAttribute("href", "/products");
  });

  it("offers shades as named swatch links carrying ?shade=", () => {
    renderPanel({});

    expect(screen.getByRole("link", { name: "Warm Beige" })).toHaveAttribute(
      "href",
      "/products?shade=warm-beige",
    );
  });

  it("offers sizes as links carrying ?size=, and toggles an applied one off", () => {
    renderPanel({ size: "30-ml" });

    expect(screen.getByRole("link", { name: "50 ml" })).toHaveAttribute(
      "href",
      "/products?size=50-ml",
    );
    expect(screen.getByRole("link", { name: "30 ml" })).toHaveAttribute("href", "/products");
  });

  it("offers On sale as a link carrying ?on_sale=true, keeping the other filters", () => {
    renderPanel({ category: "serums", skinType: ["dry"] });

    const onSale = screen.getByRole("link", { name: "On sale" });
    expect(onSale).toHaveAttribute("href", "/products?category=serums&skin_type=dry&on_sale=true");
    expect(onSale).not.toHaveAttribute("aria-current");
  });

  it("marks an applied On sale and toggles it off", () => {
    renderPanel({ onSale: true, inStock: true });

    const onSale = screen.getByRole("link", { name: "On sale" });
    expect(onSale).toHaveAttribute("aria-current", "true");
    expect(onSale).toHaveAttribute("href", "/products?in_stock=true");
  });

  it("clears every filter but keeps the category, search and sort", () => {
    renderPanel({ category: "serums", search: "rose", ordering: "name", skinType: ["dry"] });

    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/products?category=serums&search=rose&ordering=name",
    );
  });

  it("hides the brand group on a brand page and builds links under that page", () => {
    renderPanel({}, { pathname: "/brands/lumiere", showBrands: false });

    expect(screen.queryByRole("link", { name: "Verde" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Porcelain" })).toHaveAttribute(
      "href",
      "/brands/lumiere?shade=porcelain",
    );
  });

  it("leaves out a group the API returned nothing for", () => {
    render(<FilterPanel facets={{ ...facets, shades: [], sizes: [], skinTypes: [] }} query={{}} />);

    expect(screen.queryByRole("heading", { name: "Shade" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Size" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Skin type" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Price" })).toBeInTheDocument();
  });
});
