import {
  listBrands,
  listCategories,
  listShades,
  listSizes,
  listSkinTypes,
} from "@/lib/api/catalog";
import type { Brand, Category, CategoryRef, ShadeRef, SizeRef, SkinTypeRef } from "@/lib/api/types";
import { hrefWith } from "@/lib/catalog/query";

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

export function navigationSkinTypes(): Promise<SkinTypeRef[]> {
  return orEmpty(listSkinTypes);
}

export type ListingFacets = {
  categories: Category[];
  brands: Brand[];
  shades: ShadeRef[];
  sizes: SizeRef[];
  skinTypes: SkinTypeRef[];
};

export async function listingFacets(): Promise<ListingFacets> {
  const [categories, brands, shades, sizes, skinTypes] = await Promise.all([
    navigationCategories(),
    navigationBrands(),
    orEmpty(listShades),
    orEmpty(listSizes),
    navigationSkinTypes(),
  ]);
  return { categories, brands, shades, sizes, skinTypes };
}

export type MenuLink = { label: string; href: string };
export type MenuColumn = { title: string; links: MenuLink[] };

export function categoryHref(slug: string): string {
  return hrefWith({}, { category: slug });
}

/**
 * The Shop menu's columns, shared by the desktop mega-menu and the mobile
 * drill-down. "Shop all" works because `?category=<root>` includes its children.
 * The skin-type column follows the first root, as in the design.
 */
export function shopMenu(categories: Category[], skinTypes: SkinTypeRef[]): MenuColumn[] {
  const columns = categories.map((root) => ({
    title: root.name,
    links: [
      { label: "Shop all", href: categoryHref(root.slug) },
      ...root.children.map((child) => ({ label: child.name, href: categoryHref(child.slug) })),
    ],
  }));
  if (skinTypes.length === 0) return columns;

  const skinTypeColumn = {
    title: "Skin type",
    links: skinTypes.map((skinType) => ({
      label: skinType.name,
      href: hrefWith({}, { skinType: [skinType.slug] }),
    })),
  };
  return [...columns.slice(0, 1), skinTypeColumn, ...columns.slice(1)];
}

export type CategoryTrail = { root: Category; child: CategoryRef | null };

/** Where a category slug sits in the one-level tree; null when it is not in it. */
export function findCategory(
  categories: Category[],
  slug: string | undefined,
): CategoryTrail | null {
  if (slug === undefined) return null;
  for (const root of categories) {
    if (root.slug === slug) return { root, child: null };
    const child = root.children.find((candidate) => candidate.slug === slug);
    if (child !== undefined) return { root, child };
  }
  return null;
}
