import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FilterPanel } from "@/components/catalog/FilterPanel";
import type { ProductQuery } from "@/lib/api/types";
import { brands, shades, sizes, skinTypes } from "@/tests/fixtures/catalog";

const facets = { brands, shades, sizes, skinTypes };

async function renderOpen(
  query: ProductQuery,
  props: { pathname?: string; showBrands?: boolean } = {},
) {
  render(<FilterPanel facets={facets} query={query} {...props} />);
  await userEvent.click(screen.getByRole("button", { name: /Filter and sort/ }));
}

describe("FilterPanel", () => {
  it("starts closed, with the applied count on the trigger once filtered", () => {
    render(<FilterPanel facets={facets} query={{ skinType: ["dry", "oily"], size: "30-ml" }} />);

    expect(screen.getByRole("button", { name: "Filter and sort (3 applied)" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("link", { name: "Dry" })).not.toBeInTheDocument();
  });

  it("toggles skin types as a repeatable filter, keeping the category", async () => {
    await renderOpen({ category: "serums", skinType: ["dry"] });

    expect(screen.getByRole("link", { name: "Oily" })).toHaveAttribute(
      "href",
      "/products?category=serums&skin_type=dry&skin_type=oily",
    );
    const dry = screen.getByRole("link", { name: "Dry" });
    expect(dry).toHaveAttribute("aria-current", "true");
    expect(dry).toHaveAttribute("href", "/products?category=serums");
  });

  it("adds a brand to the ones already applied, and removes an applied one", async () => {
    await renderOpen({ brand: ["verde"] });

    expect(screen.getByRole("link", { name: "Lumière" })).toHaveAttribute(
      "href",
      "/products?brand=lumiere&brand=verde",
    );
    const verde = screen.getByRole("link", { name: "Verde" });
    expect(verde).toHaveAttribute("aria-current", "true");
    expect(verde).toHaveAttribute("href", "/products");
  });

  it("offers shades as named swatch links carrying ?shade=", async () => {
    await renderOpen({});

    expect(screen.getByRole("link", { name: "Warm Beige" })).toHaveAttribute(
      "href",
      "/products?shade=warm-beige",
    );
  });

  it("offers sizes as links carrying ?size=, and toggles an applied one off", async () => {
    await renderOpen({ size: "30-ml" });

    expect(screen.getByRole("link", { name: "50 ml" })).toHaveAttribute(
      "href",
      "/products?size=50-ml",
    );
    expect(screen.getByRole("link", { name: "30 ml" })).toHaveAttribute("href", "/products");
  });

  it("offers On sale as a link carrying ?on_sale=true, keeping the other filters", async () => {
    await renderOpen({ category: "serums", skinType: ["dry"] });

    const onSale = screen.getByRole("link", { name: "On sale" });
    expect(onSale).toHaveAttribute("href", "/products?category=serums&skin_type=dry&on_sale=true");
    expect(onSale).not.toHaveAttribute("aria-current");
  });

  it("marks an applied On sale and toggles it off, and carries it through the sort form", async () => {
    await renderOpen({ onSale: true, inStock: true });

    const onSale = screen.getByRole("link", { name: "On sale" });
    expect(onSale).toHaveAttribute("aria-current", "true");
    expect(onSale).toHaveAttribute("href", "/products?in_stock=true");
    expect(document.querySelector('input[name="on_sale"]')).toHaveValue("true");
  });

  it("clears every filter but keeps the category, search and sort", async () => {
    await renderOpen({ category: "serums", search: "rose", ordering: "name", skinType: ["dry"] });

    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/products?category=serums&search=rose&ordering=name",
    );
  });

  it("carries skin types through the sort form", async () => {
    await renderOpen({ skinType: ["dry", "oily"] });

    const hidden = document.querySelectorAll<HTMLInputElement>('input[name="skin_type"]');
    expect([...hidden].map((input) => input.value)).toEqual(["dry", "oily"]);
  });

  it("hides the brand group on a brand page and builds links under that page", async () => {
    await renderOpen({}, { pathname: "/brands/lumiere", showBrands: false });

    expect(screen.queryByRole("link", { name: "Verde" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Porcelain" })).toHaveAttribute(
      "href",
      "/brands/lumiere?shade=porcelain",
    );
  });

  it("leaves out a group the API returned nothing for", async () => {
    render(<FilterPanel facets={{ ...facets, shades: [], sizes: [], skinTypes: [] }} query={{}} />);
    await userEvent.click(screen.getByRole("button", { name: "Filter and sort" }));

    expect(screen.queryByRole("heading", { name: "Shade" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Size" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Skin type" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Price" })).toBeInTheDocument();
  });
});
