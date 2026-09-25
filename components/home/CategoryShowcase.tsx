import Image from "next/image";
import Link from "next/link";

import type { Category } from "@/lib/api/types";

const ART = [
  "/home/still-life-serum.svg",
  "/home/still-life-palette.svg",
  "/home/still-life-perfume.svg",
];

export function CategoryShowcase({ categories }: { categories: Category[] }) {
  const tiles = ART.flatMap((art, index) => {
    const category = categories[index];
    return category === undefined ? [] : [{ art, category }];
  });
  if (tiles.length === 0) return null;

  return (
    <section aria-labelledby="categories-heading" className="flex flex-col gap-8">
      <h2 id="categories-heading" className="text-title">
        Shop by category
      </h2>
      <ul className="grid gap-4 sm:grid-cols-3">
        {tiles.map(({ art, category }) => (
          <li key={category.slug}>
            <Link href={`/products?category=${category.slug}`} className="group flex flex-col gap-3">
              <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={art}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-(--ease-settle) group-hover:scale-[1.03]"
                />
              </div>
              <span className="font-heading text-2xl">{category.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
