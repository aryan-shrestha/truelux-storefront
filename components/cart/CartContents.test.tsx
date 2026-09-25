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
      version: 1,
      lines: lines.map((line) => ({
        quantity: 1,
        productSlug: "boxy-logo-tee",
        productName: "Boxy Logo Tee",
        size: "M",
        color: "Black",
        unitPrice: "2400.00",
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
    seed([{ variantId: "a" }, { variantId: "b", productName: "Utility Cargo Pant" }]);

    renderCart();

    // By role: the product name also appears inside the stepper's and the
    // remove control's accessible names, which is deliberate.
    expect(screen.getByRole("link", { name: "Boxy Logo Tee" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Utility Cargo Pant" })).toBeInTheDocument();
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
    // Two independent reasons a total cannot appear: ADR 0003 forbids the
    // arithmetic, and the shipping fee depends on a district collected later.
    seed([{ variantId: "a", quantity: 3 }]);

    renderCart();

    expect(screen.getByText(/confirmed at checkout/)).toBeInTheDocument();
    // The line price, never a multiple of it.
    expect(screen.getByText("Rs 2,400")).toBeInTheDocument();
    expect(screen.queryByText("Rs 7,200")).not.toBeInTheDocument();
  });

  it("changes a quantity through the stepper", async () => {
    seed([{ variantId: "a", quantity: 1 }]);
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByRole("button", { name: /Increase quantity of Boxy Logo Tee/ }));

    const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "{}");
    expect(stored.lines[0].quantity).toBe(2);
  });

  it("names the product in the remove control, not just 'Remove'", async () => {
    seed([{ variantId: "a" }]);
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByRole("button", { name: /Remove Boxy Logo Tee/ }));

    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
  });

  it("cannot step below one; removing is the way to delete a line", async () => {
    seed([{ variantId: "a", quantity: 1 }]);

    renderCart();

    expect(
      screen.getByRole("button", { name: /Decrease quantity of Boxy Logo Tee/ }),
    ).toBeDisabled();
  });
});

describe("the quantity field", () => {
  it("does not delete the line when a zero is typed", async () => {
    // Selecting the field and typing "10" would otherwise remove the line on
    // the first keystroke. Remove is the way to delete.
    seed([{ variantId: "a", quantity: 5 }]);
    const user = userEvent.setup();

    renderCart();
    const field = screen.getByRole("spinbutton", { name: /Quantity of Boxy Logo Tee/ });
    await user.clear(field);
    await user.type(field, "0");

    expect(screen.getByRole("link", { name: "Boxy Logo Tee" })).toBeInTheDocument();
  });

  it("accepts a typed quantity", async () => {
    seed([{ variantId: "a", quantity: 1 }]);
    const user = userEvent.setup();

    renderCart();
    await user.type(screen.getByRole("spinbutton", { name: /Quantity of Boxy Logo Tee/ }), "0");

    const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "{}");
    expect(stored.lines[0].quantity).toBe(10);
  });
});
