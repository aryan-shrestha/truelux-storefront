# Code Conventions

Last updated: 2026-09-21

This document records conventions that apply across the repository.

Prefer existing code examples over adding rules here. Only record conventions that
future contributors or agents need to know.

See [architecture.md](architecture.md) for layer responsibilities and system
constraints. This file covers how the code is written, not how it is arranged.

---

## Naming

### Files

Components are `PascalCase.tsx`, named for the component they export. Everything
else is `kebab-case.ts`. Directories are always `kebab-case`. Route files take the
names the App Router requires.

```text
components/catalog/ProductCard.tsx      one component, named for it
components/ui/Button.tsx
lib/api/catalog.ts                      the catalogue endpoints
lib/api/errors.ts                       ApiError and envelope parsing
lib/cart/reducer.ts
lib/cart/use-cart.ts                    a hook, so not a component
lib/format/money.ts
app/products/[slug]/page.tsx
```

One concern per module, named for the concern. **No `utils.ts`, `helpers.ts`,
`common.ts`, `types.ts` outside `lib/api`, or `constants.ts` at the root.** A module
whose name does not say what is inside becomes a dumping ground within a month. If a
helper has no obvious home, it usually belongs next to its only caller.

A component file holds one exported component. Small components used only by it may
live in the same file; the moment a second file imports one, it moves out.

Split a module when it grows past roughly 250 lines, into a directory with an
`index.ts` re-exporting the public names, so imports elsewhere do not change.

### Components

`PascalCase`, named for what they are rather than where they sit. `ProductCard`,
not `CatalogItemWrapper`. No `Container`, `Wrapper`, `Manager`, or `Provider`
suffix unless the thing genuinely is a context provider.

Props types are named `<Component>Props` and declared immediately above the
component. They are not exported unless another module composes them.

### Functions

`lib/api` functions are named for what they return, borrowing the backend's own
vocabulary: `get*` for one thing, `list*` for many, an imperative verb for a write.

```ts
listProducts(...)      getProduct(...)      listCategories(...)
submitCheckout(...)    getOrder(...)        lookupOrder(...)
```

Predicates read as questions: `isInStock`, `hasVariants`, `canCheckout`. Event
handlers are `handle<Thing><Event>` on the component and `on<Thing><Event>` as a
prop. `handle`, `process`, `manage` and `do` as a *whole* name say nothing — name
the operation.

Hooks start with `use` and live in a file of the same kebab-cased name.

### Variables

`camelCase`. Collections plural, single things singular. Name the content, not the
container: `products`, not `productList`, `data`, `result`, or `info`.

Booleans read as assertions: `isLoading`, `hasItems`, `shouldRedirect`. Avoid
negated names — `isHidden` beats `isNotVisible`, which produces
`if (!isNotVisible)`.

Module constants are `UPPER_SNAKE_CASE` at the top of the module that uses them. A
literal used twice becomes a constant; a literal used once stays inline.

---

## Server and client components

**Server by default.** `"use client"` is a decision, and every one of them should be
defensible by naming the interaction it enables.

Push the boundary as far down the tree as it goes. A page that needs one
interactive control marks that control as a client component, not the page.

```tsx
// app/products/[slug]/page.tsx — server
export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct({ slug });

  return (
    <ProductLayout product={product}>
      <VariantPicker variants={product.variants} />
    </ProductLayout>
  );
}
```

`VariantPicker` is the only client component on that page. `ProductLayout`, the
gallery and the description all render on the server.

Conventions:

- A client component receives data as props from a server component wherever that
  is possible. Passing a rendered `children` through a client boundary keeps the
  children on the server.
- A client component may call `lib/api` **only** for a customer-scoped endpoint —
  checkout, order detail, order lookup. It never fetches the catalogue.
- No `useEffect` to fetch data. If a client component needs data on mount, that is
  either a server component's job or a deliberate customer-scoped call in an event
  handler.
- Nothing reads `process.env` directly. `lib/env` is the only module that does.
- **Anything rendered from `localStorage` renders empty on the server.** Read it in
  an effect and render a stable placeholder until then, or the markup will not
  match and React will discard it. The cart badge is the obvious case.

---

## The API module

`lib/api` is the only place in the repository that calls the backend. One function
per endpoint, fully typed, throwing `ApiError` on failure.

```ts
export async function listProducts(params: ProductQuery): Promise<Page<ProductSummary>> {
  return request<Page<ProductSummary>>("/products/", {
    query: toProductQuery(params),
    revalidate: 300,
  });
}

export async function getProduct({ slug }: { slug: string }): Promise<Product> {
  return request<Product>(`/products/${encodeURIComponent(slug)}/`, { revalidate: 900 });
}
```

Conventions:

- **Arguments are a single object**, so call sites read as key-value pairs and
  argument order is not part of the contract.
- **Every read states its `revalidate` explicitly.** A call without one is
  incomplete, not "the default". A customer-scoped call states `cache: "no-store"`
  for the same reason.
- **Every path ends in a trailing slash.** Django redirects one that does not, which
  costs a round trip and can turn a `POST` into a `GET`.
- Path segments are `encodeURIComponent`-escaped. Slugs come from our own data,
  which is exactly the assumption that stops being true one day.
- Query strings are built with `URLSearchParams`, never by concatenation. A
  parameter whose value is empty or `undefined` is omitted, so the cache key stays
  canonical.
- **No function returns a status code, a `Response`, or a raw envelope.** It returns
  the typed payload or throws.
- No retries. A throttled or failed request is the caller's decision to surface, and
  an automatic retry against a per-IP rate limit makes the problem worse.

### Types

The wire types live in `lib/api/types.ts` and mirror
[integrations/backend-api.md](integrations/backend-api.md) field for field. They are
the only place API field names appear as strings.

```ts
export type Money = string; // a decimal string, e.g. "4500.00". Never a number.

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  basePrice: Money;
  category: CategoryRef;
  primaryImage: Image | null;
  inStock: boolean;
};
```

- **The API speaks `snake_case`; this repository speaks `camelCase`.** The mapping
  happens once, in `lib/api`, in an explicit function per type. Never scatter
  `product.base_price` through components, and never rename a field in transit —
  `base_price` becomes `basePrice` and nothing else.
- `type` over `interface`, except where declaration merging is actually needed.
- Nullable API fields are `T | null`, matching the wire. Absent fields are `?`.
  `primary_image` is `null`; `payment_url` is absent. They mean different things and
  the types say so.
- **No `as`.** A cast is a claim the compiler cannot check. Narrow instead, and
  where narrowing is impossible the value should not have been typed that way.
- **No `any`.** Genuinely unknown data is `unknown` and is narrowed before use.

**API responses are typed but not validated at runtime.** This is a deliberate
departure from the general rule that external data is `unknown`: the backend is a
first-party service with a pinned contract and a published OpenAPI schema, so a
mismatch is a bug to fix in both repositories rather than a runtime condition to
handle. A drifted field surfaces as a render failure with a clear stack, which is
the right outcome.

**`localStorage` is different and is validated.** It is genuinely untrusted — it may
be absent, truncated, hand-edited, or written by an older version of this code — so
it is parsed by an explicit, versioned parser that returns empty on any failure. See
Storage.

There is no runtime schema library, deliberately. Two boundaries do not justify one,
and the `typescript-best-practices` skill's "schemas before guards" rule assumes a
repository that already has one. If a third boundary appears, or the cart parser
stops being obviously correct at a glance, adopt one then and convert all of them.

---

## Storage

Two keys, both namespaced and versioned:

```text
tl.cart.v1
tl.orders.v1
```

Conventions:

- **Every read is wrapped in `try`/`catch` and every failure resets to empty.**
  `localStorage` throws in private-mode Safari, under blocked site data, and inside
  an embedded browser. A storefront that crashes because it could not read a cart is
  worse than one with an empty cart.
- **Every read is parsed and validated**, not cast. A stored value from an older
  schema is a normal condition, not an error.
- **Bump the version suffix rather than writing a migration.** A customer losing a
  cart across a schema change is a smaller cost than migration code nobody tests.
- Writes are debounced at the edge of the reducer, not performed on every keystroke.
- **The access token is never stored.** It lives in the URL for the life of the
  page and nowhere else.

---

## Styling

Tailwind v4, configured entirely in CSS. Design tokens are declared once in
`app/globals.css` under `@theme`, and everything else consumes them.

```css
@theme {
  --color-ink: #0a0a0a;
  --color-paper: #fafaf8;
  --color-accent: #d6402a;
  --font-display: "...", serif;
  --text-display: 4.5rem;
}
```

Conventions:

- **No arbitrary colour values.** `bg-[#ff0000]` is rejected in review. A colour that
  is not a token is either a missing token or a mistake.
- Spacing, type sizes and radii come from the scale. An arbitrary value is allowed
  only for something genuinely one-off — a hero's exact crop — and carries a comment
  saying why.
- **No inline `style`**, except for a value that is computed at runtime and cannot be
  a class, such as a dynamic transform or an aspect ratio derived from data.
- Variant styling is a lookup object, not string concatenation:

```tsx
const VARIANTS = {
  primary: "bg-ink text-paper hover:bg-ink/90",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
} as const;
```

  This is why there is no `tailwind-merge` in the repository: nothing merges
  conflicting classes, because nothing generates conflicting classes. `clsx` composes
  conditionals and that is all it does.
- Class lists are ordered by Prettier's Tailwind plugin. Do not hand-order them.
- Dark mode is `prefers-color-scheme` only, with tokens redefined in one place.
  There is no theme toggle and no theme state.
- **`sr-only` is not a substitute for a label.** It is for text that is genuinely
  redundant visually, not for skipping the work.

---

## Formatting values

### Money

Amounts are decimal strings and stay decimal strings. `lib/format/money.ts` is the
**only** module permitted to parse one, and it parses only to group digits for
display.

```ts
formatPrice("4500.00"); // "Rs 4,500"
```

- **No arithmetic on money anywhere in this repository.** No summing a cart, no
  computing a total, no applying a shipping fee. The backend returns `subtotal`,
  `shipping_fee` and `total`, and those are the figures shown.
- The cart page therefore does not display a total. It displays line prices and
  says the total is confirmed at checkout, which is also true.
- `Number()`, `parseFloat` and `+` applied to an amount are rejected in review
  outside `money.ts`.

### Dates

`placed_at` is ISO 8601 in UTC. Format it with an **explicit** time zone:

```ts
new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", ... })
```

Without the time zone, the server formats in UTC and the browser formats in the
visitor's zone, the two disagree, and React discards the server's markup. The
customer is in Nepal; the rendering machine is not.

---

## Forms

Native `<form>` elements with real `name` attributes, submitted by a client
component. There is no form library.

- Every input has a real `<label>`. A placeholder is not a label.
- Client-side validation mirrors the API's rules — `email`, `required`, the length
  caps in [backend-api.md](integrations/backend-api.md) — as a courtesy, not as a
  guarantee. **The server is authoritative and its 400 is the real validation.**
- A 400's `details` object is keyed by field name, and those keys map onto the
  form's fields. Render them inline against the field, not as a banner.
- The submit button is disabled while a request is in flight, and the form is never
  unmounted on failure. A customer who has typed an address must never have to type
  it again.
- **`district` is a fixed list, not a text input.** The API charges the
  outside-valley shipping fee for anything it does not recognise, silently, so a
  typo costs the customer a hundred rupees with no error to explain it.

---

## Errors

`lib/api/errors.ts` owns one error type and the envelope parsing that produces it.

```ts
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly details: Record<string, unknown>,
    readonly requestId: string | null,
    message: string,
  ) {
    super(message);
  }
}
```

Conventions:

- **Branch on `code`.** The backend rewords messages freely and pins codes as a
  public contract. Matching on `message`, or on `status` alone, breaks on a copy
  edit.
- The code → UI table lives in
  [architecture.md](architecture.md#error-handling). Do not duplicate it; a second
  copy will drift.
- A message from the API may be shown to a customer, but only where it is known to
  be useful. `validation_error` messages are; `server_error` messages carry nothing
  and must not be surfaced.
- Handle the codes a call can actually produce, and let the rest reach the
  boundary. A `try`/`catch` that swallows everything hides the one failure nobody
  anticipated.
- A transport failure has no envelope and is not an `ApiError`. Distinguish "we
  could not reach the store" from "the store said no".
- Never retry automatically. The per-IP rate limit means a retry loop converts a
  transient failure into a lockout.

---

## Accessibility

Not a review checklist — these are the ones this storefront gets wrong if nobody
writes them down.

- Every interactive element is a `<button>` or an `<a>`. A `div` with an `onClick`
  is rejected in review.
- **A filter is a link.** The catalogue changes the URL, so filters navigate, which
  means they work with a keyboard, a screen reader, middle-click and the back
  button for free.
- The variant picker is a radio group, labelled, with the unavailable options
  disabled and *announced* as unavailable rather than merely greyed.
- Focus is visible everywhere. If a focus ring is removed for looks, something
  visible replaces it in the same commit.
- Images carry the API's `alt_text`. When it is empty the image is decorative and
  gets `alt=""` — never the product name invented as a substitute, which reads as
  noise when every card repeats it.
- Live regions announce cart changes and form errors. A confirmation that only
  appears visually has not been communicated.
- Colour never carries meaning alone. "Out of stock" is a word, not a grey.
- Touch targets are at least 44px on the paths a phone actually uses: the size
  picker, the quantity stepper, the add-to-bag button.

---

## Testing

Vitest with React Testing Library for units and components; Playwright for one
end-to-end pass over the buy flow. Tests are part of the implementation, not a
follow-up.

### Layout

```text
lib/cart/reducer.test.ts          beside the module it tests
lib/format/money.test.ts
components/catalog/VariantPicker.test.tsx
tests/e2e/buy-flow.spec.ts        Playwright
tests/fixtures/                   API response fixtures
```

### What gets a test

- **`lib/` logic always.** The cart reducer, money formatting, the storage parser
  and the envelope parser are pure functions with real edge cases, and they are
  where a bug is silent.
- **Components with behaviour**, not components with markup. The variant picker,
  the quantity stepper, the checkout form. A card that renders props does not need
  a test asserting that it rendered them.
- **One Playwright spec** covering browse → product → add to bag → checkout →
  confirmation, against a stubbed API. It exists to catch the seams the unit tests
  cannot see.

Do not add meaningless tests to satisfy a checklist. A snapshot of a component's
markup is a change detector, not a test.

### Fixtures and stubs

Fixtures are typed with the same types as `lib/api` and derived from the shapes in
[backend-api.md](integrations/backend-api.md), so a contract change breaks the
fixtures at compile time rather than at runtime.

```ts
export const linenShirt: Product = { ... };
```

- Unit and component tests stub `fetch` directly. There is no MSW; one stub helper
  in `tests/fixtures/` covers every case this storefront has.
- Playwright stubs at `page.route("**/api/v1/**", ...)`, which intercepts only
  what the **browser** requests — the checkout POST and the order routes. The
  catalogue reads are made by Server Components from the Next process, which
  `page.route` cannot see, so the e2e suite needs a backend seeded with
  `seed_demo` on `API_BASE_URL` and its fixtures mirror that seed. Decided on
  2026-09-24 to accept this rather than add a stub server; unit and component
  tests still never reach the network.
- Assert on the fields that matter, never on a whole response object. Whole-object
  equality turns every added field into a failing test.
- Assert the error `code`, never the message.
- Test names state the condition and the expectation:
  `adding_the_same_variant_twice_merges_the_lines`.

---

## Formatting and linting

ESLint with `eslint-config-next` (core-web-vitals and TypeScript), and Prettier with
the Tailwind class-sorting plugin. Prettier is authoritative and its output is never
hand-adjusted. Print width 100, matching the backend.

- **Absolute imports only**, through the `@/` alias. `import { getProduct } from
  "@/lib/api/catalog"`. Relative imports hide which layer you are in when a file
  moves, and `../../../` is unreadable in review.
- Import order: framework, third party, `@/` modules, then styles. The linter
  enforces it.
- No default exports except where a framework demands one — a route's `page.tsx`,
  `layout.tsx`, `error.tsx`. Named exports are greppable and cannot be renamed
  silently at the import site.
- No barrel `index.ts` files except the one created when a module is split, and that
  one re-exports explicitly. A barrel over a whole directory defeats tree shaking
  and hides what depends on what.
- An `eslint-disable` names the specific rule and carries a reason on the same line.
  A bare disable is rejected in review.

---

## Type checking

`tsc --noEmit` with `strict: true`, plus:

```json
"noUncheckedIndexedAccess": true,
"noImplicitOverride": true,
"noFallthroughCasesInSwitch": true
```

`noUncheckedIndexedAccess` is the one that matters here: `products[0]` is
`Product | undefined`, which is the truth, and it catches the empty-catalogue case
that will otherwise reach production as a blank page from the merchant's first
filter with no results.

Consequences that follow from strict mode rather than from taste:

- Every exported function is fully annotated, including its return type. An inferred
  return type on a module boundary means a change inside the function silently
  changes the contract.
- `X | null` where the API sends null; `X | undefined` where a value is absent. They
  are not interchangeable.
- A `@ts-expect-error` names the error and the reason on the line above, and a
  `@ts-ignore` is never used — the first fails when the underlying problem is fixed,
  the second rots.
- Exhaustive switches end with `const _exhaustive: never = value;` so adding a case
  to a union fails the build at every site that must handle it.

---

## Logging

There is almost nothing to log in a storefront, and the temptation to log is the
problem.

- **No `console.log` in committed code.** The linter fails on it.
- `console.error` is permitted in `error.tsx` boundaries and in `lib/api` for a
  server-side transport failure, and nowhere else. Include the request id from the
  response header; it is what makes a customer report findable in the backend's
  logs.
- **Never logged, at any level:** an `access_token`, a full order URL, a checkout
  request body, a customer's email, phone number or address. `order_number` is safe
  and is usually what you actually wanted.
- Server-side logs go to Vercel and are readable by anyone with project access.
  Treat them as a place a credential must never land.

---

## Other conventions

**Environment variables** are read in `lib/env.ts` and nowhere else, so one file
lists the entire configuration surface. A required variable has no default and
fails the build; an optional one has a default that is safe in production. Never
call `process.env` from application code.

```ts
export const env = {
  apiBaseUrl: required("API_BASE_URL"),
  publicApiBaseUrl: required("NEXT_PUBLIC_API_BASE_URL"),
  brandName: required("NEXT_PUBLIC_BRAND_NAME"),
  siteUrl: required("NEXT_PUBLIC_SITE_URL"),
} as const;
```

Anything `NEXT_PUBLIC_` is compiled into the browser bundle and is **public**.
Nothing secret goes there, and in this repository nothing secret exists at all.

**URLs.** Lowercase, hyphenated, no trailing slash — `/products/linen-shirt`, not
`/products/linen-shirt/`. Product routes use the API's slug verbatim so the two
never disagree. Catalogue state is query parameters, never path segments, because a
filter is not a resource.

**The brand name is `env.brandName`.** It never appears as a literal in a component,
a page title, or a piece of copy. See
[ADR 0007](decisions/0007-the-brand-wordmark-is-configuration.md).

**Metadata.** Every route exports `metadata` or `generateMetadata`. A page without a
title inherits the layout's, which is wrong on every page that is not the home page.

**Images.** Always `next/image`, always with explicit `sizes` and an aspect ratio,
because the API supplies no dimensions. `priority` on the one image above the fold
and on no others.

**Copy** lives with the component that shows it. There is no translation layer and
no string catalogue; the store is in English, and inventing an i18n abstraction for
one language is exactly the speculative infrastructure `CLAUDE.md` forbids.
