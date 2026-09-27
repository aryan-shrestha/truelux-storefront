import type { Metadata } from "next";

import { CartContents } from "@/components/cart/CartContents";
import { PageShell } from "@/components/layout/PageShell";
import { shippingNote } from "@/lib/shipping/note";

export const metadata: Metadata = {
  title: "Bag",
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  return (
    <PageShell title="Your bag">
      <CartContents shippingNote={await shippingNote()} />
    </PageShell>
  );
}
