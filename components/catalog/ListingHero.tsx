import Image from "next/image";
import type { ReactNode } from "react";

type ListingHeroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
};

export function ListingHero({ eyebrow, title, description }: ListingHeroProps) {
  return (
    <div className="relative text-on-image">
      <Image src="/art/listing.svg" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-linear-to-r from-scrim to-transparent" />
      <div className="relative mx-auto flex min-h-64 max-w-page flex-col justify-center gap-4 px-4 py-14 md:min-h-[26rem] md:px-15">
        {eyebrow}
        <h1 className="text-display">{title}</h1>
        {description && <p className="max-w-md text-lg leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}
