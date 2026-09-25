import { ApproachPlates } from "@/components/home/ApproachPlates";
import { RevealLines } from "@/components/home/RevealLines";
import { env } from "@/lib/env";

export function Approach() {
  return (
    <section aria-labelledby="approach-title" className="mt-24 md:mt-[160px]">
      <h2
        id="approach-title"
        className="text-center text-[clamp(1.75rem,3.9vw,3.125rem)] leading-none font-normal uppercase"
      >
        <RevealLines lines={["Our approach to fashion design"]} />
      </h2>
      <p className="mx-auto mt-4 max-w-[700px] text-center text-[1.0625rem] leading-6 tracking-[0.1em]">
        at {env.brandName}, we blend creativity with craftsmanship to create fashion that transcends
        trends and stands the test of time. each design is meticulously crafted, ensuring the
        highest quality and an exquisite finish.
      </p>

      <ApproachPlates />
    </section>
  );
}
