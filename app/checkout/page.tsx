import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <PageShell title="Checkout">
      <CheckoutForm />
    </PageShell>
  );
}
