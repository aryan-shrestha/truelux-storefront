import type { Metadata } from "next";

import { OrderByToken } from "@/components/orders/OrderByToken";

// The backend's Khalti return and every confirmation email link here. Renaming
// or moving this route strands customers who have already paid, and no test in
// either repository would notice.
export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: PageProps<"/orders/[accessToken]">) {
  const { accessToken } = await params;

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8">
      <h1 className="text-title font-display mb-10 font-semibold">Your order</h1>
      <OrderByToken accessToken={accessToken} />
    </section>
  );
}
