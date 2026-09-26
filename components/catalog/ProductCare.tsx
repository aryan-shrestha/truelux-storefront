import Image from "next/image";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PROMISES } from "@/components/layout/promises";
import { env } from "@/lib/env";

// The design's Benefits / How to use / Ingredients panel. The API has no benefits
// or usage copy, so the panel carries what the shop does know for every product.
export function ProductCare() {
  const items = [
    { title: "Delivery", body: env.shippingNote },
    { title: "Payment", body: PROMISES.cashOnDelivery.body },
    { title: "Authenticity", body: PROMISES.authentic.body },
  ];

  return (
    <section aria-labelledby="care-heading" className="bg-secondary grid md:grid-cols-2">
      <div className="px-4 py-16 md:px-24 md:py-20">
        <h2 id="care-heading" className="sr-only">
          Delivery and payment
        </h2>
        <Accordion
          type="single"
          collapsible
          defaultValue="Delivery"
          className="border-foreground/60 border-t"
        >
          {items.map((item) => (
            <AccordionItem key={item.title} value={item.title} className="border-foreground/60">
              <AccordionTrigger>{item.title}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.body}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <div className="relative hidden min-h-[32rem] md:block">
        <Image src="/art/texture.svg" alt="" fill sizes="50vw" className="object-cover" />
      </div>
    </section>
  );
}
