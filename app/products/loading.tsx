import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <span className="sr-only" role="status">
        Loading products
      </span>
      <div className="mb-10 flex items-baseline justify-between gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex flex-col gap-10 md:flex-row md:gap-12">
        <div className="hidden flex-col gap-8 md:flex md:w-60 md:shrink-0">
          {[5, 4, 3].map((rows, group) => (
            <div key={group} className="flex flex-col gap-3">
              <Skeleton className="h-4 w-20" />
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
