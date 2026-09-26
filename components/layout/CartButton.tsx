"use client";

import { ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart/use-cart";

// A real link to /cart, so it works without JavaScript and in a new tab; only a
// plain click opens the sheet.
export function CartButton() {
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const hasCount = ready && count > 0;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    setOpen(true);
  }

  return (
    <>
      <Button asChild variant="ghost" size="icon" className="w-auto min-w-11 gap-1.5 px-2.5">
        <Link ref={linkRef} href="/cart" onClick={handleClick} aria-haspopup="dialog">
          <ShoppingBagIcon aria-hidden />
          {/* Nothing from storage renders on the server, or hydration fails. */}
          {hasCount && (
            <span aria-hidden className="tabular-nums">
              {count}
            </span>
          )}
          <span aria-live="polite" className="sr-only">
            {ready ? `Bag, ${count} ${count === 1 ? "item" : "items"}` : "Bag"}
          </span>
        </Link>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          className="w-full sm:max-w-md"
          aria-describedby={undefined}
          // The sheet has no Radix trigger, so focus goes back to the link by hand.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            linkRef.current?.focus();
          }}
        >
          <SheetHeader>
            <SheetTitle className="font-heading text-heading">
              {hasCount ? `Your bag (${count})` : "Your bag"}
            </SheetTitle>
          </SheetHeader>
          <CartDrawer onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
