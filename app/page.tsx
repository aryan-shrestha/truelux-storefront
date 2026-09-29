import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductRail } from "@/components/catalog/ProductRail";
import { About } from "@/components/home/About";
import { BrandGrid } from "@/components/home/BrandGrid";
import { CategoryRail } from "@/components/home/CategoryRail";
import { Editorial } from "@/components/home/Editorial";
import { Hero } from "@/components/home/Hero";
import { ImageBand } from "@/components/home/ImageBand";
import { Journal } from "@/components/home/Journal";
import { SALE_LINK } from "@/components/layout/site-links";
import { categoryHref, navigationBrands, navigationCategories } from "@/lib/catalog/navigation";
import { latestProducts, saleProducts } from "@/lib/catalog/rails";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  // The category read is the header's, deduplicated within the render.
  const [latest, onSale, categories, brands] = await Promise.all([
    latestProducts(),
    saleProducts(),
    navigationCategories(),
    navigationBrands(),
  ]);
  const [featured] = categories;

  return (
    <div className="flex flex-col gap-24 md:gap-36">
      <Hero />
      <Editorial href={featured === undefined ? "/products" : categoryHref(featured.slug)} />
      <ProductRail
        id="new-arrivals"
        eyebrow="Just in"
        title="New arrivals"
        description="The newest products from every brand we stock."
        products={latest}
        more={{ href: "/products?ordering=-created_at", label: "All new arrivals" }}
      />
      <ImageBand />
      {featured !== undefined && (
        <Suspense>
          <CategoryRail category={featured} />
        </Suspense>
      )}
      <ProductRail
        id="on-sale"
        eyebrow="Reduced"
        title="On sale"
        description="Lower prices, for now, from every brand we stock."
        products={onSale}
        more={{ href: SALE_LINK.href, label: "Everything on sale" }}
      />
      <div className="flex flex-col">
        <About />
        <BrandGrid brands={brands} />
      </div>
      <Journal />
    </div>
  );
}
