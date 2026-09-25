import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

// Filtered listings are disallowed because every combination is a cache key
// against the per-IP catalogue budget (ADR 0001). The order routes carry a
// bearer credential; robots.txt is only a request, so they are also noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/products", "/brands"],
      disallow: ["/products?", "/brands/*?", "/cart", "/checkout", "/orders"],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
