# Clothing Store — Storefront

Next.js 16 storefront for the clothing store. It consumes the Django REST API in
the sibling `backend/` repository and owns no data of its own.

Read [`CLAUDE.md`](CLAUDE.md) before your first change, then
[`docs/architecture.md`](docs/architecture.md),
[`docs/convention.md`](docs/convention.md), and
[`docs/integrations/backend-api.md`](docs/integrations/backend-api.md).

## Requirements

- Node.js 22 (pinned in `package.json` `engines`; Next 16 needs 20.9 or later)
- [Yarn 4](https://yarnpkg.com/) via Corepack — `corepack enable`
- The backend API running, locally or elsewhere

Yarn is the only supported entry point. npm, pnpm and bun are not supported.

The Yarn linker is set to `node-modules` in `.yarnrc.yml`, not Plug'n'Play. This
is required, not a preference: Next 16's Turbopack cannot resolve packages under
PnP and fails every build with "Could not find the Next.js package", and Vite —
and therefore Vitest — no longer supports PnP either.

## From clone to a running site

```bash
git clone <repo> && cd front-end

corepack enable
yarn install
cp .env.example .env.local        # then set the values below

yarn dev                          # http://localhost:3000
```

Playwright needs its browser once, before `yarn test:e2e`:

```bash
yarn playwright install chromium
```

Every variable in `.env.example` is required and has no default. A missing one
fails the build rather than rendering a page that half works.

### The catalogue will be empty at first

The backend's `size` and `color` lookup tables ship with no rows, and it has no
merchant admin yet. Until rows exist, no product variant can be created, so a
fresh local API serves an empty catalogue and the storefront correctly shows its
"not open yet" state.

Creating them is a backend task, through its Django shell. See that repository's
`docs/features/index.md`.

## Commands

| Command | Does |
| --- | --- |
| `yarn dev` | Development server on port 3000 |
| `yarn build` | Production build |
| `yarn start` | Serve a production build |
| `yarn lint` | ESLint |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn test` | Vitest, unit and component |
| `yarn test:e2e` | Playwright, the buy flow against a stubbed API |
| `yarn format` | Prettier, write |

Before calling work complete, run `yarn lint && yarn typecheck && yarn test`.

No test reaches the network. The suite runs with no backend, no database and no
connection.

## Environment

| Variable | Example | Notes |
| --- | --- | --- |
| `API_BASE_URL` | `http://localhost:8000` | Used by Server Components. Public HTTPS on Vercel; private only when self-hosting beside the API |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Used by the browser for checkout and the order routes. **Public** |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | The storefront's own origin, for canonical URLs and Open Graph |
| `NEXT_PUBLIC_BRAND_NAME` | `Threadline` | The wordmark and every page title. See ADR 0007 |
| `NEXT_PUBLIC_SHIPPING_NOTE` | `Rs 150 inside the Kathmandu valley, Rs 250 elsewhere.` | Display copy only. Must be kept in agreement with the backend's shipping settings by hand |

Every variable is read in `lib/env.ts` and nowhere else, so that one file lists
the whole configuration surface.

Anything prefixed `NEXT_PUBLIC_` is compiled into the browser bundle and is
public. There are no secrets in this repository and there must not be — the API
has no authentication, so there is no key to hold.

## Deploying to Vercel

The storefront is built for Vercel: the data cache and ISR are what keep the
catalogue inside the backend's request budget (`docs/architecture.md`).

### 1. Create the project

Import the repository in Vercel. The framework preset is detected as Next.js;
leave the build and install commands at their defaults. If this repository sits
inside a larger one, set **Root Directory** to the storefront's folder.

### 2. Set the environment variables

In **Settings → Environment Variables**, for Production (and Preview if you use
it):

| Variable | Production value |
| --- | --- |
| `API_BASE_URL` | The API's public HTTPS origin, e.g. `https://api.example.com` |
| `NEXT_PUBLIC_API_BASE_URL` | The same origin. Must be HTTPS, or the browser blocks checkout as mixed content |
| `NEXT_PUBLIC_SITE_URL` | The storefront's own origin, e.g. `https://shop.example.com`, with no trailing slash |
| `NEXT_PUBLIC_BRAND_NAME` | The brand name |
| `NEXT_PUBLIC_SHIPPING_NOTE` | The shipping copy, matching the backend's fees |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` — makes Vercel use the Yarn 4 pinned in `packageManager` rather than Yarn 1, which cannot read this lockfile |

- **`API_BASE_URL` cannot be a private address on Vercel.** Functions run
  outside your network, and Next refuses to optimise images from private
  addresses in production anyway.
- **`NEXT_PUBLIC_*` values are compiled in at build time.** After changing one —
  a new custom domain in `NEXT_PUBLIC_SITE_URL`, say — redeploy.
- **A missing variable fails the build** with a message naming it, by design.

### 3. Point the backend at the storefront

See [What the backend needs from you](#what-the-backend-needs-from-you) below:
`DJANGO_CORS_ALLOWED_ORIGINS` and `STOREFRONT_URL` must both be the production
origin. Preview deployments get a new URL each time, so checkout on a preview
only works if its origin is allowed too — test checkout on production or on a
fixed preview alias.

### 4. Turn off the Vercel Toolbar

**Settings → General → Vercel Toolbar → disable**, at least for Preview. The
toolbar is a third-party script injected into preview pages. On `/orders/…` it
would see a URL carrying an order's access token, which `CLAUDE.md` forbids any
third-party script from seeing. For the same reason, do not enable Vercel Web
Analytics or Speed Insights (`docs/features/seo-and-metadata.md`, "no
analytics").

### 5. After the first deploy, check

- `/robots.txt` disallows `/products?`, `/cart`, `/checkout` and `/orders`, and
  names the sitemap on the production origin
- `/sitemap.xml` lists the published products
- A product page shows its images. If they are broken, the API is serving media
  from a host that is not Cloudinary and not the API origin; add it to
  `images.remotePatterns` in `next.config.ts`
- A cash-on-delivery order goes through and reaches the confirmation page
- A Khalti test payment returns to `/orders/{token}`, and a cancelled one to
  `/orders/failed`

### 6. Keep the backend awake

The backend runs on Render's free tier, which puts the service to sleep after 15
minutes without a request. The next visitor then waits through a cold start of
about a minute. The storefront cannot prevent this: on Vercel its code runs only
when a visitor makes a request, and Vercel Hobby cron jobs run at most once a
day. The ping comes from an external monitor instead.

In [UptimeRobot](https://uptimerobot.com) (free; cron-job.org works the same
way), create a monitor:

- **Type:** HTTP(s)
- **URL:** `https://<backend>.onrender.com/health/`
- **Interval:** 5 minutes. Anything under 15 works; 5 still keeps the service
  awake if a check is missed.

Point it at `/health/` and nothing else. The liveness check touches nothing and
sits outside `/api/v1/`, so it uses none of the per-IP throttle budget.
`/health/ready/` queries the database and cache on every ping, and any
`/api/v1/` endpoint counts against the throttle.

- Render's free tier includes 750 instance-hours a month, and one service awake
  all month uses about 744. This works for **one** free service only.
- To check it works, open Render's logs after an hour: they should show `GET
  /health/` every five minutes, and the service should never show as spun down.
- Remove the monitor if the backend moves to a paid instance.

### What the build does

- Prerenders the home page, the product pages, `robots.txt` and `sitemap.xml`,
  calling the API. If the API is unreachable during the build, the build still
  succeeds: the home page shows "not open yet" and product pages render on
  first request, both refreshed within five minutes once the API answers.
- Sends security headers on every response (`next.config.ts`): `nosniff`,
  `DENY` framing, a `same-origin` referrer, a restrictive permissions policy and
  HSTS, plus `X-Robots-Tag: noindex` on `/orders/*`.

## What the backend needs from you

Two settings in the backend's environment must point at this storefront, or
customers will hit failures this repository cannot detect:

- **`DJANGO_CORS_ALLOWED_ORIGINS`** must include this storefront's origin.
  Checkout and the order routes are called from the browser, so without it they
  fail in production with a console error and no server-side trace. Local
  development already defaults to `http://localhost:3000`.
- **`STOREFRONT_URL`** must be this storefront's origin. After a Khalti
  payment the backend redirects the browser to `{that}/orders/{access_token}`,
  and to `{that}/orders/failed?reason=<code>` on failure. **Both routes must
  exist here** — nothing in either repository enforces it, and a mismatch lands a
  customer who has already paid on a 404.

## Documentation

```text
docs/
├── architecture.md          layers, caching, state, errors, constraints
├── convention.md            how the code is written
├── decisions/               eight ADRs governing this phase
├── features/                one document per feature, plus index.md
└── integrations/
    └── backend-api.md       the API contract, transcribed
```


`docs/features/index.md` is the inventory, the implementation order and the
status of every feature.
