// A plain module because the server header and the client menu both render it.
export const SITE_LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/brands", label: "Brands" },
  { href: "/products?ordering=-created_at", label: "New in" },
] as const;
