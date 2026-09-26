import Link from "next/link";

import { ListingHero } from "@/components/catalog/ListingHero";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Category, ProductQuery } from "@/lib/api/types";
import { categoryHref, findCategory } from "@/lib/catalog/navigation";

export function ShopHero({ query, categories }: { query: ProductQuery; categories: Category[] }) {
  const trail = findCategory(categories, query.category);
  const category = trail?.child ?? trail?.root;
  const title = query.search ? `Results for “${query.search}”` : (category?.name ?? "Shop");
  const description = query.search
    ? "Products whose name or description contains your search."
    : category === undefined
      ? "Skincare, makeup and fragrance from every brand we stock, delivered across Nepal."
      : `Everything in ${category.name.toLowerCase()}, across every brand we stock.`;

  return (
    <ListingHero
      eyebrow={
        trail !== null && (
          <Breadcrumb>
            <BreadcrumbList className="text-on-image">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="hover:text-on-image">
                  <Link href="/products">Shop</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {trail.child !== null && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild className="hover:text-on-image">
                      <Link href={categoryHref(trail.root.slug)}>{trail.root.name}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        )
      }
      title={title}
      description={description}
    />
  );
}
