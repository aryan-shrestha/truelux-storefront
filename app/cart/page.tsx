import type { Metadata } from "next";

import { CartContents } from "@/components/cart/CartContents";

export const metadata: Metadata = {
  title: "Bag",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="mb-10 text-title">Your bag</h1>
      <CartContents />
    </section>
  );
}
