import Link from "next/link";

import { CartButton } from "@/components/layout/CartButton";
import { HeaderFrame } from "@/components/layout/HeaderFrame";
import { LogoMark } from "@/components/layout/LogoMark";
import { MobileNav } from "@/components/layout/MobileNav";
import { SITE_LINKS } from "@/components/layout/site-links";
import { navigationCategories } from "@/lib/catalog/navigation";
import { env } from "@/lib/env";

/**
 * A server component inside a client frame, with two client islands.
 *
 * The header is on every route, so marking it client would make every page's
 * shell client-rendered, ship the category data twice, and put the navigation
 * behind hydration. `HeaderFrame` (the scroll behaviour), `CartButton` and
 * `MobileNav` are the only "use client" boundaries in the shell.
 */

export async function Header() {
  const categories = await navigationCategories();

  return (
    <HeaderFrame>
      <div className="relative mx-auto flex max-w-[1600px] items-center gap-[17px] px-4 py-4 md:px-[50px] md:py-5">
        <MobileNav categories={categories} />

        <nav aria-label="Site" className="hidden md:block">
          <ul className="flex items-center gap-8 text-[1.0625rem] font-medium tracking-[0.07em]">
            {SITE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="after:bg-ink relative py-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:transition-transform after:duration-500 after:ease-(--ease-settle) hover:after:origin-left hover:after:scale-x-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/"
          className="absolute left-1/2 flex min-h-11 min-w-11 -translate-x-1/2 items-center justify-center"
        >
          <LogoMark className="size-9" />
          <span className="sr-only">{env.brandName}</span>
        </Link>

        <div className="ml-auto flex items-center gap-[45px]">
          {/* Drawn from the design and deliberately inert: the API has no
              wishlist and no accounts, so there is nothing for either to open.
              Hidden from assistive technology rather than offered as a control
              that does nothing. */}
          <span
            aria-hidden
            className="bg-ink text-paper hidden size-[50px] items-center justify-center rounded-full md:flex"
          >
            <HeartIcon />
          </span>
          <CartButton />
          <span
            aria-hidden
            className="bg-ink text-paper hidden size-[50px] items-center justify-center rounded-full md:flex"
          >
            <AccountIcon />
          </span>
        </div>
      </div>
    </HeaderFrame>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M10 16.5s-6-3.6-6-8.2A3.3 3.3 0 0 1 10 6.4a3.3 3.3 0 0 1 6 1.9c0 4.6-6 8.2-6 8.2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="7.4" r="3.4" />
      <path d="M16 16.9c0-1.9-2.7-3.4-6-3.4s-6 1.5-6 3.4" />
    </svg>
  );
}
