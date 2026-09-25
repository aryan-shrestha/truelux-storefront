import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8 md:px-[50px]">
      <h1 className="text-title font-display mb-8 font-semibold">Checkout</h1>
      <CheckoutForm />
    </section>
  );
}
