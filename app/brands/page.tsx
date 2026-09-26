import type { Metadata } from "next";

import { BrandCard } from "@/components/brands/BrandCard";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { navigationBrands } from "@/lib/catalog/navigation";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Brands",
  description: `Every brand ${env.brandName} stocks.`,
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const brands = await navigationBrands();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="text-title mb-10">Brands</h1>
      {brands.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No brands to show yet</EmptyTitle>
            <EmptyDescription>
              Brands appear here once they have products in the shop.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <li key={brand.slug}>
              <BrandCard brand={brand} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
