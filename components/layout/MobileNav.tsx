"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SearchForm } from "@/components/layout/SearchForm";
import { SITE_LINKS } from "@/components/layout/site-links";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Category } from "@/lib/api/types";

export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menu" className="md:hidden">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Menu" className="flex flex-col gap-6 px-4 pb-8">
          <SearchForm />
          <ul className="flex flex-col gap-1 font-heading text-2xl">
            {SITE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={close} className="block py-2">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {categories.length > 0 && (
            <>
              <Separator />
              <ul className="flex flex-col gap-4">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/products?category=${category.slug}`}
                      onClick={close}
                      className="font-medium"
                    >
                      {category.name}
                    </Link>
                    {category.children.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-2 pl-4 text-muted-foreground">
                        {category.children.map((child) => (
                          <li key={child.slug}>
                            <Link href={`/products?category=${child.slug}`} onClick={close}>
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
