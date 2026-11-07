# Compliance records

Internal records that sit behind the public legal texts. The public texts are `apps/web/app/{privacy,terms,dpa,subprocessors,security,legal}/page.tsx`, and the facts they quote are in [`_docs/LEGAL.md`](../LEGAL.md). This folder holds what a supervisory authority, a merchant or a lawyer can ask Prood to show: records of processing, assessments, runbooks, a map of the EU rules that apply, and open items.

> **Status.** Drafted on 2026-11-07 with AI assistance, checked against the code on 2026-11-07 (branch `apps-apply-storefront-learnings`), and updated the same day for the changes listed in the next note. The public texts were revised after an independent AI review, which is not a lawyer's review. This is not legal advice, a certification or an audit. Prood does not claim to be "GDPR compliant" (see `_docs/BRAND.md`), and nothing here should be quoted as if it did. A qualified Portuguese lawyer must review these records and the public texts before anyone relies on them. See [open items](./open-items.md).

> **Rows marked "Ships with this change".** Four things were built in the same change as these records (2026-11-07): a daily retention job, self-service account export and deletion, self-service store export and store deletion, and security headers with `security.txt` and the `/security` page. The code is in `packages/auth/src/retention.ts`, `apps/api/app/internal/retention/route.ts`, `packages/auth/src/data-export.ts`, `packages/platform/src/privacy/store-data.ts`, `packages/security-headers/` and `apps/web/app/.well-known/security.txt/route.ts`. Unit tests cover the retention route's secret check, the session-only export routes, store deletion and export against a disposable database. Later the same day four more things were built, and these records were updated for them: opt-in two-factor sign-in (`packages/auth/src/two-factor.ts`), the administrator audit log (`packages/auth/src/admin-audit.ts`), erasing one shopper (`eraseCustomer` in `packages/platform/src/privacy/store-data.ts`), and the finding that image upload is not built, so deleting R2 files with a store is not needed yet. Migration `0013_two_factor_audit.sql` was applied to production on 2026-11-07 according to the owner. Nothing has run against real accounts yet: each marked row is listed in [open items](./open-items.md) under "Verify when the change lands".

> **Later on 2026-11-07.** Six more changes, all in the same working tree. (1) Passkeys are built and **off in production**: the plugin loads only when `PASSKEY_RP_ID` and `PASSKEY_ORIGINS` are both set (`packages/auth/src/passkey-config.ts`, `apps/api/lib/auth/server.ts`), and a relying party ID cannot work while the apps run on `*.vercel.app`. The `passkey` table (`0014_passkeys.sql`) is in production according to the owner. (2) A **Reset two-factor** tool on the admin user page replaces the manual SQL runbook (`resetUserTwoFactor`, `resetTwoFactor` in `packages/auth/src/two-factor.ts`). (3) The admin app's auth proxy never forwards or sets the trusted-device cookie (`proxyAdminAuthRequest`, `packages/auth/src/proxy.ts`), and an admin without two-factor sees a banner. A gap remains once the session cookie is shared across prood.com hosts: see [open items](./open-items.md) 14. (4) Terms acceptance is recorded (`user.terms_version`, `user.terms_accepted_at`, migration `0015_terms_acceptance.sql`, applied to production according to the owner, `LEGAL_VERSION` in `packages/types/src/legal.ts`). (5) `/terms`, `/privacy`, `/dpa`, `/security` and `/legal` were revised after an independent AI review. (6) A production bug was found and fixed: see [open items](./open-items.md), "Verify when the change lands". Passkeys and the reset tool were tested on a throwaway database, not on real accounts, a real authenticator or the real prood.com hosts.

---

## Documents

| Page | Purpose | Law |
|---|---|---|
| [Records of processing](./records-of-processing.md) | What Prood processes as controller and as processor | GDPR Art. 30 |
| [Retention schedule](./retention-schedule.md) | How long each category is kept, and what enforces it | GDPR Art. 5(1)(e) |
| [Legitimate interest assessments](./legitimate-interest-assessments.md) | Balancing tests behind each Art. 6(1)(f) use | GDPR Art. 6(1)(f), 21 |
| [DPIA and DPO assessment](./dpia-and-dpo-assessment.md) | Why neither is required today, and what changes that | GDPR Art. 35, 37 |
| [Transfer register](./transfer-register.md) | Providers outside the EEA and their safeguards | GDPR Chapter V |
| [Incident response](./incident-response.md) | Breach handling, notices and the register | GDPR Art. 33, 34 |
| [Data subject requests](./data-subject-requests.md) | Runbook for rights requests, for Prood's own data and for merchants' | GDPR Art. 12 to 22 |
| [Security measures](./security-measures.md) | Controls in the code, known gaps, CRA scope | GDPR Art. 32 |
| [EU obligations](./eu-obligations.md) | Which EU and Portuguese laws apply to Prood and to its merchants | Several |
| [Open items](./open-items.md) | Actions for counsel and the owner, and what is unverified | |

---

## Who does what

Prood is run by Búzios e Tartarugas, Lda. The only contact channel is hello@prood.com, which is also the DSA point of contact. There is no data protection officer. "Owner" in these records means the owner of the company: it is the only role named, and there is no deputy (see [open items](./open-items.md)).

---

## Keeping this current

Change these records in the same pull request as the behaviour they describe.

| If you change | Also update |
|---|---|
| `RETENTION_DAYS` in `packages/auth/src/retention.ts`, or the cron in `apps/api/vercel.json` | [Retention schedule](./retention-schedule.md), `/privacy` (processing table), `/dpa` Annex 1, `apps/docs/content/docs/architecture/privacy-data.mdx` |
| A provider, or what it receives | [Transfer register](./transfer-register.md), [records of processing](./records-of-processing.md), `/privacy`, `/subprocessors`, `/dpa` Annex 3, and give the 30-day notice in DPA 6.2 |
| A cookie, or anything stored in the browser (including the two-factor and trusted-device cookies) | `/privacy` (cookies table), `packages/consent/src/messages.ts` |
| The legal text of `/terms`, `/privacy`, `/dpa`, `/subprocessors`, `/security` or `/legal` | Bump `legal.updated` in `apps/web/lib/site.ts` **and** `LEGAL_VERSION` in `packages/types/src/legal.ts` (the same date, YYYY-MM-DD), so new sign-ups record the new version. Then update [`_docs/LEGAL.md`](../LEGAL.md) and the rows in [open items](./open-items.md) under "Public texts that disagree" |
| `PASSKEY_RP_ID`, `PASSKEY_ORIGINS`, the passkey plugin in `apps/api/lib/auth/server.ts`, or the apps' hostnames, `AUTH_COOKIE_DOMAIN` or `BETTER_AUTH_URL` | [Security measures](./security-measures.md), [open items](./open-items.md) 11 and 14, [records of processing](./records-of-processing.md), [data subject requests](./data-subject-requests.md) (account export), `/security`, `/dpa` Annex 2, `/privacy` (cookies table) |
| A second optional tool behind the consent banner | `packages/consent/src/messages.ts`, `/privacy`, `/subprocessors`, `apps/*/c15t.config.ts` |
| `ADMIN_ACTIONS` in `packages/auth/src/admin-audit.ts`, the `twoFactor` plugin options in `apps/api/lib/auth/server.ts`, `resetTwoFactor`, `proxyAdminAuthRequest`, or who can erase a shopper | [Security measures](./security-measures.md), [LIA 6](./legitimate-interest-assessments.md), [records of processing](./records-of-processing.md), [data subject requests](./data-subject-requests.md), `/security`, `/dpa` Annex 2, `/privacy` |
| A table that holds personal data | [Records of processing](./records-of-processing.md), [retention schedule](./retention-schedule.md), the account and store exports |
| A control named in DPA Annex 2 | [Security measures](./security-measures.md) |
| A plan limit, or billing going live | [Records of processing](./records-of-processing.md), [EU obligations](./eu-obligations.md), `/terms`, `/privacy` |
| Agent Auth or MCP capabilities | [EU obligations](./eu-obligations.md) (AI Act), [DPIA screening](./dpia-and-dpo-assessment.md) |

Review the whole folder yearly, and before any funding round or first paying customer.
