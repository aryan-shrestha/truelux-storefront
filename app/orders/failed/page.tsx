import type { Metadata } from "next";
import Link from "next/link";

import { RecentOrder } from "@/components/orders/RecentOrder";

// The backend's Khalti return redirects here on failure. Renaming or moving
// this route is a coordinated change with the backend's STOREFRONT_URL.
export const metadata: Metadata = {
  title: "Payment not completed",
  robots: { index: false, follow: false },
};

type Reason = "payment_not_completed" | "payment_amount_mismatch" | "payment_gateway_unavailable";

/**
 * No branch offers to pay again. There is no retry-payment endpoint, so the
 * only thing a retry could do is place a second order for goods the first one
 * has already reserved.
 */
const COPY: Record<Reason | "unknown", { title: string; body: string }> = {
  payment_not_completed: {
    title: "Your payment did not go through, and nothing was charged.",
    body: "Your order is placed but unpaid, and your bag is still here. You can place it again with cash on delivery, or wait for the shop to get in touch — it has your contact details.",
  },
  payment_amount_mismatch: {
    title: "Something went wrong with the payment amount.",
    body: "This is not something you can fix from here, so please do not pay again. The shop has your order and your contact details, and will get in touch to put it right.",
  },
  payment_gateway_unavailable: {
    title: "We could not check your payment with Khalti.",
    body: "Your payment may or may not have gone through, so please do not pay again. Your order is placed, and the shop can match a payment to it by its order number.",
  },
  unknown: {
    title: "Your payment did not complete.",
    body: "Please do not pay again until you have checked your order. Your order number and the email you ordered with are enough to find it.",
  },
};

function toReason(value: string | string[] | undefined): Reason | "unknown" {
  return value === "payment_not_completed" ||
    value === "payment_amount_mismatch" ||
    value === "payment_gateway_unavailable"
    ? value
    : "unknown";
}

export default async function PaymentFailedPage({ searchParams }: PageProps<"/orders/failed">) {
  const reason = toReason((await searchParams).reason);
  const copy = COPY[reason];

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8">
      {/* The fact leads, so it is the first thing a screen reader announces. */}
      <h1 className="text-title font-display mb-10 max-w-3xl font-semibold">{copy.title}</h1>
      <div className="flex max-w-2xl flex-col gap-6">
        <p className="prose-body">{copy.body}</p>
        <RecentOrder />
        {reason === "payment_not_completed" && (
          <p>
            <Link href="/checkout" className="decoration-indigo underline underline-offset-4">
              Order again with cash on delivery
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
