import Link from "next/link";

import { SITE_LINKS } from "@/components/layout/site-links";
import { Separator } from "@/components/ui/separator";
import { env } from "@/lib/env";

export function Footer() {
  return (
    <footer className="mt-24 bg-muted">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-14 md:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="flex max-w-sm flex-col gap-3">
            <p className="font-heading text-3xl">{env.brandName}</p>
            <p className="text-sm text-muted-foreground">
              Authentic skincare, makeup and fragrance, delivered across Nepal. You pay in cash
              when your order arrives.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 text-sm">
            <div className="flex flex-col gap-3">
              <p className="font-medium">Shop</p>
              <ul className="flex flex-col gap-2 text-muted-foreground">
                {SITE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <p className="font-medium">Orders</p>
              <ul className="flex flex-col gap-2 text-muted-foreground">
                <li>
                  <Link href="/orders/lookup" className="hover:text-foreground">
                    Find an order
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-foreground">
                    Your bag
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <Separator />

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {env.brandName}. Prices in Nepalese rupees.
        </p>
      </div>
    </footer>
  );
}
