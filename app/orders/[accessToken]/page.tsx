import type { Metadata } from "next";

import { PageShell } from "@/components/layout/PageShell";
import { OrderByToken } from "@/components/orders/OrderByToken";

// Every confirmation email links here. Moving this route strands customers with
// an order, and nothing in either repository would notice.
export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: PageProps<"/orders/[accessToken]">) {
  const { accessToken } = await params;

  return (
    <PageShell title="Your order">
      <OrderByToken accessToken={accessToken} />
    </PageShell>
  );
}
