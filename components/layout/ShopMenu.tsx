import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BRANDS_LINK, JOURNAL_LINK, SALE_LINK } from "@/components/layout/site-links";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { MenuColumn } from "@/lib/catalog/navigation";

export function ShopMenu({
  columns,
  brands,
}: {
  columns: MenuColumn[];
  brands: MenuColumn | null;
}) {
  return (
    <NavigationMenu className="hidden h-full md:flex" aria-label="Main">
      <NavigationMenuList className="h-full gap-6">
        <NavigationMenuItem className="h-full">
          {columns.length === 0 ? (
            <NavigationMenuLink asChild>
              <Link href="/products" className="h-full">
                Shop
              </Link>
            </NavigationMenuLink>
          ) : (
            <>
              <NavigationMenuTrigger>Shop</NavigationMenuTrigger>
              <NavigationMenuContent>
                <MenuPanel>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] content-start gap-x-8 gap-y-12">
                    {columns.map((column) => (
                      <MenuSection key={column.title} column={column} />
                    ))}
                  </div>
                </MenuPanel>
              </NavigationMenuContent>
            </>
          )}
        </NavigationMenuItem>
        <NavigationMenuItem className="h-full">
          {brands === null ? (
            <NavigationMenuLink asChild>
              <Link href={BRANDS_LINK.href} className="h-full">
                {BRANDS_LINK.label}
              </Link>
            </NavigationMenuLink>
          ) : (
            <>
              <NavigationMenuTrigger>{brands.title}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <MenuPanel>
                  <MenuSection
                    column={brands}
                    listClassName="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-x-8"
                  />
                </MenuPanel>
              </NavigationMenuContent>
            </>
          )}
        </NavigationMenuItem>
        <NavigationMenuItem className="h-full">
          <NavigationMenuLink asChild>
            <Link href={SALE_LINK.href} className="h-full">
              {SALE_LINK.label}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="h-full">
          <NavigationMenuLink asChild>
            <Link href={JOURNAL_LINK.href} className="h-full">
              {JOURNAL_LINK.label}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function MenuPanel({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_27%]">
      <div className="px-2 py-20 lg:px-10">{children}</div>
      <div className="relative min-h-[36rem]">
        <Image src="/art/menu.svg" alt="" fill sizes="27vw" className="object-cover" />
      </div>
    </div>
  );
}

function MenuSection({ column, listClassName }: { column: MenuColumn; listClassName?: string }) {
  return (
    <section aria-label={column.title}>
      <p className="mb-3 font-semibold">{column.title}</p>
      <ul className={listClassName}>
        {column.links.map((link) => (
          <li key={link.href}>
            <NavigationMenuLink asChild>
              <Link href={link.href}>{link.label}</Link>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
