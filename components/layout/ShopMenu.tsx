import Image from "next/image";
import Link from "next/link";

import { SITE_LINKS } from "@/components/layout/site-links";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { MenuColumn } from "@/lib/catalog/navigation";

// The root is static so the viewport spans the sticky header, not this cell.
export function ShopMenu({ columns }: { columns: MenuColumn[] }) {
  return (
    <NavigationMenu className="static hidden h-full md:flex" aria-label="Main">
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
                <div className="grid grid-cols-[1fr_27%]">
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] content-start gap-x-8 gap-y-12 px-2 py-20 lg:px-10">
                    {columns.map((column) => (
                      <section key={column.title} aria-label={column.title}>
                        <p className="mb-3 font-semibold">{column.title}</p>
                        <ul>
                          {column.links.map((link) => (
                            <li key={link.href}>
                              <NavigationMenuLink asChild>
                                <Link href={link.href}>{link.label}</Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                  <div className="relative min-h-[36rem]">
                    <Image src="/art/menu.svg" alt="" fill sizes="27vw" className="object-cover" />
                  </div>
                </div>
              </NavigationMenuContent>
            </>
          )}
        </NavigationMenuItem>
        {SITE_LINKS.map((link) => (
          <NavigationMenuItem key={link.href} className="h-full">
            <NavigationMenuLink asChild>
              <Link href={link.href} className="h-full">
                {link.label}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
