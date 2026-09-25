import { BadgeCheckIcon, BanknoteIcon, TruckIcon } from "lucide-react";

const PROMISES = [
  {
    icon: BanknoteIcon,
    title: "Cash on delivery",
    body: "Pay when your order reaches you. Nothing is charged online.",
  },
  {
    icon: BadgeCheckIcon,
    title: "Authentic products",
    body: "Every product is genuine, from the brands we stock.",
  },
  {
    icon: TruckIcon,
    title: "Delivery across Nepal",
    body: "A lower delivery fee inside the Kathmandu valley.",
  },
];

export function Promises() {
  return (
    <section aria-label="Why shop with us">
      <ul className="grid gap-8 sm:grid-cols-3">
        {PROMISES.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-4">
            <Icon aria-hidden className="mt-0.5 size-6 shrink-0 text-gold" />
            <div className="flex flex-col gap-1">
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
