# Prood

Production commerce platform built as a **pnpm + Turborepo** monorepo on
**Next.js 16 / React 19**, **Neon Postgres + Drizzle**, **Better Auth**,
**Upstash Redis**, and Vercel.

## Architecture

```
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
  Better Auth sessions directly from the database and is gated by
  `ADMIN_USER_IDS`.

## Getting Started

```bash
pnpm install
cp .env.example .env.local
pnpm env:link
pnpm db:setup
pnpm dev
```

`pnpm env:link` generates ignored `apps/*/.env.local` files from the root
`.env.local`, with local `BETTER_AUTH_URL` overrides per app. Requires Node 24
and pnpm 10.33.4.

## Scripts

- `pnpm dev` — run all apps through Turbo.
- `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` — quality gates.
- `pnpm verify` — lint, typecheck, test, and build.
- `pnpm db:migrate` — migrate and seed the platform commerce schema.
- `pnpm db:auth` — apply Better Auth/admin/agent auth SQL migrations.
- `pnpm db:setup` — full local database bootstrap.

`@prood/platform` tests run real database migrations and require `DATABASE_URL`
pointing at a disposable test database.

## Deployment

Deploy each app as a separate Vercel project sharing the same Neon database:

| App | Production URL | Notes |
| --- | --- | --- |
| `apps/web` | `https://prood.com` | Marketing site |
| `apps/dashboard` | `https://dashboard.prood.com` | Merchant dashboard |
| `apps/api` | `https://api.prood.com` | Auth issuer, REST API, MCP |
| `apps/checkout` | `https://checkout.prood.com` | Hosted checkout + payment webhooks |
| `apps/docs` | `https://docs.prood.com` | Documentation |
| `apps/storefront` | `https://{slug}.prood.app` | Wildcard tenant storefront |
| `apps/admin` | `https://admin.prood.com` | Platform ops, restrict via `ADMIN_USER_IDS` |

Production must provide strong values for `BETTER_AUTH_SECRET`,
`CHECKOUT_API_SECRET`, and `INTEGRATION_ENCRYPTION_KEY`; verified sender
configuration for `RESEND_FROM_EMAIL`; Upstash Redis for checkout sessions; and
`STOREFRONT_VERCEL_PROJECT_ID` for dashboard domain automation.

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
