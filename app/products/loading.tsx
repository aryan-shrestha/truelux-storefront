import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <span className="sr-only" role="status">
        Loading products
      </span>
      <Skeleton className="h-64 w-full rounded-none md:h-[26rem]" />
      <div className="bg-muted">
        <div className="max-w-page mx-auto flex gap-6 px-4 py-10 md:px-10">
          {[16, 20, 24, 16, 20].map((width, index) => (
            <Skeleton key={index} className="h-4" style={{ width: `${width * 0.25}rem` }} />
          ))}
        </div>
      </div>
      <div className="max-w-page mx-auto px-4 pt-14 md:px-8">
        <Skeleton className="mb-12 h-12 w-full" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
