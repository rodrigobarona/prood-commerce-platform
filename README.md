# Prood

Prood is an API-first, multi-tenant commerce platform: merchants and agencies
get stores on their own domains, checkout through their own Stripe, Easypay or
Ifthenpay accounts, and the same REST API, MCP server and Agent Auth that the
dashboard uses, with no cut of sales. It's a **pnpm + Turborepo** monorepo on
**Next.js 16 / React 19**, **Neon Postgres + Drizzle**, **Better Auth**,
**Upstash Redis** and Vercel. Brand and voice: [`_docs/BRAND.md`](_docs/BRAND.md).

## Architecture

```text
apps/
  storefront/              # Tenant storefront — :3000
  web/                     # Marketing site — :3001
  dashboard/               # Merchant dashboard — :3002
  docs/                    # Fumadocs documentation — :3003
  checkout/                # Hosted checkout — :3004
  api/                     # Commerce API, auth issuer, MCP — :3005
  admin/                   # Platform super-admin — :3006
packages/
  commerce/                # @prood/commerce — server-only commerce facade
  platform/                # @prood/platform — Neon/Drizzle engine + RLS
  auth/                    # Shared Better Auth schema/helpers
  api-client/              # OpenAPI typed client
  checkout/ checkout-host/ # Checkout state machine + Redis host
  payment-*/ storage-*/    # Payment and storage providers
  notification-resend/     # Resend email provider
  ui/ types/               # UI components and shared types
```

- **Commerce engine:** the only supported runtime engine is the built-in
  `platform` adapter (`@prood/platform`) backed by Neon Postgres and Drizzle.
- **Tenant isolation:** commerce data is scoped by Better Auth organization id
  and enforced through `withTenant(orgId)` plus database RLS.
- **API-centric apps:** storefront and dashboard use `@prood/api-client` against
  `apps/api`; dashboard only touches direct commerce helpers for integrations
  and domain automation.
- **Payments:** checkout supports Stripe, Easypay, and Ifthenpay through
  gateway-specific packages. Tenant credentials live in encrypted
  `integration_config` rows.
- **Auth:** dashboard merchant auth is issued by `apps/api`; storefront has its
  own customer auth handler per store origin; `apps/admin` validates shared
  Better Auth sessions directly from the database and is limited to the
  `admin` role.

## Getting Started

```bash
pnpm install
cp .env.example .env.local
pnpm env:link
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`pnpm env:link` generates ignored `apps/*/.env.local` files from the root
`.env.local` and writes the one-domain local URLs into each (see
[How prood.com is wired](#how-proodcom-is-wired)). Open the gateway at
<http://localhost:3001>, not the apps' own ports, so the dashboard, admin,
checkout, docs and API share one origin: the dashboard is then
<http://localhost:3001/dashboard>, the admin console
<http://localhost:3001/admin>, the docs <http://localhost:3001/docs> and the
hosted checkout <http://localhost:3001/pay>. `pnpm db:migrate`
applies the versioned migrations in `packages/platform/drizzle` (commerce and
Better Auth tables, the `prood_app` role and the RLS policies) and is a no-op
when the database is up to date. `pnpm db:seed` seeds the demo store
(`org_demo`, served at `prood-demo.localhost:3000`) and, when `ADMIN_EMAIL` /
`ADMIN_PASSWORD` are set, an admin user. Requires Node 24 and pnpm 10.34.9.

## Scripts

- `pnpm dev` — run all apps through Turbo.
- `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` — quality gates.
- `pnpm verify` — lint, typecheck, test, and build.
- `pnpm db:migrate` — apply pending database migrations (`drizzle-kit migrate`).
- `pnpm db:seed` — seed the demo store (idempotent).
- `pnpm db:generate` — after editing a Drizzle schema
  (`packages/platform/src/database/drizzle/schema/*` or
  `packages/auth/src/schema.ts`), generate the next migration. Use
  `pnpm db:generate --custom --name=<name>` for hand-written SQL.

`@prood/platform` tests need `DATABASE_URL` for a role that can create
databases: they create a temporary `prood_test_*` database on that server, run
the migrations and tests there, and drop it afterwards.

### Tenant isolation

Commerce tables carry `organization_id` and a `tenant_isolation` RLS policy.
`withTenant(orgId, fn)` opens a transaction, sets `app.current_org_id` and runs
`SET LOCAL ROLE prood_app` (NOLOGIN, NOBYPASSRLS, DML grants only), so queries
on those tables are filtered by the policy even though the connecting role
bypasses RLS. `prood_app` has no access to auth-owned tables at all; they are
read through the connecting role, so always filter those by organization. Code outside `withTenant()` (migrations, seed, tenant resolution
from the host, Better Auth) runs as the connecting role.

## How prood.com is wired

prood.com is one domain. `apps/web` owns it: its own pages are the marketing
site, and rewrites in `apps/web/next.config.ts` send every other path to the
Vercel project that serves it, so the address bar never leaves prood.com.

| Path on prood.com | App | Notes |
| --- | --- | --- |
| `/` and the other marketing pages | `apps/web` | The gateway itself |
| `/dashboard` | `apps/dashboard` | Merchant dashboard, `basePath: "/dashboard"` |
| `/admin` | `apps/admin` | Platform ops, `admin` role only, `basePath: "/admin"` |
| `/pay` | `apps/checkout` | Hosted checkout and payment webhooks, `basePath: "/pay"` |
| `/docs` | `apps/docs` | Documentation; its assets load from `/_docs/_next` |
| `/v1/*`, `/mcp` | `apps/api` | REST API and MCP server |
| `/api/auth/*` | `apps/api` | Sign-in API |
| `/.well-known/agent-configuration` | `apps/api` | Agent Auth discovery |
| `{store}.prood.app` | `apps/storefront` | Merchant stores, not on prood.com |

- **Zones.** Each app is its own Vercel project with its own `*.vercel.app`
  address. The gateway reaches it through `DASHBOARD_ORIGIN`, `ADMIN_ORIGIN`,
  `DOCS_ORIGIN`, `CHECKOUT_ORIGIN` and `API_ORIGIN`, set on the prood-web
  project only. A deployed `apps/web` build fails if one is missing; locally
  they default to the apps' ports.
- **One origin.** The session cookie belongs to prood.com, so a session started
  at the dashboard is also valid at the admin console and the API. An
  administrator should turn on two-factor or a passkey (see
  `_docs/compliance/open-items.md`).
- **Why stores are on another domain.** Merchants publish their own pages, and
  a browser treats everything on one domain as related. Keeping stores on
  prood.app stops store content from sharing cookies or storage with the
  dashboard, admin console and API sign-in.
- **Adding a zone.** Give the new app a `basePath` (as the dashboard, admin and
  checkout do) or an `assetPrefix` (as the docs do) so its files cannot collide
  with another app's `/_next`. Add a `*_ORIGIN` variable and its two rewrites
  (the bare path and `/path/:path*`) to `apps/web/next.config.ts`, add the path
  to the `PROXIED` pattern there so the gateway's security headers stay off the
  zone's responses, add the variable to `globalEnv` in `turbo.json`, and set it
  on the prood-web Vercel project.

## Deployment

Deploy each app as a separate Vercel project sharing the same Neon database.
The prood-web project holds the prood.com domain; the other projects are
reached through it and need no domain of their own, except the storefront,
which serves `*.prood.app` and its merchants' custom domains.

| App | Public address | Notes |
| --- | --- | --- |
| `apps/web` | `https://prood.com` | Marketing site and gateway |
| `apps/dashboard` | `https://prood.com/dashboard` | Merchant dashboard |
| `apps/api` | `https://prood.com/v1`, `/mcp`, `/api/auth` | Auth issuer, REST API, MCP |
| `apps/checkout` | `https://prood.com/pay` | Hosted checkout + payment webhooks |
| `apps/docs` | `https://prood.com/docs` | Documentation |
| `apps/storefront` | `https://{slug}.prood.app` | Wildcard tenant storefront |
| `apps/admin` | `https://prood.com/admin` | Platform ops, `admin` role only |

Production must provide strong values for `BETTER_AUTH_SECRET`,
`CHECKOUT_API_SECRET`, and `INTEGRATION_ENCRYPTION_KEY`; verified sender
configuration for `RESEND_FROM_EMAIL`; Upstash Redis for checkout sessions; and
`STOREFRONT_VERCEL_PROJECT_ID` for dashboard domain automation. The URL
variables, the gateway's `*_ORIGIN` variables and the passkey settings are
listed per project in the deployment guide (`apps/docs/content/docs/guides/deployment.mdx`).

## CI

GitHub Actions runs install, lint, typecheck, unit tests, and build. Platform DB
tests run in CI when `CI_DATABASE_URL` is configured.

## Adding UI Components

```bash
pnpm dlx shadcn@latest add <component> -c packages/ui
```

Commerce components live in `packages/ui/src/components/*` and are imported as
`@prood/ui/components/<name>`.

## Current Production Gaps

- SaaS subscription billing is not wired yet; plan limits are enforced from the
  local billing package and database plan value.
- Dashboard analytics and in-dashboard API key creation are placeholders.
- No PostHog/Sentry observability is wired yet.
- Marketing content is hardcoded/MDX; Sanity/Payload integration is not present.
