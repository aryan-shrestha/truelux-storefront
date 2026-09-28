import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Gallery } from "@/components/catalog/Gallery";
import { VariantPicker } from "@/components/catalog/VariantPicker";
import { ProductBreadcrumb } from "@/components/catalog/ProductBreadcrumb";
import { ProductCare } from "@/components/catalog/ProductCare";
import { ProductDetails } from "@/components/catalog/ProductDetails";
import { RelatedProducts } from "@/components/catalog/RelatedProducts";
import { SkinRoutine } from "@/components/catalog/SkinRoutine";
import { getProduct } from "@/lib/api/catalog";
import { hasCode } from "@/lib/api/errors";
import type { Product } from "@/lib/api/types";
import { navigationCategories } from "@/lib/catalog/navigation";

// Empty so every product renders on first request and is then cached (ISR). Prerendering them
// all at build bursts the API from one address, which its host answers with 429s that fail the build.
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return [];
}

// An unknown and an unpublished product return the same 404; the page must not tell them apart.
async function load(slug: string): Promise<Product> {
  try {
    return await getProduct({ slug });
  } catch (error) {
    if (hasCode(error, "not_found")) notFound();
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  let product: Product;
  try {
    product = await getProduct({ slug });
  } catch {
    // The page renders the 404 or the error boundary; metadata must not throw.
    return {};
  }

  const title = `${product.name} by ${product.brand.name}`;
  const description = product.description.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      images: product.primaryImage === null ? undefined : [{ url: product.primaryImage.url }],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  // The category read is the header's, deduplicated within the render.
  const [product, categories] = await Promise.all([load(slug), navigationCategories()]);

  return (
    <div className="flex flex-col gap-8">
      <article className="flex flex-col md:landscape:flex-row">
        <Gallery images={product.images} name={product.name} />

        <div className="md:landscape:py-fit-8 flex px-4 pt-10 md:px-8 md:landscape:min-w-0 md:landscape:flex-1 xl:landscape:px-11 xl:landscape:pr-18">
          <div className="gap-fit-7 my-auto flex w-full max-w-xl flex-col">
            <header className="gap-fit-4 flex flex-col">
              <ProductBreadcrumb categories={categories} category={product.category} />
              <h1 className="text-heading">{product.name}</h1>
              <Link
                href={`/brands/${product.brand.slug}`}
                className="text-muted-foreground hover:text-foreground w-fit text-sm hover:underline"
              >
                {product.brand.name}
              </Link>
            </header>

            {product.description && (
              <p className="text-sm leading-relaxed">{product.description}</p>
            )}

            <VariantPicker product={product} />

            <ProductDetails product={product} />
          </div>
        </div>
      </article>

      <SkinRoutine />

      <Suspense>
        <RelatedProducts product={product} />
      </Suspense>
    </div>
  );
}
