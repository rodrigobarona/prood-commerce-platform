# Prood legal facts

The single source for facts quoted in `/terms`, `/privacy`, `/dpa`, `/subprocessors`,
`/security` and `/legal` (all in `apps/web/app`). The internal records behind them are in
`_docs/compliance/`: start with its README and `open-items.md`. When one changes, update those pages and
`legal.updated` in `apps/web/lib/site.ts`, which sets the date shown on each.

The pages were finished on 7 November 2026 from the code and from the EUlabel
pattern. They haven't had a lawyer's review.

## Operator

| Fact | Value |
| --- | --- |
| Legal name (firma) | BÚZIOS E TARTARUGAS - LDA |
| Short name in copy | Búzios e Tartarugas, Lda. |
| Legal form | Sociedade por quotas |
| NIPC and VAT number | 515001708 (VAT PT515001708) |
| Registered office | Rua Gil Vicente 2, 2775-198 Parede, Portugal |
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
`_docs/BRAND.md`.

## Consent

c15t on INTH (org `prood`, project `prood.com`). Category `measurement` is Vercel Web
Analytics, the only optional tool. If a second one is added, change the banner copy
in `packages/consent/src/messages.ts`, the cookies and processing tables in
`/privacy`, and `/subprocessors` in the same change.

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
   certifications and the transfer safeguard for each (Upstash, Cloudflare and INTH
   in particular).
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
   administrators change on accounts is recorded and shown in the admin app. Image upload
   isn't built, so no merchant file sits in R2 and deleting R2 files isn't needed yet: build
   it with upload. Still missing: passkeys, and a log of what administrators read. Losing
   both phone and backup codes is fixed by hand (`_docs/compliance/data-subject-requests.md`).
   The pages say so.
4. **Promises you make.** The pages commit Prood to: 30 days to export or delete on
   request, 48 hours to notify a breach, 30 days' notice for new sub-processors,
   60 days' notice for Free plan limit changes, 14 days to answer a disagreement,
   no notice period to leave. Keep them or change them.
5. **Platform rules (P2B Regulation 2019/1150).** `/terms` says mediators will be
   named once agreed. Name at least two, or take that sentence out.
6. **Commercial registry details.** `/legal` omits the share capital. Add it from
   the Certidão permanente if you want it shown.
7. **Billing go-live.** When paid plans open: remove "Paid plans can't be bought yet"
   from `/terms`, `/pricing` and the API refusals, wire TOConline, add it to
   `/subprocessors` and `/privacy`, and check the VAT wording.
8. **Store privacy notices.** Merchants have no field for their own privacy notice,
   terms of sale or returns, and the real stores serve no policy pages. `/terms`
   makes that the merchant's job. A product fix would be better.
9. **Two-factor, passkeys and the audit log.** Two-factor with an authenticator app is
   optional and built into the dashboard (Profile) and the admin sign-in. `/dpa` Annex 2 and
   `/security` say Prood doesn't offer passkeys and doesn't log what administrators read.
   Update both if either ships, or if two-factor becomes required for administrators.
10. **Language.** The pages are in English only. `/terms` says so. Add Portuguese
    versions and a precedence clause if you want one.
