import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MobileNav } from "@/components/layout/MobileNav";

describe("MobileNav", () => {
  it("links Sale to the on-sale listing from the menu's first panel", async () => {
    render(<MobileNav columns={[]} brands={null} />);

    await userEvent.click(screen.getByRole("button", { name: "Menu" }));

    expect(screen.getByRole("link", { name: "Sale" })).toHaveAttribute(
      "href",
      "/products?on_sale=true",
    );
  });
});
