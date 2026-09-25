"use client";

import { cn } from "cn";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { isHeaderHidden } from "@/components/layout/header-scroll";

export function HeaderFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let previousY = window.scrollY;
    function handleScroll() {
      const y = window.scrollY;
      const offset = ref.current?.offsetHeight ?? 0;
      setHidden((wasHidden) => isHeaderHidden(previousY, y, wasHidden, offset));
      previousY = y;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sticky elements elsewhere read --header-offset, which this attribute moves.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-header-hidden", hidden);
  }, [hidden]);

  return (
    <header
      ref={ref}
      // A keyboard user tabbing into a hidden header must be able to see it.
      onFocusCapture={() => setHidden(false)}
      className={cn(
        "sticky top-0 z-30 border-b bg-background/95 backdrop-blur transition-transform duration-500 ease-(--ease-settle)",
        hidden && "-translate-y-full",
      )}
    >
      {children}
    </header>
  );
}
