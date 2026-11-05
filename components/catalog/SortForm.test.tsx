import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SortForm } from "@/components/catalog/SortForm";

function hiddenValues(name: string) {
  return [
    ...document.querySelectorAll<HTMLInputElement>(`input[type="hidden"][name="${name}"]`),
  ].map((input) => input.value);
}

describe("SortForm", () => {
  it("submits to the listing's path with the applied sort selected", () => {
    render(<SortForm query={{ ordering: "-base_price" }} pathname="/brands/lumiere" />);

    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveValue("-base_price");
    expect(screen.getByRole("button", { name: "Apply" }).closest("form")).toHaveAttribute(
      "action",
      "/brands/lumiere",
    );
  });

  it("carries every applied filter and the search as hidden inputs", () => {
    render(
      <SortForm
        query={{
          category: "serums",
          brand: ["lumiere", "verde"],
          skinType: ["dry", "oily"],
          minPrice: "2000",
          onSale: true,
          search: "rose",
        }}
        pathname="/products"
      />,
    );

    expect(hiddenValues("category")).toEqual(["serums"]);
    expect(hiddenValues("brand")).toEqual(["lumiere", "verde"]);
    expect(hiddenValues("skin_type")).toEqual(["dry", "oily"]);
    expect(hiddenValues("min_price")).toEqual(["2000"]);
    expect(hiddenValues("max_price")).toEqual([]);
    expect(hiddenValues("on_sale")).toEqual(["true"]);
    expect(hiddenValues("search")).toEqual(["rose"]);
  });
});
