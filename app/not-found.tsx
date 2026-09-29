import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="max-w-page mx-auto flex w-full flex-col items-center gap-6 px-4 py-24 text-center md:px-8">
      <h1 className="font-heading text-title">This page does not exist</h1>
      <p className="text-muted-foreground max-w-prose">
        The link may be old, or the product may no longer be for sale.
      </p>
      <Button asChild>
        <Link href="/products">Shop everything</Link>
      </Button>
    </section>
  );
}
