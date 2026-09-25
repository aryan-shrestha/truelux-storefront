import { request } from "@/lib/api/client";
import type {
  CheckoutInput,
  CheckoutResult,
  Order,
  OrderItem,
  ShippingAddress,
} from "@/lib/api/types";

/**
 * Customer-scoped calls. Browser-only, uncached, per ADR 0001.
 *
 * These carry the rate limits that are meant to apply to a person: 30 checkouts
 * an hour, 20 order lookups, 60 order reads. Called from a Server Component they
 * would apply to the whole shop instead, and the access token would pass through
 * a server log on its way.
 */

type RawOrderItem = {
  product_name: string;
  variant_size: string;
  variant_color: string;
  sku: string;
  quantity: number;
  unit_price: string;
};

/** Exported for fixtures only, so a stubbed response breaks when the wire shape does. */
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
  // Absent for cash on delivery. The key is omitted, not set to null.
  payment_url?: string;
};

function toItem(raw: RawOrderItem): OrderItem {
  return {
    productName: raw.product_name,
    variantSize: raw.variant_size,
    variantColor: raw.variant_color,
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
      payment_method: input.paymentMethod,
    },
  });

  return {
    orderNumber: raw.order_number,
    status: raw.status,
    subtotal: raw.subtotal,
    shippingFee: raw.shipping_fee,
    total: raw.total,
    // Spread conditionally so the key is absent rather than undefined, which is
    // what the API's own shape means and what `"paymentUrl" in result` reads.
    ...(raw.payment_url === undefined ? {} : { paymentUrl: raw.payment_url }),
  };
}

/** The access token is the credential. It stays in the URL and goes nowhere else. */
export async function getOrder({ accessToken }: { accessToken: string }): Promise<Order> {
  const raw = await request<RawOrder>(`/api/v1/orders/${encodeURIComponent(accessToken)}/`, {
    cache: "no-store",
  });
  return toOrder(raw);
}

/**
 * The fallback for a customer with no token, at 20 attempts an hour.
 *
 * A wrong email and an unknown order number return an identical 404, so a caller
 * must never attribute the failure to one field.
 */
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
