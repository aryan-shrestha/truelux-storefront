"use client";

import Link from "next/link";
import { useState } from "react";

import { SITE_LINKS } from "@/components/layout/site-links";
import { Dialog } from "@/components/ui/Dialog";
import type { Category } from "@/lib/api/types";

/**
 * The design's menu icon, at every width. On a phone it is the only route to
 * the site links; above that it adds the category tree the header has no room
 * for.
 *
 * Categories arrive as props from the server component above, so the fetch
 * stays on the server and the data crosses the boundary once.
 */
export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Menu"
      trigger={
        <button
          type="button"
          aria-label="Menu"
          className="hover:bg-ink/5 flex min-h-11 min-w-11 items-center justify-start rounded-[2px]"
        >
          <svg
            aria-hidden
            viewBox="0 0 30 20"
            className="h-5 w-[30px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M28 2H2M20 10H2M15 18H2" />
          </svg>
        </button>
      }
    >
      <nav aria-label="Menu">
        <ul className="mt-8 flex flex-col gap-4 text-[1.0625rem] font-medium tracking-[0.08em]">
          {SITE_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={() => setOpen(false)} className="block py-1">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {categories.length > 0 && (
          <ul className="border-line mt-8 flex flex-col gap-6 border-t pt-8">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/products?category=${category.slug}`}
                  onClick={() => setOpen(false)}
                  className="text-heading font-display block font-semibold uppercase"
                >
                  {category.name}
                </Link>
                {category.children.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-3 pl-4">
                    {category.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={`/products?category=${child.slug}`}
                          onClick={() => setOpen(false)}
                          className="text-ui text-slate block"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </nav>
    </Dialog>
  );
}
