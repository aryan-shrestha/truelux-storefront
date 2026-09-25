import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * The listing's shape on arrival from another page. Moving between filters on
 * the listing itself shows only the grid's skeleton, from the page's own
 * Suspense boundary, and keeps the rail in place.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8 md:px-[50px]">
      <span className="sr-only" role="status">
        Loading products
      </span>

      <div className="mb-10 flex items-baseline justify-between gap-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>

      <div className="flex flex-col gap-10 md:flex-row md:gap-12">
        <div className="md:border-line hidden flex-col gap-8 md:flex md:w-60 md:shrink-0 md:border-r md:pr-6">
          {[5, 3, 1].map((rows, group) => (
            <div key={group} className="flex flex-col gap-3">
              <Skeleton className="h-3 w-16" />
              {Array.from({ length: rows }, (_, row) => (
                <Skeleton key={row} className="h-4 w-28" />
              ))}
            </div>
          ))}
        </div>

        <div className="flex-1">
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
