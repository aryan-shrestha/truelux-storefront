import { request, toAbsoluteImageUrl } from "@/lib/api/client";
import type {
  Category,
  CategoryRef,
  Money,
  Page,
  Product,
  ProductImage,
  ProductQuery,
  ProductSummary,
  ProductVariant,
  SizeRef,
} from "@/lib/api/types";

/**
 * Catalogue reads. Server-side only, cached, per ADR 0001.
 *
 * The revalidation intervals are terms in a request budget, not preferences:
 * the backend allows 600 catalogue requests an hour per IP and a deployed
 * storefront is one IP. See docs/architecture.md before changing one or adding
 * a fourth call.
 */

const LIST_REVALIDATE = 300;
const DETAIL_REVALIDATE = 900;
const CATEGORY_REVALIDATE = 3600;

type RawRef = { name: string; slug: string };
type RawImage = { url: string; alt_text: string };
type RawVariant = {
  id: string;
  size: RawRef;
  color: RawRef;
  price: Money;
  in_stock: boolean;
};
type RawProductSummary = {
  id: string;
  name: string;
  slug: string;
  base_price: Money;
  category: RawRef;
  primary_image: RawImage | null;
  in_stock: boolean;
};
type RawProduct = RawProductSummary & {
  description: string;
  images: RawImage[];
  variants: RawVariant[];
};
type RawCategory = RawRef & { children: RawRef[] };

// Mapped field by field rather than through a generic snake-to-camel helper: a
// helper types as `any` in both directions, and these functions are where a
// field rename on the backend becomes a compile error here.
function toRef(raw: RawRef): CategoryRef & SizeRef {
  return { name: raw.name, slug: raw.slug };
}

function toImage(raw: RawImage): ProductImage {
  return { url: toAbsoluteImageUrl(raw.url), altText: raw.alt_text };
}

function toVariant(raw: RawVariant): ProductVariant {
  return {
    id: raw.id,
    size: toRef(raw.size),
    color: toRef(raw.color),
    price: raw.price,
    inStock: raw.in_stock,
  };
}

function toSummary(raw: RawProductSummary): ProductSummary {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    basePrice: raw.base_price,
    category: toRef(raw.category),
    primaryImage: raw.primary_image === null ? null : toImage(raw.primary_image),
    inStock: raw.in_stock,
  };
}

function toProduct(raw: RawProduct): Product {
  return {
    ...toSummary(raw),
    description: raw.description,
    images: raw.images.map(toImage),
    variants: raw.variants.map(toVariant),
  };
}

function toCategory(raw: RawCategory): Category {
  return { name: raw.name, slug: raw.slug, children: raw.children.map(toRef) };
}

export async function listProducts(query: ProductQuery = {}): Promise<Page<ProductSummary>> {
  const page = await request<Page<RawProductSummary>>("/api/v1/products/", {
    revalidate: LIST_REVALIDATE,
    query: {
      category: query.category,
      size: query.size,
      color: query.color,
      min_price: query.minPrice,
      max_price: query.maxPrice,
      in_stock: query.inStock,
      search: query.search,
      ordering: query.ordering,
      limit: query.limit,
      offset: query.offset,
    },
  });

  return {
    count: page.count,
    // Absolute URLs built from the request's own host, which for a server-side
    // call is the internal one. Never follow them; recompute limit and offset.
    next: page.next,
    previous: page.previous,
    results: page.results.map(toSummary),
  };
}

export async function getProduct({ slug }: { slug: string }): Promise<Product> {
  const raw = await request<RawProduct>(`/api/v1/products/${encodeURIComponent(slug)}/`, {
    revalidate: DETAIL_REVALIDATE,
  });
  return toProduct(raw);
}

/** A bare array, not a pagination envelope — the one endpoint shaped this way. */
export async function listCategories(): Promise<Category[]> {
  const raw = await request<RawCategory[]>("/api/v1/categories/", {
    revalidate: CATEGORY_REVALIDATE,
  });
  return raw.map(toCategory);
}
