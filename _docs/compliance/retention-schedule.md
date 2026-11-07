# Retention schedule

How long each category of data is kept, and what enforces it. Values in days come from `RETENTION_DAYS` in `packages/auth/src/retention.ts`. `/privacy` and `/dpa` Annex 1 publish these periods, so change them together.

Last reviewed: 2026-11-07. Counsel has not reviewed this yet. **Ships with this change** marks rows that are in the uncommitted working tree on 2026-11-07 but not released (see the [README](./README.md) and [open items](./open-items.md)).

---

## Automated: the retention job (ships with this change)

`apps/api/app/internal/retention/route.ts` calls `purgeExpiredAuthData` (`packages/auth/src/retention.ts`) daily at 03:30 UTC, from a Vercel cron in `apps/api/vercel.json`. It answers 401 to every call that lacks `Authorization: Bearer <CRON_SECRET>` (constant-time compare), so it does nothing until `CRON_SECRET` is set on the Vercel `prood-api` project. Vercel cron runs only on the production deployment. Each run logs `Retention job finished` with a count per table, and each delete is a plain `DELETE ... WHERE`, so a second run is harmless. Read from the working tree on 2026-11-07, not run.

| Data | Table | Rule in `RETENTION_DAYS` | Published today | Published must say |
|---|---|---|---|---|
| Sessions | `session` | Deleted once expired (0 days) | `/privacy`: "We don't yet clear expired session records automatically: they stay until the account is closed" | Sessions are deleted when they expire |
| Verification records (email-verification and password-reset tokens) | `verification` | Deleted once expired | Not published separately. `privacy-data.mdx` says they are not purged | Add a row |
| Invitations | `invitation` | 30 days after expiry | `/privacy`: valid 48 hours, nothing about deletion | Deleted 30 days after expiry |
| Agent activity | `agent_event` | 730 days (24 months) after the event | `/privacy`: "While the organization exists" | 24 months |

**Timing.** A daily job with a 0-day rule keeps an expired session for up to about a day. Do not publish "deleted the moment it expires".

**Failure.** Nothing alerts on a failed run, and the four deletes are separate statements, so a failure part-way leaves the later tables for the next day. Check the cron log in Vercel monthly. Vercel may keep that log only briefly on this plan, so a check-in monitor or log drain is in [open items](./open-items.md).

**Not covered by the job.** These tables hold personal data and have no deletion rule. Each is listed as a gap in [open items](./open-items.md).

| Table | Why it matters | Position |
|---|---|---|
| `approvalRequest` | Holds `login_hint` and `binding_message` after `expires_at` passes | Not deleted until the user is deleted (cascade). Gap |
| `agent`, `agentHost` | Expired agents and hosts stay | Same. Gap |
| `apikey` | Expired keys stay. The plugin sweeps them only when keys are listed or created (`apps/api/lib/api-key-limit.ts`) | Same. Low |
| `user` (merchant), no membership | Left behind when a store is deleted | Kept until the person deletes the account. Gap |
| `user` (shopper) | Linked to merchants' orders through `customers.auth_user_id` | Kept until the person deletes it, reviewed yearly. **No automated deletion of dormant shopper accounts, by decision** |
| `customers`, `orders` and the rest of the commerce tables | The merchant's data | Kept until the merchant deletes it or the store is deleted. A merchant cannot delete one customer from the dashboard (`deleteCustomer` in `packages/platform/src/admin/customers.ts` is called by no route, tool or dashboard action) |

---

## Enforced by expiry

| Data | Rule | Where |
|---|---|---|
| Checkout sessions | 24 hours by default, or the time left on the snapshot's own expiry (minimum 60 seconds). 7 days once a payment session exists (Multibanco). Not deleted when the order is placed or the store is deleted | `packages/checkout-host/src/session-store.ts` (`DEFAULT_TTL_S`, `STARTED_PAYMENT_TTL_S`, `computeTtl`) |
| Checkout lock | 30 seconds | same file, `LOCK_TTL_S` |
| Sign-in and API rate counters | The rule's window, 1 second minimum. API keys: 60 seconds | `packages/auth/src/rate-limit-storage.ts`, `apps/api/lib/api-key-limit.ts`. Windows longer than a minute: **unverified** |
| Cookies | Session 7 days (refreshed after 1 day), cart 30 days, sidebar 7 days, privacy choice 12 months | `/privacy` cookies table. Cart: `apps/storefront/lib/cart-cookie.ts`. Sidebar: `packages/ui/src/components/sidebar.tsx` |
| Browser storage | Checkout draft: cleared when the tab closes (`apps/storefront/lib/checkout-draft.ts`). Saved-for-later and theme: until the shopper clears them | |

---

## Deleted by the user or the merchant

| Action | Effect | Status and code |
|---|---|---|
| Merchant deletes their account (dashboard, **Profile**, "Delete your account") | Better Auth `deleteUser`. Asks for the password, or a sign-in from the last day. Removes the user. Sessions, sign-in methods, memberships, invitations they sent, agents, hosts, grants and approval requests go by foreign-key cascade (`packages/auth/src/schema.ts`). Refused while the user is the sole owner of a store (`listSoleOwnedStores`). `agent_event` rows stay for 24 months | Ships with this change. `apps/api/lib/auth/server.ts` (`user.deleteUser`), `apps/dashboard/components/account/your-data.tsx` |
| Shopper deletes their account (store account page) | Same `deleteUser` on the storefront's auth instance, with the same sole-owner check. After it, `unlinkAuthUserFromCustomers` sets `customers.auth_user_id` to null in every store. Orders and customer rows stay with the store, which is the controller | Ships with this change. `apps/storefront/lib/auth/server.ts`, `packages/platform/src/privacy/store-data.ts` |
| Merchant exports the account (JSON) | Profile, sign-in methods (provider only), sessions (IP address, user agent), memberships, invitations sent and addressed to the email, agents. No password hash, no tokens, no `agent_event`, no API keys | Ships with this change. `packages/auth/src/data-export.ts`, `apps/api/app/api/account/export/route.ts` |
| Shopper exports the account (JSON) | The same file, from the store | Ships with this change. `apps/storefront/app/api/account/export/route.ts` |
| Owner or admin exports the store (one JSON file, **Store settings**) | Every table in the platform schema with an `organization_id` column: store settings, products, categories, customers and addresses, orders with items and history, returns, reviews, and also carts, wishlists and promotions. Provider credentials are not in it. Images are not in it, only their addresses. Session only: an API key or an agent gets 403. Every plan including Free (Data Act switching) | Ships with this change. `packages/platform/src/privacy/store-data.ts` (`exportStoreData`), `apps/api/app/api/store/export/route.ts` |
| Owner deletes the store (**Store settings**, "Delete this store") | Refused while a plan is active, trialing or past due ("Cancel this store's plan before deleting it"). Then one transaction deletes every row with an `organization_id` and rolls back if any is left (`deleteStoreData`), and Better Auth deletes the organization, which cascades to members, invitations, subscriptions, custom domains, integration credentials and `agent_event` rows | Ships with this change. `apps/api/lib/auth/organization-hooks.ts` (`beforeDeleteOrganization`), `apps/dashboard/components/store/store-data.tsx` |
| Merchant deletes a product, category, API key or agent | Removes it | In place (`/dpa` clause 11.1) |

**What store deletion leaves behind.** Be honest about these when answering a merchant or a lawyer.

| Left behind | Why |
|---|---|
| Images in R2 bucket `prood-public` | Deletion of R2 objects is not built. The updated `/terms` says image files are public and are removed on request: that is a manual job with no written procedure (see [data subject requests](./data-subject-requests.md)). `/dpa` 11.2 says Customer Data is deleted at the end: images are the exception. Gap, with an owner in [open items](./open-items.md) |
| `apikey` rows of the store | `apikey.reference_id` has no foreign key (`packages/auth/src/schema.ts`) and `beforeDeleteOrganization` does not delete them. Whether the Better Auth API key plugin does is **unverified**. They would be refused (no organization), but name, prefix and last use would remain |
| Custom domains on the Vercel project | Removed by a second call from the browser after the store is gone (`removeDeletedStoreDomainsAction`, errors only logged). If the tab closes between the two, the domain stays on Vercel |
| Checkout sessions in Redis | They expire on their own, up to 7 days. Not purged |
| Backups at Neon | Age out on the provider's schedule. The restore window depends on the plan and is **unverified** |
| Stripe customer for the store | Held by Stripe. The store cannot be deleted while a plan is live, but the customer record and invoices stay at Stripe |
| Emails already sent | At Resend, for its log period, and in recipients' inboxes |

Export first: store deletion is immediate and cannot be undone.

---

## Manual

| Data | Period | Who and how |
|---|---|---|
| Mail in hello@prood.com | 2 years at most (published) | Owner, in a yearly pass: delete threads older than 2 years. Copy each rights request and breach report into its register when handling it |
| Rights-request log | 3 years after closing (published in `/privacy`) | Owner. Counsel to confirm the period |
| Breach register | 5 years (internal proposal, not published) | Owner. Counsel to confirm |
| Merchant data when Prood ends a contract | Retrieval period of at least 30 days (`/terms`, "Leaving, switching"), then delete | Owner: wait out the period, then delete. Store deletion is an owner action in the dashboard and the admin app has no delete-store action, so Prood has no tool to delete a store on a merchant's behalf. Gap |
| Invoices and accounting records for Prood's own fees | 10 years (published). Legal basis to be confirmed by counsel | Not applicable until paid plans open. TOConline will hold the certified invoices |
| Acceptance of the Terms | **Not recorded.** `apps/dashboard/components/auth/register-form.tsx` shows a sentence only | Gap |

---

## At providers

| Data | Period | Note |
|---|---|---|
| Hosting logs | **Unverified** | Vercel. `/privacy` says "a limited time". Replace with the real number once read from the plan |
| Visit statistics | **Unverified** | Vercel Web Analytics keeps totals |
| Consent record | **Unverified** | INTH. `/privacy` says "as long as we may need to prove it" |
| Email delivery logs | **Unverified** | Resend |
| Database backups | **Unverified** | Neon. Depends on the plan |
| Address text | **Unverified** | Geoapify |
