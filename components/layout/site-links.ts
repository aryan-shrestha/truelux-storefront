export const BRANDS_LINK = { href: "/brands", label: "Brands" } as const;
export const JOURNAL_LINK = { href: "/#journal", label: "Journal" } as const;

// A plain module because the server header, the client menu and the footer all render it.
export const SITE_LINKS = [BRANDS_LINK, JOURNAL_LINK, { href: "/#about", label: "About" }] as const;

export const ORDER_LINKS = [
  { href: "/orders/lookup", label: "Find an order" },
  { href: "/cart", label: "Your bag" },
] as const;
