import { Skeleton } from "@/components/ui/skeleton";

export function CartLinesSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-6">
      <span className="sr-only" role="status">
        Loading your bag
      </span>
      {[0, 1].map((line) => (
        <div key={line} className="flex gap-4">
          <Skeleton className="aspect-4/5 w-20 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="mt-2 h-11 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}
