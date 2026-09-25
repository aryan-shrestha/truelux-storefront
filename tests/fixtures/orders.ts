import type { RawOrder } from "@/lib/api/orders";

export const pendingOrder: RawOrder = {
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
      product_name: "Silk Skin Foundation",
      variant_size: "30 ml",
      variant_shade: "Warm Beige",
      sku: "SSF-30-WB",
      quantity: 1,
      unit_price: "3200.00",
    },
    {
      product_name: "Hydrating Serum",
      variant_size: "15 ml",
      variant_shade: "",
      sku: "HS-15",
      quantity: 2,
      unit_price: "2900.00",
    },
  ],
  subtotal: "9000.00",
  shipping_fee: "150.00",
  total: "9150.00",
  payment_method: "cod",
};

export const confirmedOrder: RawOrder = { ...pendingOrder, status: "confirmed" };
