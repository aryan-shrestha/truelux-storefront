import Image from "next/image";
import Link from "next/link";

const STEPS = [
  {
    title: "Cleanse",
    body: "Lift the day away with a gentle cleanser that leaves skin soft, not tight.",
    search: "cleanser",
  },
  {
    title: "Treat",
    body: "Press in a serum chosen for what your skin needs tonight.",
    search: "serum",
  },
  {
    title: "Moisturise",
    body: "Seal it all in with a cream that works while you sleep.",
    search: "moisturiser",
  },
];

export function Ritual() {
  return (
    <section
      aria-labelledby="ritual-heading"
      className="grid items-center gap-10 rounded-3xl bg-muted p-6 md:grid-cols-2 md:gap-16 md:p-12"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl">
        <Image src="/home/ritual.svg" alt="" fill sizes="(min-width: 768px) 45vw, 100vw" />
      </div>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h2 id="ritual-heading" className="text-title">
            A simple evening ritual
          </h2>
          <p className="text-muted-foreground">Three steps, ten minutes, better mornings.</p>
        </div>
        <ol className="flex flex-col gap-6">
          {STEPS.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-x-4">
              <span aria-hidden className="font-heading text-3xl text-gold">
                {index + 1}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-sans text-base font-medium">
                  <Link href={`/products?search=${step.search}`} className="hover:underline">
                    {step.title}
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
