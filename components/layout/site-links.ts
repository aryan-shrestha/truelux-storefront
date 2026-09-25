/**
 * The design's three top-level links. A plain module because both the server
 * header and the client menu render them, and a constant exported from a
 * "use client" file reaches a server component as a reference, not a value.
 */
export const SITE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Collections" },
  { href: "/products?ordering=-created_at", label: "New" },
] as const;
