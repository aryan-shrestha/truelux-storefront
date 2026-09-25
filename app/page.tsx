import type { Metadata } from "next";

import { BrandStrip } from "@/components/home/BrandStrip";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { Hero } from "@/components/home/Hero";
import { NewArrivals } from "@/components/home/NewArrivals";
import { Promises } from "@/components/home/Promises";
import { Ritual } from "@/components/home/Ritual";
import { latestProducts } from "@/lib/catalog/latest";
import { navigationBrands, navigationCategories } from "@/lib/catalog/navigation";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  // The category read is the header's, deduplicated within the render.
  const [products, categories, brands] = await Promise.all([
    latestProducts(),
    navigationCategories(),
    navigationBrands(),
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-20 px-4 py-10 md:gap-28 md:px-8 md:py-16">
      <Hero />
      <Promises />
      <CategoryShowcase categories={categories} />
      <NewArrivals products={products} />
      <BrandStrip brands={brands} />
      <Ritual />
    </div>
  );
}
