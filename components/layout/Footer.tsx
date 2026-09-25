import Link from "next/link";

import { LogoMark } from "@/components/layout/LogoMark";
import { env } from "@/lib/env";

// Text greys are a step darker than the design's 40% and 60% black, which fail
// contrast on the band.
//
// Drawn from the design and inert: the storefront has none of these pages and
// no translations. Plain text rather than links, so nothing offers a
// destination that does not exist.
const INFO = ["Pricing", "About", "Contacts"];
const LANGUAGES = ["ENG", "ESP", "SVE"];

export function Footer() {
  return (
    <footer className="bg-band grain font-utility mt-[148px] bg-blend-multiply">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 pt-16 pb-4 md:grid-cols-[358px_1fr] md:gap-0 md:px-[50px] md:pt-[133px] md:pl-[167px]">
        <div className="flex flex-col gap-16 md:gap-[73px]">
          <FooterList label="Info" items={INFO} />
          <FooterList label="Languages" items={LANGUAGES} />
        </div>

        <div>
          <p className="text-slate text-[0.6875rem] tracking-[0.05em] uppercase">Technologies</p>
          <div className="mt-9 flex flex-wrap items-start gap-x-4 gap-y-6 md:flex-nowrap">
            <div className="relative leading-[0.85] font-black tracking-[-0.02em]">
              <p aria-hidden className="text-ink/5 text-[4.5rem] md:text-[5.25rem]">
                VR
              </p>
              <LogoMark className="absolute top-3 left-0 size-12" />
              <p className="text-ink text-[3.5rem] break-all md:text-[5.25rem]">{env.brandName}</p>
              <p className="text-ink text-[4.5rem] md:text-[5.25rem]">QR</p>
            </div>
            <p className="text-slate mt-[70px] flex shrink-0 items-start gap-5 text-[0.8125rem]">
              Near-field communication
              <span
                aria-hidden
                className="bg-ink/20 mt-[-8px] block h-[50px] w-px rotate-[15deg]"
              />
            </p>
          </div>
        </div>

        <div className="text-slate flex flex-wrap gap-x-[70px] gap-y-2 text-[0.6875rem] md:col-start-2 md:mt-[180px]">
          <p>
            © {new Date().getFullYear()} {env.brandName}
          </p>
          {/* Not in the design, and kept on purpose: a customer's route back to
              an order without the email is this lookup. */}
          <Link href="/orders/lookup" className="hover:text-ink">
            Find an order
          </Link>
          <p>Privacy</p>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-slate text-[0.6875rem] tracking-[0.05em] uppercase">{label}</p>
      <ul className="text-ink/75 mt-8 text-[0.8125rem] leading-[17px] uppercase">
        {items.map((item, index) => (
          <li key={item}>
            {item}
            {index < items.length - 1 && (
              <span aria-hidden className="text-ink/20 ml-3">
                /
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
