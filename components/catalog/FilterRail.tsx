import { cn } from "cn";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { toggleVariants } from "@/components/ui/toggle";
import type { ProductOrdering, ProductQuery } from "@/lib/api/types";
import type { ListingFacets } from "@/lib/catalog/navigation";
import { hrefWith, withToggled } from "@/lib/catalog/query";

// Filters are links (ADR 0004): they work by keyboard, middle-click, the back
// button and before JavaScript loads. Fixed price bands rather than free inputs,
// because a free range mints a cache key per typed value.
const PRICE_BANDS = [
  { label: "Under Rs 2,000", minPrice: undefined, maxPrice: "2000" },
  { label: "Rs 2,000 to 5,000", minPrice: "2000", maxPrice: "5000" },
  { label: "Over Rs 5,000", minPrice: "5000", maxPrice: undefined },
] as const;

const SORTS: ReadonlyArray<{ value: ProductOrdering | ""; label: string }> = [
  { value: "", label: "Featured" },
  { value: "-created_at", label: "Newest" },
  { value: "base_price", label: "Price, low to high" },
  { value: "-base_price", label: "Price, high to low" },
  { value: "name", label: "A to Z" },
];

type FilterRailProps = {
  facets: ListingFacets;
  query: ProductQuery;
  pathname?: string;
  showBrands?: boolean;
};

export function FilterRail({
  facets,
  query,
  pathname = "/products",
  showBrands = true,
}: FilterRailProps) {
  const href = (change: Partial<ProductQuery>) => hrefWith(query, change, { pathname });
  const groups = ["category", "skin-type", "brand", "shade", "size", "price", "availability"];

  return (
    <div className="flex flex-col gap-6">
      {/* Every group starts open, so the rail is complete without JavaScript. */}
      <Accordion type="multiple" defaultValue={groups}>
        <FilterGroup value="category" title="Category">
          <ul className="flex flex-col gap-2">
            <li>
              <TextFilter href={href({ category: undefined })} active={!query.category}>
                Everything
              </TextFilter>
            </li>
            {facets.categories.map((category) => (
              <li key={category.slug} className="flex flex-col gap-2">
                <TextFilter
                  href={href({ category: category.slug })}
                  active={query.category === category.slug}
                >
                  {category.name}
                </TextFilter>
                {category.children.length > 0 && (
                  <ul className="flex flex-col gap-2 border-l pl-3">
                    {category.children.map((child) => (
                      <li key={child.slug}>
                        <TextFilter
                          href={href({ category: child.slug })}
                          active={query.category === child.slug}
                        >
                          {child.name}
                        </TextFilter>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </FilterGroup>

        {facets.skinTypes.length > 0 && (
          <FilterGroup value="skin-type" title="Skin type">
            <ul className="flex flex-wrap gap-2">
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
            </ul>
          </FilterGroup>
        )}

        {showBrands && facets.brands.length > 0 && (
          <FilterGroup value="brand" title="Brand">
            <ul className="flex flex-wrap gap-2">
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
            </ul>
          </FilterGroup>
        )}

        {facets.shades.length > 0 && (
          <FilterGroup value="shade" title="Shade">
            <ul className="flex flex-wrap gap-2">
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
            </ul>
          </FilterGroup>
        )}

        {facets.sizes.length > 0 && (
          <FilterGroup value="size" title="Size">
            <ul className="flex flex-wrap gap-2">
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
            </ul>
          </FilterGroup>
        )}

        <FilterGroup value="price" title="Price">
          <ul className="flex flex-col gap-2">
            {PRICE_BANDS.map((band) => {
              const active = query.minPrice === band.minPrice && query.maxPrice === band.maxPrice;
              return (
                <li key={band.label}>
                  <TextFilter
                    href={href({
                      minPrice: active ? undefined : band.minPrice,
                      maxPrice: active ? undefined : band.maxPrice,
                    })}
                    active={active}
                  >
                    {band.label}
                  </TextFilter>
                </li>
              );
            })}
          </ul>
        </FilterGroup>

        <FilterGroup value="availability" title="Availability">
          <TextFilter
            href={href({ inStock: query.inStock ? undefined : true })}
            active={Boolean(query.inStock)}
          >
            In stock only
          </TextFilter>
        </FilterGroup>
      </Accordion>

      <SortForm query={query} pathname={pathname} />
    </div>
  );
}

function FilterGroup({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}

function TextFilter({
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
      className={cn(
        "text-sm transition-colors",
        active ? "font-medium underline underline-offset-4" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
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

/** A GET form so sorting works before JavaScript loads; it carries the other filters along. */
function SortForm({ query, pathname }: { query: ProductQuery; pathname: string }) {
  return (
    <form method="get" action={pathname} className="flex flex-col gap-2">
      {query.category && <input type="hidden" name="category" value={query.category} />}
      {query.brand?.map((brand) => (
        <input key={brand} type="hidden" name="brand" value={brand} />
      ))}
      {query.size && <input type="hidden" name="size" value={query.size} />}
      {query.shade && <input type="hidden" name="shade" value={query.shade} />}
      {query.skinType?.map((skinType) => (
        <input key={skinType} type="hidden" name="skin_type" value={skinType} />
      ))}
      {query.minPrice && <input type="hidden" name="min_price" value={query.minPrice} />}
      {query.maxPrice && <input type="hidden" name="max_price" value={query.maxPrice} />}
      {query.inStock && <input type="hidden" name="in_stock" value="true" />}
      {query.search && <input type="hidden" name="search" value={query.search} />}

      <Label htmlFor="ordering">Sort</Label>
      <div className="flex gap-2">
        <NativeSelect id="ordering" name="ordering" defaultValue={query.ordering ?? ""} className="flex-1">
          {SORTS.map((sort) => (
            <NativeSelectOption key={sort.label} value={sort.value}>
              {sort.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </div>
    </form>
  );
}
