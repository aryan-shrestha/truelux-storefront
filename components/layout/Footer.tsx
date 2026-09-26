import Link from "next/link";

import { ORDER_LINKS, SITE_LINKS } from "@/components/layout/site-links";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { categoryHref, navigationCategories } from "@/lib/catalog/navigation";
import { env } from "@/lib/env";

type FooterColumn = { title: string; links: ReadonlyArray<{ href: string; label: string }> };

export async function Footer() {
  const categories = await navigationCategories();
  const columns: FooterColumn[] = [
    { title: "Shop", links: [{ href: "/products", label: "Shop everything" }, ...SITE_LINKS] },
    {
      title: "Categories",
      links: categories.map((category) => ({
        href: categoryHref(category.slug),
        label: category.name,
      })),
    },
    { title: "Orders", links: ORDER_LINKS },
  ].filter((column) => column.links.length > 0);

  return (
    <footer className="bg-ink text-ink-foreground mt-20">
      <div className="max-w-page mx-auto flex flex-col gap-12 px-4 pt-16 pb-10 md:px-10">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div className="flex max-w-xs flex-col gap-4">
            <p className="text-2xl font-bold tracking-[0.2em] uppercase">{env.brandName}</p>
            <p className="text-ink-muted text-sm">
              Authentic skincare, makeup and fragrance, delivered across Nepal. You pay in cash when
              your order arrives.
            </p>
          </div>

          <nav aria-label="Footer" className="hidden grid-cols-3 gap-10 md:grid">
            {columns.map((column) => (
              <section key={column.title} aria-label={column.title} className="flex flex-col gap-5">
                <p className="font-semibold">{column.title}</p>
                <FooterLinks links={column.links} />
              </section>
            ))}
          </nav>

          <nav aria-label="Footer" className="md:hidden">
            <Accordion type="multiple" className="border-ink-muted/40 border-t">
              {columns.map((column) => (
                <AccordionItem
                  key={column.title}
                  value={column.title}
                  className="border-ink-muted/40"
                >
                  <AccordionTrigger className="**:data-[slot=accordion-trigger-icon]:text-ink-foreground text-base">
                    {column.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <FooterLinks links={column.links} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </nav>
        </div>

        <p className="text-ink-muted text-xs">
          © {new Date().getFullYear()} {env.brandName}. Prices in Nepalese rupees.
        </p>
      </div>
    </footer>
  );
}

function FooterLinks({ links }: { links: FooterColumn["links"] }) {
  return (
    <ul className="flex flex-col gap-3 text-[0.9375rem]">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="hover:underline hover:underline-offset-4">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
