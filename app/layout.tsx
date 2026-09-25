import type { Metadata } from "next";
import { Inter, Schibsted_Grotesk, Syne } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CartProvider } from "@/lib/cart/use-cart";
import { env } from "@/lib/env";
import "./globals.css";

// Stand-ins for the mockup's Beatrice Display and Beatrice; Inter is its own.
// See the font tokens in globals.css.
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Without this, production Open Graph images resolve against localhost and
  // nothing fails loudly.
  metadataBase: new URL(env.siteUrl),
  title: {
    default: env.brandName,
    template: `%s — ${env.brandName}`,
  },
  description: `${env.brandName}. Everyday streetwear, made and shipped from Kathmandu.`,
  // The order routes carry a bearer credential in the path. Same-origin keeps it
  // out of the Referer header on any outbound link.
  referrer: "same-origin",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${schibsted.variable} ${syne.variable} ${inter.variable}`}>
      <body className="grain flex min-h-dvh flex-col">
        <CartProvider>
          <a
            href="#main"
            className="bg-ink text-paper text-ui sr-only rounded-[2px] px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
