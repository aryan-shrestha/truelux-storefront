import Link from "next/link";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Category, CategoryRef } from "@/lib/api/types";
import { categoryHref, findCategory } from "@/lib/catalog/navigation";

/** Root, then the product's own category; the root is omitted when the tree could not be read. */
export function ProductBreadcrumb({
  categories,
  category,
}: {
  categories: Category[];
  category: CategoryRef;
}) {
  const trail = findCategory(categories, category.slug);
  const crumbs = trail?.child ? [trail.root, trail.child] : [category];

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-foreground">
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.slug}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={categoryHref(crumb.slug)}>{crumb.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
