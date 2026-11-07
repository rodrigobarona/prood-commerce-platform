# Production Readiness Audit

Date: 2026-06-08

## Scope

Audited the pnpm/Turborepo monorepo across all runtime apps and related packages:

- Apps: `storefront`, `web`, `dashboard`, `docs`, `checkout`, `api`, `admin`
- Core packages: `commerce`, `platform`, `auth`, `api-client`, `checkout`, `checkout-host`, payment providers, storage providers, email/notification packages, `ui`, `types`, and shared tooling

## Current Architecture

- Runtime engine: built-in `platform` adapter only, backed by Neon Postgres and Drizzle.
- Tenant isolation: Better Auth organizations, `withTenant(orgId)`, and forced RLS on commerce tables.
- Auth: `apps/api` issues merchant/auth sessions; `apps/storefront` owns customer auth per storefront origin; `apps/admin` validates shared sessions directly and requires the admin role.
- Checkout: `apps/checkout` stores sessions in Upstash Redis and forwards payment events to the Commerce API.
- Docs: Fumadocs under `apps/docs`, with OpenAPI synced at build time.
- Domain: prood.com is one domain. `apps/web` is the gateway and rewrites `/dashboard`, `/admin`, `/pay`, `/docs`, `/v1`, `/mcp`, `/api/auth` and `/.well-known/agent-configuration` to each app's own Vercel project (see "How prood.com is wired" in the README). Merchant stores stay on `{store}.prood.app`.

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

- Prood plan billing runs in Stripe test mode. TOConline invoicing and Stripe Tax aren't wired yet (see "Prood plan billing").
- Dashboard analytics and in-dashboard API key creation remain placeholders.
- Observability is not wired yet: add Sentry and PostHog before launch.
- CI platform database tests require a `CI_DATABASE_URL` secret.
- Marketing/CMS content is still static/MDX; Sanity/Payload integration is not implemented.
- Resend production deliverability requires a verified sender domain and DNS records.
- Payment webhooks must be configured per provider and pointed at the hosted checkout: `https://prood.com/pay/api/webhooks/{provider}/{orgId}`.

## Release checklist

Update (2026-11-02). Before a deploy that changes auth or infrastructure:

- `prood-web` has `DASHBOARD_ORIGIN`, `ADMIN_ORIGIN`, `DOCS_ORIGIN`, `CHECKOUT_ORIGIN`
  and `API_ORIGIN`, each the `*.vercel.app` origin of that app's project. The build
  fails on Vercel without them.
- Every project that sets public URLs uses the one-domain values: `NEXT_PUBLIC_WEB_URL`,
  `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DOCS_URL`, `API_PUBLIC_URL` and `BETTER_AUTH_URL`
  are `https://prood.com`; `NEXT_PUBLIC_DASHBOARD_URL` is `https://prood.com/dashboard`;
  `NEXT_PUBLIC_ADMIN_URL` is `https://prood.com/admin`; `CHECKOUT_URL` is
  `https://prood.com/pay`. `AUTH_COOKIE_DOMAIN` is unset.
- `PASSKEY_RP_ID=prood.com` and `PASSKEY_ORIGINS=https://prood.com` are on `prood-api`,
  `prood-dashboard` and `prood-admin`.
- `AUTH_PROXY_SECRET` has the same value on `prood-api`, `prood-dashboard` and
  `prood-admin`. Without it every request to `/api/auth` fails in production.
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` are on `prood-api` and
  `prood-storefront`, through the Upstash integration. If Redis is unavailable the
  limiters allow requests rather than block sign-in.
- Vercel doesn't run migrations: run `pnpm db:migrate` yourself. Additive migrations
  go first.
- `RESEND_FROM_EMAIL` must use a domain verified in Resend. An unverified sender is
  logged as "Resend refused an email", and the caller carries on.

## Prood plan billing

Update (2026-11-03). Stores buy Prood plans through `@better-auth/stripe` on
`apps/api`, with the organization as the Stripe customer. Webhooks arrive at
`https://prood.com/api/auth/stripe/webhook`. For each one, the API asks Stripe which subscription
is still collecting and writes it onto `organization.planId` (`setOrganizationPlan`
in `@prood/auth/billing`). If that fails, the webhook fails and Stripe retries.

- `prood-api`: `BILLING_STRIPE_SECRET_KEY`, `BILLING_STRIPE_WEBHOOK_SECRET` and
  `BILLING_MODE`. Billing is off unless all three are set and `BILLING_MODE`
  matches the key (`live` for `sk_live_`/`rk_live_`, `test` for anything else).
- `prood-dashboard`: the same `BILLING_MODE`. Unset hides the plan picker.
- Today it's the "prood.com sandbox" account in test mode, and only platform admins
  can subscribe, so a test card never buys a real plan.
- Prices are monthly in EUR, found by lookup key (`prood_<plan>_monthly_eur`).
  The billing portal handles plan changes, card, invoices and cancelling at period end.

To go live:

1. Activate the Stripe account, then create the same products, prices, lookup
   keys, billing portal and webhook in live mode.
2. Decide VAT. Prices are tax-exclusive today, and Stripe Tax isn't on.
3. Issue certified invoices in TOConline from `invoice.paid`, on a Prood series,
   as Eleva does (see `_docs/LEGAL.md`).
4. Clear the test data first: test customer IDs on `organization.stripe_customer_id`
   don't exist in live mode, so Checkout would fail for those stores. Delete the
   `subscription` rows, null `stripe_customer_id` and `stripe_subscription_id`, and
   put stores with a test plan back on Free.
5. Swap the env to the live key and secret, set `BILLING_MODE=live`, and change
   the "can't be bought yet" copy on the site, dashboard and docs.
