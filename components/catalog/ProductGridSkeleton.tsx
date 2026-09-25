import { Skeleton } from "@/components/ui/Skeleton";

/** The listing grid's shape: the same columns, tile ratio and caption lines. */
export function ProductGridSkeleton() {
  return (
    <ul
      aria-hidden
      className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-[365/375] w-full" />
          <Skeleton className="h-3 w-16" />
          <div className="flex justify-between gap-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-14" />
          </div>
        </li>
      ))}
    </ul>
  );
}
