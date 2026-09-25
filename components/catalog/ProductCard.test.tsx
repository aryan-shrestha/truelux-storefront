import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCard } from "@/components/catalog/ProductCard";
import { boxyLogoTee, pleatedWideShort, soldOutJacket } from "@/tests/fixtures/catalog";

describe("ProductCard", () => {
  it("links the whole tile once, not the image and the name separately", () => {
    render(<ProductCard product={boxyLogoTee} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/products/boxy-logo-tee");
  });

  it("renders the price through the formatter", () => {
    render(<ProductCard product={boxyLogoTee} />);

    expect(screen.getByText("Rs 2,400")).toBeInTheDocument();
  });

  it("says sold out in words, not in colour", () => {
    render(<ProductCard product={soldOutJacket} />);

    expect(screen.getByText("Sold out")).toBeInTheDocument();
  });

  it("says nothing about stock when the product is available", () => {
    render(<ProductCard product={boxyLogoTee} />);

    expect(screen.queryByText("Sold out")).not.toBeInTheDocument();
  });

  it("renders a product with no photograph without collapsing", () => {
    // A real state: the backend requires no image, and the seeded catalogue has
    // one like this.
    render(<ProductCard product={pleatedWideShort} />);

    expect(screen.getByRole("link", { name: /Pleated Wide Short/ })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps an empty alt empty rather than substituting the product name", () => {
    // An empty alt_text means decorative. Repeating the name makes a screen
    // reader announce the same phrase twice per tile.
    const decorative = {
      ...boxyLogoTee,
      primaryImage: { url: "http://127.0.0.1:8000/media/products/tee.jpg", altText: "" },
    };

    render(<ProductCard product={decorative} />);

    expect(screen.getByRole("presentation", { hidden: true })).toBeInTheDocument();
  });
});
