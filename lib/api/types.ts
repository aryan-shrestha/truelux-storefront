/**
 * The wire types, mirroring docs/integrations/backend-api.md field for field.
 *
 * The API speaks snake_case; this repository speaks camelCase. The mapping
 * happens once, in the endpoint modules, so API field names appear as strings
 * only here and there.
 */

/** A decimal string, e.g. "4500.00". Never a number — see ADR 0003. */
export type Money = string;

export type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type CategoryRef = {
  name: string;
  slug: string;
};

export type Category = CategoryRef & {
  /** Always one level deep. A child never has children of its own. */
  children: CategoryRef[];
};

export type ProductImage = {
  url: string;
  /** May be an empty string, which means the image is decorative. */
  altText: string;
};

export type SizeRef = {
  name: string;
  slug: string;
};

export type ColorRef = {
  name: string;
  slug: string;
};

export type ProductVariant = {
  id: string;
  size: SizeRef;
  color: ColorRef;
  /** Already resolved: the variant's override, or its product's base price. */
  price: Money;
  inStock: boolean;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  basePrice: Money;
  category: CategoryRef;
  primaryImage: ProductImage | null;
  /** True when any variant has stock. Never a quantity — the API sends none. */
  inStock: boolean;
};

export type Product = ProductSummary & {
  description: string;
  images: ProductImage[];
  /**
   * A sparse set of pairings, not a grid. A product in three sizes and two
   * colours may have four variants, and a combination that was never created is
   * a different fact from one that sold out.
   */
  variants: ProductVariant[];
};

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["cod", "khalti"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type ShippingAddress = {
  fullName: string;
  addressLine: string;
  city: string;
  district: string;
};

export type OrderItem = {
  /** Snapshots taken at purchase. They do not change when the catalogue does. */
  productName: string;
  variantSize: string;
  variantColor: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
};

export type Order = {
  orderNumber: string;
  status: OrderStatus;
  placedAt: string;
  email: string;
  phone: string;
  shipping: ShippingAddress;
  items: OrderItem[];
  subtotal: Money;
  shippingFee: Money;
  total: Money;
  paymentMethod: PaymentMethod;
};

export type CheckoutItem = {
  variantId: string;
  quantity: number;
};

export type CheckoutInput = {
  items: CheckoutItem[];
  email: string;
  phone: string;
  fullName: string;
  addressLine: string;
  city: string;
  district: string;
  note: string;
  paymentMethod: PaymentMethod;
};

export type CheckoutResult = {
  orderNumber: string;
  status: OrderStatus;
  subtotal: Money;
  shippingFee: Money;
  total: Money;
  /**
   * Optional, not nullable. A cash-on-delivery response omits the key entirely
   * rather than sending null, and modelling it as `string | null` produces a
   * type that is wrong in a way the compiler cannot catch.
   */
  paymentUrl?: string;
};

export type ProductOrdering =
  "name" | "-name" | "base_price" | "-base_price" | "created_at" | "-created_at";

/** Normalised by the listing route before it reaches the client. */
export type ProductQuery = {
  category?: string;
  size?: string;
  color?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
  search?: string;
  ordering?: ProductOrdering;
  limit?: number;
  offset?: number;
};
