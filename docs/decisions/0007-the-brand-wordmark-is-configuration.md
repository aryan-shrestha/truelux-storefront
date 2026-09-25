# ADR 0007: The brand wordmark is configuration, not a constant

Status: Accepted

Date: 2026-09-21

Supersedes: None


Amended: 2026-09-25, by
[ADR 0010](0010-the-truelux-visual-direction.md): the header shows the name again,
as a text wordmark in the display serif. The 2026-09-24 amendment below, by
[ADR 0008](0008-the-storefront-follows-the-supplied-home-design.md), is itself
superseded.

Amended: 2026-09-24, by
[ADR 0008](0008-the-storefront-follows-the-supplied-home-design.md). The name is
still configuration and everything below about `NEXT_PUBLIC_BRAND_NAME` holds.
The *visual* wordmark is gone: the header shows the mockup's diamond mark with
the name as `sr-only` text, and the name appears as type only in the
collections headline, the approach copy and the footer. `Wordmark.tsx` and its
width-axis mapping were deleted.

---

## Context

The brand's name is not settled. The backend already prefixes every order number
with `TL-`, which fixes two letters into data that will outlive any rename, but the
storefront has no equivalent commitment and the merchant has asked for the name to
be changeable without a code change.

A brand name in a storefront is not one string. It appears in the header wordmark,
the page title of every route, the Open Graph title, the footer, the copyright
line, the confirmation page, the order emails the storefront does not send, the
`robots.txt` sitemap host, and the alt text of the logo. Hardcoding it means a
rename is a find-and-replace across the repository, with the ones inside sentences
missed.

It also affects the design directly, and this is the part that is easy to discover
too late. The visual direction is editorial — a large, confident wordmark carrying
the top of the page. An editorial wordmark is usually *drawn*: letter-spaced by
hand, optically centred, set at a size chosen for that exact string. A wordmark
that could be four characters or twenty-four cannot be any of those things.

## Decision

**The brand name is `NEXT_PUBLIC_BRAND_NAME`, read in `lib/env.ts`, and never
appears as a literal anywhere else in the repository.**

```ts
export const env = {
  brandName: required("NEXT_PUBLIC_BRAND_NAME"),
  // ...
} as const;
```

It is required, with no default. A missing value fails the build rather than
rendering a page with a blank header or the word `undefined`.

**The wordmark is set type, not an image and not a drawn logo.** It is rendered
from the environment variable in the display typeface, with a type treatment that
holds at any plausible length.

**The design must survive the string.** The header, the hero and the footer are
laid out so that a one-word name and a three-word name both look deliberate:
the wordmark's size is bounded rather than fixed, it does not rely on optical
centring against a specific silhouette, and no layout depends on its width.

There is no logo file in `public/` for the wordmark. A favicon and an app icon are
separate assets and are not covered by this decision.

## Reason

The merchant asked for it, and the request is reasonable for a brand that has not
launched: the name is the thing most likely to change between now and the first
customer.

The design consequence is the real content of this decision. Reading a name from
configuration is trivial; *designing as if you do not know the name* is a
constraint that has to be adopted deliberately at the start, because it cannot be
retrofitted. A header built around a four-character wordmark breaks when the name
becomes three words, and it breaks in a way that looks like carelessness rather
than like a configuration change.

Making it required rather than defaulted follows the backend's own settings rule: a
required variable has no default and fails loudly. A default of `"Store"` would
produce a deployed site that looks finished and is wrong, which is worse than a
failed build.

Set type rather than an image keeps the whole thing coherent. An SVG wordmark would
be sharper and more distinctive, and it would immediately reintroduce the problem —
the image would carry one name while the page titles carried another, and changing
the name would mean commissioning artwork. When the name settles, a drawn wordmark
becomes the obvious upgrade and this decision is what should be revisited.

## Alternatives considered

### Hardcode the name and rename when it changes

Why it was not chosen: it is one commit whenever the name changes, and it allows a
drawn wordmark and a type treatment tuned to the exact string — which is the better
design outcome. It was rejected because the merchant explicitly asked otherwise,
and because a rename spread across page titles, metadata, copy and alt text is
exactly the change that gets done 90% of the way.

### A single `BRAND` constant in a TypeScript module

Why it was not chosen: it solves the find-and-replace problem and keeps the value
in version control, which is genuinely better for reviewability. It still requires
a deploy from source to change, which is what the request was about. It is the
right answer if the name is ever settled and the requirement is dropped.

### An SVG wordmark in `public/`, with the name also in configuration

Why it was not chosen: it gives the best-looking header and the worst failure mode.
The image and the variable would disagree the first time one changed without the
other, and nothing would catch it — the header would say one name and the browser
tab another.

### Fetch the brand name from the API

Why it was not chosen: the API has no concept of a brand and no endpoint that could
serve one. Adding one would put a request on the catalogue throttle budget to
deliver a string that changes once a year.

## Consequences

### Positive

- A rename is an environment variable and a redeploy.
- The name is correct everywhere at once, because there is exactly one source.
- A missing value fails the build, not the customer.
- The header, hero and footer are laid out to tolerate a range of lengths, which
  also makes them tolerate a long category name and a translated string later.

### Negative

- **The wordmark cannot be a drawn logo, hand-kerned, or optically tuned**, which
  is a real loss for an editorial design where the wordmark is a primary visual
  element. The type treatment has to earn its distinctiveness through the typeface,
  weight and spacing rather than through bespoke lettering.
- The name is in the client bundle, which is fine — it is on every page anyway —
  but it establishes that `NEXT_PUBLIC_` variables are the mechanism, and someone
  will eventually try to put something sensitive there.
- A local developer with no `.env.local` gets a build failure rather than a running
  app, so the variable must be in `.env.example` and in the README's first
  instructions.
- **The order-number prefix `TL-` is fixed in the backend's data and will not
  follow a rename.** Order numbers from before a rename keep the old prefix
  forever, and so do the ones after it.

### Constraints introduced

- **`env.brandName` is the only source of the name.** A literal in a component, a
  `metadata.title`, a piece of copy or an `alt` attribute is rejected in review.
- **`NEXT_PUBLIC_BRAND_NAME` is required**, with no default, and is listed in
  `.env.example`.
- **No layout may depend on the wordmark's width**, and no hero may be composed
  around a specific number of characters.
- **The wordmark is rendered as text**, so it must be legible at display size in
  the chosen typeface — which is a constraint on choosing the typeface, not only on
  using it.
- Copy is written so the name can be substituted: "your order" rather than "your
  TrueLux order", unless the name is being used deliberately as a brand
  statement and is interpolated.
- The design must be checked against a short name and a long one. A visual
  regression that only appears with a three-word brand is not caught by looking at
  the current one.

## Implementation

```text
lib/env.ts                       brandName, required
.env.example                     NEXT_PUBLIC_BRAND_NAME
components/layout/Header.tsx     the wordmark, set as type
app/layout.tsx                   the metadata title template
docs/features/design-system.md   the type treatment and its length tolerance
docs/features/site-shell.md      the header layout
README.md                        the variable, in the first run instructions
```

## Future reconsideration

**Revisit when the name is settled.** At that point the trade reverses: a drawn
wordmark, hand-kerned at display size, is a meaningful upgrade for an editorial
design, and the cost — a rename requiring artwork — stops mattering. The migration
is to add an SVG and keep `env.brandName` for titles and copy, accepting that the
two must be changed together.

Revisit if a second storefront is ever run from this codebase for another brand,
which is the scenario this decision accidentally prepares for. At that point the
brand becomes a whole theme — typeface, palette, wordmark — and one variable is no
longer the right shape.
