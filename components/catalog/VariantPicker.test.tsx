import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { VariantPicker } from "@/components/catalog/VariantPicker";
import type { Product } from "@/lib/api/types";
import { CART_STORAGE_KEY } from "@/lib/cart/storage";
import { CartProvider } from "@/lib/cart/use-cart";
import { hydratingSerum, silkFoundation } from "@/tests/fixtures/catalog";

function renderPicker(product: Product) {
  return render(
    <CartProvider>
      <VariantPicker product={product} />
    </CartProvider>,
  );
}

function storedLines() {
  return JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "{}").lines;
}

afterEach(() => {
  window.localStorage.clear();
});

describe("VariantPicker, for a product with shades", () => {
  it("resolves a shade and a size to the right variant and adds it", async () => {
    const user = userEvent.setup();
    renderPicker(silkFoundation);

    await user.click(screen.getByRole("radio", { name: "Warm Beige" }));
    await user.click(screen.getByRole("radio", { name: "50 ml" }));
    await user.click(screen.getByRole("button", { name: "Add to bag" }));

    expect(screen.getByRole("button", { name: "Added to bag" })).toBeInTheDocument();
    expect(storedLines()).toEqual([
      expect.objectContaining({ variantId: "v-50-warm-beige", size: "50 ml", shade: "Warm Beige" }),
    ]);
  });

  it("names the chosen shade visibly, not only through the swatch", async () => {
    const user = userEvent.setup();
    renderPicker(silkFoundation);

    await user.click(screen.getByRole("radio", { name: "Porcelain" }));

    expect(screen.getByText("Porcelain")).toBeVisible();
  });

  it("disables an out-of-stock or never-made combination, and says which", async () => {
    const user = userEvent.setup();
    renderPicker(silkFoundation);

    await user.click(screen.getByRole("radio", { name: "Porcelain" }));

    expect(screen.getByRole("radio", { name: /^50 ml, Not available/ })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Deep Mocha, Sold out" })).toBeDisabled();
  });

  it("shows the variant's own price once the selection resolves", async () => {
    const user = userEvent.setup();
    renderPicker(silkFoundation);

    expect(screen.getByText("Rs 3,200")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Warm Beige" }));
    await user.click(screen.getByRole("radio", { name: "50 ml" }));

    expect(screen.getByText("Rs 4,400")).toBeInTheDocument();
  });

  it("keeps add to bag disabled until both a shade and a size are chosen", async () => {
    const user = userEvent.setup();
    renderPicker(silkFoundation);

    expect(screen.getByRole("button", { name: "Add to bag" })).toBeDisabled();
    expect(screen.getByText(/Choose a shade and a size/)).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "30 ml" }));
    expect(screen.getByRole("button", { name: "Add to bag" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Porcelain" }));
    expect(screen.getByRole("button", { name: "Add to bag" })).toBeEnabled();
  });
});

describe("VariantPicker, for a shadeless product", () => {
  it("renders no shade group and resolves from the size alone", async () => {
    const user = userEvent.setup();
    renderPicker(hydratingSerum);

    expect(screen.queryByText("Shade")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "15 ml" }));
    await user.click(screen.getByRole("button", { name: "Add to bag" }));

    expect(storedLines()).toEqual([expect.objectContaining({ variantId: "v-15-serum", shade: null })]);
  });
});

describe("VariantPicker, for simple and unfinished products", () => {
  it("needs no selection for a single-variant product", () => {
    renderPicker({ ...silkFoundation, variants: silkFoundation.variants.slice(0, 1) });

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to bag" })).toBeEnabled();
  });

  it("says sold out, not broken, when nothing has stock", () => {
    renderPicker({
      ...silkFoundation,
      variants: silkFoundation.variants.map((variant) => ({ ...variant, inStock: false })),
    });

    expect(screen.getByText(/no restock notification/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add to bag/ })).not.toBeInTheDocument();
  });

  it("treats a product with no variants as unfinished, not as sold out", () => {
    renderPicker({ ...silkFoundation, variants: [] });

    expect(screen.getByText(/not available to buy yet/)).toBeInTheDocument();
  });
});
