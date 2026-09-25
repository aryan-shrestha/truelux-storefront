import type { RawOrder } from "@/lib/api/orders";

/**
 * An order as the API sends it, for stubbing `fetch` and `page.route`.
 *
 * A Khalti order that came back from the payment page unpaid is the case that
 * must never read as confirmed, so `pending` is the default here.
 */
export const pendingKhaltiOrder: RawOrder = {
  order_number: "TL-2026-000142",
  status: "pending",
  placed_at: "2026-09-20T10:14:00Z",
  email: "sita@example.com",
  phone: "9800000000",
  shipping: {
    full_name: "Sita Rai",
    address_line: "Jhamsikhel Road",
    city: "Lalitpur",
    district: "Lalitpur",
  },
  items: [
    {
      product_name: "Washed Pocket Tee",
      variant_size: "M",
      variant_color: "Washed Indigo",
      sku: "WPT-M-IND",
      quantity: 3,
      unit_price: "2650.00",
    },
  ],
  subtotal: "7950.00",
  shipping_fee: "150.00",
  total: "8100.00",
  payment_method: "khalti",
};

export const paidKhaltiOrder: RawOrder = { ...pendingKhaltiOrder, status: "paid" };
