import Link from "next/link";
import { useId, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { toggleVariants } from "@/components/ui/toggle";
import type { ProductQuery } from "@/lib/api/types";
import type { ListingFacets } from "@/lib/catalog/navigation";
import { appliedFilterCount, hrefWith, withToggled } from "@/lib/catalog/query";

// Filters are links (ADR 0004): they work by keyboard, middle-click and the back
// button. Fixed price bands rather than free inputs, because a free range mints a
// cache key per typed value.
const PRICE_BANDS = [
  { label: "Under Rs 2,000", minPrice: undefined, maxPrice: "2000" },
  { label: "Rs 2,000 to 5,000", minPrice: "2000", maxPrice: "5000" },
  { label: "Over Rs 5,000", minPrice: "5000", maxPrice: undefined },
] as const;

type FilterPanelProps = {
  facets: Omit<ListingFacets, "categories">;
  query: ProductQuery;
  pathname?: string;
  showBrands?: boolean;
};

export function FilterPanel({
  facets,
  query,
  pathname = "/products",
  showBrands = true,
}: FilterPanelProps) {
  const href = (change: Partial<ProductQuery>) => hrefWith(query, change, { pathname });
  const applied = appliedFilterCount(query);

  return (
    <div className="flex flex-col gap-8">
      {facets.skinTypes.length > 0 && (
        <FilterGroup title="Skin type">
          {facets.skinTypes.map((skinType) => (
            <li key={skinType.slug}>
              <ToggleFilter
                href={href({ skinType: withToggled(query.skinType, skinType.slug) })}
                active={query.skinType?.includes(skinType.slug) ?? false}
              >
                {skinType.name}
              </ToggleFilter>
            </li>
          ))}
        </FilterGroup>
      )}

      {showBrands && facets.brands.length > 0 && (
        <FilterGroup title="Brand">
          {facets.brands.map((brand) => (
            <li key={brand.slug}>
              <ToggleFilter
                href={href({ brand: withToggled(query.brand, brand.slug) })}
                active={query.brand?.includes(brand.slug) ?? false}
              >
                {brand.name}
              </ToggleFilter>
            </li>
          ))}
        </FilterGroup>
      )}

      {facets.shades.length > 0 && (
        <FilterGroup title="Shade">
          {facets.shades.map((shade) => {
            const active = query.shade === shade.slug;
            return (
              <li key={shade.slug}>
                <Link
                  href={href({ shade: active ? undefined : shade.slug })}
                  aria-current={active ? "true" : undefined}
                  title={shade.name}
                  className={toggleVariants({ variant: "swatch", size: "swatch" })}
                >
                  <span
                    aria-hidden
                    className="size-8 rounded-full"
                    // The swatch colour is data from the API, not a design token.
                    style={{ backgroundColor: shade.hexCode }}
                  />
                  <span className="sr-only">{shade.name}</span>
                </Link>
              </li>
            );
          })}
        </FilterGroup>
      )}

      {facets.sizes.length > 0 && (
        <FilterGroup title="Size">
          {facets.sizes.map((size) => {
            const active = query.size === size.slug;
            return (
              <li key={size.slug}>
                <ToggleFilter href={href({ size: active ? undefined : size.slug })} active={active}>
                  {size.name}
                </ToggleFilter>
              </li>
            );
          })}
        </FilterGroup>
      )}

      <FilterGroup title="Price">
        {PRICE_BANDS.map((band) => {
          const active = query.minPrice === band.minPrice && query.maxPrice === band.maxPrice;
          return (
            <li key={band.label}>
              <ToggleFilter
                href={href({
                  minPrice: active ? undefined : band.minPrice,
                  maxPrice: active ? undefined : band.maxPrice,
                })}
                active={active}
              >
                {band.label}
              </ToggleFilter>
            </li>
          );
        })}
      </FilterGroup>

      <FilterGroup title="Availability">
        <li>
          <ToggleFilter
            href={href({ inStock: query.inStock ? undefined : true })}
            active={Boolean(query.inStock)}
          >
            In stock only
          </ToggleFilter>
        </li>
        <li>
          <ToggleFilter
            href={href({ onSale: query.onSale ? undefined : true })}
            active={Boolean(query.onSale)}
          >
            On sale
          </ToggleFilter>
        </li>
      </FilterGroup>

      {applied > 0 && (
        <Button asChild variant="link" size="inline" className="self-start">
          <Link
            href={hrefWith(
              { category: query.category, search: query.search, ordering: query.ordering },
              {},
              { pathname },
            )}
          >
            Clear filters
          </Link>
        </Button>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h3 id={id} className="text-sm font-semibold">
        {title}
      </h3>
      <ul className="flex flex-wrap gap-2">{children}</ul>
    </section>
  );
}

function ToggleFilter({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={toggleVariants({ variant: "outline", size: "sm" })}
    >
      {children}
    </Link>
  );
}
