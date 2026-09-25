/**
 * Every environment variable this storefront reads, in one place.
 *
 * `process.env` is not called anywhere else: one file should list the whole
 * configuration surface, and a variable read at a call site is a variable
 * nobody finds when the deploy is wrong.
 *
 * **Each field is a getter, so a variable is validated when it is read rather
 * than when this module loads.** A client component importing `env` for the
 * shipping note would otherwise evaluate `API_BASE_URL` too, which is
 * server-only and therefore `undefined` in the browser bundle — the whole page
 * fails, and it fails at import, which is hard to trace back to the one field
 * nobody meant to touch.
 *
 * Reading a server-only field in the browser still throws, and should: it means
 * that value was about to be used somewhere it does not exist.
 *
 * Each name is written as a literal `process.env.X`. Next inlines
 * `NEXT_PUBLIC_*` by static analysis and cannot see `process.env[name]`.
 */

function required(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `${name} is required and has no default. Locally, copy .env.example to .env.local and set it. ` +
        `On a host such as Vercel, add it to the project's environment variables for this ` +
        `environment (Production or Preview) and redeploy.`,
    );
  }
  return value;
}

export const env = {
  /** Server only. Used by Server Components; may be a private address. */
  get apiBaseUrl(): string {
    return required("API_BASE_URL", process.env.API_BASE_URL);
  },
  /** Public. Used by the browser for checkout and the order routes. */
  get publicApiBaseUrl(): string {
    return required("NEXT_PUBLIC_API_BASE_URL", process.env.NEXT_PUBLIC_API_BASE_URL);
  },
  /** Public. This storefront's own origin: canonical URLs, sitemap, Open Graph. */
  get siteUrl(): string {
    return required("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL);
  },
  /** Public. The wordmark and every page title. Configuration, not a constant (ADR 0007). */
  get brandName(): string {
    return required("NEXT_PUBLIC_BRAND_NAME", process.env.NEXT_PUBLIC_BRAND_NAME);
  },
  /** Public. Display copy only; the backend computes the authoritative fee. */
  get shippingNote(): string {
    return required("NEXT_PUBLIC_SHIPPING_NOTE", process.env.NEXT_PUBLIC_SHIPPING_NOTE);
  },
} as const;
