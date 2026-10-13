import type { Category, ProductQuery } from "@/lib/api/types";
import { findCategory } from "@/lib/catalog/navigation";
import { isSaleOnly } from "@/lib/catalog/query";

// Visually hidden by request; the page still needs its h1 for screen readers and search.
export function ShopTitle({ query, categories }: { query: ProductQuery; categories: Category[] }) {
  const trail = findCategory(categories, query.category);
  const category = trail?.child ?? trail?.root;
  const title = query.search
    ? `Results for “${query.search}”`
    : isSaleOnly(query)
      ? "Sale"
      : (category?.name ?? "Shop");

  return <h1 className="sr-only">{title}</h1>;
}
