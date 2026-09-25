import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { VariantPicker } from "@/components/catalog/VariantPicker";
import type { Product } from "@/lib/api/types";
import { CART_STORAGE_KEY } from "@/lib/cart/storage";
import { CartProvider } from "@/lib/cart/use-cart";
import { washedPocketTee } from "@/tests/fixtures/catalog";

function renderPicker(product: Product) {
  return render(
    <CartProvider>
      <VariantPicker product={product} />
    </CartProvider>,
  );
}

afterEach(() => {
  window.localStorage.clear();
});

/**
 * The accessible name is the label's text, and the status arrives as a separate
 * sr-only element, so the two are joined with whitespace. Matching on a function
 * says what is being asserted without pinning that detail.
 */
function named(label: string, status?: string) {
  return (name: string) =>
    name.trim().startsWith(label) && (status === undefined || name.includes(status));
}

describe("VariantPicker", () => {
  it("tells sold out and never made apart, in words", async () => {
    // The fixture's olive comes in M (in stock) and L (sold out). XXL in olive
    // was never made. A picker built from independent size and colour lists
    // would offer all three identically.
    const user = userEvent.setup();
    renderPicker(washedPocketTee);

    await user.click(screen.getByRole("radio", { name: named("Olive") }));

    expect(screen.getByRole("radio", { name: named("L", "Sold out") })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: named("XXL", "Not made") })).toBeInTheDocument();
  });

  it("keeps an unavailable option reachable rather than removing it from the tab order", async () => {
    // A customer needs to be able to find out that their size is gone.
    const user = userEvent.setup();
    renderPicker(washedPocketTee);

    await user.click(screen.getByRole("radio", { name: named("Olive") }));
    const soldOut = screen.getByRole("radio", { name: named("L", "Sold out") });

    expect(soldOut).not.toBeDisabled();
    expect(soldOut).toHaveAttribute("aria-disabled", "true");
  });

  it("does not select an unavailable pairing when it is clicked", async () => {
    const user = userEvent.setup();
    renderPicker(washedPocketTee);

    await user.click(screen.getByRole("radio", { name: named("Olive") }));
    await user.click(screen.getByRole("radio", { name: named("XXL", "Not made") }));

    expect(screen.getByRole("radio", { name: named("XXL", "Not made") })).not.toBeChecked();
  });

  it("shows the base price until a selection resolves, then the variant's own", async () => {
    // XXL carries a price_override. Showing base_price while charging the
    // override is the surprise that ends at a support message.
    const user = userEvent.setup();
    renderPicker(washedPocketTee);

    expect(screen.getByText("Rs 2,650")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: named("XXL") }));
    await user.click(screen.getByRole("radio", { name: named("Washed Indigo") }));

    expect(screen.getByText("Rs 2,950")).toBeInTheDocument();
  });

  it("keeps add to bag disabled until a pairing resolves", async () => {
    const user = userEvent.setup();
    renderPicker(washedPocketTee);

    expect(screen.getByRole("button", { name: "Add to bag" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: named("M") }));
    await user.click(screen.getByRole("radio", { name: named("Olive") }));

    expect(screen.getByRole("button", { name: "Add to bag" })).toBeEnabled();
  });

  it("adds the resolved variant to the cart and says so", async () => {
    const user = userEvent.setup();
    renderPicker(washedPocketTee);

    await user.click(screen.getByRole("radio", { name: named("M") }));
    await user.click(screen.getByRole("radio", { name: named("Olive") }));
    await user.click(screen.getByRole("button", { name: "Add to bag" }));

    expect(screen.getByRole("button", { name: "Added to bag" })).toBeInTheDocument();

    const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "{}");
    expect(stored.lines).toHaveLength(1);
    expect(stored.lines[0].variantId).toBe("v-m-olive");
  });

  it("renders a single-variant product as labels, not as groups of one", () => {
    const cap: Product = {
      ...washedPocketTee,
      variants: washedPocketTee.variants.slice(0, 1),
    };

    renderPicker(cap);

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to bag" })).toBeEnabled();
  });

  it("says sold out, not broken, when nothing has stock", () => {
    const gone: Product = {
      ...washedPocketTee,
      variants: washedPocketTee.variants.map((variant) => ({ ...variant, inStock: false })),
    };

    renderPicker(gone);

    // The whole-product message, not the per-option word that now appears on
    // every unavailable chip.
    expect(screen.getByText(/no restock notification/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add to bag/ })).not.toBeInTheDocument();
  });

  it("treats a product with no variants as unfinished, not as sold out", () => {
    // A merchant can create a product and not finish it. The two are different
    // facts and a customer reads them differently.
    renderPicker({ ...washedPocketTee, variants: [] });

    expect(screen.getByText(/not available to buy yet/)).toBeInTheDocument();
    expect(screen.queryByText(/no restock notification/)).not.toBeInTheDocument();
  });
});
