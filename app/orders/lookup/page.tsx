import type { Metadata } from "next";

import { LookupForm } from "@/components/orders/LookupForm";

export const metadata: Metadata = {
  title: "Find an order",
  robots: { index: false, follow: false },
};

export default function LookupPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="mb-10 text-title">Find an order</h1>
      <LookupForm />
    </section>
  );
}
