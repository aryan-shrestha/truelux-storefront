import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { CartButton } from "@/components/layout/CartButton";
import { CART_STORAGE_KEY } from "@/lib/cart/storage";
import { CartProvider } from "@/lib/cart/use-cart";

afterEach(() => {
  window.localStorage.clear();
});

describe("CartButton", () => {
  it("shows the unit count once storage has been read", async () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        lines: [
          { variantId: "a", quantity: 2 },
          { variantId: "b", quantity: 1 },
        ],
      }),
    );

    render(
      <CartProvider>
        <CartButton />
      </CartProvider>,
    );

    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("announces the count rather than leaving a bare number", async () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ version: 1, lines: [{ variantId: "a", quantity: 1 }] }),
    );

    render(
      <CartProvider>
        <CartButton />
      </CartProvider>,
    );

    expect(await screen.findByText("Cart, 1 item")).toBeInTheDocument();
  });

  it("shows the bag glyph for an empty cart, not a zero", async () => {
    render(
      <CartProvider>
        <CartButton />
      </CartProvider>,
    );

    expect(await screen.findByText("Cart, 0 items")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("opens the bag as a sheet on a plain click, instead of navigating", async () => {
    storeLine();
    renderButton();

    const link = await screen.findByRole("link", { name: "Cart, 1 item" });
    await userEvent.click(link);

    const sheet = screen.getByRole("dialog", { name: "Your bag (1)" });
    expect(sheet).toHaveTextContent("Washed Pocket Tee");
    expect(screen.getByRole("link", { name: "Checkout" })).toHaveAttribute("href", "/checkout");
  });

  it("leaves a modified click to the browser, so /cart still opens in a new tab", async () => {
    storeLine();
    renderButton();

    const link = await screen.findByRole("link", { name: "Cart, 1 item" });
    // jsdom cannot follow a link. Stopping it here, after the component's own
    // handler has declined the click, keeps the test about the component.
    document.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(link, { metaKey: true });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/cart");
  });

  it("returns focus to the cart link when the sheet closes", async () => {
    storeLine();
    renderButton();

    const link = await screen.findByRole("link", { name: "Cart, 1 item" });
    await userEvent.click(link);
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(link).toHaveFocus();
  });
});

function storeLine() {
  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      lines: [
        {
          variantId: "v-m-olive",
          quantity: 1,
          productSlug: "washed-pocket-tee",
          productName: "Washed Pocket Tee",
          size: "M",
          color: "Olive",
          unitPrice: "2650.00",
          imageUrl: null,
        },
      ],
    }),
  );
}

function renderButton() {
  render(
    <CartProvider>
      <CartButton />
    </CartProvider>,
  );
}
