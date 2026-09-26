import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CategoryBand } from "@/components/catalog/CategoryBand";
import { categoryTree } from "@/tests/fixtures/catalog";

describe("CategoryBand", () => {
  it("lists the roots under Shop all when no category is applied", () => {
    render(<CategoryBand categories={categoryTree} query={{}} pathname="/products" />);

    expect(screen.getByRole("link", { name: "Shop all" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Skincare" })).toHaveAttribute(
      "href",
      "/products?category=skincare",
    );
    expect(screen.queryByRole("link", { name: "Serums" })).not.toBeInTheDocument();
  });

  it("inside a root, lists its children, with Shop all meaning the whole root", () => {
    render(
      <CategoryBand categories={categoryTree} query={{ category: "skincare" }} pathname="/products" />,
    );

    const all = screen.getByRole("link", { name: "Shop all" });
    expect(all).toHaveAttribute("href", "/products?category=skincare");
    expect(all).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Serums" })).toHaveAttribute(
      "href",
      "/products?category=serums",
    );
    expect(screen.queryByRole("link", { name: "Fragrance" })).not.toBeInTheDocument();
  });

  it("marks the applied child, and keeps the other filters on every link", () => {
    render(
      <CategoryBand
        categories={categoryTree}
        query={{ category: "serums", skinType: ["dry"], offset: 25 }}
        pathname="/brands/verde"
      />,
    );

    expect(screen.getByRole("link", { name: "Serums" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Shop all" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Cleansers" })).toHaveAttribute(
      "href",
      "/brands/verde?category=cleansers&skin_type=dry",
    );
  });

  it("renders nothing when the category list failed", () => {
    const { container } = render(<CategoryBand categories={[]} query={{}} pathname="/products" />);

    expect(container).toBeEmptyDOMElement();
  });
});
