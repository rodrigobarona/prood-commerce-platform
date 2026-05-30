# Plan entitlement enforcement

This document describes where limits will be enforced when platform billing launches. **Hard blocks are not active until billing ships**—use dashboard warnings first, then enforcement.

## Grandfathering (rollout)

- Organizations with **more than one verified custom domain** on Free at enforcement start: keep domains active; show upgrade prompt for adding new domains.
- Organizations above Free product/order/seat counts: **soft warning** for 30 days, then hard block on new creates (not deletion of existing data).
- All existing orgs default to `plan_id = 'free'` via migration.

## Insertion points

| Entitlement | Check | Location |
| --- | --- | --- |
| `maxProducts` | Count products before insert | `packages/platform` catalog `createProduct` (or dashboard action wrapping it) |
| `maxOrdersPerMonth` | Count orders in calendar month before checkout complete | Order placement in `packages/platform` checkout/orders domain |
| `maxTeamSeats` | Count members before invite accept | Dashboard team invite flow / Better Auth `member` hooks |
| `maxCustomDomains` | Count verified domains before add | `apps/dashboard/lib/domains.ts` → `addDomainAction` |
| `maxStores` | Count orgs user owns or agency portfolio | Org creation + agency switcher (future) |
| `agentAuthEnabled` | Block capability grants / agent JWT issuance | `apps/api` Agent Auth plugin configuration |
| `apiWriteEnabled` | Restrict API key scopes to read-only on Free | `apps/api/lib/resolve-caller.ts` + API key creation |
| `removeBranding` | Storefront/dashboard theme flag | Storefront layout when Prood branding is added |
| `customAdminDomain` (planned) | Block admin white-label domain setup on Free/Grow | Dashboard domains UI — Scale / Agency only; see [Multi-tenant platform](/docs/architecture/multi-tenant) |

## Reading plan from database

```ts
import { getEntitlements, type PlanId } from "@prood/billing"
// organization.planId from auth schema (default 'free')
const limits = getEntitlements(organization.planId as PlanId)
```

## Stripe (future)

- `organization.stripe_customer_id` / `stripe_subscription_id` populated on checkout success webhook.
- `plan_status`: `trialing` during 14-day trial, `past_due` on failed payment, `canceled` on churn.
- Map Stripe Price IDs to `PlanId` in env or `packages/billing` config when implementing Checkout.

## Status

| Layer | Status |
| --- | --- |
| `@prood/billing` entitlements | Done |
| `organization.plan_id` columns | Done (schema) |
| Runtime enforcement | Not started |
| Stripe Billing | Not started |
