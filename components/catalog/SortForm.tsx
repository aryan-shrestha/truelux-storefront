import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { ProductOrdering, ProductQuery } from "@/lib/api/types";

const SORTS: ReadonlyArray<{ value: ProductOrdering | ""; label: string }> = [
  { value: "", label: "Featured" },
  { value: "-created_at", label: "Newest" },
  { value: "base_price", label: "Price, low to high" },
  { value: "-base_price", label: "Price, high to low" },
  { value: "name", label: "A to Z" },
];

/** A GET form so sorting works without client code; it carries the other filters along. */
export function SortForm({ query, pathname }: { query: ProductQuery; pathname: string }) {
  return (
    <form method="get" action={pathname} className="flex items-center gap-2">
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
      {query.onSale && <input type="hidden" name="on_sale" value="true" />}
      {query.search && <input type="hidden" name="search" value={query.search} />}

      <Label htmlFor="ordering" className="text-sm font-semibold">
        Sort
      </Label>
      <NativeSelect id="ordering" name="ordering" defaultValue={query.ordering ?? ""}>
        {SORTS.map((sort) => (
          <NativeSelectOption key={sort.label} value={sort.value}>
            {sort.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  );
}
