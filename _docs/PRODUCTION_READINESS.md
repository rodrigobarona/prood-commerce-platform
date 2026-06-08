# Production Readiness Audit

Date: 2026-06-08

## Scope

Audited the pnpm/Turborepo monorepo across all runtime apps and related packages:

- Apps: `storefront`, `web`, `dashboard`, `docs`, `checkout`, `api`, `admin`
- Core packages: `commerce`, `platform`, `auth`, `api-client`, `checkout`, `checkout-host`, payment providers, storage providers, email/notification packages, `ui`, `types`, and shared tooling

## Current Architecture

- Runtime engine: built-in `platform` adapter only, backed by Neon Postgres and Drizzle.
- Tenant isolation: Better Auth organizations, `withTenant(orgId)`, and forced RLS on commerce tables.
- Auth: `apps/api` issues merchant/auth sessions; `apps/storefront` owns customer auth per storefront origin; `apps/admin` validates shared sessions directly and requires `ADMIN_USER_IDS`.
- Checkout: `apps/checkout` stores sessions in Upstash Redis and forwards payment events to the Commerce API.
- Docs: Fumadocs under `apps/docs`, with OpenAPI synced at build time.

## Fixes Applied

- Added missing `apps/admin/eslint.config.js`.
- Added root `pnpm test` and included tests in `pnpm verify`.
- Added a Turbo `test` task and wired the existing `@prood/types` test file.
- Fixed `@prood/platform` tests to execute adapter calls inside tenant scope.
- Added `scripts/link-env.sh` to generate per-app local env files from root `.env.local`.
- Removed temporary auth debug endpoints from dashboard and admin.
- Removed hardcoded Better Auth build fallback secrets.
- Removed dead `COMMERCE_ADAPTER` / `AUTH_PROVIDER` config surfaces.
- Removed undocumented `AUTH_UPSTREAM_URL` and unsafe `VERCEL_PROJECT_ID` fallbacks.
- Required explicit Resend API key and sender configuration.
- Added GitHub Actions CI for install, lint, typecheck, unit tests, optional DB tests, and build.
- Updated README and docs to match the actual app/package/deployment state.

## Verification Baseline

Before fixes:

- `pnpm lint` failed on missing `apps/admin` ESLint config.
- `pnpm typecheck` passed.
- `pnpm test` was missing at the root.
- `pnpm -r --if-present test` failed because `@prood/platform` tests were not tenant-scoped.
- `pnpm build` passed.

Final verification completed:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

`@prood/platform` tests require `DATABASE_URL` pointing at a disposable database because they run migrations and truncate seeded commerce tables.

## Remaining Production Gaps

- SaaS subscription billing is not wired to Stripe yet; dashboard billing remains a plan-display placeholder.
- Dashboard analytics and in-dashboard API key creation remain placeholders.
- Observability is not wired yet: add Sentry and PostHog before launch.
- CI platform database tests require a `CI_DATABASE_URL` secret.
- Marketing/CMS content is still static/MDX; Sanity/Payload integration is not implemented.
- Resend production deliverability requires a verified sender domain and DNS records.
- Payment webhooks must be configured per provider and pointed at `apps/checkout`.
