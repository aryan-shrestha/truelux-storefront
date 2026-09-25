import type { Metadata } from "next";

import { Approach } from "@/components/home/Approach";
import { Collections } from "@/components/home/Collections";
import { Hero } from "@/components/home/Hero";
import { Intro } from "@/components/home/Intro";
import { NewThisWeek } from "@/components/home/NewThisWeek";
import { latestProducts } from "@/lib/catalog/latest";
import { navigationCategories } from "@/lib/catalog/navigation";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  description: `${env.brandName}. Everyday streetwear, made and shipped from Kathmandu.`,
};

const RAIL_COUNT = 6;
const GRID_COUNT = 3;

export default async function Home() {
  // The same category fetch as the header's, so it is deduplicated within the
  // render and costs no upstream request.
  const [products, categories] = await Promise.all([latestProducts(), navigationCategories()]);

  return (
    // Clips the design's deliberate overflow — the rail and the last plate run
    // off the right edge — without a horizontal page scroll.
    <div className="overflow-x-clip">
      <div className="mx-auto max-w-[1600px] px-4 md:px-[50px]">
        {/* From lg, the intro and hero together fill the viewport under the
            90px header, the hero pinned to the bottom. The floor keeps a short
            laptop from crushing it. */}
        <div className="lg:[container-type:inline-size] lg:flex lg:h-[calc(100svh-90px)] lg:min-h-[34rem] lg:flex-col lg:justify-between lg:pb-[clamp(1.5rem,5svh,3rem)]">
          <Intro categories={categories} />
          <Hero />
        </div>

        {products.length === 0 ? (
          // An empty catalogue and an unreachable one read the same here: a new
          // deployment lands on this until the merchant publishes something.
          <section className="border-line mt-24 flex flex-col gap-4 border-t py-16 md:mt-[148px]">
            <h2 className="text-heading font-display font-semibold">The shop is not open yet</h2>
            <p className="prose-body text-slate">
              There is nothing to buy here at the moment. Come back shortly.
            </p>
          </section>
        ) : (
          <>
            <NewThisWeek products={products.slice(0, RAIL_COUNT)} />
            {/* The oldest three of the nine, so a full catalogue shows nothing
                twice; a small one repeats rather than leaving a gap. */}
            <Collections products={products.slice(-GRID_COUNT)} categories={categories} />
          </>
        )}

        <Approach />
      </div>
    </div>
  );
}
