import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid md:grid-cols-[69fr_31fr]">
      <span className="sr-only" role="status">
        Loading product
      </span>
      <Skeleton className="aspect-9/10 w-full rounded-none" />
      <div className="flex flex-col gap-6 px-4 pt-10 md:px-11 md:pt-28">
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
