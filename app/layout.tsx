import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CartProvider } from "@/lib/cart/use-cart";
import { env } from "@/lib/env";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Authentic skincare, makeup and fragrance, delivered across Nepal. Pay in cash when your order arrives.";

export const metadata: Metadata = {
  // Without this, production Open Graph URLs resolve against localhost.
  metadataBase: new URL(env.siteUrl),
  title: {
    default: env.brandName,
    template: `%s | ${env.brandName}`,
  },
  description: DESCRIPTION,
  openGraph: {
    siteName: env.brandName,
    type: "website",
    locale: "en_NP",
    description: DESCRIPTION,
  },
  // The order routes carry a bearer credential in the path.
  referrer: "same-origin",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <CartProvider>
          <a
            href="#main"
            className="sr-only rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
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
