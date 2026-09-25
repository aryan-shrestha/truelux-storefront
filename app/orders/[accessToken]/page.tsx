import type { Metadata } from "next";

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
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="mb-10 text-title">Your order</h1>
      <OrderByToken accessToken={accessToken} />
    </section>
  );
}
