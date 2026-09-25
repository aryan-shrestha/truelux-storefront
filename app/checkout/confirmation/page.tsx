import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Confirmation } from "@/components/checkout/Confirmation";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({
  searchParams,
}: PageProps<"/checkout/confirmation">) {
  const { order } = await searchParams;
  if (typeof order !== "string" || order === "") notFound();

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8">
      <h1 className="text-title font-display mb-10 font-semibold">Thank you for your order</h1>
      <Confirmation orderNumber={order} />
    </section>
  );
}
