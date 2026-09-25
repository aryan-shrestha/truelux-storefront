import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 md:px-8">
      <h1 className="text-title">This page does not exist</h1>
      <p className="max-w-prose text-muted-foreground">
        The link may be old, or the product may no longer be for sale.
      </p>
      <Button asChild>
        <Link href="/products">Shop everything</Link>
      </Button>
    </section>
  );
}
