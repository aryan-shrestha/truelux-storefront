import Link from "next/link";

import { CartButton } from "@/components/layout/CartButton";
import { HeaderFrame } from "@/components/layout/HeaderFrame";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchForm } from "@/components/layout/SearchForm";
import { SITE_LINKS } from "@/components/layout/site-links";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { navigationCategories } from "@/lib/catalog/navigation";
import { env } from "@/lib/env";

export async function Header() {
  const categories = await navigationCategories();

  return (
    <HeaderFrame>
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:h-18 md:px-8">
        <div className="flex items-center">
          <MobileNav categories={categories} />
          <NavigationMenu viewport={false} className="hidden md:flex">
            <NavigationMenuList>
              {SITE_LINKS.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <Link href="/" className="font-heading text-2xl font-medium tracking-wide md:text-3xl">
          {env.brandName}
        </Link>

        <div className="flex items-center justify-end gap-3">
          <SearchForm className="hidden w-52 lg:block" />
          <CartButton />
        </div>
      </div>
    </HeaderFrame>
  );
}
