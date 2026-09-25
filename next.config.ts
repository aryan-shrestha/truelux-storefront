import type { NextConfig } from "next";

import { env } from "./lib/env";

const isProduction = process.env.NODE_ENV === "production";

type RemotePattern = Exclude<
  NonNullable<NextConfig["images"]>["remotePatterns"],
  undefined
>[number];

/**
 * The API's own host, allowed as an image source. The API returns relative
 * media URLs whenever its storage is the filesystem rather than Cloudinary, and
 * `lib/api` resolves those against whichever base URL made the call — so a
 * deployment that serves media from the API itself breaks every product image
 * unless that host is listed here.
 */
function apiImagePattern(baseUrl: string): RemotePattern {
  const url = new URL(baseUrl);
  return {
    protocol: url.protocol === "https:" ? "https" : "http",
    hostname: url.hostname,
    port: url.port,
    pathname: "/**",
  };
}

/**
 * Sent with every response. The storefront loads no third-party script and
 * embeds nothing, so each of these costs nothing and closes something.
 *
 * No Content-Security-Policy yet: Next's inline bootstrap scripts need a
 * per-request nonce from middleware to allow, and a CSP that is loosened with
 * 'unsafe-inline' to avoid that is not worth shipping.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nothing here is meant to be framed; this stops clickjacking the checkout.
  { key: "X-Frame-Options", value: "DENY" },
  // Matches the metadata policy in app/layout.tsx. As a header it also covers
  // responses that carry no <head>, and an order URL is a bearer credential
  // that must never leave in a Referer.
  { key: "Referrer-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // The order routes carry a credential in the path. The pages already
      // say noindex in their metadata; the header says it before any HTML is
      // parsed, and for any response on these paths.
      {
        source: "/orders/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  images: {
    // Production images normally come from Cloudinary. The local hosts cover a
    // development backend whose storage is the filesystem.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
      apiImagePattern(env.apiBaseUrl),
      apiImagePattern(env.publicApiBaseUrl),
    ],
    // Next refuses to optimise an image whose host resolves to a private
    // address, because a user-controlled image URL would otherwise be an SSRF
    // vector. In development the API *is* on a private address and every
    // product image fails without this.
    //
    // Never in production: there the images come from Cloudinary or a public
    // API host, and a private-IP fetch would be the attack this guard exists
    // to stop.
    dangerouslyAllowLocalIP: !isProduction,
  },
};

export default nextConfig;
