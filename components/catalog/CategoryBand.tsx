import { cn } from "cn";
import Link from "next/link";
import type { ReactNode } from "react";

import type { Category, ProductQuery } from "@/lib/api/types";
import { findCategory } from "@/lib/catalog/navigation";
import { hrefWith } from "@/lib/catalog/query";

type CategoryBandProps = {
  categories: Category[];
  query: ProductQuery;
  pathname: string;
};

/**
 * Inside a root category the band lists its children after "Shop all" (the root,
 * which includes them); anywhere else it lists the roots. Other filters are kept.
 */
export function CategoryBand({ categories, query, pathname }: CategoryBandProps) {
  if (categories.length === 0) return null;

  const trail = findCategory(categories, query.category);
  const href = (category: string | undefined) => hrefWith(query, { category }, { pathname });
  const links = trail === null ? categories : trail.root.children;

  return (
    <nav aria-label="Categories" className="bg-muted">
      <ul className="mx-auto flex max-w-page items-center gap-x-6 overflow-x-auto px-4 py-7 whitespace-nowrap md:px-10 md:py-10">
        <li className="border-r border-input pr-6">
          <BandLink
            href={href(trail?.root.slug)}
            active={trail === null ? query.category === undefined : trail.child === null}
          >
            Shop all
          </BandLink>
        </li>
        {links.map((category) => (
          <li key={category.slug}>
            <BandLink href={href(category.slug)} active={query.category === category.slug}>
              {category.name}
            </BandLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function BandLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center text-[0.9375rem] underline-offset-6 hover:underline",
        active && "underline",
      )}
    >
      {children}
    </Link>
  );
}
