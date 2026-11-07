# Open items

What still needs a person. Nothing here is closed by AI review. Everything marked "unverified" in the other records is listed here with an owner.

Last updated: 2026-11-07, after the move to one domain (prood.com), the removal of trusted devices, passkeys, the two-factor reset tool, terms acceptance and the revised public texts. "Owner" means the owner of Búzios e Tartarugas, Lda. (no deputy is named). The public texts were revised after an independent AI review, which is not a lawyer's review: item 1 is still open.

---

## Do these first

| # | Item | Why | Who |
|---|---|---|---|
| 1 | Have counsel review `/terms`, `/privacy`, `/dpa`, `/subprocessors`, `/legal` and this folder. Nothing is lawyer-reviewed (`_docs/LEGAL.md`) | Every record says so | Owner |
| 2 | **Done 2026-11-07.** Show the DPA at sign-up, and record which Terms and DPA version each account accepted. See "Done" below. Left: accounts created earlier have no record, and counsel decides whether tick-box acceptance is enough | `apps/dashboard/components/auth/register-form.tsx`, `user.terms_version`, `user.terms_accepted_at` | Owner, counsel |
| 3 | Confirm a DPA is accepted with every sub-processor, with the SCC module recorded, and confirm each provider's legal entity and Data Privacy Framework status | `/dpa` 7.2 no longer says Module Three was signed (it says Prood relies on the clauses in each sub-processor's own terms), but nobody has checked Neon/Databricks, Upstash, Resend, Cloudflare, INTH, Geoapify, Vercel ([transfer register](./transfer-register.md)) | Owner |
| 4 | **Done 2026-11-07.** Two-factor and an administrator audit log: both built. See "Done" below. Passkeys (on, to be tried on a real device), reading logs, recovery, the shared session and the admin policy are items 11 to 15 | Evidence in the Done table | Owner |
| 5 | **Done 2026-11-07, with a condition.** Images: no merchant file reaches R2 today, so nothing needs deleting with a store, and `/dpa` 11.1 and `/terms` now say image files are removed on request. See "Done" below. The condition is item 16 | Data Act switching, `/terms`, `/dpa` 11.1, 11.2 | Owner |
| 6 | Confirm company size (people, turnover, balance sheet) | Decides DSA, P2B, NIS2 and EAA exemptions ([EU obligations](./eu-obligations.md)) | Owner |
| 7 | **Done 2026-11-07, with a question for counsel.** The sentence promising to name mediators is gone from `/terms`. It now offers mediation if the business asks, with a mediator both sides agree on. P2B Art. 12 may still ask for two named mediators (verify) | `_docs/LEGAL.md` item 5, [EU obligations](./eu-obligations.md) | Counsel |
| 8 | Read each provider's real retention and write it into `/privacy`: Vercel logs, Resend delivery logs, INTH consent record, Neon backups, Geoapify. Only the owner can read these from the provider's plan | `/privacy` says "a limited time". Weakens [LIA 1 and 2](./legitimate-interest-assessments.md) | Owner |
| 9 | Give merchants a place for their privacy notice, terms of sale and returns | Merchants must publish them, and Prood offers no field (`_docs/LEGAL.md` item 8). GDPR Art. 13, DL 24/2014 | Owner |
| 10 | Choose where the breach register, rights-request log and offline contact list live, and write the first copy | The [runbooks](./incident-response.md) need them from the first event | Owner |

---

## Opened on 2026-11-07

Raised by the two-factor, audit log, shopper erasure, passkey and terms acceptance work, and by the revised public texts. Same table shape as above, numbers continue. Items 17 to 23 are owner-only facts that no code change can settle.

| # | Item | Why | Who |
|---|---|---|---|
| 11 | Passkeys are on in production: try one on a real device | Production sets `PASSKEY_RP_ID=prood.com` and `PASSKEY_ORIGINS=https://prood.com` on `prood-api`, `prood-dashboard` and `prood-admin` (set by the owner; not checked from the repository). The plugin loads only when both are set (`resolvePasskeyConfig`, `packages/auth/src/passkey-config.ts`); a half configuration stops the server at start. prood.com is one domain, so one relying party ID and one origin cover the dashboard, the admin console and the API. A `*.vercel.app` address cannot hold a passkey (it is a public suffix), so use prood.com. `/security` and `/dpa` Annex 2 say passkeys are available and optional. Tested over HTTP with a software authenticator on a throwaway database and in the UI against a mocked `navigator.credentials`. **Not tested on a real authenticator or on the real prood.com host**: see the passkey row in "Verify when the change lands". Passkeys are in the account export (name, device type, whether backed up, created: never keys) | Owner |
| 12 | The audit log does not record reads. Decide whether to log what an administrator opens (a user, a store's accounts, sessions) | `recordAdminAction` is called only after a ban, unban, role change, sign-out or agent revocation (`apps/admin/app/(admin)/users/actions.ts`, `agents/actions.ts`). The admin queries in `apps/admin/lib/admin-queries.ts` read every store's accounts and write nothing. Impersonation is not recorded either. The Better Auth admin plugin is enabled (`admin()` in `apps/api/lib/auth/server.ts`), the admin app has no screen for it, but an admin session can call the plugin's route directly. The only trace is `session.impersonated_by` on the session row, shown under Sessions while the row lasts. This is what [LIA 6](./legitimate-interest-assessments.md) still turns on | Owner |
| 13 | Two-factor recovery rests on one person | The reset tool exists (**Reset two-factor** on the admin user page, `resetUserTwoFactor`, audited as `user.reset_two_factor`) and replaces the manual SQL runbook, which stays only as a fallback if no other administrator can sign in ([data subject requests](./data-subject-requests.md)). The owner still checks identity by hand, the checks are not defined beyond examples, and it depends on hello@prood.com. Decide who covers when the owner is away, and write the checks down | Owner |
| 14 | **Open.** One origin shares the session by design. The dashboard (the root of the domain, `/login`, `/orders`, ...), the admin console (`/admin`) and the API are all on prood.com, so there is one session cookie, and a session started at the dashboard also opens the admin console. The admin app validates session tokens straight from the database (`apps/admin/lib/auth/index.ts`) and checks only `user.role`, not second-factor state. Signing in at either place asks for the code when the account has two-factor on, and a passkey counts as a second step. There is no trusted-device shortcut: Prood does not remember devices (`apps/api/lib/auth/two-factor-guard.ts`). **Mitigations today:** two-factor or a passkey on every administrator account, and the banner in the admin layout until it is on. **Decision for the owner:** whether to require two-factor for administrators (item 15), for example by checking `user.two_factor_enabled` in `assertAdmin`; or to accept the shared session in writing. `/security` and `/dpa` Annex 2 already say a session started at the dashboard also opens the admin console | Weakens "the admin console asks for the code at every sign-in" for anyone who signed in at the dashboard | Owner |
| 15 | Require two-factor for platform administrators? A decision for the owner. **Recommendation: require it once they have turned it on themselves, to avoid lockout** | It is optional for everyone today, admins included. Nothing in `assertAdmin` (`apps/admin/lib/auth/index.ts`) checks `user.two_factor_enabled`. An admin without it now sees a banner in the admin layout (`apps/admin/app/(admin)/layout.tsx`). Admins can read every store's accounts, so this is where a forced second factor helps most. It would also close the gap in item 14 | Owner |
| 16 | Build R2 export and deletion together with image upload | Image upload is not built: `getStorage` and `uploadForTenant` in `packages/commerce/src/storage.ts` have no caller (checked 2026-11-07), so no merchant file is in the bucket. The key layout is `org/<organizationId>/...` (`tenantStorageDirectory`). The day an upload route ships, store deletion, the store export and `/dpa` 11.1 and 11.2 must change in the same pull request, or the gap in [retention](./retention-schedule.md) returns | Owner |
| 17 | Share capital for `/legal` | **Done 2026-11-07.** The owner confirmed EUR 100. It is in `legal.capital` (`apps/web/lib/site.ts`) and on `/legal`. Recheck it against the Certidão permanente when you next have it | Owner |
| 18 | Does the Cloudflare R2 account hold Prood's or Eleva's contract? And the `rbarona.workers.dev` Worker (`prood-media`)? | Per the owner's notes the bucket sits on Eleva's Cloudflare account, and the Worker's address is on the owner's own `workers.dev` subdomain. The processor's customer should be Prood, or the contract party should be named. Not verifiable from the repository | Owner |
| 19 | Which provider hosts hello@prood.com, how long it keeps mail, who can read it | The only mailbox: rights requests, breaches, DSA notices | Owner |
| 20 | Is Prood a small enterprise for P2B? | Art. 11 (internal complaints) exempts small enterprises (verify). Rests on headcount and turnover (item 6) | Owner |
| 21 | Portuguese translations of the privacy notice and the cookie banner | The pages are in English only (`/terms` says so). The DSA contact point answers in English and Portuguese. Banner text is in `packages/consent/src/messages.ts` | Owner |
| 22 | Pin Vercel regions, or check them again | No `apps/*/vercel.json` sets `regions` (checked 2026-11-07). `fra1` is claimed from a manual check on 2 November 2026. The public texts say "set up to run in Frankfurt" | Owner |
| 23 | Entity names and Data Privacy Framework or SCC status of each provider | Names and safeguards in `/dpa` Annex 3 and `/subprocessors` were never confirmed from the providers' own terms (item 3) | Owner |

---

## Done

Closed by code on 2026-11-07. Dates are the day the code was checked in the working tree. Migrations `0013_two_factor_audit.sql`, `0014_passkeys.sql` and `0015_terms_acceptance.sql` were applied to production on 2026-11-07 according to the owner: not checked from the repository. None of it has run against real accounts. Each row is also in "Verify when the change lands".

| Item | Done | Evidence | What is left |
|---|---|---|---|
| Two-factor sign-in (opt-in authenticator app and backup codes) | 2026-11-07 | `twoFactor` plugin in `apps/api/lib/auth/server.ts`. `two_factor` table and `user.two_factor_enabled` in `packages/auth/src/schema.ts`. Challenge pages `apps/dashboard/app/(auth)/two-factor` and `apps/admin/app/(auth)/two-factor`. Profile panel `apps/dashboard/components/account/two-factor-panel.tsx`. Stores refuse a password sign-in for an account with it on (`apps/storefront/lib/auth/two-factor-guard.ts`, test in `apps/storefront/lib/__tests__/two-factor-guard.test.ts`) | Items 11, 13, 14, 15 |
| Administrator audit log | 2026-11-07 | `admin_audit_event` in `packages/auth/src/schema.ts`. Writer `packages/auth/src/admin-audit.ts`, called from `apps/admin/app/(admin)/users/actions.ts` and `agents/actions.ts`. Viewer `apps/admin/app/(admin)/audit/page.tsx`. Purged after 730 days (`RETENTION_DAYS.adminAuditEvents`, `packages/auth/src/retention.ts`). Actions on a person appear in their account export (`adminActionsOnYou`, `packages/auth/src/data-export.ts`) | Item 12. A failed write is only logged, so a gap in the log is possible: see [security measures](./security-measures.md) |
| Merchant tool to delete one shopper | 2026-11-07 | `eraseCustomer` in `packages/platform/src/privacy/store-data.ts`. Session-only `DELETE /api/store/customers/{id}` (`apps/api/app/api/store/customers/[id]/route.ts`, owner or admin, an API key or agent gets 403). Button `apps/dashboard/components/store/erase-customer-section.tsx` on the customer page | Reviews are not touched: they hold an author name only and are not linked to the shopper. The shopper's platform-wide sign-in account is Prood's data, not the merchant's. The erasure itself is not written to any log |
| R2 image deletion | 2026-11-07 | Not needed today: no caller of `getStorage` or `uploadForTenant` (`packages/commerce/src/storage.ts`), so no merchant file exists. `/terms` and `/dpa` 11.1 say image files are removed on request | Item 16: build it with image upload |
| Terms and DPA acceptance recorded (closes "DPA not accepted" and "no record of what was accepted") | 2026-11-07 | The dashboard register form has a required box that links the terms, the data processing terms and the privacy policy (`apps/dashboard/components/auth/register-form.tsx`) and sends `termsVersion`. `apps/api/lib/auth/server.ts` refuses `/sign-up/email` unless it equals `LEGAL_VERSION` (`packages/types/src/legal.ts`, the date shown on the legal pages, YYYY-MM-DD) and stamps the time. Columns `user.terms_version` and `user.terms_accepted_at` (`packages/auth/src/schema.ts`, migration `0015_terms_acceptance.sql`). Shoppers on stores do not accept the merchant terms. `/terms` ("The contract") and `/dpa` (opening paragraph) say the person ticks the box and that the version and time are recorded | Accounts created before 2026-11-07 have no record. Counsel: is a ticked box enough? Every change of legal text must bump `LEGAL_VERSION` with `legal.updated` ([README](./README.md)) |
| Two-factor reset tool (replaces the manual SQL runbook) | 2026-11-07 | **Reset two-factor** on the admin user page (`apps/admin/app/(admin)/users/[id]/user-actions.tsx`), `resetUserTwoFactor` in `apps/admin/app/(admin)/users/actions.ts`, `resetTwoFactor` in `packages/auth/src/two-factor.ts`. Deletes the `two_factor` row, sets `two_factor_enabled` to false and deletes every session. An admin cannot do it to themselves. Audited as `user.reset_two_factor` (`ADMIN_ACTIONS`). Tested end to end on a throwaway database (19 of 19 checks), including an admin account with two-factor signing in through the real admin app | Item 13. Not used on a real account |
| Passkeys built, then enabled in production | 2026-11-07 | `@better-auth/passkey` plugin in `apps/api/lib/auth/server.ts`, only with `PASSKEY_RP_ID` and `PASSKEY_ORIGINS` (`packages/auth/src/passkey-config.ts`, test `passkey-config.test.ts`). `passkey` table (`0014_passkeys.sql`, `REVOKE ALL ... FROM prood_app`). Dashboard Profile panel `apps/dashboard/components/account/passkeys-panel.tsx`, "Sign in with a passkey" on the dashboard and admin login, shown only when configured. In the account export (`packages/auth/src/data-export.ts`). Tested over HTTP with a software authenticator on a throwaway database, and in the UI against a mocked `navigator.credentials`. The owner sets `PASSKEY_RP_ID=prood.com` and `PASSKEY_ORIGINS=https://prood.com` in production (not checked from the repository) | Item 11: not tested on a real authenticator or the real prood.com host |
| Trusted devices removed | 2026-11-07 | "Trust this device" is not offered by the apps, and the two-factor verify routes refuse a call that asks for it (`guardTrustDevice` in `apps/api/lib/auth/two-factor-guard.ts`, called from the `before` hook in `apps/api/lib/auth/server.ts`; test `apps/api/lib/__tests__/two-factor-guard.test.ts`). No `trust_device` cookie is set and no `trust-device-` record is made, so a device never skips the code. This closes the trusted-device half of the old shared-cookie gap | Item 14: the shared session |
| Banner for an admin without two-factor | 2026-11-07 | `TwoFactorNotice` in `apps/admin/app/(admin)/layout.tsx`, shown when `isTwoFactorEnabled` is false | Item 15: two-factor is still not required |
| Mediators sentence removed from `/terms` | 2026-11-07 | `/terms` ("Suspension and termination"): mediation "if you ask, with a mediator we agree on together" | Counsel: does that meet P2B Art. 12? |
| Livro de Reclamações statement removed from `/terms` and `/legal` | 2026-11-07 | Both pages no longer mention it (checked in `apps/web/app/terms/page.tsx` and `legal/page.tsx`) | Counsel: must Prood register at all? |
| Dashboard downloads and customer erasure called the wrong URL (production bug) | 2026-11-07 | The dashboard called the API's session-only routes at `COMMERCE_API_URL` (which ends in `/v1`) plus `/api/...`, so the account download, the store download and **Erase this customer** would have returned 404. Fixed with `getCommerceApiOrigin` in `apps/dashboard/lib/commerce-api.ts`, with a test (`apps/dashboard/lib/__tests__/commerce-api-origin.test.ts`) | Check once after deploy: see "Verify when the change lands" |

---

## Before relying on this

Facts nobody could verify from the repository.

| Item | Why | Who |
|---|---|---|
| Headcount, turnover and balance sheet total of Búzios e Tartarugas, Lda. | Micro and small-enterprise exemptions | Owner |
| Vercel plan, runtime log retention, whether a log drain exists | Incident evidence, `/privacy` "a limited time" | Owner |
| Vercel DPA, DPF listing, SCC module for Prood's own data as controller. Read the Vercel Trust Center incident notices | Transfer register | Owner |
| Region `fra1` on all seven Vercel projects, Redis `fra1`, Neon `eu-central-1`, R2 EU jurisdiction. The repo pins none of them: no `apps/*/vercel.json` has `regions` (checked 2026-11-07), and `fra1` rests on a manual check on 2 November 2026 | `_docs/LEGAL.md`, BRAND.md and the "set up to run in Frankfurt" wording of the public texts depend on it (item 22) | Owner |
| Resend: delivery log period, DPF status, whether the API key is shared with Eleva | Privacy text, key rotation | Owner |
| INTH: legal entity, DPA, record retention, support access from outside the EEA | `/subprocessors`, [LIA 2](./legitimate-interest-assessments.md) | Owner |
| Neon: DPA accepted, plan, restore window, whether backups can be purged on request | `/dpa` Annex 2 promises point-in-time restore | Owner |
| Upstash: DPA, SCC module, SOC 2 | `/subprocessors` | Owner |
| Cloudflare: which account holds the R2 bucket (Eleva's, per the owner's notes) and the `rbarona.workers.dev` Worker, DPA, DPF listing | Who the processor's customer is (item 18) | Owner |
| Geoapify (Keptagon s.r.o.): DPA, retention, whether its script stores anything on the device | The browser calls it directly with the shopper's IP address | Owner |
| Who hosts hello@prood.com, how long it keeps mail, who can read it | The only mailbox, for requests, breaches and DSA notices (item 19) | Owner |
| Whether the mailbox is read in Portuguese as well as English | `/terms` and `/legal` now say the DSA contact point answers in both | Owner |
| MFA on Vercel, Neon, Upstash, Cloudflare, Stripe, Resend, GitHub, the mailbox provider | `/dpa` Annex 2, [security measures](./security-measures.md) | Owner |
| Better Auth defaults in the installed version: invitation validity (48 hours), session 7 days refreshed after 1 day, rate-limit windows, password limits, `deleteUser` fresh-session rule | `/privacy` quotes them, the repo sets none | Owner |
| `CRON_SECRET`, `KV_REST_API_*`, `AUTH_PROXY_SECRET`, `INTEGRATION_ENCRYPTION_KEY` set on the right projects | Retention job refuses without the first | Owner |
| Every `integration_config` value in production carries the `enc:v1:` prefix | `packages/commerce/src/crypto.ts` reads unprefixed values as plaintext | Owner |
| Number of live stores and shoppers | DPIA "large scale" | Owner |
| Whether the admin app is the only way to reach other stores' data, and who has the admin role | [LIA 6](./legitimate-interest-assessments.md) | Owner |
| Whether `autonomous` Agent Auth mode lets an agent act without a person's approval | `/terms` says a person approves; `apps/api/lib/auth/server.ts` enables both modes | Owner |
| Whether the Better Auth API key plugin deletes a store's keys on store deletion | `apikey.reference_id` has no foreign key | Owner |
| Whether Prood must be registered on the Livro de Reclamações electrónico | The statement was removed from `/terms` and `/legal` on 2026-11-07, so this is now a question for counsel only | Counsel |
| Vercel Firewall rules on public routes | None are in the repo | Owner |
| Stripe: test data to clear before go-live, and whether the "independent controller" description holds | `/privacy` now calls it an independent controller for Prood's plan fees; `_docs/PRODUCTION_READINESS.md` billing steps | Owner |
| Existing real merchants or shoppers, if any | Retention, export and the terms acceptance gate all affect them. Accounts created before 2026-11-07 have no `terms_version` | Owner |

---

## Verify when the change lands

Each item "ships with this change": it is in the uncommitted working tree on 2026-11-07, read but not run, except where a row says it was tested (the reset tool, passkeys and the admin proxy, on a throwaway database). Check each before merging, and merge the records with the code, not ahead of it.

| Item | Check | Where |
|---|---|---|
| Retention cron | `crons` entry `30 3 * * *` on `/internal/retention`. 401 without the secret. A logged `Retention job finished` the morning after the first production run. Values equal the published text: sessions 0, verification 0, invitations 30, agent events 730 days | `apps/api/vercel.json`, `apps/api/app/internal/retention/route.ts`, `packages/auth/src/retention.ts` |
| Retention failures | Nothing alerts. Add a check-in monitor | Vercel |
| Account export | The JSON has no password hash and no token. Also contains invitations and agents. Merchants and shoppers can both download it | `packages/auth/src/data-export.ts`, `apps/api/app/api/account/export/route.ts`, `apps/storefront/app/api/account/export/route.ts` |
| Account deletion | Both apps refuse a sole owner. Password or fresh sign-in is asked. `customers.auth_user_id` is nulled in every store. Memberships, agents, hosts, approval requests are gone. A merchant deleting from a store page loses their dashboard login and the page does not say so | `apps/api/lib/auth/server.ts`, `apps/storefront/lib/auth/server.ts`, `apps/*/components/account/your-data.tsx` |
| Store export | Owner or admin only, session only (API key and agent get 403). Includes carts, wishlists and promotions too. Image addresses, no image files. Provider credentials absent. Built in memory before streaming, so test a large store. Downloads are not logged | `packages/platform/src/privacy/store-data.ts`, `apps/api/app/api/store/export/route.ts`, `packages/auth/src/download.ts` |
| Store deletion | Owner only. Refused with a live plan. All rows gone or none. `apikey`, R2 images, Redis sessions, Vercel domain entries are not covered (see [retention](./retention-schedule.md)). Test that the transaction really rolls back | `apps/api/lib/auth/organization-hooks.ts`, `apps/dashboard/components/store/store-data.tsx` |
| Two-factor | On a test merchant account: **Profile**, turn it on with the password, scan the code, confirm, save the ten backup codes. Sign out and in: the browser lands on `/two-factor`, a wrong code is refused, a backup code works once. There is no "Trust this device" option, and a direct verify call with `trustDevice: true` is refused with "Prood doesn't trust devices". The same account is refused a password sign-in at a store with "Sign in from the Prood dashboard". Read-only SQL on `two_factor`: `secret` and `backup_codes` are not readable text. The account export shows `twoFactorEnabled` and no secret. Turning it off asks for the password. Deleting the user removes the `two_factor` row. Sign in at the dashboard with two-factor on, then open `/admin`: it opens without a second prompt, because the session is shared (item 14). Sign out, then sign in at `/admin/login` directly: the code is asked. Confirm the migration really is on production: `\d two_factor` and `\d admin_audit_event` | `apps/api/lib/auth/server.ts`, `apps/dashboard/components/account/two-factor-panel.tsx`, `apps/storefront/lib/auth/two-factor-guard.ts`, `apps/api/lib/auth/two-factor-guard.ts`, `packages/platform/drizzle/0013_two_factor_audit.sql` |
| Two-factor reset | As admin A, open the user page of a test account (admin B or a merchant) that has two-factor on, use **Reset two-factor**, and confirm the person is signed out everywhere, `user.two_factor_enabled` is false, no `two_factor` row remains, and the audit log shows `user.reset_two_factor`. The button is absent on your own page and for an account without two-factor. Then sign in as the reset account with the password only. Tested on a throwaway database (19 of 19), not yet on production | `apps/admin/app/(admin)/users/actions.ts`, `packages/auth/src/two-factor.ts` |
| Passkeys | `PASSKEY_RP_ID=prood.com` and `PASSKEY_ORIGINS=https://prood.com` are set on `prood-api`, `prood-dashboard` and `prood-admin` (a half configuration stops the server at start). On a **real authenticator**, on prood.com: add a passkey under Profile (it asks for a fresh sign-in), sign out, sign in with it on `/dashboard/login` and on `/admin/login`, confirm no authenticator code is asked, remove it, and read the account export. The `passkey` table is empty until this test. `/security` and `/dpa` Annex 2 say passkeys are available and optional | `apps/dashboard/components/account/passkeys-panel.tsx`, `apps/*/components/auth/login-form.tsx`, `packages/auth/src/passkey-config.ts` |
| One-domain cutover: addresses | On https://prood.com, open `/login` (the dashboard), `/` (the homepage when signed out, the dashboard when signed in), `/admin/login`, `/docs`, `/pay/c/x` (an unknown session: the checkout app's page, not the marketing site), `/v1/health` and `/.well-known/agent-configuration` (its addresses start with `https://prood.com`). Each must answer from the right app, with that app's own security headers and no doubled Content-Security-Policy. `prood-web` has `DASHBOARD_ORIGIN`, `ADMIN_ORIGIN`, `DOCS_ORIGIN`, `CHECKOUT_ORIGIN` and `API_ORIGIN` (the build fails on Vercel without them), no other project has the prood.com domain, and the old `dashboard.`, `api.`, `checkout.`, `docs.` and `admin.` hosts are removed from their projects | `apps/web/next.config.ts`, `turbo.json` |
| One-domain cutover: sign-in | Sign in at `/login`. In the browser, one `__Secure-better-auth.session_token` cookie exists, for prood.com only (host-only, no `Domain` attribute). `AUTH_COOKIE_DOMAIN` is unset on every project. `/admin` opens with the same session (by design: item 14). `NEXT_PUBLIC_DASHBOARD_URL` is `https://prood.com`, `NEXT_PUBLIC_ADMIN_URL` in `/admin` and `CHECKOUT_URL` in `/pay`; `NEXT_PUBLIC_AUTH_URL` and `COMMERCE_API_URL` are the API project's own address | `packages/auth/src/proxy.ts`, `packages/auth/src/origins.ts`, `apps/api/lib/auth/server.ts` |
| One-domain cutover: payment | A test payment through `/pay` with a store connected to Stripe in test mode: the storefront redirects to `https://prood.com/pay/c/{id}`, the payment completes, `/pay/confirm/{id}` returns to the store, and the webhook arrives at `/pay/api/webhooks/stripe/{org}` and reaches the API. **Merchants' payment-provider webhook URLs are now `/pay/api/webhooks/{provider}/{org}`: each one registered on the old checkout host must be registered again at the provider** (Stripe, Easypay, Ifthenpay), or paid orders will not be confirmed. The URL shown on each store's provider page is built from `CHECKOUT_URL`. Tell affected merchants | `packages/commerce/src/payments.ts`, `apps/checkout/app/api/webhooks`, `apps/dashboard/app/(dashboard)/integrations/[provider]/page.tsx` |
| One-domain cutover: old addresses | Bookmarks, emails and saved links to the old subdomains or to `*.vercel.app` addresses no longer lead to the product (nothing in the repo redirects them). Prood's own plan billing webhook must be `https://prood.com/api/auth/stripe/webhook`: check it in the Stripe dashboard. Search the repository, the Stripe dashboard, the Resend templates and the public pages for the old hosts | `_docs/PRODUCTION_READINESS.md` |
| Terms acceptance | Create a test merchant account with the box unticked (refused in the form), then ticked. In Neon read-only SQL: `select terms_version, terms_accepted_at from "user" where email = ...` gives the `LEGAL_VERSION` date and a time. A direct call to `/sign-up/email` without `termsVersion` is refused. A shopper sign-up on a store leaves both columns empty. Confirm `0015_terms_acceptance.sql` is on production: `\d "user"` | `apps/dashboard/components/auth/register-form.tsx`, `apps/api/lib/auth/server.ts`, `packages/types/src/legal.ts` |
| Dashboard downloads and erasure (production bug fixed 2026-11-07) | **After deploy, click once each: Download my data (Profile), Download store data (Store settings) and Erase customer (a test customer).** The dashboard had called the API's session-only routes at `COMMERCE_API_URL` (which ends in `/v1`) plus `/api/...`, so all three would have returned 404. `getCommerceApiOrigin` now builds the origin. Check each returns a file or succeeds, and `COMMERCE_API_URL` on `prood-dashboard` still ends in `/v1` and is the API project's own address, not prood.com | `apps/dashboard/lib/commerce-api.ts`, `apps/dashboard/app/api/export/account/route.ts`, `apps/dashboard/app/api/export/store/route.ts`, `apps/dashboard/app/(dashboard)/customers/actions.ts` |
| Administrator audit log | As an admin, ban and unban a test user, change a role, sign one device and all devices out, revoke a test agent. Each shows under **Audit log** in the admin app with admin, action, target and IP address (not blank behind Vercel). A failing write logs `[admin-audit] COULD NOT RECORD`: search the runtime log. The test user's account export lists the actions under `adminActionsOnYou`. The row for `agent.revoke` has the agent's id as target, so it does not appear in any person's export. Run the retention job and check the log line carries `adminAuditEvents` | `apps/admin/app/(admin)/audit/page.tsx`, `packages/auth/src/admin-audit.ts`, `packages/auth/src/data-export.ts` |
| Erasing one shopper | On a test store, erase a shopper with and without "Also clear their email, addresses and notes". The profile, addresses, wishlist and carts are gone. Orders remain with no customer link, and with the box ticked have no contact email, addresses, notes, history notes or return notes. A review by the same name is untouched. An API key and an agent get 403 from `DELETE /api/store/customers/{id}`. A member (not owner or admin) gets no button. Nothing logs the erasure: write it in the rights-request log | `packages/platform/src/privacy/store-data.ts`, `apps/api/app/api/store/customers/[id]/route.ts`, `apps/dashboard/components/store/erase-customer-section.tsx` |
| Image upload and R2 | Still absent. Search for callers of `getStorage` and `uploadForTenant` before each release. List `org/` in bucket `prood-public` in the Cloudflare console: it should hold no merchant file. A hit means upload shipped and item 16 is due | `packages/commerce/src/storage.ts` |
| Security headers | Every app sends the headers. CSP does not break sign-in, checkout (Stripe), Geoapify, Vercel Analytics, c15t or images. `'unsafe-inline'` stays on scripts | `packages/security-headers/src/index.ts`, `apps/*/next.config.*` |
| `security.txt` and `/security` | The file points to `/security#report`. The page did not exist on 2026-11-07 | `apps/web/app/.well-known/security.txt/route.ts`, `apps/web/app/security` |
| Public texts agree with the code | See the next section | `apps/web/app/*` |
| Docs and facts files | Update `_docs/LEGAL.md` (item 3 now describes work that shipped, `docs/architecture/privacy-data.mdx` path is `apps/docs/content/docs/architecture/privacy-data.mdx`), `_docs/BRAND.md` ("there's no export"), `apps/web/components/marketing/keys.tsx` ("Store export isn't built yet"), `apps/web/components/marketing/features.tsx` ("store export: Coming later"), and the docs privacy page | Several |

---

## Public texts that disagree with the code or with each other

Read against the working tree on 2026-11-07. The public texts were revised the same day after an independent AI review (not a lawyer's review), and rows 1 to 19 were rechecked against the revised pages. "Resolved" means the page now says what the code does or what is known. It does not mean counsel has seen it. Each remaining row needs a decision, not a silent fix.

| # | Where | Says | The code or another text says | Action |
|---|---|---|---|---|
| 1 | `/dpa` 11.1 ("export all Customer Data") | Everything can be exported | The export leaves out image files and provider credentials | **Resolved.** 11.1 now leaves out image files and credentials. Recheck at merge |
| 2 | `/terms` ("Leaving, switching") and `/dpa` 11.1: store deletion removes "everything the store owns in our database ... at once" | Complete, immediate, but now limited to the database | Checkout sessions in Redis last up to 7 days (11.1 now says they expire within the Annex 1 periods), `apikey` rows are not removed by the code read, Vercel domain entries are removed by a second browser call, backups age out (both texts say so) | **Mostly resolved.** Left: `apikey` rows and custom domains are not mentioned. Say what stays |
| 3 | `/dpa` 11.2 ("Prood then deletes Customer Data") | Deletion at the end | No tool deletes R2 files, and no upload puts one there today | **Resolved.** Images are removed on request (11.1, `/terms`). Revisit when upload ships (item 16). 11.2 now gives return or deletion at the Customer's choice, with deletion within 30 days after the retrieval period |
| 4 | `/dpa` Annex 2: a role "that cannot read the sign-in tables" | No read | Migration `0006_auth_tables_private.sql` grants `SELECT (id, email)` on `user` | **Resolved.** Annex 2 says "except for account identifiers and email addresses" |
| 5 | `/dpa` Annex 2: row-level security isolates stores | Always isolated | The connecting role has BYPASSRLS, and isolation holds inside `withTenant()` only (`0000_app_role.sql`) | **Resolved.** Annex 2 and `/security` now say a few cross-store operations run under the connecting role, in code written to touch only the rows concerned |
| 6 | `/dpa` Annex 2: provider credentials "encrypted with AES-256-GCM" | Always encrypted | `packages/commerce/src/crypto.ts` reads a value without the `enc:v1:` prefix as plaintext | **Resolved in the text** ("when they are saved"). The code fallback stays: check production rows, then remove it (AGENTS.md prefers a clean break). Listed in [security measures](./security-measures.md) |
| 7 | `/terms` ("The contract"): the DPA is part of the contract after the person ticks the box | DPA shown and accepted | The register form now links Terms, DPA and Privacy and records the version and time | **Resolved 2026-11-07.** See "Done" |
| 8 | `/terms` ("API, MCP and AI agents"): beyond public reads, an agent does only what a person with the right role approved | Approval always | `modes: ["delegated", "autonomous"]` in `apps/api/lib/auth/server.ts` | Confirm what `autonomous` does |
| 9 | `/privacy` ("Request counters last seconds to a minute") and `/dpa` Annex 1 | Up to a minute | Windows come from Better Auth rules and are not set in the repo | Verify |
| 10 | `/privacy` ("an invitation is valid for 48 hours"; sessions "7 days from last use") | Fixed values | Library defaults. Sessions refresh after 1 day, so "7 days" is a day out | Verify, or set them in code |
| 11 | `/privacy` and `/subprocessors`, `/dpa` Annex 3 | Same company | Now all three say "Databricks, Inc. and Neon, LLC" or "Databricks and Neon" | **Resolved.** Entity names still need the provider's own terms (item 23) |
| 12 | `/privacy` and `/subprocessors` on Stripe | Was "Processor" | `/privacy` now says "Independent controller (payment processing)", and `/subprocessors` lists it under providers for Prood's own data | **Resolved in the text.** Counsel to confirm the role |
| 13 | `/dpa` 7.2: Module Three "entered into" with each sub-processor | Was "done" | 7.2 now says Prood relies on the clauses in the sub-processor's own terms, and the Module Four clause is gone. Nobody has checked the providers' terms | **Resolved in the text.** Verify the underlying terms (item 3) |
| 14 | `/privacy` and `/subprocessors`: Vercel and Cloudflare under the Data Privacy Framework | Certified | Still to confirm (item 23) | Verify |
| 15 | `_docs/LEGAL.md` and the public texts: functions in `fra1` | Set | No `regions` in any `apps/*/vercel.json`. The public texts now say "set up to run in the Frankfurt region ... as Prood last checked on 2 November 2026" | **Softened.** Verify in the console, or pin `regions` (item 22) |
| 16 | `_docs/LEGAL.md` item 3 and `apps/docs/.../privacy-data.mdx` ("What does not exist yet") | No clean-up, no self-service | Both exist in the working tree | **Resolved** (`LEGAL.md` updated 2026-11-07). Recheck `privacy-data.mdx` |
| 17 | `_docs/BRAND.md`, `apps/web/components/marketing/keys.tsx`, `features.tsx` | "No export", "Store export isn't built yet", "Coming later" | The store export exists | **Resolved** on 2026-11-07: the three files now say the data can be downloaded and that only the owner transfer is missing |
| 18 | `/terms` ("Law and courts") and `/legal`: complaints book | Prood has a complaints book route | Prood sells only to businesses | **Resolved.** The statement is removed from both pages. Counsel: must Prood register at all? |
| 19 | `/legal`: Art. 171 Commercial Companies Code details | Complete | Share capital now shown (item 17). DSA contact languages are stated (English and Portuguese) | **Resolved** |
| 20 | `/privacy` (administrator actions row), `/security` and `/dpa` Annex 2 list the audited actions as "a ban, a role change, signing a device out, revoking an agent" | Four kinds | `ADMIN_ACTIONS` now also has `user.reset_two_factor` (a reset of someone's two-factor) | Add it to the three lists, and bump `LEGAL_VERSION` with `legal.updated` |
| 21 | `/privacy`: Geoapify has a row in Prood's own table (legitimate interests and contract) and is a "Processor" in the recipients table | Prood decides the purpose | [LIA, "Not Prood's basis"](./legitimate-interest-assessments.md) and the [records](./records-of-processing.md) say the merchant is the controller and Prood its processor | Ask counsel which view holds |
| 22 | `/dpa` 2.1 and 1.3: Prood is the controller of the link between guest orders and a shopper account, on the Customer's instruction | Controller of the link | [Records](./records-of-processing.md) and [LIA 8](./legitimate-interest-assessments.md) already ask counsel about the split | Ask counsel (also in "For counsel") |
| 23 | `/privacy` cookie table: `better-auth.two_factor` lasts 10 minutes | Fixed value | Plugin default in better-auth 1.7.14 (`twoFactorCookieMaxAge` 600 seconds), not set in the repo | Verify, or set it in code |

---

## Known gaps, not being built

Each has an owner and a rationale. A gap stays here until the code closes it.

| Gap | Rationale | Owner |
|---|---|---|
| Passkeys untested on a real device | Passkeys are on in production, but nobody has tried one on a real authenticator on prood.com (item 11). Two-factor is optional, so an account with neither relies on a password and the sign-in rate limit | Owner |
| Reads by administrators are not logged | The audit log records changes only. Impersonation is not recorded (item 12) | Owner |
| Two-factor recovery depends on the owner checking identity | A reset tool exists. The checks are not written down, and the SQL fallback is untested (item 13) | Owner |
| Dashboard session valid at the admin console | By design: one origin, one session cookie. Mitigated by two-factor or a passkey on administrator accounts, which is optional. Decide whether to require it (items 14 and 15) | Owner |
| Automated deletion of dormant shopper accounts | By decision: shopper accounts are linked to merchants' orders, so they are kept until the person deletes them, and reviewed yearly | Owner |
| Deletion of R2 images on store deletion | Not needed today, because image upload is not built and no merchant file is in R2. It must be built with image upload (item 16) | Owner |
| A Neon restore drill | Not planned. `/dpa` Annex 2 names point-in-time restore, and nobody has tried it | Owner |
| Per-provider retention numbers | Vercel logs, Resend delivery logs, INTH consent record, Neon backups, Geoapify: nobody has verified them. Owner-only (item 8) | Owner |
| Purging `approvalRequest`, expired agents and hosts, expired API keys | Not in the retention job. Removed only with the user | Owner |
| Audit of store-export downloads and of shopper erasures | The export holds a store's customer list and is not logged. The audit log covers Prood administrators only, not merchants | Owner |
| Dependency audit, Dependabot, secret scanning | `.github/workflows/ci.yml` runs none | Owner |
| Error tracking, uptime and retention-job monitoring | Not wired (`_docs/PRODUCTION_READINESS.md`) | Owner |
| External penetration test | None commissioned. `/dpa` Annex 2 says so | Owner |
| Accessibility audit and statement | None done ([EU obligations](./eu-obligations.md)) | Owner |
| Price history for the Omnibus lowest-price rule | Not built. Merchants' duty, but the tool cannot check it | Owner |
| Fields for GPSR information and privacy and returns pages | Not built | Owner |
| Integration key rotation | `INTEGRATION_ENCRYPTION_KEY` cannot change without losing every credential | Owner |

---

## Merge day, in this order

| Step | Why | Who |
|---|---|---|
| 1. Set `CRON_SECRET` on `prood-api`, and check the other secrets in the first table | The job refuses without it | Owner |
| 2. Update `legal.updated` in `apps/web/lib/site.ts` **and** `LEGAL_VERSION` in `packages/types/src/legal.ts` (the same date, YYYY-MM-DD), with `/privacy`, `/terms`, `/dpa` and this folder together | They must agree: a sign-up records `LEGAL_VERSION`, and the register form refuses a version other than the current one. `_docs/LEGAL.md` says to change them as one | Owner or agent |
| 3. Write the `/security` page | `security.txt` points at it | Owner or agent |
| 4. Merge and deploy `prood-api` and the dashboard and storefront together | The export and delete routes are split across apps | Owner |
| 5. Next morning: look for `Retention job finished` in the `prood-api` logs | First run. Runtime logs may last a day or less | Owner |
| 6. Download an account export and a store export from a test store, delete a test shopper and a test store, and compare with the [retention schedule](./retention-schedule.md). Click **Download my data**, **Download store data** and **Erase customer** once each right after the deploy | Nothing here has been run on production, and the dashboard called the wrong URL for all three until the fix of 2026-11-07 | Owner |
| 7. Cut over to one domain: set the five `*_ORIGIN` variables on `prood-web`, the one-domain URL variables and the passkey variables on the other projects, leave `AUTH_COOKIE_DOMAIN` unset, deploy `prood-web` last, then run the "One-domain cutover" rows in "Verify when the change lands". Confirm migrations `0013`, `0014` and `0015` are on production (the owner says they are) | The sign-up gate needs the `terms_version` column, or every registration fails. Provider webhooks stay broken until each merchant registers the new `/pay/api/webhooks/...` URL | Owner |

---

## Promises that need the owner's approval

The public texts make these commitments. Each is a real operational duty.

| Commitment | Where |
|---|---|
| Reply to rights requests within one month, and act on a merchant's shopper request within 30 days | `/privacy`, `/dpa` 8.2 |
| Notify merchants of a breach without undue delay, and aim to do so within 48 hours | `/dpa` 9.1, `/security` |
| 30 days' notice of a new sub-processor, 14 days to object, no use of it for an objecting merchant | `/dpa` 6.2, 6.3 |
| 30 days' notice of material changes to the terms | `/terms` "Changes" |
| 60 days' notice before a price rises or a limit changes in a way that matters, and the right to leave without charge before it applies | `/terms` "Plans, fees and taxes" |
| 30 days' notice and a statement of reasons before ending a contract without cause, and a statement of reasons for every suspension or closure at the latest when it takes effect | `/terms` "Suspension and termination" |
| Take an unsettled dispute to mediation if the customer asks, with a mediator both sides agree on | `/terms` "Suspension and termination" |
| Record which terms version and time each new account accepted, and keep `LEGAL_VERSION` equal to the date on the legal pages | `/terms` "The contract", `/dpa` |
| Confirm receipt of a report of illegal content, look at it, and tell the reporter what was decided. Tell the Customer why content was removed or a store suspended | `/terms` "Acceptable use" |
| Answer the DSA contact point in English or Portuguese | `/terms`, `/legal` |
| Delete all Customer Data within 30 days after the retrieval period, however the contract ends, unless the law requires it to be kept | `/terms` "Leaving, switching", `/dpa` 11.2 |
| Answer a request for data not listed in the export within 30 days | `/terms` "Leaving, switching" |
| Answer a disagreement within 14 days | `/terms` |
| Complete a switch within 30 days, or tell the customer within 14 working days why not, with a date of up to seven months | `/terms` "Leaving, switching" |
| Remove image files on request | `/terms` "Leaving, switching" |
| Keep closed-store data at least 30 days for retrieval, unless asked to delete at once | `/terms` |
| Answer written compliance questions within 30 days, and allow audits on 30 days' notice | `/dpa` 12 |
| Read hello@prood.com every working day | Needed to meet the one-month and 48-hour deadlines |

---

## For counsel

| Question | Context |
|---|---|
| Review all public texts, in English only. Does an English-only contract work with Portuguese customers? | `/terms` "General" |
| Do the terms pass the Portuguese standard-terms regime (Decree-Law 446/85: verify articles)? Is acceptance by a required box on the sign-up form, with the version and time stored, enough for the terms and the DPA together? | Register form, `user.terms_version`, [EU obligations](./eu-obligations.md) |
| Are the revised liability caps enforceable against a business (the higher of EUR 1,000 and 12 months of fees, EUR 5,000 or twice the fees for a DPA breach), does the customer's responsibility for third-party claims "to the extent they arise from" its store, Customer Data or sales pass, and does it all pass Art. 13 of the Data Act? | `/terms` "Liability", `/dpa` 13.1 |
| Is Prood a hosting service only, or an online platform, under the DSA? Is it an online intermediation service under P2B, and is it a small enterprise for Art. 11? Is mediation "if you ask, with a mediator we agree on" enough for Art. 12, now that the sentence naming mediators is gone? | [EU obligations](./eu-obligations.md) |
| Are the Art. 16 and 17 DSA procedures enough as written (notice content, confirmation of receipt, decision, statement of reasons to the Customer), and is "English or Portuguese" enough for the contact point? | `/terms` "Acceptable use", `/legal` |
| Is a statement of reasons for every suspension or termination, at the latest when it takes effect, enough for P2B Art. 4? | `/terms` "Suspension and termination" |
| Do the Data Act switching clauses work as written: retrieval period and 30-day deletion however the contract ends, the exportable data list plus "ask us for anything not listed", and no switching charges? | `/terms` "Leaving, switching", `/dpa` 11.2 |
| `/dpa` 2.1 now says the link between guest orders and a shopper account is the Customer's instruction and Prood's own controller activity. Does that split work, and is the cross-store link lawful as written? | [LIA 8](./legitimate-interest-assessments.md), Art. 26, `/privacy` (guest-order row) |
| Is Stripe an independent controller for Prood's own plan fees, as `/privacy` now says? | `/privacy`, `/subprocessors` |
| Does `/privacy` give Prood a legitimate-interest basis for Geoapify address suggestions, or is the merchant the controller (the records say the merchant)? | `/privacy`, [LIA](./legitimate-interest-assessments.md) |
| Does Prood stay outside PSD2 while it stores providers' credentials and creates payments? | `/terms` "Payments" |
| Are the retention periods right: sessions 0 days, verification 0, invitations 30 days after expiry, agent events 24 months, administrator audit events 24 months, Customer Data deleted within 30 days after the retrieval period, correspondence 2 years, rights log 3 years, breach register 5 years, invoices 10 years? | [Retention schedule](./retention-schedule.md). Art. 21(3) of Lei 58/2019 and the limitation periods |
| Is a browser call to Geoapify before consent within Art. 5(3) ePrivacy and Art. 5 of Lei 41/2004? | [LIA, cookies](./legitimate-interest-assessments.md) |
| Does the accessibility exemption for microenterprises cover Prood, and what must merchants do? | EAA row |
| Confirm the NIS2, CRA, AI Act, DPO and DPIA conclusions | Respective files |
| Does a Livro de Reclamações entry apply to a B2B-only SaaS? (The statement was removed from `/terms` and `/legal` on 2026-11-07.) | [EU obligations](./eu-obligations.md) |
| Should Prood publish Portuguese versions of the privacy notice and the cookie banner, and which language prevails? | `_docs/LEGAL.md` item 10 |
| Is it acceptable that the admin console accepts a dashboard session, because the dashboard and the admin console share one origin on prood.com, or must two-factor be required for administrators first? | Items 14 and 15 |
| Are the DPA sub-processor wording (Art. 28(4)), the SCC wording and the audit wording consistent with Art. 28 and Chapter V now? | `/dpa` 6.4, 7.2, 12 |
| Is 24 months right for the administrator audit log, and must an erasure request reach audit rows about the person (or by the person) before then? | [Records of processing](./records-of-processing.md), [LIA 6](./legitimate-interest-assessments.md) |
| Is Prood's processing of product images, which can show people, covered by the DPA? | `/dpa` Annex 1 |
