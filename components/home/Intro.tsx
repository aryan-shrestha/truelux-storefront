import Link from "next/link";

import type { Category } from "@/lib/api/types";

/** The root categories and a search box, above the hero. */
export function Intro({ categories }: { categories: Category[] }) {
  return (
    <div className="pt-4 md:pt-[30px]">
      {categories.length > 0 && (
        <nav aria-label="Categories">
          {/* A parent links to its own slug only; the API's category filter
              does not descend into children (site-shell.md). */}
          <ul className="animate-fade text-[1.0625rem] leading-6 tracking-[0.08em] uppercase">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/products?category=${category.slug}`}
                  className="hover:text-slate transition-colors"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* A plain GET form: the listing already reads ?search=, so this works
          without JavaScript and adds no cache key of its own. */}
      <form
        action="/products"
        role="search"
        className="animate-fade relative mt-[22px] max-w-[367px]"
        style={{ animationDelay: "80ms" }}
      >
        <label htmlFor="home-search" className="sr-only">
          Search the shop
        </label>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="9" cy="9" r="6.8" />
          <path d="m14 14 2.5 2.5" />
        </svg>
        <input
          id="home-search"
          name="search"
          type="search"
          enterKeyHint="search"
          placeholder="Search"
          className="bg-wash placeholder:text-ink/65 focus:bg-wash/70 h-[50px] w-full rounded-[2px] pr-[28px] pl-12 text-[0.9375rem] tracking-[0.08em] transition-colors placeholder:text-right"
        />
      </form>
    </div>
  );
}
