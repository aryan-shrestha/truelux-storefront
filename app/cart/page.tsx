import type { Metadata } from "next";

import { CartContents } from "@/components/cart/CartContents";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Bag",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <PageShell title="Your bag">
      <CartContents />
    </PageShell>
  );
}
