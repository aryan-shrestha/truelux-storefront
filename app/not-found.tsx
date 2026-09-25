import Link from "next/link";

/**
 * Reached by notFound() from a product route, and by any unmatched URL. It
 * offers the listing rather than only the home page, because someone who hit a
 * dead product link is shopping.
 */
export default function NotFound() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-24 sm:px-8">
      <h1 className="text-title font-display font-semibold">This page does not exist</h1>
      <p className="prose-body text-slate mt-4">
        The link may be old, or the piece may no longer be for sale.
      </p>
      <p className="mt-8">
        <Link href="/products" className="decoration-indigo underline underline-offset-4">
          Shop everything
        </Link>
      </p>
    </section>
  );
}
