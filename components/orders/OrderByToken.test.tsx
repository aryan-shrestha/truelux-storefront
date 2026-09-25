import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OrderByToken } from "@/components/orders/OrderByToken";
import { CART_STORAGE_KEY, readCart } from "@/lib/cart/storage";
import { CartProvider } from "@/lib/cart/use-cart";
import { HANDOFF_KEY, markHandoff } from "@/lib/orders/handoff";
import { ORDER_RECORD_KEY, readOrderRecords } from "@/lib/orders/record";
import { paidKhaltiOrder, pendingKhaltiOrder } from "@/tests/fixtures/orders";

const TOKEN = "3f6c1a2e-8b4d-4e7a-9c1f-5d2b7e8a9c30";

function jsonResponse(body: unknown, status: number, requestId = "req-1"): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "X-Request-ID": requestId },
  });
}

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function apiError(status: number, code: string) {
  return jsonResponse({ error: { code, message: "Reworded at will.", details: {} } }, status);
}

function seedCart() {
  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      lines: [
        {
          variantId: "9bcb804a-6c3d-4970-ba88-2076709bc494",
          quantity: 1,
          productSlug: "washed-pocket-tee",
          productName: "Washed Pocket Tee",
          size: "M",
          color: "Washed Indigo",
          unitPrice: "2650.00",
          imageUrl: null,
        },
      ],
    }),
  );
}

function renderPage() {
  return render(
    <CartProvider>
      <OrderByToken accessToken={TOKEN} />
    </CartProvider>,
  );
}

beforeEach(() => {
  seedCart();
});

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("OrderByToken", () => {
  it("fetches the order by its token without caching, and renders the API's figures", async () => {
    const fetchMock = stubFetch(jsonResponse(paidKhaltiOrder, 200));

    renderPage();

    expect(await screen.findByText("TL-2026-000142")).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      `http://127.0.0.1:8000/api/v1/orders/${TOKEN}/`,
    );
    expect(fetchMock.mock.calls[0]?.[1]?.cache).toBe("no-store");
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Rs 8,100")).toBeInTheDocument();
  });

  it("does not describe a pending Khalti order as paid or confirmed", async () => {
    stubFetch(jsonResponse(pendingKhaltiOrder, 200));

    renderPage();

    expect(await screen.findByText("Awaiting payment")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/payment is confirmed/i);
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
  });

  it("clears the bag when this browser handed the order to Khalti, once", async () => {
    stubFetch(jsonResponse(paidKhaltiOrder, 200));
    markHandoff("TL-2026-000142");

    renderPage();

    await screen.findByText("TL-2026-000142");
    expect(readCart()).toEqual([]);
    expect(window.localStorage.getItem(HANDOFF_KEY)).toBeNull();
  });

  it("leaves the bag alone when the order arrives from an email link", async () => {
    stubFetch(jsonResponse(paidKhaltiOrder, 200));

    renderPage();

    await screen.findByText("TL-2026-000142");
    expect(readCart()).toHaveLength(1);
  });

  it("is safe when the bag is already empty", async () => {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    stubFetch(jsonResponse(paidKhaltiOrder, 200));
    markHandoff("TL-2026-000142");

    renderPage();

    await screen.findByText("TL-2026-000142");
    expect(readCart()).toEqual([]);
  });

  it("records the order number on this device, and never the token", async () => {
    stubFetch(jsonResponse(paidKhaltiOrder, 200));

    renderPage();

    await screen.findByText("TL-2026-000142");
    expect(readOrderRecords()[0]).toMatchObject({
      orderNumber: "TL-2026-000142",
      email: "sita@example.com",
    });
    expect(window.localStorage.getItem(ORDER_RECORD_KEY)).not.toContain(TOKEN);
  });

  it("says it could not find the order without suggesting the link is wrong", async () => {
    stubFetch(apiError(404, "not_found"));

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "We could not find that order." }),
    ).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/link|token|invalid/i);
  });

  it("explains the rate limit on a 429", async () => {
    stubFetch(apiError(429, "throttled"));

    renderPage();

    expect(await screen.findByRole("heading", { name: /too many requests/ })).toBeInTheDocument();
  });

  it("tells an unreachable shop apart from a missing order", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    renderPage();

    expect(
      await screen.findByRole("heading", { name: /could not reach the shop/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/could not find/)).not.toBeInTheDocument();
  });

  it("never renders the access token, in any state", async () => {
    for (const response of [
      jsonResponse(pendingKhaltiOrder, 200),
      apiError(404, "not_found"),
      apiError(500, "server_error"),
    ]) {
      stubFetch(response);
      const { container, unmount } = renderPage();
      await vi.waitFor(() => expect(screen.getByRole("status")).not.toBeEmptyDOMElement());
      expect(container.innerHTML).not.toContain(TOKEN);
      unmount();
    }
  });
});
