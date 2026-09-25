import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCard } from "@/components/catalog/ProductCard";
import { roseWaterToner, soldOutPerfume, velvetLipTint } from "@/tests/fixtures/catalog";

describe("ProductCard", () => {
  it("links the product and, separately, its brand", () => {
    render(<ProductCard product={velvetLipTint} />);

    expect(screen.getByRole("link", { name: "Velvet Lip Tint" })).toHaveAttribute(
      "href",
      "/products/velvet-lip-tint",
    );
    expect(screen.getByRole("link", { name: "Lumière" })).toHaveAttribute(
      "href",
      "/brands/lumiere",
    );
  });

  it("renders the price through the formatter", () => {
    render(<ProductCard product={velvetLipTint} />);

    expect(screen.getByText("Rs 1,800")).toBeInTheDocument();
  });

  it("says sold out in words, and nothing when the product is available", () => {
    const { unmount } = render(<ProductCard product={soldOutPerfume} />);
    expect(screen.getByText("Sold out")).toBeInTheDocument();
    unmount();

    render(<ProductCard product={velvetLipTint} />);
    expect(screen.queryByText("Sold out")).not.toBeInTheDocument();
  });

  it("renders a product with no photograph without an image", () => {
    render(<ProductCard product={roseWaterToner} />);

    expect(screen.getByRole("link", { name: "Rose Water Toner" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps an empty alt empty rather than substituting the product name", () => {
    const decorative = {
      ...velvetLipTint,
      primaryImage: { url: "http://127.0.0.1:8000/media/products/tint.jpg", altText: "" },
    };

    render(<ProductCard product={decorative} />);

    expect(screen.getByRole("presentation", { hidden: true })).toBeInTheDocument();
  });
});
