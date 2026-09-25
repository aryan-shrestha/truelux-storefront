import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton() {
  return (
    <ul
      aria-hidden
      className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-4/5 w-full rounded-xl" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-14" />
        </li>
      ))}
    </ul>
  );
}
