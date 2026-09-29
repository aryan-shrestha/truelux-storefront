import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { quoteCart, type RawQuote } from "@/lib/api/orders";

const items = [{ variantId: "v1", quantity: 2 }];

const quote: RawQuote = {
  subtotal: "6400.00",
  shipping_fee: "150.00",
  discount: "0.00",
  total: "6550.00",
  free_shipping_remaining: "1600.00",
  lines: [{ variant_id: "v1", quantity: 2, unit_price: "3200.00", line_total: "6400.00" }],
};

function stubFetch(response: Response) {
  const fetchMock = vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
    Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sentBody(fetchMock: ReturnType<typeof stubFetch>): unknown {
  return JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("quoteCart", () => {
  it("posts variant ids, quantities and the district, uncached", async () => {
    const fetchMock = stubFetch(json(quote));

    await quoteCart({ items, district: "Lalitpur" });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "http://127.0.0.1:8000/api/v1/checkout/quote/",
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "POST", cache: "no-store" });
    expect(sentBody(fetchMock)).toEqual({
      items: [{ variant_id: "v1", quantity: 2 }],
      district: "Lalitpur",
    });
  });

  it("omits the district when there is none", async () => {
    const fetchMock = stubFetch(json(quote));

    await quoteCart({ items });

    expect(sentBody(fetchMock)).not.toHaveProperty("district");
  });

  it("returns the API's figures as strings", async () => {
    stubFetch(json(quote));

    const result = await quoteCart({ items, district: "Lalitpur" });

    expect(result.subtotal).toBe("6400.00");
    expect(result.shippingFee).toBe("150.00");
    expect(result.total).toBe("6550.00");
    expect(result.freeShippingRemaining).toBe("1600.00");
  });

  it("keeps a districtless shipping fee and total as null", async () => {
    stubFetch(json({ ...quote, shipping_fee: null, total: null }));

    const result = await quoteCart({ items });

    expect(result.shippingFee).toBeNull();
    expect(result.total).toBeNull();
  });

  it.each([
    [422, "variant_unavailable", { variant_ids: ["v1"] }],
    [422, "insufficient_stock", { variant_id: "v1", requested: 2 }],
    [429, "throttled", {}],
  ])("throws the %s %s code", async (status, code, details) => {
    stubFetch(json({ error: { code, message: "Reworded at will.", details } }, status));

    const failure = await quoteCart({ items }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).code).toBe(code);
  });
});
