import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { CartContents } from "@/components/cart/CartContents";
import { CART_STORAGE_KEY, type CartLine } from "@/lib/cart/storage";
import { CartProvider } from "@/lib/cart/use-cart";

function seed(lines: Array<Partial<CartLine> & { variantId: string }>) {
  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      version: 2,
      lines: lines.map((line) => ({
        quantity: 1,
        productSlug: "velvet-lip-tint",
        productName: "Velvet Lip Tint",
        size: "4 g",
        shade: "Rosewood",
        unitPrice: "1800.00",
        imageUrl: null,
        ...line,
      })),
    }),
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <CartContents />
    </CartProvider>,
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe("CartContents", () => {
  it("shows the lines that are in storage", () => {
    seed([{ variantId: "a" }, { variantId: "b", productName: "Rose Water Toner" }]);

    renderCart();

    expect(screen.getByRole("link", { name: "Velvet Lip Tint" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rose Water Toner" })).toBeInTheDocument();
  });

  it("invites shopping when the bag is empty", () => {
    renderCart();

    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop everything" })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("shows no total, and says where the figure comes from", () => {
    seed([{ variantId: "a", quantity: 3 }]);

    renderCart();

    expect(screen.getByText(/confirmed at checkout/)).toBeInTheDocument();
    // The line price, never a multiple of it.
    expect(screen.getByText("Rs 1,800")).toBeInTheDocument();
    expect(screen.queryByText("Rs 5,400")).not.toBeInTheDocument();
  });

  it("changes a quantity through the stepper", async () => {
    seed([{ variantId: "a", quantity: 1 }]);
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByRole("button", { name: /Increase quantity of Velvet Lip Tint/ }));

    const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "{}");
    expect(stored.lines[0].quantity).toBe(2);
  });

  it("shows size and shade, or the size alone for a shadeless product", () => {
    seed([
      { variantId: "a" },
      { variantId: "b", productName: "Rose Water Toner", size: "100 ml", shade: null },
    ]);

    renderCart();

    expect(screen.getByText("4 g · Rosewood")).toBeInTheDocument();
    expect(screen.getByText("100 ml")).toBeInTheDocument();
  });

  it("names the product in the remove control, not just 'Remove'", async () => {
    seed([{ variantId: "a" }]);
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByRole("button", { name: /Remove Velvet Lip Tint/ }));

    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
  });

  it("cannot step below one; removing is the way to delete a line", async () => {
    seed([{ variantId: "a", quantity: 1 }]);

    renderCart();

    expect(
      screen.getByRole("button", { name: /Decrease quantity of Velvet Lip Tint/ }),
    ).toBeDisabled();
  });
});

describe("the quantity field", () => {
  it("does not delete the line when a zero is typed", async () => {
    seed([{ variantId: "a", quantity: 5 }]);
    const user = userEvent.setup();

    renderCart();
    const field = screen.getByRole("spinbutton", { name: /Quantity of Velvet Lip Tint/ });
    await user.clear(field);
    await user.type(field, "0");

    expect(screen.getByRole("link", { name: "Velvet Lip Tint" })).toBeInTheDocument();
  });

  it("accepts a typed quantity", async () => {
    seed([{ variantId: "a", quantity: 1 }]);
    const user = userEvent.setup();

    renderCart();
    await user.type(screen.getByRole("spinbutton", { name: /Quantity of Velvet Lip Tint/ }), "0");

    const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "{}");
    expect(stored.lines[0].quantity).toBe(10);
  });
});
