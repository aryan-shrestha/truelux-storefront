import { request, toAbsoluteImageUrl } from "@/lib/api/client";
import type {
  Brand,
  BrandRef,
  Category,
  CategoryRef,
  Money,
  Page,
  Product,
  ProductImage,
  ProductQuery,
  ProductSummary,
  ProductVariant,
  ShadeRef,
  ShippingSettings,
  SizeRef,
  SkinTypeRef,
} from "@/lib/api/types";

// Terms in the catalogue request budget (docs/architecture.md). Change one only
// after redoing that arithmetic.
const LIST_REVALIDATE = 600;
const DETAIL_REVALIDATE = 1800;
const REFERENCE_REVALIDATE = 3600;
const RELATED_REVALIDATE = 3600;
const SHIPPING_REVALIDATE = 3600;

type RawRef = { name: string; slug: string };
type RawShade = { name: string; slug: string; hex_code: string };
type RawImage = { url: string; alt_text: string };
type RawVariant = {
  id: string;
  size: RawRef;
  shade: RawShade | null;
  price: Money;
  in_stock: boolean;
};
type RawProductSummary = {
  id: string;
  name: string;
  slug: string;
  base_price: Money;
  brand: RawRef;
  category: RawRef;
  primary_image: RawImage | null;
  in_stock: boolean;
};
type RawProduct = RawProductSummary & {
  description: string;
  images: RawImage[];
  variants: RawVariant[];
  skin_types: RawRef[];
  skin_feel: string;
  key_ingredients: string;
};
type RawShipping = {
  inside_valley_fee: Money;
  outside_valley_fee: Money;
  free_shipping_threshold: Money | null;
};
type RawCategory = RawRef & { children: RawRef[] };
type RawBrand = RawRef & {
  description: string;
  logo_url: string | null;
  product_count: number;
};

function toRef(raw: RawRef): CategoryRef & BrandRef & SizeRef & SkinTypeRef {
  return { name: raw.name, slug: raw.slug };
}

function toShade(raw: RawShade): ShadeRef {
  return { name: raw.name, slug: raw.slug, hexCode: raw.hex_code };
}

function toImage(raw: RawImage): ProductImage {
  return { url: toAbsoluteImageUrl(raw.url), altText: raw.alt_text };
}

function toVariant(raw: RawVariant): ProductVariant {
  return {
    id: raw.id,
    size: toRef(raw.size),
    shade: raw.shade === null ? null : toShade(raw.shade),
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
    brand: toRef(raw.brand),
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
    skinTypes: raw.skin_types.map(toRef),
    skinFeel: raw.skin_feel,
    keyIngredients: raw.key_ingredients,
  };
}

function toCategory(raw: RawCategory): Category {
  return { name: raw.name, slug: raw.slug, children: raw.children.map(toRef) };
}

function toBrand(raw: RawBrand): Brand {
  return {
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    logoUrl: raw.logo_url === null ? null : toAbsoluteImageUrl(raw.logo_url),
    productCount: raw.product_count,
  };
}

function toPage(page: Page<RawProductSummary>): Page<ProductSummary> {
  return {
    count: page.count,
    next: page.next,
    previous: page.previous,
    results: page.results.map(toSummary),
  };
}

export async function listProducts(query: ProductQuery = {}): Promise<Page<ProductSummary>> {
  const page = await request<Page<RawProductSummary>>("/api/v1/products/", {
    revalidate: LIST_REVALIDATE,
    query: {
      category: query.category,
      brand: query.brand,
      size: query.size,
      shade: query.shade,
      skin_type: query.skinType,
      min_price: query.minPrice,
      max_price: query.maxPrice,
      in_stock: query.inStock,
      search: query.search,
      ordering: query.ordering,
      limit: query.limit,
      offset: query.offset,
    },
  });
  return toPage(page);
}

/**
 * The product page's "combine with" rail. Its own function because it keys one
 * list per category and revalidates like reference data, not like the listing.
 */
export async function listRelatedProducts({
  category,
  limit,
}: {
  category: string;
  limit: number;
}): Promise<Page<ProductSummary>> {
  const page = await request<Page<RawProductSummary>>("/api/v1/products/", {
    revalidate: RELATED_REVALIDATE,
    query: { category, limit },
  });
  return toPage(page);
}

export async function getProduct({ slug }: { slug: string }): Promise<Product> {
  const raw = await request<RawProduct>(`/api/v1/products/${encodeURIComponent(slug)}/`, {
    revalidate: DETAIL_REVALIDATE,
  });
  return toProduct(raw);
}

export async function listCategories(): Promise<Category[]> {
  const raw = await request<RawCategory[]>("/api/v1/categories/", {
    revalidate: REFERENCE_REVALIDATE,
  });
  return raw.map(toCategory);
}

export async function listBrands(): Promise<Brand[]> {
  const raw = await request<RawBrand[]>("/api/v1/brands/", {
    revalidate: REFERENCE_REVALIDATE,
  });
  return raw.map(toBrand);
}

export async function getBrand({ slug }: { slug: string }): Promise<Brand> {
  const raw = await request<RawBrand>(`/api/v1/brands/${encodeURIComponent(slug)}/`, {
    revalidate: REFERENCE_REVALIDATE,
  });
  return toBrand(raw);
}

export async function listShades(): Promise<ShadeRef[]> {
  const raw = await request<RawShade[]>("/api/v1/shades/", {
    revalidate: REFERENCE_REVALIDATE,
  });
  return raw.map(toShade);
}

export async function listSizes(): Promise<SizeRef[]> {
  const raw = await request<RawRef[]>("/api/v1/sizes/", {
    revalidate: REFERENCE_REVALIDATE,
  });
  return raw.map(toRef);
}

export async function listSkinTypes(): Promise<SkinTypeRef[]> {
  const raw = await request<RawRef[]>("/api/v1/skin-types/", {
    revalidate: REFERENCE_REVALIDATE,
  });
  return raw.map(toRef);
}

export async function getShipping(): Promise<ShippingSettings> {
  const raw = await request<RawShipping>("/api/v1/shipping/", {
    revalidate: SHIPPING_REVALIDATE,
  });
  return {
    insideValleyFee: raw.inside_valley_fee,
    outsideValleyFee: raw.outside_valley_fee,
    freeShippingThreshold: raw.free_shipping_threshold,
  };
}
