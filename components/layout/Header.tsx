import Link from "next/link";

import { CartButton } from "@/components/layout/CartButton";
import { HeaderFrame } from "@/components/layout/HeaderFrame";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchSheet } from "@/components/layout/SearchSheet";
import { ShopMenu } from "@/components/layout/ShopMenu";
import { navigationCategories, navigationSkinTypes, shopMenu } from "@/lib/catalog/navigation";
import { env } from "@/lib/env";

export async function Header() {
  const [categories, skinTypes] = await Promise.all([
    navigationCategories(),
    navigationSkinTypes(),
  ]);
  const columns = shopMenu(categories, skinTypes);

  return (
    <HeaderFrame>
      <div className="max-w-page mx-auto grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:h-20 md:px-8">
        <div className="flex h-full items-center">
          <MobileNav columns={columns} />
          <ShopMenu columns={columns} />
        </div>

        <Link
          href="/"
          translate="no"
          className="text-xl font-bold tracking-[0.2em] uppercase md:text-[1.625rem] md:tracking-[0.22em]"
        >
          {env.brandName}
        </Link>

        <div className="flex items-center justify-end">
          <SearchSheet />
          <CartButton />
        </div>
      </div>
    </HeaderFrame>
  );
}
