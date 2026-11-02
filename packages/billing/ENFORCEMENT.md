# Plan entitlement enforcement

Limits from `@prood/billing` are enforced at the points below. Every organization is on `plan_id = 'free'` until subscription billing ships. Paid plans can't be bought yet.

## Enforced

| Entitlement | Check | Location |
| --- | --- | --- |
| `maxProducts` | Count products before insert | `assertCanCreateProduct` in `apps/api/lib/enforcement.ts`, called by `POST /v1/admin/products` and the MCP tool |
| `maxOrdersPerMonth` | Count orders this month before placing one | `assertCanPlaceOrder` in `apps/api/lib/enforcement.ts`, called by `POST /v1/carts/{id}/place-order` and the MCP tool. The demo store always refuses orders here |
| `maxTeamSeats` | Count members and pending invitations before an invite | `apps/dashboard/app/(dashboard)/team/actions.ts`, then `apps/api/lib/auth/organization-hooks.ts` |
| `maxCustomDomains` | Count domains before adding one | `apps/dashboard/app/(dashboard)/domains/actions.ts` |
| `agentAuthEnabled` | Refuse the agent on every call | `resolveAgentAccess` in `apps/api/lib/agent-access.ts` |
| `apiWriteEnabled` | Refuse a key with the `admin` scope on every call | `apps/api/lib/resolve-caller.ts`. The dashboard also won't create one: `apps/dashboard/app/(dashboard)/settings/api-keys/actions.ts` |

## Not enforced

| Entitlement | State |
| --- | --- |
| `maxStores` | Defined in `plans.ts`, read nowhere. Don't state a store count |
| `removeBranding` | Defined in `plans.ts`, read nowhere. Removing Prood branding is coming later |

## Reading the plan

```ts
import { getEntitlements, type PlanId } from "@prood/billing"

const limits = getEntitlements(organization.planId as PlanId)
```

Shared helpers: `apps/api/lib/enforcement.ts` and `packages/commerce/src/enforcement.ts` (`assertLimit`, `assertFeature`). The feature checks run in `resolve-caller.ts` and `agent-access.ts`.

## Status

| Layer | Status |
| --- | --- |
| `@prood/billing` entitlements | Done |
| `organization.plan_id` column | Done |
| Runtime enforcement | Done for the limits above |
| Subscription billing | Not started |
