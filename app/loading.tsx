import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8 md:px-[50px]">
      <span className="sr-only" role="status">
        Loading
      </span>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-6 h-4 w-full max-w-lg" />
      <Skeleton className="mt-3 h-4 w-full max-w-md" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((block) => (
          <Skeleton key={block} className="aspect-[365/375] w-full" />
        ))}
      </div>
    </section>
  );
}
