# @prood/platform

The built-in Prood commerce engine — tenant-scoped Postgres (Neon) with Drizzle ORM and row-level security. No external commerce SaaS required.

## When to use

- **Production storefronts** — multi-tenant catalog, cart, checkout, and orders on Neon
- **Development** — same schema as production via `pnpm db:setup`
- **Reference implementation** — full `CommerceAdapter` + admin API

## Installation

```bash
pnpm add @prood/platform @prood/types
```

## Quick start

```typescript
import { initDrizzle, migrateDrizzle, seedDrizzle, createPlatformAdapter } from '@prood/platform'

// 1. Connect to Neon
initDrizzle(process.env.DATABASE_URL!)
await migrateDrizzle(process.env.DATABASE_URL!)
await seedDrizzle()

// 2. Create the adapter (scoped per request via withTenant)
const { adapter } = createPlatformAdapter({ currency: 'EUR' })

// 3. Use the CommerceAdapter interface
const products = await adapter.getProducts({ limit: 10 })
const cart = await adapter.createCart()
```

In apps, prefer `@prood/commerce` (`getAdapter()`, `withTenant(orgId, fn)`) rather than calling the platform directly.

## Database

| Concern | Implementation |
| --- | --- |
| Driver | `@neondatabase/serverless` + Drizzle |
| Tenancy | `app.current_org_id` session variable + RLS on tenant tables |
| Migrations | `packages/platform/src/database/drizzle/migrate.ts` via `pnpm db:setup` |
| Auth tables | Better Auth (`user`, `session`, `organization`, …) in the same database |

## Customer identity

Commerce buyers are referenced by **internal UUID** (`customers.id`). Better Auth linkage is `customers.auth_user_id` only — email lives in Better Auth and is joined at read time for merchant UI. See [Privacy & data](/docs/architecture/privacy-data).

## Implemented domains

| Domain | Status |
| --- | --- |
| Catalog, cart, checkout, orders | ✅ |
| Customers (addresses; auth via Better Auth) | ✅ |
| Store, brands, countries, wishlist, reviews, promotions, returns | ✅ |
| Wholesale, auctions, rentals, gift-cards, locations | Not supported (`NOT_SUPPORTED`) |

## Scripts

```bash
pnpm db:migrate      # Run migrations
pnpm db:migrate:seed # Migrate + seed demo org
```

From repo root:

```bash
pnpm db:setup   # migrate + seed commerce, auth tables, demo org + admin user
```

Requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` for the auth seed step. Commerce catalog and auth org both use `org_demo` — set `DEFAULT_TENANT_ORG_ID=org_demo` for local storefront resolution.

## Package layout

```
packages/platform/src/
├── adapter.ts           # createPlatformAdapter
├── admin/               # Dashboard admin API
├── customers/identity.ts
├── database/drizzle/    # Schema, queries, migrate, seed
├── domains/             # Catalog, cart, checkout, orders, …
└── tenant/lookup.ts     # Host → organization resolution
```
