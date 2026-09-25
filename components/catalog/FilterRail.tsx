import Link from "next/link";

import { hrefWith } from "@/lib/catalog/query";
import type { Category, ProductOrdering, ProductQuery } from "@/lib/api/types";

/**
 * Filters are links, so they work by keyboard, by middle-click, with the back
 * button and with JavaScript still loading. Selecting one is a navigation, and
 * the URL is the only place the state lives (ADR 0004).
 *
 * **It offers no size or colour picker, and cannot.** `catalog-browsing.md`
 * planned to derive both from the current result set, but the list payload
 * carries no variants — `ProductListSerializer` publishes `in_stock` as a
 * boolean and nothing else about them — and the API has no endpoint listing
 * sizes or colours. `?size=` and `?color=` remain valid and are honoured when
 * present; they simply cannot be surfaced as controls without an API change.
 */

/**
 * Fixed bands rather than two number inputs. A free numeric range would let a
 * visitor mint a cache key per value they type, which is the hole the
 * normaliser exists to close.
 */
const PRICE_BANDS = [
  { label: "Under Rs 3,000", minPrice: undefined, maxPrice: "3000" },
  { label: "Rs 3,000 to 6,000", minPrice: "3000", maxPrice: "6000" },
  { label: "Over Rs 6,000", minPrice: "6000", maxPrice: undefined },
] as const;

const SORTS: ReadonlyArray<{ value: ProductOrdering | ""; label: string }> = [
  { value: "", label: "Featured" },
  { value: "-created_at", label: "Newest" },
  { value: "base_price", label: "Price, low to high" },
  { value: "-base_price", label: "Price, high to low" },
  { value: "name", label: "A to Z" },
];

type FilterRailProps = {
  categories: Category[];
  query: ProductQuery;
};

export function FilterRail({ categories, query }: FilterRailProps) {
  return (
    <div className="flex flex-col gap-8">
      <Group title="Category">
        <FilterLink href={hrefWith(query, { category: undefined })} active={!query.category}>
          Everything
        </FilterLink>
        {categories.map((category) =>
          category.children.length === 0 ? (
            <FilterLink
              key={category.slug}
              href={hrefWith(query, { category: category.slug })}
              active={query.category === category.slug}
            >
              {category.name}
            </FilterLink>
          ) : (
            <CategoryGroup key={category.slug} category={category} query={query} />
          ),
        )}
      </Group>

      <Group title="Price">
        {PRICE_BANDS.map((band) => {
          const active = query.minPrice === band.minPrice && query.maxPrice === band.maxPrice;
          return (
            <FilterLink
              key={band.label}
              href={hrefWith(query, {
                minPrice: active ? undefined : band.minPrice,
                maxPrice: active ? undefined : band.maxPrice,
              })}
              active={active}
            >
              {band.label}
            </FilterLink>
          );
        })}
      </Group>

      <Group title="Availability">
        <FilterLink
          href={hrefWith(query, { inStock: query.inStock ? undefined : true })}
          active={Boolean(query.inStock)}
        >
          In stock only
        </FilterLink>
      </Group>

      <SortForm query={query} />
    </div>
  );
}

/**
 * A parent with children collapses, as a native `<details>`: it opens and
 * closes by keyboard and without JavaScript, and announces its state.
 *
 * The parent's own filter moves inside as "All {name}", because the summary is
 * the toggle and a link inside it would be a control within a control. The
 * label says what it does: the API's filter matches the parent exactly and does
 * not include its children (site-shell.md).
 *
 * It starts open when the applied category is the parent or one of its
 * children, so the current filter is never hidden.
 */
function CategoryGroup({ category, query }: { category: Category; query: ProductQuery }) {
  const containsActive =
    query.category === category.slug ||
    category.children.some((child) => child.slug === query.category);

  return (
    <details open={containsActive} className="group">
      <summary
        className={[
          "text-ui flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden",
          containsActive ? "text-ink font-medium" : "text-slate hover:text-ink",
        ].join(" ")}
      >
        {category.name}
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className="size-3 shrink-0 transition-transform duration-300 ease-(--ease-settle) group-open:rotate-45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M1 6h10M6 1v10" />
        </svg>
      </summary>
      <div className="border-line mt-1 mb-2 ml-1 flex flex-col gap-1.5 border-l pl-3">
        <FilterLink
          href={hrefWith(query, { category: category.slug })}
          active={query.category === category.slug}
        >
          All {category.name.toLowerCase()}
        </FilterLink>
        {category.children.map((child) => (
          <FilterLink
            key={child.slug}
            href={hrefWith(query, { category: child.slug })}
            active={query.category === child.slug}
          >
            {child.name}
          </FilterLink>
        ))}
      </div>
    </details>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-detail text-slate">{title}</h2>
      {children}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      // Marked, not merely styled: a screen reader needs to know which is applied.
      aria-current={active ? "true" : undefined}
      className={[
        "text-ui w-fit transition-colors",
        active
          ? "decoration-indigo font-medium underline underline-offset-4"
          : "text-slate hover:text-ink",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

/**
 * A real form with method="get", so sorting works before JavaScript loads. The
 * other filters ride along as hidden inputs, because a GET form replaces the
 * whole query string.
 */
function SortForm({ query }: { query: ProductQuery }) {
  return (
    <form method="get" action="/products" className="flex flex-col gap-2">
      {query.category && <input type="hidden" name="category" value={query.category} />}
      {query.size && <input type="hidden" name="size" value={query.size} />}
      {query.color && <input type="hidden" name="color" value={query.color} />}
      {query.minPrice && <input type="hidden" name="min_price" value={query.minPrice} />}
      {query.maxPrice && <input type="hidden" name="max_price" value={query.maxPrice} />}
      {query.inStock && <input type="hidden" name="in_stock" value="true" />}
      {query.search && <input type="hidden" name="search" value={query.search} />}

      <label htmlFor="ordering" className="text-detail text-slate">
        Sort
      </label>
      <select
        id="ordering"
        name="ordering"
        defaultValue={query.ordering ?? ""}
        className="border-wash text-ui bg-paper min-h-11 rounded-[2px] border px-2"
      >
        {SORTS.map((sort) => (
          <option key={sort.label} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>
      {/* Always visible rather than hidden behind an auto-submitting select:
          the select has no handler, so this is what makes sorting work at all,
          with or without JavaScript. */}
      <button type="submit" className="text-detail w-fit underline underline-offset-4">
        Apply
      </button>
    </form>
  );
}
