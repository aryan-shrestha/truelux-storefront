# ADR 0004: Catalogue state lives in the URL

Status: Accepted

Date: 2026-09-21

Supersedes: None

---

## Context

The product listing has six filters, a search box, a sort control and pagination:

```text
category  size  color  min_price  max_price  in_stock  search  ordering  limit  offset
```

That state has to live somewhere. The default instinct in a React application is
component state, with the filter rail owning a `useState` per control and firing a
fetch when one changes.

Two things about this storefront make that instinct wrong.

The first is [ADR 0001](0001-the-browser-makes-every-customer-scoped-call.md). The
catalogue is rendered on the server and cached, which means the server has to know
which filters are applied before it renders anything. Filter state held in a client
component is invisible to the server, so a filtered listing would be a client-side
fetch — which forfeits the cache, the server rendering and the throttle budget in
one move.

The second is that this is a shop a customer reaches from an Instagram link and
shares back to a friend. "Black hoodies in medium" has to be a thing you can send.

There is a cost on the other side, and it is not small. Every distinct query string
is a distinct cache key, and cache keys are the numerator of ADR 0001's throttle
budget. A crawler that follows filter links, or a marketing campaign appending
`utm_*` parameters, manufactures cache keys faster than 600 requests an hour can
absorb.

## Decision

**Catalogue state is the URL's search parameters, and nothing else holds it.**

```text
/products?category=hoodies&size=m&in_stock=true&ordering=-created_at&offset=25
```

The listing route reads `searchParams`, normalises them, and passes them to
`lib/api`. There is no client-side filter state, no `useState` mirroring a
parameter, and no fetch in the browser for a filtered listing.

**Filters are links.** A size filter is an `<a>` to the same route with one
parameter changed. Selecting one is a navigation.

**Parameters are normalised before they reach a cache key.** The route accepts a
known set, validates each value's shape, drops everything else, and orders what
remains canonically. `?utm_source=ig`, `?size=NONSENSE` and `?SIZE=m` all collapse
onto the same key as the request without them.

**`robots.ts` disallows filtered listing URLs.** The unfiltered listing and the
product pages are what gets indexed.

## Reason

Putting the state in the URL is what makes server rendering possible at all, and
server rendering is what makes the throttle budget work. The three decisions are
one decision seen from different angles.

Everything else follows for free rather than by design. A filtered view is
shareable because it is a URL. The back button works because navigation is
navigation. A filter is keyboard-accessible, middle-clickable and screen-reader
navigable because it is a link, not a `div` with an `onClick` and an `aria-*`
attribute approximating one. None of that needed to be built.

Normalisation is the part that is easy to skip and expensive to skip. Without it,
the cache key is whatever the visitor's URL bar contains, which is attacker- and
crawler-controlled. With it, the set of reachable cache keys is bounded by the
merchant's own categories, sizes and colours — a number that is known and can be
checked against the budget. It also makes one canonical URL per view, which is what
a search engine wants.

Disallowing filtered URLs in `robots.txt` closes the remaining hole. A crawler
following every combination of six filters is a combinatorial number of requests,
each one a cache miss, all of them for pages with no distinct content worth
indexing.

## Alternatives considered

### Client-side filter state with a browser fetch

Why it was not chosen: it is the conventional React answer and it gives the
snappiest interaction, with no navigation between filter changes. It forfeits
server rendering for every filtered view, which means the listing is not indexable
in any state but its default, and it moves catalogue requests from the server's
cached budget to the visitor's browser — where a shared NAT address exhausts the
per-IP catalogue limit on behalf of everyone behind it. It also makes a filtered
view unshareable unless the URL is synchronised anyway, at which point the URL is
the state and the local copy is a second source of truth that can drift.

### URL state, but read in a client component with `useSearchParams`

Why it was not chosen: it keeps the shareability and the back button while allowing
a client-side fetch, which sounds like the best of both. It still forfeits server
rendering, because the component that knows the filters is a client component. It
is the option to revisit only if the filter interaction ever needs to be faster
than a navigation.

### Path segments for the primary filter, `/products/hoodies`

Why it was not chosen: it reads better and would be the right shape if categories
were resources with pages of their own. They are not — the API's category endpoint
returns a navigation tree and nothing else, and `?category=` does not even descend
into child categories. Making one filter a path and five others query parameters
also splits the normalisation logic across two mechanisms for no gain.

### Storing the last-used filters in `localStorage` and restoring them

Why it was not chosen: a customer who returns to `/products` and sees it
pre-filtered from a previous visit has been shown a subset of the shop without
asking. It also means the URL and the view disagree, which breaks sharing in the
most confusing possible way — the recipient sees something different from the
sender.

## Consequences

### Positive

- Every filtered view is server-rendered, cached, shareable and linkable.
- The back button, forward button and browser history all behave without any code.
- Filters are accessible by construction, because they are links.
- The set of reachable cache keys is bounded and knowable, which is what makes
  ADR 0001's budget calculable rather than hopeful.
- The listing works with JavaScript disabled or still loading, which on a slow
  mobile connection is the first few seconds of every visit.

### Negative

- **Changing a filter is a navigation**, so it costs a round trip rather than
  feeling instant. On a cached page this is fast, but it is not the same as local
  state, and a customer toggling four filters performs four navigations.
- URLs get long and ugly with several filters applied, which matters when they are
  shared.
- **A filter combination with no products is a reachable, cacheable, empty page.**
  The empty state is therefore a real design surface, not an edge case.
- Normalisation is invisible work that must not be forgotten. A new filter added
  without adding it to the accepted set silently does nothing; added without
  validation, it opens the cache-key hole again.
- Pagination by `offset` in the URL means a customer can bookmark page 3 of a
  listing whose contents have since shifted.

### Constraints introduced

- **The listing route reads `searchParams` and normalises them before any fetch.**
  Raw search parameters never reach `lib/api`.
- **Adding a filter means adding it to the accepted set, to the validator, and to
  the canonical ordering**, in the same commit.
- **Filters render as `<a>`, not as buttons or selects with handlers.** A select
  that navigates on change is acceptable only with a no-JavaScript fallback.
- **No client-side filter state exists**, including a `useState` mirroring a
  parameter for optimistic UI.
- **`robots.ts` disallows filtered listing URLs**, and any new listing-like route
  must be considered against it.
- `ordering` accepts only `name`, `base_price` and `created_at` — the API silently
  ignores anything else, so the storefront validates it rather than passing it
  through.

## Implementation

```text
app/products/page.tsx            reads and normalises searchParams
lib/api/catalog.ts               takes a normalised query object
components/catalog/FilterRail    renders links, not handlers
app/robots.ts                    disallows filtered listing URLs
docs/features/catalog-browsing.md
docs/architecture.md             the cache-key argument
```

## Future reconsideration

Revisit if filter interaction becomes a measured conversion problem. The step is
not to move state into a component — it is to keep the URL authoritative and layer
`useOptimistic` over the pending navigation, so the UI responds immediately while
the server render is in flight. That preserves every property above.

Revisit the normalisation rules whenever a filter is added, and re-check the cache
key count against ADR 0001's budget at the same time. The two are the same
arithmetic.

Revisit path segments for categories if the backend ever gives categories real
content — a description, an image, a curated order — because at that point a
category becomes a resource rather than a filter, and a resource deserves a path.
