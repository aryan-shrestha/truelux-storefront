import Image from "next/image";
import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Brand } from "@/lib/api/types";

export function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Card className="relative h-full transition-colors hover:bg-muted">
      <div className="mx-4 flex aspect-3/2 items-center justify-center rounded-lg bg-muted">
        {brand.logoUrl === null ? (
          <span aria-hidden className="font-heading text-3xl">
            {brand.name}
          </span>
        ) : (
          <div className="relative h-2/5 w-3/5">
            <Image src={brand.logoUrl} alt="" fill sizes="200px" className="object-contain" />
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle>
          <Link href={`/brands/${brand.slug}`} className="after:absolute after:inset-0">
            {brand.name}
          </Link>
        </CardTitle>
        <CardDescription>
          {brand.productCount === 1 ? "1 product" : `${brand.productCount} products`}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
