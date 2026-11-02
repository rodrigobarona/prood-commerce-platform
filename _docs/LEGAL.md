# Prood legal facts

The single source for facts quoted in `/terms`, `/privacy` and `/dpa`. When one
changes, update those pages and their "Last updated" date. These pages are drafts
written from the Eleva and EUlabel patterns and haven't had a lawyer's review.

## Operator

| Fact | Value |
| --- | --- |
| Legal name (firma) | BÚZIOS E TARTARUGAS - LDA |
| Short name in copy | Búzios e Tartarugas, Lda. |
| Legal form | Sociedade por quotas |
| NIPC and VAT number | 515001708 |
| Registered office | Rua Gil Vicente 2, 2775-198 Parede, Portugal |
| Commercial registry | Conservatória do Registo Comercial de Cascais |
| Governing law and courts | Portuguese law, courts of Cascais |
| Supervisory authority | Comissão Nacional de Proteção de Dados (CNPD) |

Never publish or commit the shareholders' or managers' names, their tax numbers or
the Certidão access code.

## Roles

Prood is the controller for its own users' accounts, and the processor for merchants'
shopper data. Merchants are the controllers of that data.

## Where data lives

Checked 2 November 2026: the Neon database is in `eu-central-1`, all seven Vercel
projects run functions in `fra1`, Upstash `prood-redis` is in `fra1`, and the R2
bucket `prood-public` uses EU jurisdiction. Resend's primary processing is in the US.
Recheck before changing the claims in `_docs/BRAND.md`.

## Billing

Prood's own service fees go through the same path as Eleva: Stripe collects the
subscription, and TOConline issues the certified Portuguese invoice. Stripe invoices
aren't Portuguese tax documents. See `packages/accounting` in `elevacare-monorepo`.
