# Features

Current feature inventory.

Phase 1 is the storefront for a Kathmandu streetwear brand moving off Instagram.
It owns no data: the Django API owns the catalogue, the orders and the money, and
this repository's whole job is to render that well and hand a cart back as an
order. Checkout is guest-only, payment is cash on delivery or Khalti, and there is
no authentication anywhere.

| #   | Feature           | Status  | Documentation                  | Depends on | Last updated |
| --- | ----------------- | ------- | ------------------------------ | ---------- | ------------ |
| 1   | design-system     | In progress | `features/design-system.md` | —      | 2026-09-24   |
| 2   | api-client        | Implemented | `features/api-client.md`   | —          | 2026-09-21   |
| 3   | site-shell        | Implemented | `features/site-shell.md`   | 1, 2       | 2026-09-24   |
| 4   | catalog-browsing  | Implemented | `features/catalog-browsing.md` | 2, 3   | 2026-09-24   |
| 5   | product-detail    | Implemented | `features/product-detail.md` | 4        | 2026-09-24   |
| 6   | cart              | Implemented | `features/cart.md`           | 5        | 2026-09-24   |
| 7   | checkout          | Implemented | `features/checkout.md`     | 6          | 2026-09-24   |
| 8   | order-status      | Implemented | `features/order-status.md` | 7          | 2026-09-24   |
| 9   | storefront-home   | In progress | `features/storefront-home.md` | 4       | 2026-09-24   |
| 10  | seo-and-metadata  | In progress | `features/seo-and-metadata.md` | 4, 5, 9 | 2026-09-24 |

`Depends on` refers to the `#` column of this table.

## Implementation order

Implement in table order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10.

**#2 to #8 are built; #1 and #9 are waiting on the merchant.** The shop browses,
keeps a bag, places an order, and serves both halves of the backend's Khalti
return plus the order lookup. #9 storefront-home follows the mockup at
`docs/design/Home.svg` against placeholder images, and stays In progress until
real photography and copy replace them. The mockup restyled the whole shop:
[ADR 0008](../decisions/0008-the-storefront-follows-the-supplied-home-design.md). #10 seo-and-metadata, whose
`robots.ts` protects the catalogue's request budget, is next.

`design-system` (#1) has every primitive it needs — `Field` landed with checkout —
and stays In progress only for the photography and the brand name below.

#7 and #8 are verified against stubs and not yet against the real backend: the
backend's `.env` allows only `https://example.com` for CORS, so a browser on
`localhost:3000` cannot reach checkout or the order endpoints until that is
cleared.

Things learned building #1 to #3, each recorded where it belongs:

- **The API returns relative image URLs in development.** The backend's local
  settings override its storage backend to the filesystem, so `image.url` is
  `/media/products/foo.jpg` rather than a Cloudinary URL. Handed to `next/image`
  it resolves against the storefront's own origin and 404s. `lib/api` resolves
  it; `next.config.ts` allows both hosts.
- **`localhost` is not `127.0.0.1`.** It resolves to `::1` first, so anything
  bound to `[::]:8000` shadows a Django dev server on IPv4 and the storefront
  silently talks to the wrong thing.
- **The mobile dialog did not restore focus**, because it was opened from a
  button outside the Radix trigger. Found by driving the keyboard in a browser,
  not by reading the code — and now pinned by a test, because it is invisible to
  anyone using a mouse.

And building #7:

- **`page.route` cannot stub a Server Component.** The e2e suite only ever
  intercepted the browser's calls; the catalogue reads went to whatever answered
  on `API_BASE_URL`, and it passed because a seeded backend matched the
  fixtures. Found when an unrelated Django container took port 8000 and the
  suite and the build both failed. Recorded in `convention.md` and accepted.
- **Only failures that placed nothing keep the form.** Once an order exists —
  cash on delivery, or `payment_gateway_unavailable` — the form goes, and the cart
  is cleared after that render so the empty-bag state never flashes.
- **No `color-scheme` had been declared**, so native controls stayed light in
  dark mode. Checkout was the first page with a native select.

And building #8:

- **The confirmation email broke the planned cart clear.** The token route was
  planned to empty the bag on any successful load, which was right while only
  the Khalti redirect reached it. Every order's email now links there too, so a
  one-shot handoff marker written by checkout decides instead.
- **A promise for `use()` must be created outside the component that
  suspends**, or it is discarded and recreated on every retry — an endless
  refetch against a 60/hour limit.
- **The storefront has no contact channel**, so no failure page can say how to
  reach the shop. Raised with the merchant, not invented.

And building #4 to #6:

- **The filter rail cannot offer a size or colour picker.** `catalog-browsing.md`
  planned to derive both from the current result set; the list payload carries no
  variants, and the API has no endpoint listing sizes. Both parameters still work
  when present. This is the clearest thing to raise with the backend — a small
  read endpoint on their side, no client-side substitute on ours.
- **Reading `searchParams` makes a route dynamic, and the budget still holds.**
  Verified: five requests to one listing URL produced exactly one upstream call,
  because `fetch` with `revalidate` still serves from the data cache. ADR 0001
  counts upstream requests, not renders.
- **Next refuses to optimise images from a private address**, so every product
  image fails against a local backend until `dangerouslyAllowLocalIP` is set —
  in development only; it is the right default against SSRF.
- **`lib/env.ts` validated every variable on import**, so a client component
  importing it for one public value tripped over a server-only one and took the
  page down. It validates per field now. The first end-to-end run found it.
- **Sold out and not made were identical on screen.** The status was `sr-only`,
  so the distinction the picker exists to draw was invisible to a sighted
  customer. Found by looking at the page, not by running the tests.

`design-system` (#1) and `api-client` (#2) were first because every other feature
is an application of one or both, and because both decide things that are
expensive to change later. #1 fixes the palette, the two typefaces and their
roles, the radius rule and the single motion moment; #2 fixes the caching
directive on every read, which is the term in a budget rather than a preference.
They are independent of each other and can be built in either order or at once.

`site-shell` (#3) is where the first real page appeared. It is also the first place
the three-way split in how data reaches a component becomes concrete: the wordmark
is a build-time constant, the category navigation is a cached server fetch, and
the cart count cannot exist on the server at all. Getting that wrong here makes
every page in the store client-rendered.

`catalog-browsing` (#4) carries the load-bearing piece of this whole project — the
search-parameter normaliser. Every distinct query string is a cache key, and cache
keys are the numerator of
[ADR 0001](../decisions/0001-the-browser-makes-every-customer-scoped-call.md)'s
throttle budget. Without normalisation, a crawler or a campaign link manufactures
cache keys faster than 600 requests an hour can absorb them, and the failure
appears as 429s on the shop's busiest page during its busiest hour. This is the
first feature to build carefully rather than quickly.

`product-detail` (#5) is where the variant model has to be understood properly.
The API's variant list is a **sparse set of pairings**, not a grid: a product in
three sizes and two colours may have four variants, and a combination that was
never created is a different fact from one that sold out. A picker built from
independent size and colour lists looks correct against a well-formed product and
lies about a sparse one.

`cart` (#6) and `checkout` (#7) are the two halves of one argument, and
[ADR 0002](../decisions/0002-the-cart-is-browser-state.md) is that argument. The
cart holds knowingly stale display data so it can render with no network call, and
the backend re-resolves every price and every stock level inside a row lock at
placement. The consequence lands in #7 as two 422s that must each be handled well.

**#7 is the hardest feature in the repository, and not because of the form.** Five
distinct failures reach one submit button; two of them leave a real order behind;
and one of those two — `payment_gateway_unavailable` — is a 422 that means *the
order was placed*. There is no retry-payment endpoint, so a "try again" button on
that path places a second order and decrements the same stock twice for goods the
customer has already reserved.

**#8 is a contract with the backend repository.** After a Khalti payment the
backend redirects the browser to `{storefront}/orders/{access_token}` on success
and `{storefront}/orders/failed?reason=<code>` on failure. The backend's own
documentation states that nothing on its side enforces those routes exist. If
either is missing or renamed, a customer who has already paid lands on a 404, and
no test in either repository will notice.

`storefront-home` (#9) comes after #4 because it reuses the product card, and it
is deliberately late: it is the page with the least API support — no featured
flag, no collection model, no campaign copy, no hero image field — so it is the
page most likely to be redesigned once the rest of the store exists and real
photography has arrived.

`seo-and-metadata` (#10) is last but is not cosmetic. Its `robots.ts` is what
stops a crawler spending the catalogue's hourly request budget on filter
combinations, which makes it part of the same architecture as #4's normaliser.

**Two features cannot be finished without the merchant.** #1 and #9 both rest on
full-bleed photography that does not exist — the brand's current assets are square
Instagram posts, which will not fill a viewport-height hero. And the brand name is
unset, which is why
[ADR 0007](../decisions/0007-the-brand-wordmark-is-configuration.md) makes the
wordmark configuration; the layout can be built and tested against several
lengths, but the final optical judgement waits.

**The backend now emails the access token**, for both payment methods, linking to
`{STOREFRONT_URL}/orders/{access_token}`.
[ADR 0006](../decisions/0006-the-storefront-keeps-its-own-order-record.md) is
**superseded** as a result: a cash-on-delivery customer is no longer left with
nothing.

What remains for #7 and #8 is smaller and still real. The send is best-effort —
the backend's `send_email` swallows every exception so an SMTP failure cannot
fail a placed order — and nothing tells the storefront whether it worked. So the
confirmation page keeps the order number prominent rather than saying "check your
email", and the lookup keeps its prefill as a convenience. The local order record
survives as a recent-orders list, which is a much smaller claim than the one it
was built for.

**A fresh backend serves an empty catalogue** until someone fills it. There are
now two ways: `merchant-admin` (#10 on that side, implemented 2026-09-22) gives
the merchant `SizeAdmin` and `ColorAdmin` and a "Generate variants" action, and
`manage.py seed_demo` is the DEBUG-only development path, populating sizes,
colours, a two-level category tree and nine products. It deliberately seeds the awkward
shapes — a product with no images, a single-variant product, a sparse variant
grid, a price override, an entirely sold-out product and an unpublished one —
because those are the states that break a page and a tidy fixture omits all of
them. `tests/fixtures/catalog.ts` mirrors the same shapes.

The empty states in #4 and #9 are still the default experience against a
deployment nobody has seeded, not an edge case.

## Architectural decisions

Eight decisions in `docs/decisions/` govern this phase. Read the relevant one
before implementing the feature that depends on it.

| ADR  | Decision                                                    | Governs                                    |
| ---- | ----------------------------------------------------------- | ------------------------------------------ |
| 0001 | The browser makes every customer-scoped call                | api-client, catalog-browsing, checkout, order-status |
| 0002 | The cart is browser state; the server owns price and stock  | cart, checkout, product-detail             |
| 0003 | Money is a decimal string end to end                        | api-client, cart, checkout, every price    |
| 0004 | Catalogue state lives in the URL                            | catalog-browsing, seo-and-metadata         |
| 0005 | The storefront branches on the API's error codes            | api-client, checkout, order-status         |
| 0006 | ~~The storefront keeps its own order record~~ **superseded** | checkout, order-status                      |
| 0007 | The brand wordmark is configuration (amended by 0008)       | design-system, site-shell                  |
| 0008 | The storefront follows the supplied home design             | design-system, site-shell, storefront-home, every page |

ADR 0001 is the one to read first. Three of the others are downstream of its
throttle arithmetic, and #4's normaliser and #10's `robots.ts` both exist to
protect it.

## Integration references

`docs/integrations/` transcribes the published contracts of systems outside this
repository, so an implementation is written against a fixed document rather than a
recollection of one.

[backend-api.md](../integrations/backend-api.md) carries the Django API's whole
surface — every endpoint, every field, the error envelope and its codes, the
throttle rates, the CORS requirement, and a closing list of what the API
deliberately does **not** offer. Read it before writing anything in `lib/api`.

The backend repository is authoritative. If that document and `backend/docs/`
disagree, the backend is right and the transcription is stale.

Khalti has no document of its own here, because the storefront never calls it. It
sets `window.location` to a `payment_url` the API returned, and it serves the two
routes the backend's return redirect points at. The Khalti facts that affect
storefront copy — the sixty-minute link expiry, that only `Completed` is success,
and that the return round trip is slow because the backend verifies
server-to-server — are in `backend-api.md` under the payment return.

## Deferred to Phase 2 and later

Customer accounts and order history, saved addresses, wishlist, product reviews,
discount codes, gift cards, multi-currency, faceted search with real counts, fuzzy
or typo-tolerant search, restock notifications, a persisted server-side cart,
abandoned-cart recovery, analytics, and any content management for the home page.

Several of those are blocked on the API rather than on effort. The ones worth
raising with the backend first, because each removes a compromise recorded in a
feature document above:

- **A shipping quote before placement.** The fee is computed at checkout and
  returned with the placed order, so a customer commits without seeing it (#7).
- **Child-category filtering.** `?category=` matches one category exactly, so a
  parent category link can legitimately show nothing (#3, #4).
- **A size and colour list endpoint.** Without one the filter rail can only offer
  what the current results contain (#4).

## Status definitions

- **Planned** — documented but implementation has not started.
- **In progress** — implementation has started but is incomplete.
- **Implemented** — documented scope is implemented and verified.
- **Blocked** — implementation cannot continue because of a documented blocker.
- **Deprecated** — feature exists but should not receive new development.
