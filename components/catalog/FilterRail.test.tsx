import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FilterRail } from "@/components/catalog/FilterRail";
import { categoryTree } from "@/tests/fixtures/catalog";

function group(name: string) {
  return screen.getByText(name, { selector: "summary" }).closest("details")!;
}

describe("FilterRail", () => {
  it("collapses a parent with children, and leaves a childless one a plain link", () => {
    render(<FilterRail categories={categoryTree} query={{}} />);

    expect(group("Tops")).not.toHaveAttribute("open");
    expect(screen.getByRole("link", { name: "Bottoms" })).toHaveAttribute(
      "href",
      "/products?category=bottoms",
    );
  });

  it("opens the group holding the applied category, so it is never hidden", () => {
    render(<FilterRail categories={categoryTree} query={{ category: "hoodies" }} />);

    expect(group("Tops")).toHaveAttribute("open");
    expect(screen.getByRole("link", { name: "Hoodies" })).toHaveAttribute("aria-current", "true");
  });

  it("keeps the parent's own filter inside the group, named for what it does", () => {
    render(<FilterRail categories={categoryTree} query={{ category: "tops" }} />);

    expect(group("Tops")).toHaveAttribute("open");
    expect(screen.getByRole("link", { name: "All tops" })).toHaveAttribute(
      "href",
      "/products?category=tops",
    );
  });
});
