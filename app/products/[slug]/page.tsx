import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Gallery } from "@/components/catalog/Gallery";
import { VariantPicker } from "@/components/catalog/VariantPicker";
import { getProduct, listProducts } from "@/lib/api/catalog";
import { hasCode } from "@/lib/api/errors";
import type { Product } from "@/lib/api/types";

/**
 * Prerender the catalogue's product pages at build time.
 *
 * These are the pages search engines index and the pages a slow phone loads
 * first, so they are worth having as HTML rather than rendered on demand. A
 * product published after the build still works: `dynamicParams` defaults to
 * true, so an unknown slug renders once and is cached from then on.
 *
 * It returns nothing rather than throwing if the API is unreachable. A build
 * should not fail because the backend was restarting; every page simply renders
 * on demand instead.
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const page = await listProducts({ limit: 100 });
    return page.results.map((product) => ({ slug: product.slug }));
  } catch {
    return [];
  }
}

/**
 * An unknown slug and an unpublished one return the same 404 from the API, and
 * this page must not distinguish them either — doing so would confirm that a
 * hidden product exists.
 */
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
    // The page itself produces the 404 or the error boundary. Metadata must not
    // be the thing that throws.
    return {};
  }

  const description = product.description.slice(0, 160);

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.primaryImage === null ? undefined : [{ url: product.primaryImage.url }],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await load(slug);

  return (
    <article className="mx-auto max-w-[1600px] px-4 py-6 sm:px-8 md:px-[50px] lg:py-6">
      <div className="flex flex-col gap-10 md:flex-row md:gap-12 lg:gap-16">
        {/* From lg the gallery is exactly the viewport under the header (90px)
            and a 1.5rem margin each side, and as wide as a 4:5 photograph of
            that height plus the thumbnail column — never more than 60%, so the
            details keep room on a landscape tablet. */}
        <div className="md:w-3/5 lg:sticky lg:top-[calc(var(--header-offset)+1.5rem)] lg:h-[calc(100svh-90px-3rem)] lg:w-[min(60%,calc((100svh-90px-3rem)*0.8+88px))] lg:shrink-0 lg:transition-[top] lg:duration-450 lg:ease-(--ease-settle)">
          <Gallery images={product.images} name={product.name} />
        </div>

        <div className="md:flex-1">
          <div className="flex flex-col gap-8 transition-[top] duration-450 ease-(--ease-settle) md:sticky md:top-[calc(var(--header-offset)+1.5rem)] lg:pt-6">
            <header className="flex flex-col gap-2">
              <p className="text-detail text-slate">{product.category.name}</p>
              <h1 className="text-title font-display font-semibold">{product.name}</h1>
            </header>

            <VariantPicker product={product} />

            {product.description && <p className="prose-body">{product.description}</p>}
          </div>
        </div>
      </div>
    </article>
  );
}
