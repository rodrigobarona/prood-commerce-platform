# Data subject requests

How to handle a request under Art. 12 to 22 GDPR. The deadline is one month from receipt (Art. 12(3)). `/privacy` promises one month, and `/dpa` 8.2 promises 30 days when a merchant asks Prood to act on a shopper's data.

Last reviewed: 2026-11-07. Counsel has not reviewed this yet. **Ships with this change** marks self-service tools that are in the working tree but not committed or released (see the [README](./README.md)). Until they are released, `/privacy`, `/terms` and `/dpa` say there are none and promise handling by hand: the manual route below is what keeps that promise.

---

## Routine

Requests reach hello@prood.com, the only mailbox. Nothing alerts on a new message: no webhook or alert address is configured in the repository. The owner reads the inbox every working day and does not rely on any alert. A monthly pass also checks the retention cron log in Vercel (ships with this change).

---

## Steps

| Step | Action |
|---|---|
| 1. Log | Record date received, requester, right, and due date, and copy the request into the log. Keep it outside the production database. The location is not chosen yet: see [open items](./open-items.md). The inbox is not a record |
| 2. Role | Whose data is this? Account, session, consent record and Prood correspondence: Prood is controller. Orders, customers, addresses, carts, returns, reviews and checkout sessions: the merchant is controller and Prood is processor. See below |
| 3. Identity | Ask for proof only if there is reasonable doubt (Art. 12(6)). A reply from the account's email address is usually enough. Do not ask for ID documents by default |
| 4. Act | Follow the tables below |
| 5. Reply | Within one month. A complex or numerous request may take 2 more months, and the person must be told in the first month. Free unless manifestly unfounded or excessive |
| 6. Refuse | Give reasons, and mention the right to complain to CNPD and to go to court (Art. 12(4)) |
| 7. Close | Record the outcome. Keep the record under the [retention schedule](./retention-schedule.md) |

---

## Prood's own data (accounts, sessions, consent record)

| Right | Self-service (ships with this change) | By hand |
|---|---|---|
| Access, copy, portability | **Merchants:** dashboard **Profile**, "Your data", "Download my data" (`/api/export/account`): profile, sign-in methods, sessions, memberships, invitations, agents. No password hash, tokens or API keys. **Shoppers:** the same file from their store account page (`apps/storefront/app/api/account/export/route.ts`). Neither includes orders: those are the store's. | Look the address up in `user`, `account`, `member`, `invitation`, `session` (Neon SQL editor, read-only), the consent record at INTH, the mailbox and Resend. Reply with the data. Never send the password hash or session tokens |
| Rectification | The profile page: unverified which fields it lets a person change | Change `user.name` or `user.email` by hand, and record it |
| Erasure | **Merchants:** "Delete your account" on the dashboard Profile page (Better Auth `deleteUser`, password or a sign-in from the last day). Blocked while the user is the sole owner of a store: delete the store or add an owner first. **Shoppers:** deletion on the store account page. Removes the sign-in account, sessions and the links to customer rows. Orders and customer rows stay with the store | There is no admin tool that deletes a user. Without the self-service tool, ask the person to use it. If they cannot sign in, delete the `user` row in Neon (the foreign keys cascade to `session`, `account`, `member`, `agent`, `agentHost` and others) and record exactly what ran |
| Restriction | None | Revoke sessions and ban the user in the admin app (`banUser`, `revokeAllUserSessions` in `apps/admin/app/(admin)/users/actions.ts`), and record it |
| Objection (Art. 21) | None | Stop unless compelling grounds or legal claims apply. See the [assessments](./legitimate-interest-assessments.md) |
| Withdraw consent to visit statistics | **Cookie settings** in the footer of prood.com and of every store | Nothing to do by hand. Ask INTH to delete the record if the person asks for erasure (Art. 17) |

---

## Erasure checklist for Prood's own data

Check each place, and record what was done.

1. **Account.** The person deletes it, or the owner deletes the `user` row. Memberships, invitations the person sent, agents, agent hosts, capability grants and approval requests go by foreign-key cascade (`packages/auth/src/schema.ts`).
2. **Sole owner.** Ask the person to add an owner or delete the store. If the store must go, warn that deletion removes all its commerce data at once, and offer the store export first.
3. **Both roles.** A person who is both a merchant and a shopper has one `user` row. Deleting it from either side removes both logins. Both apps refuse while the person is the sole owner of a store, but otherwise nothing warns them. Say so before acting.
4. **Agent events.** `agent_event` rows hold an actor ID with no foreign key. They remain for 24 months. The ID no longer resolves to a person in Prood's systems.
5. **Redis.** Rate-limit counters hold the IP address for seconds to a minute. Checkout sessions hold a shopper's details for 24 hours, or 7 days once a payment has started. Do not delete them by hand unless asked: they expire.
6. **Resend.** Check whether sent-email logs can be removed. If not, they expire on the provider's schedule (unverified).
7. **INTH.** Delete the consent record if the person asks.
8. **Mailbox.** Delete threads about the person, unless needed for the request record or a claim.
9. **Stripe.** Only owners of paid stores have a billing record. Billing is in test mode. Invoices must be kept 10 years once billing is live.
10. **Backups.** Tell the person that backups at Neon are overwritten on the provider's schedule. The period is unverified, so say "a limited time", as `/privacy` does.

---

## When Prood is the processor (merchants' data)

For orders, customers, addresses, carts, returns, reviews and checkout sessions, the merchant is the controller (`/privacy`, "Store shoppers"; `/dpa` 8.1).

1. Do not answer the substance. Tell the person Prood will pass the request on, or ask them to contact the store.
2. Forward it to the store's owners without undue delay (`/dpa` 8.1). The owner's email comes from the `member` and `user` tables (query in [incident response](./incident-response.md)).
3. Help the merchant answer. `/dpa` 8.2 promises that, on the merchant's email, Prood finds, exports, corrects or deletes a shopper's data within 30 days. The merchant's own tools are: the store export (ships with this change: **Store settings**, "Download store data", JSON, all plans, owners and admins), the dashboard's customers and orders pages, and on a paid plan the Admin API. **A merchant cannot erase one shopper from the dashboard**: the only function that does, `deleteCustomer` (`packages/platform/src/admin/customers.ts`, over `adminDeleteCustomer`), is called by no API route, MCP tool or dashboard action (checked 2026-11-07; `apps/docs/content/docs/architecture/privacy-data.mdx` says the same). Prood must do it by hand, and record that it did. This is a gap: see [open items](./open-items.md).
4. **Images.** The store export has image addresses, not files, and store deletion leaves the files in R2 bucket `prood-public`. `/terms` ("Leaving, switching") says image files are removed on request. Do it by hand in the Cloudflare console, for the store's objects only (the key layout was not checked), and record what was deleted. There is no written procedure or tool.
5. If the person cannot name a store, look the email up in `customers` and `orders` across stores and name the stores. Do not share more.
6. Orders may be kept where the merchant has a tax or fulfilment basis, as `privacy-data.mdx` says. Prood does not decide the merchant's retention.

---

## Reply templates

```text
We received your request on [date]. We will reply by [date].
```

```text
We have completed your request: [what was done].
Copies in our backups are overwritten on our database provider's schedule.
You may complain to the Comissão Nacional de Proteção de Dados (www.cnpd.pt).
```

```text
This data is held for [store], which decides how it is used.
We have passed on your request. You can also contact them at [contact].
```
