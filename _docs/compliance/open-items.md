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
| 4 | Make two-factor and an administrator audit log a dated decision, or add them | Highest security gaps ([security measures](./security-measures.md)). Admins read every store's accounts and can impersonate, with no record | Owner |
| 5 | Images: the store export carries image addresses only and R2 files are not deleted with the store. The updated `/terms` says image files are public and removed on request, and `/dpa` 11.1 and 11.2 still say "all Customer Data". Decide: build R2 export and deletion, or write the by-hand procedure and fix the `/dpa` wording | Data Act switching, `/terms`, `/dpa` 11.1, 11.2 | Owner |
| 6 | Confirm company size (people, turnover, balance sheet) | Decides DSA, P2B, NIS2 and EAA exemptions ([EU obligations](./eu-obligations.md)) | Owner |
| 7 | Name two mediators, or remove the sentence in `/terms` | P2B Art. 12, `_docs/LEGAL.md` item 5 | Owner |
| 8 | Read each provider's real retention and write it into `/privacy`: Vercel logs, Resend delivery logs, INTH consent record, Neon backups, Geoapify | `/privacy` says "a limited time". Weakens [LIA 1 and 2](./legitimate-interest-assessments.md) | Owner |
| 9 | Give merchants a place for their privacy notice, terms of sale and returns | Merchants must publish them, and Prood offers no field (`_docs/LEGAL.md` item 8). GDPR Art. 13, DL 24/2014 | Owner |
| 10 | Choose where the breach register, rights-request log and offline contact list live, and write the first copy | The [runbooks](./incident-response.md) need them from the first event | Owner |

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
| Security headers | Every app sends the headers. CSP does not break sign-in, checkout (Stripe), Geoapify, Vercel Analytics, c15t or images. `'unsafe-inline'` stays on scripts | `packages/security-headers/src/index.ts`, `apps/*/next.config.*` |
| `security.txt` and `/security` | The file points to `/security#report`. The page did not exist on 2026-11-07 | `apps/web/app/.well-known/security.txt/route.ts`, `apps/web/app/security` |
| Public texts agree with the code | See the next section | `apps/web/app/*` |
| Docs and facts files | Update `_docs/LEGAL.md` (item 3 now describes work that shipped, `docs/architecture/privacy-data.mdx` path is `apps/docs/content/docs/architecture/privacy-data.mdx`), `_docs/BRAND.md` ("there's no export"), `apps/web/components/marketing/keys.tsx` ("Store export isn't built yet"), `apps/web/components/marketing/features.tsx` ("store export: Coming later"), and the docs privacy page | Several |

---

## Public texts that disagree with the code or with each other

Read against the working tree on 2026-11-07, including the uncommitted edits to `/dpa`, `/privacy` and `/terms`. Each needs a decision, not a silent fix.

| # | Where | Says | The code or another text says | Action |
|---|---|---|---|---|
| 1 | `/dpa` 11.1 ("export all Customer Data") | Everything can be exported | The export leaves out image files and provider credentials, and `/terms` says so | Reword 11.1 |
| 2 | `/terms` ("Deletion") and `/dpa` 11.1: "everything the store owns is removed at once" | Complete, immediate | R2 images stay (removal on request), checkout sessions in Redis last up to 7 days, `apikey` rows are not removed by the code read, Vercel domain entries are removed by a second browser call, backups age out | Say what stays |
| 3 | `/dpa` 11.2 ("Prood then deletes Customer Data") | Deletion at the end | Images are not deleted by any tool | Say images are removed on request |
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
| 16 | `_docs/LEGAL.md` item 3 and `apps/docs/.../privacy-data.mdx` ("What does not exist yet") | No clean-up, no self-service | Both exist in the working tree | Rewrite |
| 17 | `_docs/BRAND.md`, `apps/web/components/marketing/keys.tsx`, `features.tsx` | "No export", "Store export isn't built yet", "Coming later" | The store export exists in the working tree | Rewrite when it ships |
| 18 | `/terms` ("Law and courts") and `/legal`: complaints book | Prood has a complaints book route | Prood sells only to businesses | Ask counsel |
| 19 | `/legal`: Art. 171 Commercial Companies Code details | Complete | Share capital omitted (`_docs/LEGAL.md` item 6). DSA contact languages not stated | Add |

---

## Known gaps, not being built

Each has an owner and a rationale. A gap stays here until the code closes it.

| Gap | Rationale | Owner |
|---|---|---|
| Two-factor and passkeys | Not built. `/dpa` Annex 2 says so. Merchant accounts rely on a password and the sign-in rate limit | Owner |
| Administrator audit log | Not built. `/dpa` Annex 2 says so. Admin power is broad and unrecorded | Owner |
| Automated deletion of dormant shopper accounts | By decision: shopper accounts are linked to merchants' orders, so they are kept until the person deletes them, and reviewed yearly | Owner |
| Deletion of R2 images on store deletion | Not built. `/terms` says images are removed on request, so it is a manual job | Owner |
| A Neon restore drill | Not planned. `/dpa` Annex 2 names point-in-time restore, and nobody has tried it | Owner |
| Per-provider retention numbers | Vercel logs, Resend delivery logs, INTH consent record, Neon backups, Geoapify: nobody has verified them | Owner |
| Purging `approvalRequest`, expired agents and hosts, expired API keys | Not in the retention job. Removed only with the user | Owner |
| Merchant tool to delete one shopper | `deleteCustomer` exists in `packages/platform/src/admin/customers.ts` and is called from nowhere. Done by hand | Owner |
| Audit of store-export downloads | The file holds a store's customer list and is not logged | Owner |
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
| Are the retention periods right: sessions 0 days, verification 0, invitations 30 days after expiry, agent events 24 months, correspondence 2 years, rights log 3 years, breach register 5 years, invoices 10 years? | [Retention schedule](./retention-schedule.md). Art. 21(3) of Lei 58/2019 and the limitation periods |
| Is a browser call to Geoapify before consent within Art. 5(3) ePrivacy and Art. 5 of Lei 41/2004? | [LIA, cookies](./legitimate-interest-assessments.md) |
| Does the accessibility exemption for microenterprises cover Prood, and what must merchants do? | EAA row |
| Confirm the NIS2, CRA, AI Act, DPO and DPIA conclusions | Respective files |
| Does a Livro de Reclamações entry apply to a B2B-only SaaS? | `/legal` |
| Should Prood publish Portuguese versions, and which language prevails? | `_docs/LEGAL.md` item 10 |
| Is Prood's processing of product images, which can show people, covered by the DPA? | `/dpa` Annex 1 |
