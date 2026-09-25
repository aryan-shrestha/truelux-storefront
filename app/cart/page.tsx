import type { Metadata } from "next";

import { CartContents } from "@/components/cart/CartContents";

export const metadata: Metadata = {
  title: "Bag",
  // The cart is this device's state and has nothing for a search engine.
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8">
      <h1 className="text-title font-display mb-10 font-semibold">Your bag</h1>
      <CartContents />
    </section>
  );
}
