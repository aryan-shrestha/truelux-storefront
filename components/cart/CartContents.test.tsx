import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CartContents } from "@/components/cart/CartContents";
import { CART_STORAGE_KEY, type CartLine } from "@/lib/cart/storage";
import { CartProvider } from "@/lib/cart/use-cart";
import type { RawQuote } from "@/lib/api/orders";
import {
  districtlessQuote,
  freeShippingQuote,
  noThresholdQuote,
  quoteResponse,
} from "@/tests/fixtures/quote";

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
      <CartContents shippingNote="Free shipping over Rs 8,000 · Cash on delivery" />
    </CartProvider>,
  );
}

function stubQuote(respond: () => Promise<Response>) {
  const fetchMock = vi.fn((_url: string | URL | Request, _init?: RequestInit) => respond());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function quotedWith(body: RawQuote) {
  return stubQuote(() => Promise.resolve(quoteResponse(body)));
}

function quoteError(code: string, details: Record<string, unknown>) {
  return stubQuote(() =>
    Promise.resolve(
      new Response(JSON.stringify({ error: { code, message: "Reworded at will.", details } }), {
        status: 422,
      }),
    ),
  );
}

function sentQuantities(fetchMock: ReturnType<typeof stubQuote>, call: number): number[] {
  const body = JSON.parse(String(fetchMock.mock.calls[call]?.[1]?.body));
  return body.items.map((item: { quantity: number }) => item.quantity);
}

beforeEach(() => {
  quotedWith(districtlessQuote);
});

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
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

  it("shows the store's shipping copy", () => {
    seed([{ variantId: "a" }]);

    renderCart();

    expect(screen.getByText("Free shipping over Rs 8,000 · Cash on delivery")).toBeInTheDocument();
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

describe("the quoted subtotal", () => {
  it("shows a skeleton and no figure until the quote arrives, then the API's subtotal", async () => {
    let respond: (response: Response) => void = () => {};
    stubQuote(() => new Promise((resolve) => (respond = resolve)));
    seed([{ variantId: "a", quantity: 3 }]);

    const { container } = renderCart();

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.queryByText("Rs 5,400")).not.toBeInTheDocument();

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    respond(quoteResponse(districtlessQuote));

    expect(await screen.findByText("Rs 6,400")).toBeInTheDocument();
    expect(screen.queryByText("Rs 5,400")).not.toBeInTheDocument();
  });

  it("nudges toward the threshold with the remaining amount", async () => {
    seed([{ variantId: "a" }]);

    renderCart();

    const nudge = await screen.findByText(/more for free shipping/);
    expect(nudge).toHaveTextContent("Add Rs 1,600 more for free shipping");
  });

  it("says free shipping once the threshold is reached", async () => {
    quotedWith(freeShippingQuote);
    seed([{ variantId: "a" }]);

    renderCart();

    expect(await screen.findByText("Free shipping")).toBeInTheDocument();
    expect(screen.queryByText(/more for free shipping/)).not.toBeInTheDocument();
  });

  it("leaves shipping to checkout when there is no threshold", async () => {
    quotedWith(noThresholdQuote);
    seed([{ variantId: "a" }]);

    renderCart();

    expect(await screen.findByText("Shipping calculated at checkout")).toBeInTheDocument();
  });

  it("re-quotes once the lines settle, and shows only the latest answer", async () => {
    const answers = [
      { ...districtlessQuote, subtotal: "1800.00" },
      { ...districtlessQuote, subtotal: "3600.00" },
      { ...districtlessQuote, subtotal: "5400.00" },
    ];
    const fetchMock = stubQuote(() => Promise.resolve(quoteResponse(answers.shift()!)));
    seed([{ variantId: "a", quantity: 1 }]);
    const user = userEvent.setup();

    renderCart();
    expect(await screen.findByText("Rs 1,800", { selector: "dd *" })).toBeInTheDocument();

    const increase = screen.getByRole("button", { name: /Increase quantity of Velvet Lip Tint/ });
    await user.click(increase);
    await user.click(increase);

    expect(await screen.findByText("Rs 3,600", { selector: "dd *" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentQuantities(fetchMock, 1)).toEqual([3]);
  });

  it("ignores a quote that answers for lines that have since changed", async () => {
    const pending: Array<(response: Response) => void> = [];
    stubQuote(() => new Promise((resolve) => pending.push(resolve)));
    seed([{ variantId: "a", quantity: 1 }]);
    const user = userEvent.setup();

    renderCart();
    await waitFor(() => expect(pending).toHaveLength(1));
    await user.click(screen.getByRole("button", { name: /Increase quantity of Velvet Lip Tint/ }));
    await waitFor(() => expect(pending).toHaveLength(2));

    pending[0]?.(quoteResponse({ ...districtlessQuote, subtotal: "1800.00" }));
    pending[1]?.(quoteResponse({ ...districtlessQuote, subtotal: "3600.00" }));

    expect(await screen.findByText("Rs 3,600")).toBeInTheDocument();
    expect(screen.queryByText("Rs 1,800", { selector: "dd *" })).not.toBeInTheDocument();
  });

  it("marks the unavailable line, not the others, and shows no subtotal", async () => {
    quoteError("variant_unavailable", { variant_ids: ["b"] });
    seed([{ variantId: "a" }, { variantId: "b", productName: "Rose Water Toner" }]);

    renderCart();

    const marked = await screen.findByText("This is no longer available.");
    expect(
      within(marked.closest("li")!).getByRole("link", { name: "Rose Water Toner" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("This is no longer available.")).toHaveLength(1);
    expect(screen.getByText(/to see your subtotal/)).toBeInTheDocument();
  });

  it("marks the line without enough stock, stating no quantity", async () => {
    quoteError("insufficient_stock", { variant_id: "a", requested: 3 });
    seed([
      { variantId: "a", quantity: 3 },
      { variantId: "b", productName: "Rose Water Toner" },
    ]);

    renderCart();

    const marked = await screen.findByText("There is not enough stock for this quantity.");
    expect(
      within(marked.closest("li")!).getByRole("link", { name: "Velvet Lip Tint" }),
    ).toBeInTheDocument();
  });

  it("shows no figures and leaves shipping to checkout when the quote is throttled", async () => {
    stubQuote(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: { code: "throttled", message: "", details: {} } }), {
          status: 429,
        }),
      ),
    );
    seed([{ variantId: "a" }]);

    renderCart();

    expect(await screen.findByText("Shipping calculated at checkout")).toBeInTheDocument();
    expect(screen.queryByText("Subtotal")).not.toBeInTheDocument();
  });
});
