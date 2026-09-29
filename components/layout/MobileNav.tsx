"use client";

import { ChevronLeftIcon, ChevronRightIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { BRANDS_LINK, JOURNAL_LINK, ORDER_LINKS, SALE_LINK } from "@/components/layout/site-links";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/ui/item";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { MenuColumn } from "@/lib/catalog/navigation";

type Panel =
  { kind: "root" } | { kind: "shop" } | { kind: "brands" } | { kind: "column"; index: number };

export function MobileNav({
  columns,
  brands,
}: {
  columns: MenuColumn[];
  brands: MenuColumn | null;
}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>({ kind: "root" });
  const close = () => setOpen(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setPanel({ kind: "root" });
  }

  const column =
    panel.kind === "column"
      ? (columns[panel.index] ?? null)
      : panel.kind === "brands"
        ? brands
        : null;
  const columnParent: Panel = panel.kind === "brands" ? { kind: "root" } : { kind: "shop" };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menu" className="-ml-2.5 md:hidden">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="gap-0 overflow-y-auto p-0 data-[side=left]:w-full data-[side=left]:sm:max-w-sm"
      >
        <SheetHeader className="border-foreground h-16 justify-center border-b px-4">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <nav aria-label="Menu">
          {panel.kind === "root" && (
            <>
              <ul>
                <li>
                  {columns.length === 0 ? (
                    <LinkRow href="/products" onNavigate={close}>
                      Shop
                    </LinkRow>
                  ) : (
                    <ForwardRow onClick={() => setPanel({ kind: "shop" })}>Shop</ForwardRow>
                  )}
                </li>
                <li>
                  {brands === null ? (
                    <LinkRow href={BRANDS_LINK.href} onNavigate={close}>
                      {BRANDS_LINK.label}
                    </LinkRow>
                  ) : (
                    <ForwardRow onClick={() => setPanel({ kind: "brands" })}>
                      {brands.title}
                    </ForwardRow>
                  )}
                </li>
                <li>
                  <LinkRow href={SALE_LINK.href} onNavigate={close}>
                    {SALE_LINK.label}
                  </LinkRow>
                </li>
                <li>
                  <LinkRow href={JOURNAL_LINK.href} onNavigate={close}>
                    {JOURNAL_LINK.label}
                  </LinkRow>
                </li>
              </ul>
              <ul className="text-muted-foreground flex flex-col px-4 py-3">
                {ORDER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} onClick={close} className="block py-2.5">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {panel.kind === "shop" && (
            <ul>
              <li>
                <BackRow onClick={() => setPanel({ kind: "root" })} label="Shop" />
              </li>
              <li>
                <LinkRow href="/products" onNavigate={close}>
                  Shop everything
                </LinkRow>
              </li>
              {columns.map((candidate, index) => (
                <li key={candidate.title}>
                  <ForwardRow onClick={() => setPanel({ kind: "column", index })}>
                    {candidate.title}
                  </ForwardRow>
                </li>
              ))}
            </ul>
          )}

          {column !== null && (
            <ul>
              <li>
                <BackRow onClick={() => setPanel(columnParent)} label={column.title} />
              </li>
              {column.links.map((link) => (
                <li key={link.href}>
                  <LinkRow href={link.href} onNavigate={close} indented>
                    {link.label}
                  </LinkRow>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function ForwardRow({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Item asChild variant="rule" size="lg">
      <button type="button" onClick={onClick}>
        <span className="flex-1">{children}</span>
        <ChevronRightIcon aria-hidden />
      </button>
    </Item>
  );
}

// Focus moves to the back row when a sub-menu opens, so a keyboard user is not left on nothing.
function BackRow({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Item asChild variant="rule" size="lg">
      <button type="button" onClick={onClick} autoFocus aria-label={`Back from ${label}`}>
        <ChevronLeftIcon aria-hidden />
        <span className="flex-1">{label}</span>
      </button>
    </Item>
  );
}

function LinkRow({
  href,
  onNavigate,
  indented = false,
  children,
}: {
  href: string;
  onNavigate: () => void;
  indented?: boolean;
  children: ReactNode;
}) {
  return (
    <Item asChild variant="rule" size="lg">
      <Link href={href} onClick={onNavigate} className={indented ? "pl-12" : undefined}>
        {children}
      </Link>
    </Item>
  );
}
