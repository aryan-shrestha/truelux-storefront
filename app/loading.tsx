import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="max-w-page mx-auto w-full px-4 py-12 md:px-8 md:py-16">
      <span className="sr-only" role="status">
        Loading
      </span>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-6 h-4 w-full max-w-lg" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((block) => (
          <Skeleton key={block} className="aspect-4/5 w-full rounded-none" />
        ))}
      </div>
    </section>
  );
}
