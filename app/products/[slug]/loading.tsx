import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col md:landscape:flex-row">
      <span className="sr-only" role="status">
        Loading product
      </span>
      <div className="flex gap-2 md:landscape:h-[calc(100svh-5rem)] md:landscape:max-w-[62%] md:landscape:gap-3">
        <div className="flex w-16 shrink-0 flex-col gap-2 pl-2 md:w-21 md:pl-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="aspect-9/10 w-full rounded-none" />
          ))}
        </div>
        <Skeleton className="aspect-9/10 min-w-0 flex-1 rounded-none md:landscape:h-full md:landscape:flex-initial" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-6 px-4 pt-10 md:px-8 md:landscape:px-11 md:landscape:py-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-28" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-16" />
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-none" />
      </div>
    </div>
  );
}
