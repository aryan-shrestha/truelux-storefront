import { listBrands, listCategories, listShades, listSizes } from "@/lib/api/catalog";
import type { Brand, Category, ShadeRef, SizeRef } from "@/lib/api/types";

// The header, the home page and the filter rail render on every busy route, and
// none of them is worth taking a page down for when a reference list fails.
async function orEmpty<T>(read: () => Promise<T[]>): Promise<T[]> {
  try {
    return await read();
  } catch {
    return [];
  }
}

export function navigationCategories(): Promise<Category[]> {
  return orEmpty(listCategories);
}

export function navigationBrands(): Promise<Brand[]> {
  return orEmpty(listBrands);
}

export type ListingFacets = {
  categories: Category[];
  brands: Brand[];
  shades: ShadeRef[];
  sizes: SizeRef[];
};

export async function listingFacets(): Promise<ListingFacets> {
  const [categories, brands, shades, sizes] = await Promise.all([
    navigationCategories(),
    navigationBrands(),
    orEmpty(listShades),
    orEmpty(listSizes),
  ]);
  return { categories, brands, shades, sizes };
}
