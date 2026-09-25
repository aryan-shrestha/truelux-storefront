import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <span className="sr-only" role="status">
        Loading product
      </span>
      <Skeleton className="mb-8 h-4 w-48" />
      <div className="flex flex-col gap-10 md:flex-row md:gap-12 lg:gap-16">
        <Skeleton className="aspect-4/5 w-full rounded-2xl md:w-3/5" />
        <div className="flex flex-col gap-6 md:flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-28" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="size-11 rounded-full" />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-11 w-16" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
