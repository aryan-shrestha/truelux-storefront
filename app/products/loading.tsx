import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <span className="sr-only" role="status">
        Loading products
      </span>
      <div className="bg-muted">
        <div className="max-w-page mx-auto flex gap-6 px-4 py-10 md:px-10">
          {[16, 20, 24, 16, 20].map((width, index) => (
            <Skeleton key={index} className="h-4" style={{ width: `${width * 0.25}rem` }} />
          ))}
        </div>
      </div>
      <div className="max-w-page mx-auto px-4 pt-14 md:px-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <Skeleton className="hidden h-96 lg:block" />
        <div>
          <Skeleton className="mb-8 h-11 w-full" />
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
