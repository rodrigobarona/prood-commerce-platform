# Prood legal facts

The single source for facts quoted in `/terms`, `/privacy`, `/dpa`, `/subprocessors`,
`/security` and `/legal` (all in `apps/web/app`). The internal records behind them are in
`_docs/compliance/`: start with its README and `open-items.md`. When one changes, update those pages,
`legal.updated` in `apps/web/lib/site.ts` (the date shown on each) and `LEGAL_VERSION` in
`packages/types/src/legal.ts`, which must equal that date as YYYY-MM-DD. Every new sign-up records
`LEGAL_VERSION` as the version of the terms and data processing terms it accepted
(`user.terms_version`, `user.terms_accepted_at`), so a text change that leaves it alone means new
accounts record the old version.

The pages were finished on 7 November 2026 from the code and from the EUlabel
pattern, then revised the same day after an independent AI review (not a lawyer's review). They
haven't had a lawyer's review.

## Operator

| Fact | Value |
| --- | --- |
| Legal name (firma) | BÚZIOS E TARTARUGAS - LDA |
| Short name in copy | Búzios e Tartarugas, Lda. |
| Legal form | Sociedade por quotas |
| NIPC and VAT number | 515001708 (VAT PT515001708) |
| Registered office | Rua Gil Vicente 2, 2775-198 Parede, Portugal |
| Share capital (capital social) | €100 (confirmed by the owner, 2026-11-07) |
| Commercial registry | Conservatória do Registo Comercial de Cascais |
| Governing law and courts | Portuguese law, courts of Cascais (Comarca de Lisboa Oeste) |
| Supervisory authority | Comissão Nacional de Proteção de Dados (CNPD) |
| Only contact channel | hello@prood.com (also the DSA point of contact) |

Never publish or commit the shareholders' or managers' names, their tax numbers or
the Certidão access code.

## Roles

- Prood is the **controller** of platform accounts, shopper sign-in accounts (one
  `user` per email, platform-wide), session security, visit statistics and the
  privacy choice on prood.com and on stores.
- Prood is the **processor** of shopper data in orders, carts, customers, addresses
  and checkout sessions. Merchants are the controllers.
- A store's Stripe, Easypay or Ifthenpay account is the merchant's own provider, not
  a Prood sub-processor.

## Where data lives

Checked 2 November 2026: the Neon database is in `eu-central-1`, all seven Vercel
projects run functions in `fra1`, Upstash `prood-redis` is in `fra1`, and the R2
bucket `prood-public` uses EU jurisdiction. Resend's primary processing is in the US.
INTH hosts consent records in Frankfurt. Recheck before changing the claims in
`_docs/BRAND.md`. These come from a manual look in each console. No `apps/*/vercel.json` sets
`regions` (checked 7 November 2026), so `fra1` is not pinned in the repository: the public texts
say the functions are "set up to run" in Frankfurt, as last checked on 2 November 2026. Pin
`regions` or look again before relying on it.

## Consent

c15t on INTH (org `prood`, project `prood.com`). Category `measurement` is Vercel Web
Analytics, the only optional tool. If a second one is added, change the banner copy
in `packages/consent/src/messages.ts`, the cookies and processing tables in
`/privacy`, and `/subprocessors` in the same change.

## Terms acceptance

The dashboard sign-up form (`apps/dashboard/components/auth/register-form.tsx`) has a required box:
"I accept the terms of service and the data processing terms, on behalf of my business, and I have
read the privacy policy". It sends `termsVersion`, and `apps/api/lib/auth/server.ts` refuses
`/sign-up/email` unless that equals `LEGAL_VERSION` (`packages/types/src/legal.ts`), then stamps
`user.terms_version` and `user.terms_accepted_at` (migration `0015_terms_acceptance.sql`, applied to
production according to the owner). Shoppers who sign up on a store don't accept the merchant terms,
so both columns stay empty for them. An account keeps the version it accepted. Accounts that existed
before the change have no record.

## Billing

Prood's own service fees go through the same path as Eleva: Stripe collects the
subscription, and TOConline issues the certified Portuguese invoice. Stripe invoices
aren't Portuguese tax documents. See `packages/accounting` in `elevacare-monorepo`.
TOConline isn't wired yet, and paid plans can't be bought yet. `/terms` ("Plans, fees
and taxes") and `/privacy` (billing row) are written for the day they can.

## Before publishing: review list

These are the places where a person has to confirm a fact or make a call. Everything
else comes from the code.

1. **Entities and certifications.** Confirm the legal names and addresses in
   `/dpa` Annex 3 and `/subprocessors`: Neon/Databricks, Upstash, Cloudflare,
   Geoapify (Keptagon s.r.o.), INTH, Stripe Payments Europe. Confirm the
   certifications and the transfer safeguard (Data Privacy Framework or Standard Contractual
   Clauses) for each (Upstash, Cloudflare and INTH in particular). `/dpa` 7.2 no longer says a
   particular module was signed, but nobody has read the providers' own terms.
2. **Retention that depends on a provider.** Vercel log retention, Resend delivery
   log retention, the INTH consent record retention and the Neon backup window are
   described as "a limited time" or "the provider's own schedule". Replace with the
   real numbers if you want to state them.
3. **Retention and rights tools.** A daily job (`/internal/retention`, cron 03:30 UTC,
   `CRON_SECRET` on prood-api) deletes expired sessions, verification links, expired
   invitations, agent events older than 24 months and administrator audit events older
   than 24 months. Merchants and shoppers can download and delete their accounts, and
   owners can download and delete a store. Owners and admins can erase one shopper from
   the dashboard (orders stay, or lose the shopper's contact details if the merchant
   chooses). Merchants and Prood staff can turn on two-factor sign-in, and what Prood
   administrators change on accounts is recorded and shown in the admin app. Losing both
   phone and backup codes is fixed by a platform administrator with **Reset two-factor** on the
   user page of the admin app (`resetUserTwoFactor` in `apps/admin/app/(admin)/users/actions.ts`,
   audited as `user.reset_two_factor`), after the owner has checked who is asking
   (`_docs/compliance/data-subject-requests.md`). Image upload isn't built, so no merchant file
   sits in R2 and deleting R2 files isn't needed yet: build it with upload. Still missing: a log
   of what administrators read. The pages say so.
4. **Promises you make.** The pages commit Prood to: 30 days to export or delete on
   request, aiming to notify a breach within 48 hours (`/dpa` 9.1), 30 days' notice for new
   sub-processors, 60 days' notice before a price or Free plan limit changes in a way that
   matters, 30 days' notice and a statement of reasons before ending a contract without fault,
   14 days to answer a disagreement, mediation on request, no notice period to leave, and
   deletion of Customer Data within 30 days after the retrieval period. Keep them or change them.
5. **Platform rules (P2B Regulation 2019/1150).** Done on 7 November 2026: `/terms` no longer says
   mediators will be named. It says that if you ask, Prood takes an unsettled dispute to mediation
   with a mediator both sides agree on. Art. 12 of the Regulation asks for two named mediators, so
   counsel must say whether that is enough. Termination always comes with a statement of reasons
   (Art. 4), and whether Prood is a small enterprise for P2B is for the owner to confirm.
6. **Commercial registry details.** `/legal` shows the share capital (EUR 100, from the owner on
   7 November 2026). Recheck it against the Certidão permanente when you next have it.
7. **Billing go-live.** When paid plans open: remove "Paid plans can't be bought yet"
   from `/terms`, `/pricing` and the API refusals, wire TOConline, add it to
   `/subprocessors` and `/privacy`, and check the VAT wording.
8. **Store privacy notices.** Merchants have no field for their own privacy notice,
   terms of sale or returns, and the real stores serve no policy pages. `/terms`
   makes that the merchant's job. A product fix would be better.
9. **Two-factor, passkeys and the audit log.** Two-factor with an authenticator app is
   optional and built into the dashboard (Profile) and the admin sign-in. Passkeys are
   available and optional (see item 11). Prood does not remember devices, so there is no
   trusted-device cookie. `/security` and `/dpa` Annex 2 say two-factor is not yet required
   for administrators, and that the dashboard and the admin console share one sign-in on
   prood.com, so a session started at the dashboard also opens the admin console. Both also say
   Prood doesn't log what administrators read. Update both if two-factor becomes required for
   administrators.
10. **Language.** The pages are in English only. `/terms` says so. The contact point answers in
    English and Portuguese (`/terms`, `/legal`). The privacy notice and the cookie banner have no
    Portuguese version yet. Add Portuguese versions and a precedence clause if you want one.
11. **Passkeys.** Passkeys sign in without a password and count as a second step. The plugin
    loads only when `PASSKEY_RP_ID` and `PASSKEY_ORIGINS` are both set (`resolvePasskeyConfig` in
    `packages/auth/src/passkey-config.ts`). prood.com is one domain, so a relying party ID of
    `prood.com` works: production sets `PASSKEY_RP_ID=prood.com` and
    `PASSKEY_ORIGINS=https://prood.com` on `prood-api`, `prood-dashboard` and `prood-admin`
    (set by the owner, not checked from the repository). A `*.vercel.app` address is a public
    suffix, so no ID works there; use prood.com. `/security` and `/dpa` Annex 2 say passkeys are
    available and optional. Not yet tested on a real authenticator or on prood.com.
12. **Everything only the owner can state.** The real retention numbers (Vercel logs,
    Resend logs, INTH consent record, Neon backups), each provider's legal entity and transfer
    safeguard, whether the Cloudflare R2 account and the `rbarona.workers.dev` Worker belong to Prood or
    to Eleva (the contract party), the mailbox provider for hello@prood.com, and Prood's size for P2B.
    All are in `_docs/compliance/open-items.md`.
