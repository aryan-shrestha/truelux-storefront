import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton() {
  return (
    <ul
      aria-hidden
      className="grid grid-cols-2 gap-x-2 gap-y-12 md:grid-cols-3 md:gap-x-0.5 md:gap-y-16 lg:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index} className="flex flex-col items-center gap-3">
          <Skeleton className="aspect-4/5 w-full rounded-none" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-4 w-14" />
        </li>
      ))}
    </ul>
  );
}
