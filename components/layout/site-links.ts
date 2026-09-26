// A plain module because the server header, the client menu and the footer all render it.
export const SITE_LINKS = [
  { href: "/brands", label: "Brands" },
  { href: "/#journal", label: "Journal" },
  { href: "/#about", label: "About" },
] as const;

export const ORDER_LINKS = [
  { href: "/orders/lookup", label: "Find an order" },
  { href: "/cart", label: "Your bag" },
] as const;
