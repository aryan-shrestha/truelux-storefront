import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Gallery } from "@/components/catalog/Gallery";
import { VariantPicker } from "@/components/catalog/VariantPicker";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getProduct, listProducts } from "@/lib/api/catalog";
import { hasCode } from "@/lib/api/errors";
import type { Product } from "@/lib/api/types";

// Returns nothing rather than failing the build when the API is down; pages then render on demand.
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const page = await listProducts({ limit: 100 });
    return page.results.map((product) => ({ slug: product.slug }));
  } catch {
    return [];
  }
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
  const product = await load(slug);

  return (
    <article className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/products">Shop</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/products?category=${product.category.slug}`}>
                {product.category.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-10 md:flex-row md:gap-12 lg:gap-16">
        <div className="md:w-3/5">
          <Gallery images={product.images} name={product.name} />
        </div>

        <div className="md:flex-1">
          <div className="flex flex-col gap-8 md:sticky md:top-[calc(var(--header-offset)+1.5rem)]">
            <header className="flex flex-col gap-2">
              <Link
                href={`/brands/${product.brand.slug}`}
                className="w-fit text-sm tracking-wide text-muted-foreground hover:text-foreground"
              >
                {product.brand.name}
              </Link>
              <h1 className="text-title">{product.name}</h1>
            </header>

            <VariantPicker product={product} />

            {product.description && (
              <p className="max-w-prose leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
