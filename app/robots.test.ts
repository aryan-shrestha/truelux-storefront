import { describe, expect, it } from "vitest";

import robots from "@/app/robots";

describe("robots", () => {
  const { rules, sitemap } = robots();
  const rule = Array.isArray(rules) ? rules[0] : rules;

  it("keeps crawlers off filtered listings, which spend the catalogue budget", () => {
    expect(rule?.disallow).toContain("/products?");
    expect(rule?.allow).toContain("/products");
  });

  it("keeps crawlers off every route that carries a cart or a credential", () => {
    expect(rule?.disallow).toEqual(expect.arrayContaining(["/cart", "/checkout", "/orders"]));
  });

  it("points at the sitemap on the storefront's own origin", () => {
    expect(sitemap).toBe("http://localhost:3000/sitemap.xml");
  });
});
