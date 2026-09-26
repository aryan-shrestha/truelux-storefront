import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductDetails } from "@/components/catalog/ProductDetails";
import { hydratingSerum, silkFoundation } from "@/tests/fixtures/catalog";

function rowFor(term: string) {
  return screen.getByText(term, { selector: "dt" }).nextElementSibling;
}

describe("ProductDetails", () => {
  it("shows suited to, skin feel and key ingredients as ruled rows", () => {
    render(<ProductDetails product={hydratingSerum} />);

    expect(rowFor("Suited to")).toHaveTextContent("Dry, Combination");
    expect(rowFor("Skin feel")).toHaveTextContent("Plump, dewy, comfortable");
    expect(rowFor("Key ingredients")).toHaveTextContent("Sodium Hyaluronate");
  });

  it("hides each row the merchant left empty", () => {
    render(<ProductDetails product={{ ...hydratingSerum, skinTypes: [], keyIngredients: "  " }} />);

    expect(screen.queryByText("Suited to")).not.toBeInTheDocument();
    expect(screen.queryByText("Key ingredients")).not.toBeInTheDocument();
    expect(rowFor("Skin feel")).toHaveTextContent("Plump, dewy, comfortable");
  });

  it("renders nothing, not an empty rule, when every row is empty", () => {
    const { container } = render(<ProductDetails product={silkFoundation} />);

    expect(container).toBeEmptyDOMElement();
  });
});
