# Incident response

What to do when a security incident might affect personal data. Art. 33 GDPR gives 72 hours to reach CNPD (when Prood is controller). `/dpa` clause 9.1 gives 48 hours to reach merchants (when Prood is processor). Both clocks start on awareness, so start the steps below at once.

Last reviewed: 2026-11-07. Counsel has not reviewed this yet. This is a plan, not a record of any practised drill: none has been run.

---

## Roles

| Role | Who |
|---|---|
| Incident lead and decision-maker | Owner |
| Deputy | None named. See [open items](./open-items.md) |
| Contacts | An offline list the owner holds: provider support routes, counsel, CNPD, and the owner's phone, usable if accounts or the mailbox are compromised. **Unverified that it exists** |
| Legal support | External counsel, when engaged |

hello@prood.com is the only mailbox, so reports, rights requests and merchants' messages share one inbox. Nothing alerts on a report. The owner reads it every working day (see [data subject requests](./data-subject-requests.md)). Copy each report into the register: do not rely on the inbox as the record. Provider notices go to the account owner's address at each provider.

---

## Severity

| Level | Meaning | Example |
|---|---|---|
| 1 | Personal data confirmed exposed, altered, lost or unavailable | Cross-tenant read of orders, leaked database credentials used, store export downloaded by the wrong person |
| 2 | Possible exposure, under investigation | Leaked key with unknown use, provider notice |
| 3 | No personal data at risk | Blocked attack, outage of public pages only |

Awareness means reasonable certainty that a breach happened. A short investigation is allowed, but it cannot be used to delay.

---

## Steps

| When | Step |
|---|---|
| Immediately | Open a register entry. Record who reported it, when, and what is known |
| First hours | Contain, following the steps below. Export the logs you need now: Vercel runtime logs may last hours, not days |
| By 24 hours | Decide: is it a breach? Whose data? Is Prood controller (accounts, sessions, consent record), processor (orders, customers, checkout sessions), or both? |
| By 48 hours | Processor: email the owners of affected stores (`/dpa` 9.1). No tool prints them. Run in the Neon SQL editor: `select o.slug, u.email from member m join "user" u on u.id = m.user_id join organization o on o.id = m.organization_id where m.role = 'owner'` and narrow it with `where o.slug = ...`. Check the query still matches the schema before relying on it |
| By 72 hours | Controller: notify CNPD, unless the breach is unlikely to create a risk (Art. 33(1)). If late, give the reasons |
| Without undue delay | Controller: tell affected people if the risk is high (Art. 34). For shoppers, merchants are the controllers and decide on this, with Prood's help (`/dpa` "Helping with compliance") |
| After closing | Record the cause, effects and remedy. Update [security measures](./security-measures.md). Review within 30 days |

Information may be given in phases (Art. 33(4), `/dpa` 9.2). Do not wait for a complete picture.

**Provider breaches.** A provider notice starts Prood's own awareness. Prood's providers' notice periods are unverified (see the [transfer register](./transfer-register.md)), so a late provider notice can leave little time.

**Where the merchant is controller.** The merchant decides on CNPD and data-subject notices. Prood supplies what it needs.

---

## Containment

**Rotate only what is affected, then redeploy.** Vercel applies changed variables only to new deployments, so redeploy every listed project and confirm the old value is refused before recording it as contained. Secrets, and where they live (names from the code, project names from `_docs/LEGAL.md` and the owner's notes; the Vercel project settings were not checked):

| Secret | Where | Note |
|---|---|---|
| `BETTER_AUTH_SECRET` | `prood-api`, `prood-dashboard`, `prood-admin`, `prood-storefront` | Signs sessions and, through `apps/api/lib/agent-proxy-token.ts`, the token `/v1` trusts for agents. Rotating signs everyone out, and agent tokens already issued fail. Test on a preview first |
| `AUTH_PROXY_SECRET` | `prood-api`, `prood-dashboard`, `prood-admin`: same value | Without it every request to `/api/auth` fails in production (`_docs/PRODUCTION_READINESS.md`) |
| `DATABASE_URL` | Every app that reads the database, Neon | Rotate the role password in Neon |
| `INTEGRATION_ENCRYPTION_KEY` | Apps that save or read provider credentials | **Rotation is not supported.** The key is derived once with a fixed salt, and ciphertext carries only a format prefix (`packages/commerce/src/crypto.ts`). Replacing the key makes every stored credential unreadable. Have merchants re-enter their credentials, or add key versions first. Gap |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | `prood-api`, `prood-storefront`, checkout | Upstash |
| `CHECKOUT_API_SECRET` | Apps that talk to checkout | |
| `CRON_SECRET` | `prood-api` | Guards `/internal/retention` (ships with this change) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | `prood-api`, `prood-storefront` | The key may be shared with Eleva (unverified): rotating it affects that project too |
| `BILLING_STRIPE_SECRET_KEY`, `BILLING_STRIPE_WEBHOOK_SECRET` | `prood-api` | Test mode today |
| `S3_*` (R2 key) | Apps that upload images | Scoped key, on Eleva's account per the owner's notes |
| `VERCEL_TOKEN` | Dashboard | Used for custom domains. Broad scope: rotate first if the dashboard is breached |
| Payment-provider credentials | Merchants' own accounts, stored in `integration_config` | Merchants revoke them at the provider. Tell them |
| Merchant API keys | Dashboard, or delete the `apikey` row | Tell the merchant |

**Suspending a merchant.** There is no suspended state for a store. To stop access, revoke its API keys, revoke its members' sessions and agents in the admin app (`apps/admin/lib/admin-queries.ts`, `revokeAgent`; `apps/admin/app/(admin)/users/actions.ts`, `revokeAllUserSessions`), and ban the users (`banUser` in the same file, which sets `user.banned`). The admin app has no delete-user or delete-store action. Or delete the store (owner action, ships with this change). Deleting removes data, so use it only where `/terms` allows, after an export, and email the owners the same day.

**Other tools.** Vercel Firewall rules, or taking a route offline.

**Logs.** Vercel runtime logs last 1 day on Pro and 1 hour on Hobby, longer with Observability Plus (as read for the sibling EUlabel project on 2026-11-01: not checked for Prood's plan). Without a log drain, evidence can be gone before anyone reads this page. Observability (Sentry, PostHog) is not wired (`_docs/PRODUCTION_READINESS.md`). A log drain to EU storage is on the [open items](./open-items.md).

---

## NIS2

The sibling EUlabel record says Decree-Law 125/2025 transposes NIS2 in Portugal, and that micro and small enterprises are out of scope for the service types relevant to a hosting provider, with a few size-independent exceptions. Prood is a small company, so no NIS2 incident reporting is expected today. This has not been checked for Prood. See [EU obligations](./eu-obligations.md). Counsel should confirm, including the decree-law number.

---

## Templates

### Notice to merchants (`/dpa` 9)

```text
Subject: Prood security notice: personal data breach

We are writing under clause 9 of our data processing terms.

What happened: [nature of the breach, date, when we became aware]
Data affected: [categories of data, approximate number of records]
People affected: [categories, approximate number]
Likely consequences: [...]
What we have done: [containment and remedy]
What you may need to do: [e.g. assess your Art. 33 duties, rotate your payment provider credentials]
Contact: hello@prood.com

We will send updates as we learn more. Next update by: [date]
```

### Notice to CNPD (Art. 33(3))

Use the form CNPD publishes on its website, and keep a copy in the register. Prepare:

1. Controller: Búzios e Tartarugas, Lda., NIPC 515001708, contact hello@prood.com
2. Nature of the breach, with categories and approximate numbers of people and records
3. Likely consequences
4. Measures taken or proposed
5. Reason for any delay past 72 hours

### Notice to people (Art. 34)

```text
Subject: Important security notice from Prood

On [date], [what happened, in plain language].
This may affect your [data].
What this could mean for you: [...]
What we have done: [...]
What you can do: [...]
Questions: hello@prood.com
```

---

## Register

Art. 33(5) requires a record of every breach, including those not notified. Keep one entry per incident, with:

| Field | Note |
|---|---|
| ID, dates | Detected, aware, contained, closed |
| Facts | What happened, cause |
| Data | Categories, numbers, role (controller or processor) |
| Effects | Consequences for people |
| Decision | Notified or not, and why |
| Notices | To CNPD, merchants, people, with dates |
| Remedy | Measures, follow-up |

The register has no entries as of 2026-11-07, and **its location is not chosen**. It must be kept outside the production database, so it survives an incident. The owner chooses. Each entry holds its own copy of the report and of every notice.
