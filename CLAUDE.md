# CLAUDE.md

Repository instructions for Claude. Read this before the first edit of a session.

Keep this file short. It contains rules that apply to almost every change. Durable
architecture knowledge, feature state, and decisions belong in `docs/`.

---

## Project

Next.js storefront for TrueLux, a multi-brand cosmetics shop in Nepal (skincare,
makeup, fragrance; cash on delivery only). It consumes a Django REST API that lives
in the sibling `../back-end` repository and owns no data of its own.

- Next.js 16, App Router
- React 19
- TypeScript, `strict`
- Tailwind CSS v4, configured in CSS
- shadcn/ui (Radix base) as the only component library
- Yarn 4, `nodeLinker: node-modules`

`yarn` is the only package manager. Never use npm, pnpm, or bun, and never `npx`
with one exception: the shadcn CLI, `npx shadcn@latest add <name>` (ADR 0009).

**Do not switch the linker back to Plug'n'Play.** Next 16's Turbopack cannot
resolve packages under PnP and fails every build with "Could not find the Next.js
package", and Vite — and therefore Vitest — no longer supports it either.

There is **no client data-fetching library** and **no global state store**. Do not
add, stub, or introduce one.

---

## Components: shadcn/ui only

[ADR 0009](docs/decisions/0009-shadcn-ui-is-the-component-library.md).

- **Every interactive or UI primitive is a shadcn component**: buttons, inputs,
  dialogs, sheets, selects, checkboxes, radios, toggles, carousels, badges,
  skeletons, pagination, alerts, empty states. Never hand-roll one, and never add
  another UI kit. A primitive shadcn lacks is composed from shadcn parts.
- Add components with `npx shadcn@latest add <name>`. They land in `components/ui/`
  under their generated kebab-case names. Check `components/ui/` first; do not
  re-add one that exists.
- **Tailor inside `components/ui/*` or the theme variables in `app/globals.css`,
  not with long class lists at call sites.** A call site passes layout classes.
- `cn` is imported from the `cn` package. There is no `lib/utils.ts`.
- Colours are theme variables. No hex values in components; the one exception is a
  shade swatch filled from the API's `hex_code`.
- A link that looks like a control stays a link and takes the component's variants
  (`buttonVariants`, `toggleVariants`, `Button asChild`).

There is **no backend in this repository**. Nothing here has a database, a
session, a secret, or an API key.

---

## Commands

```bash
yarn install
yarn dev
yarn build
yarn lint
yarn typecheck
yarn test
yarn test:e2e
yarn format
```

Anything not covered by a script runs through `yarn`, never a bare binary.

Before reporting work as complete, run:

```bash
yarn lint
yarn typecheck
yarn test
```

Read the actual output. Never claim a check passed without running it.

---

## Source of truth

When information conflicts, use this order:

1. Explicit requirements in the current task
2. Existing source code and tests
3. Repository architecture/convention documentation
4. Established patterns elsewhere in the repository
5. Next.js/React/TypeScript conventions
6. General best practices

**The backend API is authoritative over all of the above** for anything it owns:
prices, stock, totals, order state, and error codes. The storefront displays what
the API returned and never computes a substitute.

Do not replace an established repository pattern simply because another approach
is newer, more fashionable, or more idiomatic elsewhere.

If documentation contradicts source code:

1. Treat the documentation as authoritative.
2. Correct the stale code when appropriate.
3. Mention the discrepancy in the final report.

Never invent project conventions when the repository already contains an example
that answers the question.

---

## Codebase context

Durable repository knowledge lives here:

```text
docs/
├── architecture.md
├── convention.md
├── decisions/
├── features/
└── integrations/
    └── backend-api.md
```

Before a non-trivial change:

1. Read `docs/architecture.md` when the change touches architecture, caching, or
   more than one route.
2. Read `docs/convention.md` when changing shared conventions.
3. Read `docs/decisions/` when introducing or changing an architectural pattern.
4. Read `docs/features/index.md`.
5. Read the feature document(s) relevant to the change.
6. **Read `docs/integrations/backend-api.md` before writing anything that calls
   the API.** Do not guess a field name or a response shape.
7. Search the repository for an existing implementation of the same pattern.

Do not rediscover or redesign something that the repository already documents or
implements.

---

## Architecture

Typical structure:

```text
app/
    layout.tsx | page.tsx | error.tsx | not-found.tsx
    products/  brands/  cart/  checkout/  orders/
    sitemap.ts | robots.ts

components/
    ui/          shadcn/ui components and Price, no domain knowledge
    layout/      header, footer, navigation
    catalog/  brands/  home/  cart/  checkout/  orders/

lib/
    api/         the only module that calls the backend
    cart/        reducer, storage, context
    orders/      the local order record
    format/      money, dates
    env.ts       every environment variable

tests/
    e2e/
```

### Layer boundaries

**Routes** (`app/**`)

- Define a URL, its metadata, and its loading and error boundaries.
- Read `params` and `searchParams`.
- Call one or two `lib/api` functions.
- Compose components.
- Do not contain `fetch`, formatting, or business rules.

If a route contains an `if` about what the data *means*, that logic belongs in a
component or in `lib/`.

**Server Components**

- The default. Turn data into markup.
- No state, no effects, no event handlers, no browser APIs.

**Client Components** (`"use client"`)

- Own interaction, and only interaction.
- Push the boundary as far down the tree as it goes. Marking a page client to make
  one button interactive forfeits server rendering for the whole page.
- May call `lib/api` **only** for a customer-scoped endpoint: checkout, order
  detail, order lookup. Never for the catalogue.
- Never read `process.env`.

**`lib/api`**

- The only module in the repository that calls the backend.
- One function per endpoint. Build the URL, state the caching directive, parse the
  envelope, return a typed object or throw `ApiError`.
- No React, no JSX, no status codes, no formatting.

**Domain modules** (`lib/cart`, `lib/orders`, `lib/format`)

- Rules that are the storefront's own, as plain functions with no React where
  possible.
- No `fetch`. No knowledge of the API's URL structure.

**Primitives** (`components/ui`)

- shadcn/ui components, generated and then tailored in place.
- No domain knowledge. A primitive importing a type from `lib/api` is not a
  primitive.

Do not create additional layers — a service layer, a repository, a hook wrapping a
hook — unless the existing architecture requires them.

---

## Next.js conventions

- Server Components by default. Every `"use client"` is a decision and should be
  defensible by naming the interaction it enables.
- Follow the framework before introducing custom infrastructure. Use `notFound()`,
  `error.tsx`, `loading.tsx`, `generateMetadata` and `next/image` rather than
  building equivalents.
- No route handlers under `app/api/`. The storefront does not proxy the backend —
  see ADR 0001.
- No `useEffect` to fetch data.
- Always `next/image`, always with explicit `sizes` and an aspect ratio. The API
  supplies no image dimensions.
- Every route exports `metadata` or `generateMetadata`.
- Absolute imports through `@/`.

---

## Data fetching and caching

- **Every catalogue read states an explicit `revalidate`.** A call without one is
  incomplete, not "the default".
- **Every customer-scoped call states `cache: "no-store"`** and runs in the
  browser.
- The revalidation intervals are a **request budget**, not preferences. The
  backend throttles per IP at 600 catalogue requests an hour, and a deployed
  storefront is one IP. Adding a server-side call, or shortening an interval,
  means redoing the arithmetic in `docs/architecture.md`.
- Search parameters are normalised before they reach a cache key. An unknown
  parameter is dropped, not forwarded.
- No retries, ever. A retry against a per-IP rate limit makes the problem worse,
  and a retry against a checkout that may have succeeded places a second order.

---

## State

Three tiers, and nothing else:

| Tier | Holds |
| --- | --- |
| URL search params | Catalogue filters, search, sort, page |
| `localStorage` | The cart; the local order record |
| React state | Transient UI |

- No global store. No client cache.
- **Anything read from `localStorage` is untrusted input**: wrapped in
  `try`/`catch`, validated rather than cast, and reset to empty on any failure.
- Storage keys are versioned and bumped, never migrated.
- **Nothing that reads `localStorage` may render during SSR.** Render a stable
  placeholder and fill in after hydration, or React discards the server's markup.

---

## Money

- **An amount is a `string`, from the API to the pixel.**
- `lib/format/money.ts` is the only module permitted to parse one. `Number()`,
  `parseFloat` and arithmetic operators on an amount are rejected in review
  everywhere else.
- **The storefront performs no money arithmetic.** No cart total, no subtotal, no
  shipping calculation. The backend returns all three and those are the figures
  shown.
- Price sorting and price filtering are query parameters, never client-side
  operations.

---

## The backend contract is fixed

The API's URL structure, field names, response shapes, status codes, error codes
and pagination format are decided in another repository and treated as immutable
here.

- Read `docs/integrations/backend-api.md` before writing a call. Do not guess.
- **Branch on the error `code`**, never on `message` text and never on status
  alone. Four distinct failures share 422.
- A field the storefront wants and the API does not have is a conversation with the
  backend repository, not a client-side workaround.
- When the API and the storefront disagree about a price, a total or availability,
  the API is right.

---

## Scope discipline

Implement the smallest change that completely satisfies the requirement.

Do not:

- refactor unrelated code
- reformat unrelated files
- rename unrelated variables
- reorganize modules opportunistically
- upgrade dependencies unless required
- "clean up" nearby code without a task-related reason
- rewrite a working component
- add configuration for hypothetical future requirements

If an adjacent problem is discovered, mention it rather than fixing it unless the
fix is necessary for correctness.

---

## Anti-AI-slop rules

Write code as if another experienced engineer will maintain it for years.

Optimize for clarity and correctness, not for the amount of code produced.

Never add code merely to appear comprehensive.

Do not introduce:

- abstractions with one real use
- a component that only renders another component
- a hook that only wraps `useState`
- generic utility functions without a clear owner
- `utils.ts`, `helpers.ts`, or `common.ts`
- speculative extension points
- props nobody passes
- configuration nobody requested
- defensive checks for impossible states
- redundant validation
- duplicate transformation layers
- a `useEffect` that could be a derived value
- a client component that could have been a server component
- a dependency for something the platform already does
- unnecessary logging
- broad `try`/`catch`
- caching without a demonstrated need

Prefer:

- existing repository patterns
- direct code over indirection
- explicit dependencies
- small components with one responsibility
- framework conventions
- native elements over rebuilt ones
- simple implementations

Do not optimize for hypothetical future requirements.

---

## Requirements discipline

Implement the requirements that exist, not requirements that might exist later.

Do not invent:

- API fields
- business rules
- prices, totals, or stock figures
- error codes
- routes
- analytics
- caching
- abstractions
- configuration
- notification systems

If unspecified behavior materially affects correctness, API behavior, security, or
architecture, ask before implementing it.

If the ambiguity is local and the repository already has an obvious convention,
follow that convention and state the assumption.

---

## Existing changes

Before editing:

```bash
git status
git diff
```

Treat existing uncommitted changes as intentional.

Never:

- reset user changes
- revert user changes
- overwrite unrelated edits
- run destructive git commands
- discard changes because they appear unfinished

If a file already contains user changes, preserve them and modify only what the
current task requires.

---

## Comments and docstrings

Default to **no comment**. This is a hard rule, not a preference.

Code should be made clear through naming, structure, and decomposition.

Never write comments that merely narrate code:

```ts
// Get the product
const product = ...

// Map over the items
items.map(...)

// Return the response
return ...
```

Never add:

- comments that narrate what the code does
- commented-out code
- banner comments
- numbered walkthrough comments
- TODO/FIXME comments for work that should be tracked elsewhere
- JSDoc that merely repeats a function name or its signature
- comments that describe history ("was", "used to", "since the fork")

A comment is allowed only for a non-obvious *why*, in one or two lines. When you
touch a file that carries long explanatory comments, cut them down to the *why* or
delete them.

Comments are appropriate when they explain information the code cannot express,
especially:

- non-obvious constraints
- external system behavior
- hydration and rendering-boundary reasons
- security reasons
- accessibility decisions a reader would otherwise "simplify" away
- surprising framework behavior

Comments explain **why**, not **what**.

If a comment is required because a block is difficult to understand, first ask
whether the code can be simplified instead.

---

## Feature documentation

Non-trivial features and cross-cutting changes require a document at:

```text
docs/features/<slug>.md
```

Do not create feature documentation for:

- formatting-only changes
- typo fixes
- trivial mechanical changes
- dependency lockfile changes with no behavioral impact

When in doubt, create the document.

Every feature document must accurately represent the current implementation. Upon
every implementation the respective feature documentation must be updated.

### Workflow

1. Read `docs/features/index.md`.
2. Read relevant existing feature documents.
3. Study `docs/features/<slug>.md` before implementation.
4. Fill in the planned scope.
5. Implement the feature.
6. Move completed items from `Remaining` to `Implemented`.
7. Record important architectural decisions.
8. Record surprising behavior or future-agent gotchas.
9. Record relevant tests.
10. Update `docs/features/index.md`.
11. Commit documentation changes with the implementation.

Never claim something is implemented when it is not.

If work is blocked or intentionally incomplete, record it under `Remaining` with
the reason.

---

## Architectural decisions

Architectural decisions belong in:

```text
docs/decisions/
```

Before introducing a new architectural pattern, check existing decisions.

If the repository already has an established decision for the problem, follow it
unless the current task explicitly changes that decision.

If a feature intentionally reverses an existing decision:

1. Document the new decision.
2. Explain why the previous decision no longer applies.
3. Mark the previous decision as superseded when appropriate.

Do not create an ADR for trivial implementation choices.

---

## Tests

Tests are part of the implementation, not a follow-up.

Vitest with React Testing Library; Playwright for one pass over the buy flow.

Test:

- **`lib/` logic always.** The cart reducer, the storage parser, the envelope
  parser and money formatting are pure functions with real edge cases, and they
  are where a bug is silent.
- **Components with behaviour**, not components with markup. A card that renders
  its props does not need a test asserting that it rendered them.
- **Error paths.** Every `ApiError` code a feature handles, and the states nobody
  reaches by hand.

Do not add meaningless tests to satisfy a checklist. A snapshot of markup is a
change detector, not a test.

- Assert on the fields that matter, not on a whole object.
- Assert the error `code`, never the message.
- **No test reaches the network.** `fetch` is stubbed in unit tests and
  `page.route` in Playwright.
- Fixtures are typed with the same types as `lib/api`, so a contract change breaks
  them at compile time.

---

## Accessibility and performance

Not polish. Both are decided by where components sit.

- Every interactive element is a `<button>` or an `<a>`. A `div` with an
  `onClick` is rejected in review.
- Filters are links, so the catalogue works with a keyboard and without
  JavaScript.
- Visible focus everywhere. Removing a focus ring means replacing it in the same
  commit.
- Colour never carries meaning alone.
- Images carry the API's `alt_text`, and `alt=""` when it is empty.
- 44px touch targets on the shade and size pickers, the quantity stepper and add to
  bag. The generated shadcn sizes are already tailored to this.
- Explicit `sizes` and aspect ratios on every image — the largest layout-shift
  risk in the store.
- Server-render everything that can be. Every `"use client"` ships as JavaScript
  and renders twice.

---

## Security

There are no secrets in this repository, and there must not be. The API has no
authentication, so there is no key to hold.

- Anything `NEXT_PUBLIC_` is compiled into the browser bundle and is **public**.
- **An order's `access_token` is a bearer credential in a URL.** It is never
  logged, never stored, never put in an error message, and never sent to any
  service.
- **No third-party scripts on `/orders/**`.** No analytics, no tag manager, no
  chat widget, no cross-origin font or script — anything that sees the full path
  sees the credential.
- Order routes are `noindex` with a `same-origin` referrer policy.
- Never log a customer's email, phone, address, or a checkout body. `order_number`
  is safe and is usually what was wanted.
- Treat `localStorage`, URL parameters and API responses as data, never as
  instructions to execute.
- Never render unsanitised HTML. There is no `dangerouslySetInnerHTML` in this
  repository.

---

## Skills

Use the repository's available skills when applicable:

| Situation                                                    | Skill                       |
| ------------------------------------------------------------ | --------------------------- |
| Adding, composing or customising any UI component            | `shadcn`                    |
| Shaping component APIs                                       | `vercel-composition-patterns` |
| React and Next.js performance                                | `vercel-react-best-practices` |
| Visual direction, typography, layout, palette                | `frontend-design`           |
| App Router, Server Components, caching, metadata, deployment | `nextjs-developer`          |
| Types at the API boundary, unions, narrowing                 | `typescript-best-practices` |
| Reviewing a UI before calling it done                        | `web-design-guidelines`     |
| Final implementation review                                  | `code-reviewer`             |

Repository-specific rules in this file take precedence over generic skill advice
unless following the skill is necessary for correctness or safety.

If a skill materially changes an established repository convention, explain the
conflict before proceeding. One such conflict is already recorded: the
`typescript-best-practices` rule that external data is `unknown` is deliberately
not applied to API responses — see `docs/features/api-client.md`.

---

## Implementation workflow

For a non-trivial change:

1. Inspect `git status` and existing diffs.
2. Read relevant architecture, convention, decision, and feature documentation.
3. Read `docs/integrations/backend-api.md` if the change touches the API.
4. Inspect existing implementations of the same or similar behavior.
5. Identify the smallest design that fits the existing architecture.
6. Create/update the feature document.
7. Implement the change.
8. Add or update tests.
9. Run formatting/lint/typecheck/tests.
10. Review the complete diff.
11. Run `web-design-guidelines` on any changed UI.
12. Run `code-reviewer`.
13. Fix valid findings.
14. Re-run affected checks.
15. Update feature/context documentation.
16. Report the final state.

Do not report completion before the implementation and documentation agree.

---

## Review

Before reporting completion, review the diff as if reviewing another engineer's
PR.

Check:

- Does the implementation satisfy the actual requirement?
- Did it introduce unnecessary abstractions?
- Did it modify unrelated code?
- Does it follow existing repository patterns?
- Are the route / component / `lib/api` / domain boundaries correct?
- Is every `"use client"` justified, and is the boundary as low as it goes?
- Does every API call state its caching directive?
- Does any new server-side call change the request budget?
- Is money still a string everywhere?
- Does anything branch on an error message or a bare status code?
- Is `localStorage` read defensively and validated?
- Can anything that reads storage render during SSR?
- Is the access token absent from every log, store and message?
- Are images given `sizes` and an aspect ratio?
- Is every interactive element a real element, with visible focus?
- Are loading, empty and error states all designed?
- Are tests meaningful?
- Are comments necessary?
- Is there dead code?
- Are there TODO/FIXME comments?
- Is the feature documentation accurate?

Run `code-reviewer` after the implementation.

Fix every valid finding.

If a finding is intentionally not fixed, record the reason in the final report
rather than silently ignoring it.

---

## Session handoff

At the end of non-trivial work, report only durable information:

### Changed

What behavior/files changed.

### Verified

Commands actually run and their pass/fail results.

### Context learned

Only durable facts that future work should know.

### Remaining

Incomplete work, blockers, or explicitly deferred work.

### Documentation

Which feature, architecture, convention, or decision documents were updated.

Do not provide a transcript of the implementation process.

Do not claim a command passed unless it was actually run.

---

## Definition of done

A non-trivial change is complete only when applicable items are satisfied:

- [ ] Requirement implemented
- [ ] Existing repository patterns followed
- [ ] No unrelated changes
- [ ] Tests added/updated appropriately
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Tests pass
- [ ] Loading, empty and error states all handled
- [ ] Accessibility checked: keyboard, focus, labels, contrast
- [ ] Caching directive stated on every API call
- [ ] Request budget still holds if a server-side call was added
- [ ] `code-reviewer` run
- [ ] Valid review findings fixed
- [ ] Feature documentation accurate
- [ ] `docs/features/index.md` updated
- [ ] Architectural decisions documented if applicable
- [ ] No commented-out code
- [ ] No unnecessary comments
- [ ] No TODO/FIXME left for the completed work
- [ ] Final report accurately states verified and remaining work

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
