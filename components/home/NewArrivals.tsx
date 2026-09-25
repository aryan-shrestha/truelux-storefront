import Link from "next/link";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ProductSummary } from "@/lib/api/types";

export function NewArrivals({ products }: { products: ProductSummary[] }) {
  return (
    <section aria-labelledby="new-arrivals-heading" className="flex flex-col gap-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="new-arrivals-heading" className="text-title">
          New arrivals
        </h2>
        {products.length > 0 && (
          <Button asChild variant="link">
            <Link href="/products?ordering=-created_at">Shop all new</Link>
          </Button>
        )}
      </div>
      {products.length === 0 ? (
        // An empty catalogue and an unreachable one read the same here.
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>The shelves are being stocked</EmptyTitle>
            <EmptyDescription>New products appear here as soon as they are published.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ProductGrid products={products} />
      )}
    </section>
  );
}
