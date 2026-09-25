import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProductListing } from "@/components/catalog/ProductListing";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getBrand } from "@/lib/api/catalog";
import { hasCode } from "@/lib/api/errors";
import type { Brand } from "@/lib/api/types";
import { listingFacets } from "@/lib/catalog/navigation";
import {
  toCanonicalSearch,
  toProductQuery,
  toRequestedSearch,
  type RawSearchParams,
} from "@/lib/catalog/query";
// An unknown and an inactive brand return the same 404.
async function load(slug: string): Promise<Brand> {
  try {
    return await getBrand({ slug });
  } catch (error) {
    if (hasCode(error, "not_found")) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/brands/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  try {
    const brand = await getBrand({ slug });
    const description = brand.description.slice(0, 160) || `Shop ${brand.name}.`;
    return {
      title: brand.name,
      description,
      alternates: { canonical: `/brands/${brand.slug}` },
      openGraph: {
        title: brand.name,
        description,
        images: brand.logoUrl === null ? undefined : [{ url: brand.logoUrl }],
      },
    };
  } catch {
    // The page renders the 404 or the error boundary; metadata must not throw.
    return {};
  }
}

export default async function BrandPage({ params, searchParams }: PageProps<"/brands/[slug]">) {
  const { slug } = await params;
  const raw: RawSearchParams = await searchParams;
  const pathname = `/brands/${encodeURIComponent(slug)}`;

  // The brand is the path, so a ?brand= here is dropped from the canonical URL.
  const query = { ...toProductQuery(raw), brand: undefined };
  const canonical = toCanonicalSearch(query);
  if (toRequestedSearch(raw) !== canonical) {
    redirect(canonical === "" ? pathname : `${pathname}?${canonical}`);
  }

  const [brand, facets] = await Promise.all([load(slug), listingFacets()]);

  return (
    <ProductListing
      heading={<BrandHeader brand={brand} />}
      query={query}
      facets={facets}
      pathname={pathname}
      lockedBrand={brand.slug}
    />
  );
}

function BrandHeader({ brand }: { brand: Brand }) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/brands">Brands</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{brand.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {brand.logoUrl !== null && (
          <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
            <Image src={brand.logoUrl} alt="" fill sizes="96px" className="object-contain p-3" />
          </div>
        )}
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="text-title">{brand.name}</h1>
          {brand.description && <p className="text-muted-foreground">{brand.description}</p>}
        </div>
      </div>
    </div>
  );
}
