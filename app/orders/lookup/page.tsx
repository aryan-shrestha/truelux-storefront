import type { Metadata } from "next";

import { LookupForm } from "@/components/orders/LookupForm";

export const metadata: Metadata = {
  title: "Find an order",
  robots: { index: false, follow: false },
};

export default function LookupPage() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8">
      <h1 className="text-title font-display mb-10 font-semibold">Find an order</h1>
      <LookupForm />
    </section>
  );
}
