# next-commerce

A commerce-agnostic storefront built with **Next.js 16 / React 19**, ported from
the Commerce.js Nuxt reference storefront. Turborepo + pnpm monorepo, Node 24,
deployed on Vercel + Neon Postgres.

## Architecture

```
apps/
  storefront/              # Next.js 16 storefront (App Router) — port of apps/storefront
packages/
  commerce/                # @workspace/commerce — server-only data layer
  ui/                      # @workspace/ui — shadcn/Radix + 33 commerce components
  # vendored, framework-agnostic Commerce.js packages:
  types/ core/ checkout/ platform/ webhook-verifier/
  storage-s3/ storage-vercel-blob/
  payment-stripe/ payment-easypay/ payment-ifthenpay/
```

- **Data layer** (`@workspace/commerce`) wraps a pluggable `CommerceAdapter`.
  The built-in **platform** adapter (Neon Postgres + Drizzle) is the default and
  is swappable via `COMMERCE_ADAPTER` (medusa/salla seams included).
- **Payments** are gateway-agnostic (`PaymentProvider`): **Stripe** (embedded
  Payment Element) is the default; **Easypay** and **Ifthenpay** cover Portugal
  (Multibanco, MB WAY, card). Webhooks live at `/api/webhooks/{provider}`.
- **Storage** is pluggable via `STORAGE_PROVIDER`: **Vercel Blob** (default) or
  S3-compatible (**Cloudflare R2**, AWS, MinIO).
- **Auth** uses **Better Auth** on the same Neon database (Drizzle), behind a
  `getSession()` seam so WorkOS AuthKit / Clerk can be swapped via `AUTH_PROVIDER`.

## Getting started

```bash
pnpm install
cp .env.example apps/storefront/.env.local   # fill in DATABASE_URL etc.
pnpm db:setup                         # migrate + seed commerce, create auth tables
pnpm dev
```

Requires Node >= 24 and pnpm 10.

## Scripts

- `pnpm dev` — run the storefront
- `pnpm build` / `pnpm typecheck` / `pnpm lint` — Turbo pipelines
- `pnpm db:migrate` — migrate + seed the commerce (platform) schema
- `pnpm db:auth` — push the Better Auth schema
- `pnpm db:setup` — both of the above

## Deployment (Vercel)

1. Provision **Neon Postgres** via the Vercel marketplace integration → sets `DATABASE_URL`.
2. Set the env vars from `.env.example` in the Vercel project.
3. Run `pnpm db:setup` once (locally against the prod DB, or as a deploy step).
4. Configure payment webhooks to `/api/webhooks/{stripe,easypay,ifthenpay}`.
5. Deploy (`turbo build`). Catalog data uses Cache Components (`cacheComponents: true`)
   with `'use cache'` + `cacheTag`/`cacheLife` on `@workspace/commerce` catalog
   queries (SWR: home/store 3600s, products/categories 600s). Cart/checkout/
   account stay dynamic via cookies/session.

## Adding UI components

```bash
pnpm dlx shadcn@latest add <component> -c packages/ui
```

Commerce components live in `packages/ui/src/components/*` and are imported as
`@workspace/ui/components/<name>`.

## Roadmap

### Apps (vs upstream `_context/repo-clone/apps`)

| Upstream app                            | Status in this repo                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **`storefront`**                        | **Ported** → `apps/storefront` (Next.js 16 / React 19)                                            |
| `hosted-checkout`                       | Not ported — checkout lives inside `apps/storefront` (`/checkout`, embedded Stripe + PT gateways) |
| `dashboard`                             | Not ported — planned (commercejs.cloud admin)                                                     |
| `docs`                                  | Not ported — planned                                                                              |
| `landing-page`, `pitch-deck`, `cloud-*` | Not ported — static marketing sites                                                               |

- CMS integration (Sanity / Payload) for marketing content — the data layer and
  page structure are designed to compose CMS content alongside commerce data.
- Full server-side card capture flows; admin dashboard.
