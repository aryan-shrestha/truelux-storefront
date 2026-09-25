import { Skeleton } from "@/components/ui/Skeleton";

/** The product page's shape: the gallery at viewport height, then the details. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-8 md:px-[50px]">
      <span className="sr-only" role="status">
        Loading product
      </span>

      <div className="flex flex-col gap-10 md:flex-row md:gap-12 lg:gap-16">
        <div className="flex flex-col gap-3 md:w-3/5 lg:h-[calc(100svh-90px-3rem)] lg:w-[min(60%,calc((100svh-90px-3rem)*0.8+88px))] lg:shrink-0 lg:flex-row">
          <div className="order-2 flex gap-2 lg:order-none lg:w-[76px] lg:flex-col">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="aspect-[4/5] w-16 lg:w-full" />
            ))}
          </div>
          <Skeleton className="aspect-[4/5] w-full lg:aspect-auto lg:h-full lg:flex-1" />
        </div>

        <div className="flex flex-col gap-8 md:flex-1 lg:pt-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-3/4" />
          </div>
          <Skeleton className="h-7 w-28" />
          {[4, 2].map((chips, group) => (
            <div key={group} className="flex flex-col gap-3">
              <Skeleton className="h-3 w-12" />
              <div className="flex gap-2">
                {Array.from({ length: chips }, (_, index) => (
                  <Skeleton key={index} className="h-11 w-14" />
                ))}
              </div>
            </div>
          ))}
          <Skeleton className="h-11 w-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
