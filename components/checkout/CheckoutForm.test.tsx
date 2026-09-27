import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CART_STORAGE_KEY, readCart, type CartLine } from "@/lib/cart/storage";
import { CartProvider } from "@/lib/cart/use-cart";
import { readOrderRecords } from "@/lib/orders/record";
import {
  districtlessQuote,
  freeShippingQuote,
  lalitpurQuote,
  quoteResponse,
} from "@/tests/fixtures/quote";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const warmBeige: CartLine = {
  variantId: "9bcb804a-6c3d-4970-ba88-2076709bc494",
  quantity: 3,
  productSlug: "silk-skin-foundation",
  productName: "Silk Skin Foundation",
  size: "30 ml",
  shade: "Warm Beige",
  unitPrice: "3200.00",
  imageUrl: null,
};

const serum: CartLine = {
  ...warmBeige,
  variantId: "6c1807da-f7e4-4d86-8b1e-eb819a04f6b9",
  quantity: 1,
  productSlug: "hydrating-serum",
  productName: "Hydrating Serum",
  size: "15 ml",
  shade: null,
};

function seed(lines: CartLine[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 2, lines }));
}

function jsonResponse(body: unknown, status: number, requestId = "req-1"): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "X-Request-ID": requestId },
  });
}

function apiError(status: number, code: string, details: Record<string, unknown> = {}) {
  return jsonResponse({ error: { code, message: "Reworded at will.", details } }, status);
}

const QUOTE_URL = /\/checkout\/quote\/$/;

function sentDistrict(init: RequestInit | undefined): string | undefined {
  return JSON.parse(String(init?.body)).district;
}

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn((url: string | URL | Request, init?: RequestInit) => {
    if (QUOTE_URL.test(String(url))) {
      return Promise.resolve(
        quoteResponse(sentDistrict(init) === undefined ? districtlessQuote : lalitpurQuote),
      );
    }
    return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function checkoutCalls(fetchMock: ReturnType<typeof stubFetch>) {
  return fetchMock.mock.calls.filter(([url]) => !QUOTE_URL.test(String(url)));
}

const placedCod = {
  order_number: "TL-2026-000142",
  status: "pending",
  subtotal: "10600.00",
  shipping_fee: "150.00",
  total: "10750.00",
};

async function chooseDistrict(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("combobox", { name: "District" }));
  await user.type(screen.getByPlaceholderText("Search districts"), name.slice(0, 5));
  await user.click(screen.getByRole("option", { name }));
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Full name"), "Sita Rai");
  await user.type(screen.getByLabelText("Email"), "sita@example.com");
  await user.type(screen.getByLabelText("Phone"), "9800000000");
  await user.type(screen.getByLabelText("Address"), "Jhamsikhel Road");
  await user.type(screen.getByLabelText("City"), "Lalitpur");
  await chooseDistrict(user, "Lalitpur");
  await user.click(screen.getByRole("button", { name: "Place order" }));
  return user;
}

function renderForm() {
  return render(
    <CartProvider>
      <CheckoutForm />
    </CartProvider>,
  );
}

beforeEach(() => {
  seed([warmBeige, serum]);
});

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
  push.mockReset();
});

describe("CheckoutForm, when an order is placed", () => {
  it("sends variant ids and quantities and no price, then confirms a cash-on-delivery order", async () => {
    const fetchMock = stubFetch(jsonResponse(placedCod, 201));

    renderForm();
    await fillAndSubmit();

    const body = JSON.parse(String(checkoutCalls(fetchMock)[0]?.[1]?.body));
    expect(body.items).toEqual([
      { variant_id: warmBeige.variantId, quantity: 3 },
      { variant_id: serum.variantId, quantity: 1 },
    ]);
    expect(body.district).toBe("Lalitpur");
    expect(body.payment_method).toBe("cod");
    expect(JSON.stringify(body)).not.toMatch(/price|total/);

    expect(push).toHaveBeenCalledWith("/checkout/confirmation?order=TL-2026-000142");
    expect(readCart()).toEqual([]);
    expect(readOrderRecords()[0]?.amounts.total).toBe("10750.00");
  });
});

describe("CheckoutForm, when the order is refused", () => {
  it("renders a 400's messages against their fields and keeps everything typed", async () => {
    stubFetch(apiError(400, "validation_error", { email: ["Enter a valid email address."] }));

    renderForm();
    await fillAndSubmit();

    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(/Enter a valid email address/);
    expect(email).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("One field needs your attention.");

    expect(screen.getByLabelText("Full name")).toHaveValue("Sita Rai");
    expect(screen.getByLabelText("Address")).toHaveValue("Jhamsikhel Road");
    expect(screen.getByRole("combobox", { name: "District" })).toHaveTextContent("Lalitpur");
  });

  it("names every line in variant_unavailable, and removes them on request", async () => {
    stubFetch(
      apiError(422, "variant_unavailable", { variant_ids: [warmBeige.variantId, serum.variantId] }),
    );

    renderForm();
    const user = await fillAndSubmit();

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Silk Skin Foundation (30 ml · Warm Beige)");
    expect(alert).toHaveTextContent("Hydrating Serum (15 ml)");
    expect(alert).toHaveTextContent("Nothing was ordered.");

    await user.click(within(alert).getByRole("button", { name: "Remove them from your bag" }));
    expect(readCart()).toEqual([]);
  });

  it("names the one line in insufficient_stock and states no quantity", async () => {
    stubFetch(
      apiError(422, "insufficient_stock", { variant_id: warmBeige.variantId, requested: 3 }),
    );

    renderForm();
    await fillAndSubmit();

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Silk Skin Foundation (30 ml · Warm Beige)");
    expect(alert).not.toHaveTextContent(/\d+ (left|available|in stock)/i);
  });

  it("says the shop is busy on a 429 and does not retry", async () => {
    const fetchMock = stubFetch(apiError(429, "throttled"));

    renderForm();
    await fillAndSubmit();

    expect(screen.getByRole("alert")).toHaveTextContent(/busy/);
    expect(checkoutCalls(fetchMock)).toHaveLength(1);
  });

  it("does not claim failure when the store could not be reached", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    renderForm();
    await fillAndSubmit();

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("may or may not have been placed");
    expect(within(alert).getByRole("link", { name: "look your order up" })).toHaveAttribute(
      "href",
      "/orders/lookup",
    );
    // The bag is untouched: the customer may need it.
    expect(readCart()).toHaveLength(2);
  });
});

describe("CheckoutForm, before anything is sent", () => {
  it("asks for a district rather than sending without one", async () => {
    const fetchMock = stubFetch(jsonResponse(placedCod, 201));
    const user = userEvent.setup();

    renderForm();
    await user.type(screen.getByLabelText("Full name"), "Sita Rai");
    await user.type(screen.getByLabelText("Email"), "sita@example.com");
    await user.type(screen.getByLabelText("Phone"), "9800000000");
    await user.type(screen.getByLabelText("Address"), "Jhamsikhel Road");
    await user.type(screen.getByLabelText("City"), "Lalitpur");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    const district = screen.getByRole("combobox", { name: "District" });
    expect(district).toHaveAccessibleDescription(/Choose a district from the list/);
    expect(district).toHaveFocus();
    expect(checkoutCalls(fetchMock)).toHaveLength(0);
  });

  it("offers cash on delivery as the only way to pay", () => {
    stubFetch(jsonResponse(placedCod, 201));

    renderForm();

    expect(screen.getByText("Cash on delivery")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("offers the shop, not an empty form, when the bag is empty", () => {
    window.localStorage.clear();

    renderForm();

    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Place order/ })).not.toBeInTheDocument();
  });
});

describe("CheckoutForm's quoted summary", () => {
  it("quotes without a district first, then re-quotes with it and shows the API's total", async () => {
    const fetchMock = stubFetch(jsonResponse(placedCod, 201));
    const user = userEvent.setup();

    renderForm();

    expect(await screen.findByText("Rs 6,400")).toBeInTheDocument();
    expect(screen.getByText("After shipping")).toBeInTheDocument();

    await chooseDistrict(user, "Lalitpur");

    expect(await screen.findByText("Rs 6,550")).toBeInTheDocument();
    expect(screen.getByText("Rs 150")).toBeInTheDocument();
    expect(screen.getByText(/more for free shipping/)).toHaveTextContent("Add Rs 1,600");
    const quotes = fetchMock.mock.calls.filter(([url]) => QUOTE_URL.test(String(url)));
    expect(sentDistrict(quotes.at(-1)?.[1])).toBe("Lalitpur");
  });

  it("says Free once when the order ships free", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(quoteResponse(freeShippingQuote))),
    );

    renderForm();

    expect(await screen.findByText("Free")).toBeInTheDocument();
    expect(screen.queryByText("Free shipping")).not.toBeInTheDocument();
  });

  it("keeps Place order available while a quote is in flight", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );

    renderForm();
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const button = screen.getByRole("button", { name: "Place order" });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-disabled");
  });

  it("marks the line a quote says is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(apiError(422, "variant_unavailable", { variant_ids: [serum.variantId] })),
      ),
    );

    renderForm();

    const marked = await screen.findByText("This is no longer available.");
    expect(marked.closest("li")).toHaveTextContent("Hydrating Serum");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
