import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <span className="sr-only" role="status">
        Loading brands
      </span>
      <Skeleton className="mb-10 h-10 w-40" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="aspect-4/3 w-full rounded-xl" />
        ))}
      </div>
    </section>
  );
}
