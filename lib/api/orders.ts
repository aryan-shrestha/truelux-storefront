import { request } from "@/lib/api/client";
import type {
  CartQuote,
  CheckoutInput,
  CheckoutResult,
  Order,
  OrderItem,
  QuoteInput,
  ShippingAddress,
} from "@/lib/api/types";

// Browser-only and uncached (ADR 0001): these rate limits must land on the
// customer's IP, and the access token must never pass through a server log.

type RawOrderItem = {
  product_name: string;
  variant_size: string;
  variant_shade: string | null;
  sku: string;
  quantity: number;
  unit_price: string;
};

/** Exported for fixtures, so a stubbed response breaks when the wire shape does. */
export type RawOrder = {
  order_number: string;
  status: Order["status"];
  placed_at: string;
  email: string;
  phone: string;
  shipping: {
    full_name: string;
    address_line: string;
    city: string;
    district: string;
  };
  items: RawOrderItem[];
  subtotal: string;
  shipping_fee: string;
  total: string;
  payment_method: Order["paymentMethod"];
};

type RawCheckoutResult = {
  order_number: string;
  status: Order["status"];
  subtotal: string;
  shipping_fee: string;
  total: string;
};

function toItem(raw: RawOrderItem): OrderItem {
  return {
    productName: raw.product_name,
    variantSize: raw.variant_size,
    // The backend stores "" for a shadeless variant.
    variantShade: raw.variant_shade === "" ? null : raw.variant_shade,
    sku: raw.sku,
    quantity: raw.quantity,
    unitPrice: raw.unit_price,
  };
}

function toShipping(raw: RawOrder["shipping"]): ShippingAddress {
  return {
    fullName: raw.full_name,
    addressLine: raw.address_line,
    city: raw.city,
    district: raw.district,
  };
}

function toOrder(raw: RawOrder): Order {
  return {
    orderNumber: raw.order_number,
    status: raw.status,
    placedAt: raw.placed_at,
    email: raw.email,
    phone: raw.phone,
    shipping: toShipping(raw.shipping),
    items: raw.items.map(toItem),
    subtotal: raw.subtotal,
    shippingFee: raw.shipping_fee,
    total: raw.total,
    paymentMethod: raw.payment_method,
  };
}

export async function submitCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const raw = await request<RawCheckoutResult>("/api/v1/checkout/", {
    method: "POST",
    cache: "no-store",
    body: {
      items: input.items.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
      email: input.email,
      phone: input.phone,
      full_name: input.fullName,
      address_line: input.addressLine,
      city: input.city,
      district: input.district,
      note: input.note,
      payment_method: "cod",
    },
  });

  return {
    orderNumber: raw.order_number,
    status: raw.status,
    subtotal: raw.subtotal,
    shippingFee: raw.shipping_fee,
    total: raw.total,
  };
}

/** Exported for fixtures, so a stubbed response breaks when the wire shape does. */
export type RawQuote = {
  subtotal: string;
  shipping_fee: string | null;
  discount: string;
  total: string | null;
  free_shipping_remaining: string | null;
  lines: Array<{ variant_id: string; quantity: number; unit_price: string; line_total: string }>;
};

/** Prices the bag without placing anything. Shares the checkout throttle scope. */
export async function quoteCart(
  { items, district }: QuoteInput,
  { signal }: { signal?: AbortSignal } = {},
): Promise<CartQuote> {
  const raw = await request<RawQuote>("/api/v1/checkout/quote/", {
    method: "POST",
    cache: "no-store",
    signal,
    body: {
      items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
      ...(district === undefined ? {} : { district }),
    },
  });

  return {
    subtotal: raw.subtotal,
    shippingFee: raw.shipping_fee,
    discount: raw.discount,
    total: raw.total,
    freeShippingRemaining: raw.free_shipping_remaining,
  };
}

export async function getOrder({ accessToken }: { accessToken: string }): Promise<Order> {
  const raw = await request<RawOrder>(`/api/v1/orders/${encodeURIComponent(accessToken)}/`, {
    cache: "no-store",
  });
  return toOrder(raw);
}

/** A wrong email and an unknown order number return the same 404; never attribute it to one field. */
export async function lookupOrder({
  orderNumber,
  email,
}: {
  orderNumber: string;
  email: string;
}): Promise<Order> {
  const raw = await request<RawOrder>("/api/v1/orders/lookup/", {
    method: "POST",
    cache: "no-store",
    body: { order_number: orderNumber, email },
  });
  return toOrder(raw);
}
