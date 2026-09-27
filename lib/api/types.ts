/** A decimal string, e.g. "4500.00". Never a number (ADR 0003). */
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
  children: CategoryRef[];
};

export type BrandRef = {
  name: string;
  slug: string;
};

export type Brand = BrandRef & {
  description: string;
  logoUrl: string | null;
  productCount: number;
};

export type SizeRef = {
  name: string;
  slug: string;
};

export type ShadeRef = {
  name: string;
  slug: string;
  hexCode: string;
};

export type SkinTypeRef = {
  name: string;
  slug: string;
};

export type ProductImage = {
  url: string;
  /** An empty string means the image is decorative. */
  altText: string;
};

export type ProductVariant = {
  id: string;
  size: SizeRef;
  shade: ShadeRef | null;
  /** Already resolved: the variant's override, or its product's base price. */
  price: Money;
  inStock: boolean;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  basePrice: Money;
  brand: BrandRef;
  category: CategoryRef;
  primaryImage: ProductImage | null;
  inStock: boolean;
};

export type Product = ProductSummary & {
  description: string;
  images: ProductImage[];
  variants: ProductVariant[];
  skinTypes: SkinTypeRef[];
  /** An empty string when the merchant has not written one. */
  skinFeel: string;
  /** An empty string when the merchant has not written one. */
  keyIngredients: string;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type ShippingAddress = {
  fullName: string;
  addressLine: string;
  city: string;
  district: string;
};

export type OrderItem = {
  productName: string;
  variantSize: string;
  variantShade: string | null;
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
};

export type CheckoutResult = {
  orderNumber: string;
  status: OrderStatus;
  subtotal: Money;
  shippingFee: Money;
  total: Money;
};

export type QuoteInput = {
  items: CheckoutItem[];
  district?: string;
};

export type CartQuote = {
  subtotal: Money;
  /** Null when no district was sent, unless the free-shipping threshold is reached. */
  shippingFee: Money | null;
  discount: Money;
  /** Null exactly when `shippingFee` is. */
  total: Money | null;
  /** Null when no threshold is set or it has been reached. */
  freeShippingRemaining: Money | null;
};

export type ShippingSettings = {
  insideValleyFee: Money;
  outsideValleyFee: Money;
  /** Null when the merchant offers no free shipping. */
  freeShippingThreshold: Money | null;
};

export type ProductOrdering =
  "name" | "-name" | "base_price" | "-base_price" | "created_at" | "-created_at";

export type ProductQuery = {
  category?: string;
  brand?: string[];
  size?: string;
  shade?: string;
  skinType?: string[];
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
  search?: string;
  ordering?: ProductOrdering;
  limit?: number;
  offset?: number;
};
