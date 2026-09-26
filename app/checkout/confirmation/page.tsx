import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Confirmation } from "@/components/checkout/Confirmation";
import { PageShell } from "@/components/layout/PageShell";

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
    <PageShell title="Thank you for your order">
      <Confirmation orderNumber={order} />
    </PageShell>
  );
}
