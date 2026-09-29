import type { RawQuote } from "@/lib/api/orders";

export const districtlessQuote: RawQuote = {
  subtotal: "6400.00",
  shipping_fee: null,
  discount: "0.00",
  total: null,
  free_shipping_remaining: "1600.00",
  lines: [],
};

export const lalitpurQuote: RawQuote = {
  ...districtlessQuote,
  shipping_fee: "150.00",
  total: "6550.00",
};

export const freeShippingQuote: RawQuote = {
  ...districtlessQuote,
  subtotal: "9000.00",
  shipping_fee: "0.00",
  total: "9000.00",
  free_shipping_remaining: null,
};

export const noThresholdQuote: RawQuote = {
  ...districtlessQuote,
  free_shipping_remaining: null,
};

export function quoteResponse(body: RawQuote): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}
