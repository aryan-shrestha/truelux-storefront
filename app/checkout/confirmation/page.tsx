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
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="mb-10 text-title">Thank you for your order</h1>
      <Confirmation orderNumber={order} />
    </section>
  );
}
