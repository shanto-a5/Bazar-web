# Bazar Web

The customer-facing website for Bazar — the same marketplace, accounts, cart,
checkout and orders as the Bazar mobile app, delivered as a server-rendered
Next.js site. It talks to the existing Bazar backend over the same public API
the mobile app uses; there is no second backend and no mock data.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS v4 (brand theme defined in `src/app/globals.css`)
- Public catalogue pages are server-rendered; authenticated pages run on the client

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env.local
   ```

   Set `NEXT_PUBLIC_API_BASE_URL` to the Bazar API origin and
   `NEXT_PUBLIC_SITE_URL` to this site's public origin (used for canonical URLs,
   `sitemap.xml` and JSON-LD). No secrets belong in these variables — they are
   public values only.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>. If port 3000 is busy, run
   `npx next dev --port 3001`.

## Build and run for production

```bash
npm run build
npm run start
```

## Quality checks

```bash
npm run lint     # ESLint (next/core-web-vitals + TypeScript rules)
npm run build    # type-checks, then builds
```

## Environment variables

| Variable                   | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the Bazar API (no trailing slash).                 |
| `NEXT_PUBLIC_SITE_URL`     | Public origin of this website, without a trailing slash.       |

## What is implemented

- **Public catalogue (SEO-friendly, server-rendered):** home, all products with
  search / category filter / pagination, category pages, product pages (with
  `Product` + `BreadcrumbList` JSON-LD, Open Graph, canonical URLs), and store
  pages. `robots.txt` and `sitemap.xml` are generated from the live catalogue.
- **Auth:** sign in, register, forgot password (emailed reset link) and reset
  password. The opaque bearer token is stored in `localStorage` under
  `bazar.auth.token` and sent as an `Authorization` header, exactly like mobile.
- **Cart & checkout:** cart with per-seller groups, quantity/selection editing,
  vouchers and delivery options; checkout with saved/new addresses, delivery and
  payment method selection, live totals preview and order placement. Optional
  "use my location" reverse-geocodes via OpenStreetMap Nominatim and always falls
  back to manual entry.
- **Account:** overview, orders list and detail (timeline, tracking, status),
  wishlist, addresses, notifications, reviews, followed stores, and profile &
  security (update details, change or set initial password, sign out everywhere).
- **Store following** and **wishlist** with optimistic UI where safe.

## Limitations

- Order-placement and other write flows call the production API; they were not
  exercised end-to-end to avoid creating real records.
- "Use my location" depends on the browser Geolocation API and OpenStreetMap
  Nominatim; if either is unavailable the form falls back to manual entry.
- Product images are rendered with a plain `<img>` (with a graceful fallback)
  rather than `next/image`, to accommodate the many remote image hosts.

## Project layout

- `src/app` — routes (App Router). Public catalogue under `catalogue`,
  `category/[id]`, `product/[id]`, `store/[id]`; private area under `account`,
  plus `cart` and `checkout`.
- `src/lib/api` — the single typed HTTP surface (`client.ts`, `bazar-api.ts`).
- `src/lib/shared` — pure rules ported from the mobile app (money, pricing,
  delivery, order status, catalogue rules).
- `src/lib` — domain types, config, formatting, labels and SEO helpers.
- `src/components` — shared UI and feature components.
