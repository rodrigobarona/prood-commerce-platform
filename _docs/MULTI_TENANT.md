# Multi-Tenant Platform

This repo runs as a white-label, multi-tenant commerce platform: one set of
deployments serves many merchant stores. Each store is an **organization**
(Better Auth org plugin), and all commerce data is isolated per organization by
**Postgres row-level security (RLS)**.

```
Better Auth org (tenant)
   └─ withTenant(orgId)  →  SET app.current_org_id  (per-request transaction)
        └─ Forced RLS filters every row by organization_id
```

- **Dashboard** (`apps/dashboard`) — merchants sign in, pick an active org, and
  manage their store. Every data call runs inside `withActiveOrg()`.
- **Storefront** (`apps/storefront`) — resolves the tenant from the request host
  and threads `tenantId` into every `@prood/commerce` call.
- **Platform** (`packages/platform`) — owns the commerce schema, the
  `withTenant()` tenant scope, and `applyTenantIsolation()` (RLS).

## Domain architecture

Prood uses a **Vercel-style split** between the company domain and tenant store URLs:

| URL | App | Purpose |
| --- | --- | --- |
| `prood.com` | `apps/web` | Marketing |
| `dashboard.prood.com` | `apps/dashboard` | Merchant admin |
| `api.prood.com` | `apps/api` | Commerce API |
| `checkout.prood.com` | `apps/checkout` | Hosted checkout (`/c/{sessionId}`) |
| `docs.prood.com` | `apps/docs` | Documentation |
| `{slug}.prood.app` | `apps/storefront` | Free store subdomain (automatic) |
| `shop.client.com` | `apps/storefront` | Optional store custom domain |

`NEXT_PUBLIC_PLATFORM_DOMAIN=prood.app` is **only** the apex for merchant storefront subdomains — not for dashboard or API hosts.

## How tenant resolution works

| Surface | Source of tenant | Mechanism |
|---------|------------------|-----------|
| Dashboard | active org on the session (`session.activeOrganizationId`) | `withActiveOrg()` → `withTenant()` |
| Storefront | request host | `resolveTenantId()` → `tenantId` arg → `runScoped()` → `withTenant()` |

Storefront host resolution (`apps/storefront/lib/tenant.ts`):

1. Custom domain → `tenant_domain` table (verified rows).
2. `{slug}.{NEXT_PUBLIC_PLATFORM_DOMAIN}` subdomain → `organization.slug`.
3. Fallback → `DEFAULT_TENANT_ORG_ID` (the seeded demo store).

Catalog reads are cached **per tenant** (`products-<org>`, `categories-<org>`,
`store-<org>`), so caching never crosses tenants.

## Environment variables

Shared:

- `DATABASE_URL` — Neon Postgres (all apps share it).
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — Better Auth.
- `DEFAULT_TENANT_ORG_ID` — explicit fallback tenant (single-tenant/dev). When
  unset, unmatched hosts 404 in production.
- `NEXT_PUBLIC_PLATFORM_DOMAIN` — apex used for `{slug}.platform` subdomains.
- `INTEGRATION_ENCRYPTION_KEY` — key for encrypting stored provider credentials
  at rest (falls back to `BETTER_AUTH_SECRET`; set a dedicated key in production).

Dashboard (custom domains via Vercel — optional in dev):

- `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` (storefront project), `VERCEL_TEAM_ID`.

Commerce seed:

- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — initial platform admin.

## First-time setup

```bash
# 1. Install
pnpm install

# 2. Commerce schema + RLS + demo seed (tags data with DEMO_ORG_ID = "org_demo")
pnpm db:migrate           # runs migrateDrizzle -> applyTenantIsolation + seed

# 3. Auth + org + tenant_domain + integration_config tables
pnpm --filter dashboard db:push

# 4. Run
pnpm dev                  # storefront :3000, checkout :3004, dashboard :3002
```

`applyTenantIsolation()` (in `packages/platform/.../drizzle/migrate.ts`) adds an
`organization_id` column (defaulting to `current_setting('app.current_org_id')`)
to every tenant table, then `ENABLE` + `FORCE`s RLS with a `tenant_isolation`
policy. `store_info` and tenant tables use the session variable, so inserts must
run inside `withTenant()`.

## Onboarding a new merchant

1. Register in the dashboard → creates a user + first organization (the store).
2. The org id becomes the tenant key for all their commerce data.
3. Add a domain in **Domains** (subdomain is automatic; custom domains use the
   Vercel SDK + DNS verification, recorded in `tenant_domain`).
4. The storefront, served at that host, resolves to the org and shows the store.

## Verifying isolation (do this against a real DB)

1. Create two orgs (A and B) in the dashboard; add a product to each.
2. With `app.current_org_id = A`, confirm only A's product is visible:
   ```sql
   SELECT set_config('app.current_org_id', '<org A id>', false);
   SELECT id, name, organization_id FROM products;   -- only A's rows
   ```
3. Switch to B and confirm only B's rows return.
4. With no setting, RLS returns zero rows (writes are blocked too) — proof that
   any code path forgetting `withTenant()` fails closed rather than leaking.

## Per-tenant payments

Payment credentials configured in the dashboard (`integration_config`) flow
into the provider factory at runtime:

- `getPaymentProvider(id, config?)` builds a provider from a tenant's stored
  credentials, falling back to env vars per field.
- The storefront sends `tenantId` when creating a checkout session; the checkout
  host persists it on the session and rebuilds the provider with the tenant's
  credentials (and publishable key) on pay/confirm.
- Provider registry field keys (`lib/providers.ts`) match the provider
  constructor params, so stored config maps directly.
- Webhooks are routed per tenant (`/api/webhooks/[provider]/[org]`) and verified
  against the merchant's stored secret.

## Package security audit (secure-by-design)

Every package was reviewed for cross-tenant leakage. Posture by package:

| Package | Touches tenant data? | Status |
|---------|----------------------|--------|
| `platform` | Yes — owns commerce schema | Isolated by forced RLS + `withTenant()` |
| `commerce` | Yes — wraps platform | Tenant threaded; per-tenant cache tags; per-tenant payments |
| `checkout-host` | Yes — checkout sessions | `tenantId` stored on session; provider rebuilt per tenant |
| `checkout` | Per-session state machine | New instance per session; no module-level mutable state |
| `payment-stripe` / `-easypay` / `-ifthenpay` | Credentials only | Stateless; config injected per tenant via the factory |
| `storage-vercel-blob` / `storage-s3` | File uploads | Tenant-namespaced via `uploadForTenant()` |
| `types`, `ui`, `eslint-config`, `typescript-config` | No | Safe |

> Legacy/dead packages `@prood/core` and `@prood/webhook-verifier`, and
> the platform's dormant Prisma backend + legacy query layer, were removed — the
> only commerce engine in the runtime path is `@prood/platform` (Drizzle).

### Secure-by-design measures (implemented)

1. **Secrets at rest.** `integration_config.config` values are encrypted with
   AES-256-GCM (`packages/commerce/src/crypto.ts`, `encryptConfig`/
   `decryptConfig`) using `INTEGRATION_ENCRYPTION_KEY` (falls back to
   `BETTER_AUTH_SECRET`). The dashboard encrypts on write and decrypts on read;
   the commerce layer decrypts when building providers. Values without the
   `enc:v1:` prefix are treated as plaintext (dev / migration).
2. **Storage key namespacing.** `uploadForTenant(orgId, input)` and
   `tenantStorageDirectory(orgId, …)` prefix every key with `org/<orgId>/…` so
   merchants can't collide with or read each other's assets; Vercel Blob uploads
   use `addRandomSuffix` for unguessable URLs. Always upload via these helpers.
3. **Per-tenant webhooks.** Provider webhooks are routed per tenant at
   `/api/webhooks/[provider]/[org]`; `verifyPaymentWebhook(payload, sig,
   provider, org)` verifies against the merchant's stored secret (env fallback
   when org is `_`). The checkout host registers the org-scoped webhook URL on
   each session.
4. **Unknown-host fallback.** `resolveTenantId()` serves a store only for a
   resolved host or an explicit `DEFAULT_TENANT_ORG_ID`; an unmatched host
   returns `notFound()` in production (demo store only in development).

## Maintenance follow-ups

- **Notifications** (Resend/SMTP) have no runtime factory in the Next stack yet;
  when one is added, read credentials from `integration_config` the same way
  payments do.
- When adding a new tenant-owned table, add it to `TENANT_TABLES` in
  `packages/platform/src/database/drizzle/migrate.ts`; if its natural key repeats
  across tenants, include `organization_id` in the primary key (see `store_info`
  and `integrations`).
