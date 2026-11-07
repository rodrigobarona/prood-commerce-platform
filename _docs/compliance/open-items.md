# Open items

What still needs a person. Nothing here is closed by AI review. Everything marked "unverified" in the other records is listed here with an owner.

Last updated: 2026-11-07. "Owner" means the owner of Búzios e Tartarugas, Lda. (no deputy is named).

---

## Do these first

| # | Item | Why | Who |
|---|---|---|---|
| 1 | Have counsel review `/terms`, `/privacy`, `/dpa`, `/subprocessors`, `/legal` and this folder. Nothing is lawyer-reviewed (`_docs/LEGAL.md`) | Every record says so | Owner |
| 2 | Show the DPA at sign-up, and record which Terms and DPA version each account accepted | `/terms` says the DPA is part of the contract after the person is "shown these terms", but `apps/dashboard/components/auth/register-form.tsx` links only Terms and Privacy, and no acceptance is stored (only `user.created_at`) | Owner |
| 3 | Confirm a DPA is accepted with every sub-processor, with the SCC module recorded | `/dpa` 7.2 says Module Three is in place. Nobody has checked Neon/Databricks, Upstash, Resend, Cloudflare, INTH, Geoapify ([transfer register](./transfer-register.md)) | Owner |
| 4 | **Done 2026-11-07.** Two-factor and an administrator audit log: both built. See "Done" below. Passkeys, reading logs, manual recovery and the admin policy are items 11 to 15 | Evidence in the Done table | Owner |
| 5 | **Done 2026-11-07, with a condition.** Images: no merchant file reaches R2 today, so nothing needs deleting with a store, and `/dpa` 11.1 and `/terms` now say image files are removed on request. See "Done" below. The condition is item 16 | Data Act switching, `/terms`, `/dpa` 11.1, 11.2 | Owner |
| 6 | Confirm company size (people, turnover, balance sheet) | Decides DSA, P2B, NIS2 and EAA exemptions ([EU obligations](./eu-obligations.md)) | Owner |
| 7 | Name two mediators, or remove the sentence in `/terms` | P2B Art. 12, `_docs/LEGAL.md` item 5 | Owner |
| 8 | Read each provider's real retention and write it into `/privacy`: Vercel logs, Resend delivery logs, INTH consent record, Neon backups, Geoapify | `/privacy` says "a limited time". Weakens [LIA 1 and 2](./legitimate-interest-assessments.md) | Owner |
| 9 | Give merchants a place for their privacy notice, terms of sale and returns | Merchants must publish them, and Prood offers no field (`_docs/LEGAL.md` item 8). GDPR Art. 13, DL 24/2014 | Owner |
| 10 | Choose where the breach register, rights-request log and offline contact list live, and write the first copy | The [runbooks](./incident-response.md) need them from the first event | Owner |

---

## Opened on 2026-11-07

Raised by the two-factor, audit log and shopper erasure work. Same table shape as above, numbers continue.

| # | Item | Why | Who |
|---|---|---|---|
| 11 | Passkeys: decide whether to build them | Not built. `/security` and `/dpa` Annex 2 say so. Two-factor is an authenticator app and backup codes only (`twoFactor({ issuer: "Prood" })` in `apps/api/lib/auth/server.ts`) | Owner |
| 12 | The audit log does not record reads. Decide whether to log what an administrator opens (a user, a store's accounts, sessions) | `recordAdminAction` is called only after a ban, unban, role change, sign-out or agent revocation (`apps/admin/app/(admin)/users/actions.ts`, `agents/actions.ts`). The admin queries in `apps/admin/lib/admin-queries.ts` read every store's accounts and write nothing. Impersonation is not recorded either. The Better Auth admin plugin is enabled (`admin()` in `apps/api/lib/auth/server.ts`), the admin app has no screen for it, but an admin session can call the plugin's route directly. The only trace is `session.impersonated_by` on the session row, shown under Sessions while the row lasts. This is what [LIA 6](./legitimate-interest-assessments.md) still turns on | Owner |
| 13 | Two-factor recovery is manual | If a person loses both phone and backup codes there is no self-service route. The owner checks identity and resets it by hand: see the runbook in [data subject requests](./data-subject-requests.md). It depends on one person and on hello@prood.com. Decide whether to add a second route, and who covers when the owner is away | Owner |
| 14 | The trusted-device cookie is not per app. The dashboard offers "Trust this device for 30 days" (`offerTrustDevice: true` in `packages/auth/src/two-factor-panel.tsx`). The admin screen does not offer it, but the check is made by the API, which does not know which app asked. When `AUTH_COOKIE_DOMAIN` is set, session cookies are shared across the subdomains (`crossSubDomainCookies` in `packages/auth/src/server.ts`), so a trust cookie set by a dashboard sign-in may reach the admin app and skip the second step for an admin account on that browser. Read from the plugin in better-auth 1.7.14, **not tested**. Test it, then decide whether admin must refuse trusted devices (a check on the admin sign-in path) or the dashboard stops offering the box to admin accounts | Weakens the "staff enter a code every time" line in `two-factor-panel.tsx` | Owner |
| 15 | Require two-factor for platform administrators? A decision for the owner | It is optional for everyone today, admins included. Nothing in `assertAdmin` (`apps/admin/lib/auth/index.ts`) checks `user.two_factor_enabled`. Admins can read every store's accounts, so this is where a forced second factor helps most | Owner |
| 16 | Build R2 export and deletion together with image upload | Image upload is not built: `getStorage` and `uploadForTenant` in `packages/commerce/src/storage.ts` have no caller (checked 2026-11-07), so no merchant file is in the bucket. The key layout is `org/<organizationId>/...` (`tenantStorageDirectory`). The day an upload route ships, store deletion, the store export and `/dpa` 11.1 and 11.2 must change in the same pull request, or the gap in [retention](./retention-schedule.md) returns | Owner |

---

## Done

Closed by code on 2026-11-07. Dates are the day the code was checked in the working tree. Migration `0013_two_factor_audit.sql` was applied to production on 2026-11-07 according to the owner: not checked from the repository. None of it has run against real accounts. Each row is also in "Verify when the change lands".

| Item | Done | Evidence | What is left |
|---|---|---|---|
| Two-factor sign-in (opt-in authenticator app and backup codes) | 2026-11-07 | `twoFactor` plugin in `apps/api/lib/auth/server.ts`. `two_factor` table and `user.two_factor_enabled` in `packages/auth/src/schema.ts`. Challenge pages `apps/dashboard/app/(auth)/two-factor` and `apps/admin/app/(auth)/two-factor`. Profile panel `apps/dashboard/components/account/two-factor-panel.tsx`. Stores refuse a password sign-in for an account with it on (`apps/storefront/lib/auth/two-factor-guard.ts`, test in `apps/storefront/lib/__tests__/two-factor-guard.test.ts`) | Items 11, 13, 14, 15 |
| Administrator audit log | 2026-11-07 | `admin_audit_event` in `packages/auth/src/schema.ts`. Writer `packages/auth/src/admin-audit.ts`, called from `apps/admin/app/(admin)/users/actions.ts` and `agents/actions.ts`. Viewer `apps/admin/app/(admin)/audit/page.tsx`. Purged after 730 days (`RETENTION_DAYS.adminAuditEvents`, `packages/auth/src/retention.ts`). Actions on a person appear in their account export (`adminActionsOnYou`, `packages/auth/src/data-export.ts`) | Item 12. A failed write is only logged, so a gap in the log is possible: see [security measures](./security-measures.md) |
| Merchant tool to delete one shopper | 2026-11-07 | `eraseCustomer` in `packages/platform/src/privacy/store-data.ts`. Session-only `DELETE /api/store/customers/{id}` (`apps/api/app/api/store/customers/[id]/route.ts`, owner or admin, an API key or agent gets 403). Button `apps/dashboard/components/store/erase-customer-section.tsx` on the customer page | Reviews are not touched: they hold an author name only and are not linked to the shopper. The shopper's platform-wide sign-in account is Prood's data, not the merchant's. The erasure itself is not written to any log |
| R2 image deletion | 2026-11-07 | Not needed today: no caller of `getStorage` or `uploadForTenant` (`packages/commerce/src/storage.ts`), so no merchant file exists. `/terms` and `/dpa` 11.1 say image files are removed on request | Item 16: build it with image upload |

---

## Before relying on this

Facts nobody could verify from the repository.

| Item | Why | Who |
|---|---|---|
| Headcount, turnover and balance sheet total of Búzios e Tartarugas, Lda. | Micro and small-enterprise exemptions | Owner |
| Vercel plan, runtime log retention, whether a log drain exists | Incident evidence, `/privacy` "a limited time" | Owner |
| Vercel DPA, DPF listing, SCC module for Prood's own data as controller. Read the Vercel Trust Center incident notices | Transfer register | Owner |
| Region `fra1` on all seven Vercel projects, Redis `fra1`, Neon `eu-central-1`, R2 EU jurisdiction. The repo pins none of them | `_docs/LEGAL.md` says checked 2 November; BRAND.md claims depend on it | Owner |
| Resend: delivery log period, DPF status, whether the API key is shared with Eleva | Privacy text, key rotation | Owner |
| INTH: legal entity, DPA, record retention, support access from outside the EEA | `/subprocessors`, [LIA 2](./legitimate-interest-assessments.md) | Owner |
| Neon: DPA accepted, plan, restore window, whether backups can be purged on request | `/dpa` Annex 2 promises point-in-time restore | Owner |
| Upstash: DPA, SCC module, SOC 2 | `/subprocessors` | Owner |
| Cloudflare: which account holds the R2 bucket (Eleva's, per the owner's notes), DPA, DPF listing | Who the processor's customer is | Owner |
| Geoapify (Keptagon s.r.o.): DPA, retention, whether its script stores anything on the device | The browser calls it directly with the shopper's IP address | Owner |
| Who hosts hello@prood.com, how long it keeps mail, who can read it | The only mailbox, for requests, breaches and DSA notices | Owner |
| Languages the DSA contact point accepts (Art. 11, 12) | `/legal` does not say | Owner |
| MFA on Vercel, Neon, Upstash, Cloudflare, Stripe, Resend, GitHub, the mailbox provider | `/dpa` Annex 2, [security measures](./security-measures.md) | Owner |
| Better Auth defaults in the installed version: invitation validity (48 hours), session 7 days refreshed after 1 day, rate-limit windows, password limits, `deleteUser` fresh-session rule | `/privacy` quotes them, the repo sets none | Owner |
| `CRON_SECRET`, `KV_REST_API_*`, `AUTH_PROXY_SECRET`, `INTEGRATION_ENCRYPTION_KEY` set on the right projects | Retention job refuses without the first | Owner |
| Every `integration_config` value in production carries the `enc:v1:` prefix | `packages/commerce/src/crypto.ts` reads unprefixed values as plaintext | Owner |
| Number of live stores and shoppers | DPIA "large scale" | Owner |
| Whether the admin app is the only way to reach other stores' data, and who has the admin role | [LIA 6](./legitimate-interest-assessments.md) | Owner |
| Whether `autonomous` Agent Auth mode lets an agent act without a person's approval | `/terms` says a person approves; `apps/api/lib/auth/server.ts` enables both modes | Owner |
| Whether the Better Auth API key plugin deletes a store's keys on store deletion | `apikey.reference_id` has no foreign key | Owner |
| Whether Prood is registered on the Livro de Reclamações electrónico, and whether it must be | `/terms` and `/legal` point to it | Owner |
| Vercel Firewall rules on public routes | None are in the repo | Owner |
| Stripe: role (processor or controller), test data to clear before go-live | `/privacy` calls it a processor; `_docs/PRODUCTION_READINESS.md` billing steps | Owner |
| Existing real merchants or shoppers, if any | Retention, export and acceptance gate all affect them | Owner |

---

## Verify when the change lands

Each item "ships with this change": it is in the uncommitted working tree on 2026-11-07, read but not run. Check each before merging, and merge the records with the code, not ahead of it.

| Item | Check | Where |
|---|---|---|
| Retention cron | `crons` entry `30 3 * * *` on `/internal/retention`. 401 without the secret. A logged `Retention job finished` the morning after the first production run. Values equal the published text: sessions 0, verification 0, invitations 30, agent events 730 days | `apps/api/vercel.json`, `apps/api/app/internal/retention/route.ts`, `packages/auth/src/retention.ts` |
| Retention failures | Nothing alerts. Add a check-in monitor | Vercel |
| Account export | The JSON has no password hash and no token. Also contains invitations and agents. Merchants and shoppers can both download it | `packages/auth/src/data-export.ts`, `apps/api/app/api/account/export/route.ts`, `apps/storefront/app/api/account/export/route.ts` |
| Account deletion | Both apps refuse a sole owner. Password or fresh sign-in is asked. `customers.auth_user_id` is nulled in every store. Memberships, agents, hosts, approval requests are gone. A merchant deleting from a store page loses their dashboard login and the page does not say so | `apps/api/lib/auth/server.ts`, `apps/storefront/lib/auth/server.ts`, `apps/*/components/account/your-data.tsx` |
| Store export | Owner or admin only, session only (API key and agent get 403). Includes carts, wishlists and promotions too. Image addresses, no image files. Provider credentials absent. Built in memory before streaming, so test a large store. Downloads are not logged | `packages/platform/src/privacy/store-data.ts`, `apps/api/app/api/store/export/route.ts`, `packages/auth/src/download.ts` |
| Store deletion | Owner only. Refused with a live plan. All rows gone or none. `apikey`, R2 images, Redis sessions, Vercel domain entries are not covered (see [retention](./retention-schedule.md)). Test that the transaction really rolls back | `apps/api/lib/auth/organization-hooks.ts`, `apps/dashboard/components/store/store-data.tsx` |
| Two-factor | On a test merchant account: **Profile**, turn it on with the password, scan the code, confirm, save the ten backup codes. Sign out and in: the browser lands on `/two-factor`, a wrong code is refused, a backup code works once. "Trust this device for 30 days" shows in the dashboard and not in the admin app. The same account is refused a password sign-in at a store with "Sign in from the Prood dashboard". Read-only SQL on `two_factor`: `secret` and `backup_codes` are not readable text. The account export shows `twoFactorEnabled` and no secret. Turning it off asks for the password. Deleting the user removes the `two_factor` row. Test the trusted-device cookie across dashboard and admin once `AUTH_COOKIE_DOMAIN` is set (item 14). Confirm the migration really is on production: `\d two_factor` and `\d admin_audit_event` | `apps/api/lib/auth/server.ts`, `apps/dashboard/components/account/two-factor-panel.tsx`, `apps/storefront/lib/auth/two-factor-guard.ts`, `packages/platform/drizzle/0013_two_factor_audit.sql` |
| Administrator audit log | As an admin, ban and unban a test user, change a role, sign one device and all devices out, revoke a test agent. Each shows under **Audit log** in the admin app with admin, action, target and IP address (not blank behind Vercel). A failing write logs `[admin-audit] COULD NOT RECORD`: search the runtime log. The test user's account export lists the actions under `adminActionsOnYou`. The row for `agent.revoke` has the agent's id as target, so it does not appear in any person's export. Run the retention job and check the log line carries `adminAuditEvents` | `apps/admin/app/(admin)/audit/page.tsx`, `packages/auth/src/admin-audit.ts`, `packages/auth/src/data-export.ts` |
| Erasing one shopper | On a test store, erase a shopper with and without "Also clear their email, addresses and notes". The profile, addresses, wishlist and carts are gone. Orders remain with no customer link, and with the box ticked have no contact email, addresses, notes, history notes or return notes. A review by the same name is untouched. An API key and an agent get 403 from `DELETE /api/store/customers/{id}`. A member (not owner or admin) gets no button. Nothing logs the erasure: write it in the rights-request log | `packages/platform/src/privacy/store-data.ts`, `apps/api/app/api/store/customers/[id]/route.ts`, `apps/dashboard/components/store/erase-customer-section.tsx` |
| Image upload and R2 | Still absent. Search for callers of `getStorage` and `uploadForTenant` before each release. List `org/` in bucket `prood-public` in the Cloudflare console: it should hold no merchant file. A hit means upload shipped and item 16 is due | `packages/commerce/src/storage.ts` |
| Security headers | Every app sends the headers. CSP does not break sign-in, checkout (Stripe), Geoapify, Vercel Analytics, c15t or images. `'unsafe-inline'` stays on scripts | `packages/security-headers/src/index.ts`, `apps/*/next.config.*` |
| `security.txt` and `/security` | The file points to `/security#report`. The page did not exist on 2026-11-07 | `apps/web/app/.well-known/security.txt/route.ts`, `apps/web/app/security` |
| Public texts agree with the code | See the next section | `apps/web/app/*` |
| Docs and facts files | Update `_docs/LEGAL.md` (item 3 now describes work that shipped, `docs/architecture/privacy-data.mdx` path is `apps/docs/content/docs/architecture/privacy-data.mdx`), `_docs/BRAND.md` ("there's no export"), `apps/web/components/marketing/keys.tsx` ("Store export isn't built yet"), `apps/web/components/marketing/features.tsx` ("store export: Coming later"), and the docs privacy page | Several |

---

## Public texts that disagree with the code or with each other

Read against the working tree on 2026-11-07, including the uncommitted edits to `/dpa`, `/privacy` and `/terms`. Each needs a decision, not a silent fix.

| # | Where | Says | The code or another text says | Action |
|---|---|---|---|---|
| 1 | `/dpa` 11.1 ("export all Customer Data") | Everything can be exported | The export leaves out image files and provider credentials, and `/terms` says so | Fixed in the working tree on 2026-11-07: 11.1 now leaves out image files and credentials. Recheck at merge |
| 2 | `/terms` ("Deletion") and `/dpa` 11.1: "everything the store owns is removed at once" | Complete, immediate | no merchant image is in R2 today (no upload), checkout sessions in Redis last up to 7 days, `apikey` rows are not removed by the code read, Vercel domain entries are removed by a second browser call, backups age out | Say what stays |
| 3 | `/dpa` 11.2 ("Prood then deletes Customer Data") | Deletion at the end | No tool deletes R2 files, and no upload puts one there today | Say images are removed on request, and revisit when upload ships (item 16) |
| 4 | `/dpa` Annex 2: "an application database role that cannot read the sign-in tables" | No read | Migration `0006_auth_tables_private.sql` grants `SELECT (id, email)` on `user`. `privacy-data.mdx` says the same | Reword |
| 5 | `/dpa` Annex 2: "database role" isolates stores by RLS | Always isolated | The connecting role has BYPASSRLS, and isolation holds inside `withTenant()` only (`0000_app_role.sql`) | Soften, or say it |
| 6 | `/dpa` Annex 2: provider credentials "encrypted with AES-256-GCM" | Always encrypted | `packages/commerce/src/crypto.ts` reads a value without the `enc:v1:` prefix as plaintext | Check production rows, then remove the fallback (AGENTS.md prefers a clean break) |
| 7 | `/terms` ("The contract"): the DPA is part of the contract after the person is "shown these terms" | DPA shown | Register form links Terms and Privacy only | Add the DPA link and a record |
| 8 | `/terms` ("API, MCP and AI agents"): an agent acts only after a person approves | Approval always | `modes: ["delegated", "autonomous"]` in `apps/api/lib/auth/server.ts` | Confirm what `autonomous` does |
| 9 | `/privacy` ("Request counters last seconds to a minute") and `/dpa` Annex 1 | Up to a minute | Windows come from Better Auth rules and are not set in the repo | Verify |
| 10 | `/privacy` ("an invitation is valid for 48 hours"; sessions "7 days from last use") | Fixed values | Library defaults. Sessions refresh after 1 day, so "7 days" is a day out | Verify, or set them in code |
| 11 | `/privacy` lists "Neon" in transfers, `/subprocessors` and `/dpa` Annex 3 name "Databricks, Inc. and Neon, LLC" | Same company | Naming differs | Align |
| 12 | `/privacy` calls Stripe a "Processor". `/subprocessors` puts it under "Providers for Prood's own data" | Processor | Stripe usually acts as a controller for payment data | Ask counsel |
| 13 | `/dpa` 7.2: Module Three "entered into" with each sub-processor | Done | Nobody checked. Geoapify and INTH are listed "None needed" | Verify |
| 14 | `/privacy` and `/subprocessors`: Vercel and Cloudflare under the Data Privacy Framework | Certified | `_docs/LEGAL.md` lists this as still to confirm | Verify |
| 15 | `_docs/LEGAL.md`: "all seven Vercel projects run functions in fra1" | Set | No `regions` in any `apps/*/vercel.json` | Verify in the console |
| 16 | `_docs/LEGAL.md` item 3 and `apps/docs/.../privacy-data.mdx` ("What does not exist yet") | No clean-up, no self-service | Both exist in the working tree. `LEGAL.md` item 3 and 9 and `privacy-data.mdx` were updated on 2026-11-07 for two-factor, the audit log and shopper erasure | Fixed in the same change (2026-11-07) |
| 17 | `_docs/BRAND.md`, `apps/web/components/marketing/keys.tsx`, `features.tsx` | "No export", "Store export isn't built yet", "Coming later" | The store export exists in the working tree | Fixed in the same change (2026-11-07): the three files now say the data can be downloaded and that only the owner transfer is missing |
| 18 | `/terms` ("Law and courts") and `/legal`: complaints book | Prood has a complaints book route | Prood sells only to businesses | Ask counsel |
| 19 | `/legal`: Art. 171 Commercial Companies Code details | Complete | Share capital omitted (`_docs/LEGAL.md` item 6). DSA contact languages not stated | Add |

---

## Known gaps, not being built

Each has an owner and a rationale. A gap stays here until the code closes it.

| Gap | Rationale | Owner |
|---|---|---|
| Passkeys | Not built. `/security` and `/dpa` Annex 2 say so. Two-factor is optional, so an account without it relies on a password and the sign-in rate limit (item 11) | Owner |
| Reads by administrators are not logged | The audit log records changes only. Impersonation is not recorded (item 12) | Owner |
| Two-factor recovery is manual | Item 13 | Owner |
| Automated deletion of dormant shopper accounts | By decision: shopper accounts are linked to merchants' orders, so they are kept until the person deletes them, and reviewed yearly | Owner |
| Deletion of R2 images on store deletion | Not needed today, because image upload is not built and no merchant file is in R2. It must be built with image upload (item 16) | Owner |
| A Neon restore drill | Not planned. `/dpa` Annex 2 names point-in-time restore, and nobody has tried it | Owner |
| Per-provider retention numbers | Vercel logs, Resend delivery logs, INTH consent record, Neon backups, Geoapify: nobody has verified them | Owner |
| Purging `approvalRequest`, expired agents and hosts, expired API keys | Not in the retention job. Removed only with the user | Owner |
| Audit of store-export downloads and of shopper erasures | The export holds a store's customer list and is not logged. The audit log covers Prood administrators only, not merchants | Owner |
| Dependency audit, Dependabot, secret scanning | `.github/workflows/ci.yml` runs none | Owner |
| Error tracking, uptime and retention-job monitoring | Not wired (`_docs/PRODUCTION_READINESS.md`) | Owner |
| External penetration test | None commissioned. `/dpa` Annex 2 says so | Owner |
| Terms acceptance record | None stored | Owner |
| Accessibility audit and statement | None done ([EU obligations](./eu-obligations.md)) | Owner |
| Price history for the Omnibus lowest-price rule | Not built. Merchants' duty, but the tool cannot check it | Owner |
| Fields for GPSR information and privacy and returns pages | Not built | Owner |
| Integration key rotation | `INTEGRATION_ENCRYPTION_KEY` cannot change without losing every credential | Owner |

---

## Merge day, in this order

| Step | Why | Who |
|---|---|---|
| 1. Set `CRON_SECRET` on `prood-api`, and check the other secrets in the first table | The job refuses without it | Owner |
| 2. Update `legal.updated` in `apps/web/lib/site.ts`, `/privacy`, `/terms`, `/dpa` and this folder together | They must agree. `_docs/LEGAL.md` says to change them as one | Owner or agent |
| 3. Write the `/security` page | `security.txt` points at it | Owner or agent |
| 4. Merge and deploy `prood-api` and the dashboard and storefront together | The export and delete routes are split across apps | Owner |
| 5. Next morning: look for `Retention job finished` in the `prood-api` logs | First run. Runtime logs may last a day or less | Owner |
| 6. Download an account export and a store export from a test store, delete a test shopper and a test store, and compare with the [retention schedule](./retention-schedule.md) | Nothing here has been run | Owner |

---

## Promises that need the owner's approval

The public texts make these commitments. Each is a real operational duty.

| Commitment | Where |
|---|---|
| Reply to rights requests within one month, and act on a merchant's shopper request within 30 days | `/privacy`, `/dpa` 8.2 |
| Notify merchants of a breach within 48 hours | `/dpa` 9.1 |
| 30 days' notice of a new sub-processor, 14 days to object, no use of it for an objecting merchant | `/dpa` 6.2, 6.3 |
| 30 days' notice of material changes to the terms | `/terms` "Changes" |
| 60 days' notice before a Free plan limit changes in a way that matters | `/terms` "Plans, fees and taxes" |
| 30 days' notice before ending a contract without cause | `/terms` "Suspension and termination" |
| Answer a disagreement within 14 days | `/terms` |
| Complete a switch within 30 days, or tell the customer within 14 working days why not, with a date of up to seven months | `/terms` "Leaving, switching" |
| Remove image files on request | `/terms` "Leaving, switching" |
| Keep closed-store data at least 30 days for retrieval, unless asked to delete at once | `/terms` |
| Answer written compliance questions within 30 days, and allow audits on 30 days' notice | `/dpa` 12 |
| Name mediators | `/terms` |
| Read hello@prood.com every working day | Needed to meet the one-month and 48-hour deadlines |

---

## For counsel

| Question | Context |
|---|---|
| Review all public texts, in English only. Does an English-only contract work with Portuguese customers? | `/terms` "General" |
| Do the terms pass the Portuguese standard-terms regime (Decree-Law 446/85: verify articles)? Is the browse-wrap acceptance enough, and the DPA acceptance through the Terms? | Register form |
| Is the EUR 100 liability cap enforceable against a business, and does it pass Art. 13 of the Data Act? | `/terms` "Liability" |
| Is Prood a hosting service only, or an online platform, under the DSA? Is it an online intermediation service under P2B? | [EU obligations](./eu-obligations.md) |
| Are the Art. 16 and 17 DSA procedures enough as written, and what must the contact point say about languages? | `/terms` "Acceptable use" |
| Is Prood the controller or the processor when it links guest customer rows to a shopper account? Is the cross-store link lawful as written? | [LIA 8](./legitimate-interest-assessments.md), Art. 26 |
| Is Stripe a processor or an independent controller for Prood's own plan fees? | `/privacy` |
| Does Prood stay outside PSD2 while it stores providers' credentials and creates payments? | `/terms` "Payments" |
| Are the retention periods right: sessions 0 days, verification 0, invitations 30 days after expiry, agent events 24 months, administrator audit events 24 months, correspondence 2 years, rights log 3 years, breach register 5 years, invoices 10 years? | [Retention schedule](./retention-schedule.md). Art. 21(3) of Lei 58/2019 and the limitation periods |
| Is a browser call to Geoapify before consent within Art. 5(3) ePrivacy and Art. 5 of Lei 41/2004? | [LIA, cookies](./legitimate-interest-assessments.md) |
| Does the accessibility exemption for microenterprises cover Prood, and what must merchants do? | EAA row |
| Confirm the NIS2, CRA, AI Act, DPO and DPIA conclusions | Respective files |
| Does a Livro de Reclamações entry apply to a B2B-only SaaS? | `/legal` |
| Should Prood publish Portuguese versions, and which language prevails? | `_docs/LEGAL.md` item 10 |
| Is 24 months right for the administrator audit log, and must an erasure request reach audit rows about the person (or by the person) before then? | [Records of processing](./records-of-processing.md), [LIA 6](./legitimate-interest-assessments.md) |
| Is Prood's processing of product images, which can show people, covered by the DPA? | `/dpa` Annex 1 |
