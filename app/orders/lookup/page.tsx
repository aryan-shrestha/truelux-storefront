import type { Metadata } from "next";

import { PageShell } from "@/components/layout/PageShell";
import { LookupForm } from "@/components/orders/LookupForm";

export const metadata: Metadata = {
  title: "Find an order",
  robots: { index: false, follow: false },
};

export default function LookupPage() {
  return (
    <PageShell title="Find an order">
      <LookupForm />
    </PageShell>
  );
}
