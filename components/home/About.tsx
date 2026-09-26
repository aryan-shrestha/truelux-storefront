import { env } from "@/lib/env";

const PROMISES = [
  { title: "Cash on delivery", body: "Pay when your order reaches you. Nothing is charged online." },
  { title: "Authentic products", body: "Every product is genuine, from the brands we stock." },
  { title: "Delivery across Nepal", body: "A lower delivery fee inside the Kathmandu valley." },
];

// The header's About link lands here.
export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="scroll-mt-(--header-offset) bg-secondary px-4 py-24 md:py-40"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
        <h2 id="about-heading" className="font-heading text-title">
          Good skin is a habit, not a secret. We bring the brands; you choose what suits you.
        </h2>
        <p className="text-sm uppercase">About {env.brandName}</p>
      </div>
      <ul
        aria-label="Why shop with us"
        className="mx-auto mt-16 grid max-w-4xl gap-8 text-center sm:grid-cols-3"
      >
        {PROMISES.map((promise) => (
          <li key={promise.title} className="flex flex-col gap-1">
            <p className="font-semibold">{promise.title}</p>
            <p className="text-sm text-muted-foreground">{promise.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
