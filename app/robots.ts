import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

/**
 * Part of the architecture, not a formality (seo-and-metadata.md).
 *
 * `/products?` keeps crawlers off filtered listings: six filters make a
 * combinatorial number of URLs, each a separate cache key costing upstream
 * requests against the per-IP catalogue budget (ADR 0001), for pages with
 * nothing distinct to index. It is the longer match, so it beats the
 * `/products` allow for any URL with a query string.
 *
 * `/orders` is a security measure — those paths carry a bearer credential —
 * and not a sufficient one: robots.txt is a request, so the routes are also
 * noindex and same-origin referrer.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/products"],
      disallow: ["/products?", "/cart", "/checkout", "/orders"],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
