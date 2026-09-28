import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShopMenu } from "@/components/layout/ShopMenu";

describe("ShopMenu", () => {
  it("links Sale to the on-sale listing", () => {
    render(<ShopMenu columns={[]} brands={null} />);

    expect(screen.getByRole("link", { name: "Sale" })).toHaveAttribute(
      "href",
      "/products?on_sale=true",
    );
  });
});
