# Data subject requests

How to handle a request under Art. 12 to 22 GDPR. The deadline is one month from receipt (Art. 12(3)). `/privacy` promises one month, and `/dpa` 8.2 promises 30 days when a merchant asks Prood to act on a shopper's data.

Last reviewed: 2026-11-07. Counsel has not reviewed this yet. **Ships with this change** marks self-service tools that are in the working tree but not committed or released (see the [README](./README.md)). Until they are released, `/privacy`, `/terms` and `/dpa` say there are none and promise handling by hand: the manual route below is what keeps that promise. The shopper erasure tool, the administrator audit log and two-factor were added on 2026-11-07 and are in the same working tree.

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
| Access, copy, portability | **Merchants:** dashboard **Profile**, "Your data", "Download my data" (`/api/export/account`): profile (including whether two-factor is on), sign-in methods, sessions, memberships, invitations, agents, and the actions Prood administrators took on the account (`adminActionsOnYou`: what and when, from `admin_audit_event`). No password hash, tokens, API keys, or two-factor secret and backup codes. **Shoppers:** the same file from their store account page (`apps/storefront/app/api/account/export/route.ts`). Neither includes orders: those are the store's. | Look the address up in `user`, `account`, `member`, `invitation`, `session` (Neon SQL editor, read-only), `admin_audit_event` (rows where `target_id` is the person's ID, and, if the person is or was an admin, rows where `actor_id` is theirs: the self-service file leaves the second kind out), the consent record at INTH, the mailbox and Resend. Reply with the data. Never send the password hash, session tokens, or anything from `two_factor` |
| Rectification | The profile page: unverified which fields it lets a person change | Change `user.name` or `user.email` by hand, and record it |
| Erasure | **Merchants:** "Delete your account" on the dashboard Profile page (Better Auth `deleteUser`, password or a sign-in from the last day). Blocked while the user is the sole owner of a store: delete the store or add an owner first. **Shoppers:** deletion on the store account page. Removes the sign-in account, sessions and the links to customer rows. Orders and customer rows stay with the store. Two-factor goes with the account (`two_factor.user_id` cascades). `admin_audit_event` rows about the person stay up to 730 days: say so in the reply, and see [open items](./open-items.md) for the counsel question | There is no admin tool that deletes a user. Without the self-service tool, ask the person to use it. If they cannot sign in, delete the `user` row in Neon (the foreign keys cascade to `session`, `account`, `member`, `agent`, `agentHost` and others) and record exactly what ran |
| Restriction | None | Revoke sessions and ban the user in the admin app (`banUser`, `revokeAllUserSessions` in `apps/admin/app/(admin)/users/actions.ts`). The admin app writes both to the audit log. Record it in the rights-request log too |
| Objection (Art. 21) | None | Stop unless compelling grounds or legal claims apply. See the [assessments](./legitimate-interest-assessments.md) |
| Withdraw consent to visit statistics | **Cookie settings** in the footer of prood.com and of every store | Nothing to do by hand. Ask INTH to delete the record if the person asks for erasure (Art. 17) |

---

## Erasure checklist for Prood's own data

Check each place, and record what was done.

1. **Account.** The person deletes it, or the owner deletes the `user` row. Memberships, invitations the person sent, agents, agent hosts, capability grants and approval requests go by foreign-key cascade (`packages/auth/src/schema.ts`).
2. **Sole owner.** Ask the person to add an owner or delete the store. If the store must go, warn that deletion removes all its commerce data at once, and offer the store export first.
3. **Both roles.** A person who is both a merchant and a shopper has one `user` row. Deleting it from either side removes both logins. Both apps refuse while the person is the sole owner of a store, but otherwise nothing warns them. Say so before acting.
4. **Agent events and audit rows.** `agent_event` rows hold an actor ID with no foreign key. They remain for 24 months. `admin_audit_event` rows hold an actor ID and a target ID with no foreign key. They remain for 730 days. The IDs no longer resolve to a person in Prood's systems (the admin app shows "Deleted account"). Do not delete audit rows by hand without counsel's view: they are the record of what staff did.
5. **Redis.** Rate-limit counters hold the IP address for seconds to a minute. Checkout sessions hold a shopper's details for 24 hours, or 7 days once a payment has started. Do not delete them by hand unless asked: they expire.
6. **Resend.** Check whether sent-email logs can be removed. If not, they expire on the provider's schedule (unverified).
7. **INTH.** Delete the consent record if the person asks.
8. **Mailbox.** Delete threads about the person, unless needed for the request record or a claim.
9. **Stripe.** Only owners of paid stores have a billing record. Billing is in test mode. Invoices must be kept 10 years once billing is live.
10. **Backups.** Tell the person that backups at Neon are overwritten on the provider's schedule. The period is unverified, so say "a limited time", as `/privacy` does.

---

## Resetting two-factor by hand

Two-factor is optional and has no self-service recovery. A person who has lost both their phone and their backup codes writes to hello@prood.com, and the owner resets it. It works for merchants and for staff. Nothing here was run: the SQL is untested.

1. **Log** the request as in "Steps" above.
2. **Check identity.** More than a reply from the account's email address, because the second factor exists to survive a stolen password, and a stolen mailbox would defeat a reset that trusted the mailbox alone. Ask for something a thief would not have, such as the store name, plan and a recent action, and, where the store has another owner or admin, ask that person to confirm. The exact checks are not yet defined: see [open items](./open-items.md) 13. If in doubt, refuse and say why.
3. **Reset.** In the Neon SQL editor, in one transaction, for the person's `user.id`:
   ```sql
   BEGIN;
   DELETE FROM two_factor WHERE user_id = '<user id>';
   UPDATE "user" SET two_factor_enabled = false WHERE id = '<user id>';
   COMMIT;
   ```
   Both parts are needed. With only the first, the account still says it is on and the store sign-in refusal (`apps/storefront/lib/auth/two-factor-guard.ts`) and the second step stay in force. Before running, check the `user.id` against the email.
4. **Sessions.** If the account may be compromised, also sign it out everywhere from the admin app (`revokeAllUserSessions`). That action is written to the audit log. The SQL above is not.
5. **Tell the person** to sign in with the password and turn it on again under **Profile**, which makes a new secret and ten new backup codes. Never send them a code.
6. **Record** in the rights-request log: date, who asked, how identity was checked, the `user.id`, the SQL that ran, and who ran it.

If the Better Auth secret is ever changed, every stored second-factor secret becomes unreadable (the plugin encrypts with it), and this reset is needed for every account that has it on.

---

## When Prood is the processor (merchants' data)

For orders, customers, addresses, carts, returns, reviews and checkout sessions, the merchant is the controller (`/privacy`, "Store shoppers"; `/dpa` 8.1).

1. Do not answer the substance. Tell the person Prood will pass the request on, or ask them to contact the store.
2. Forward it to the store's owners without undue delay (`/dpa` 8.1). The owner's email comes from the `member` and `user` tables (query in [incident response](./incident-response.md)).
3. Help the merchant answer. `/dpa` 8.2 promises that, on the merchant's email, Prood finds, exports, corrects or deletes a shopper's data within 30 days. The merchant's own tools are: the store export (ships with this change: **Store settings**, "Download store data", JSON, all plans, owners and admins), the dashboard's customers and orders pages, on a paid plan the Admin API, and, since 2026-11-07, **Erase this customer** on the customer page (ships with this change). It is available to owners and admins only, from a signed-in session: an API key or an agent is refused (`DELETE /api/store/customers/{id}`, `apps/api/app/api/store/customers/[id]/route.ts`, `eraseCustomer` in `packages/platform/src/privacy/store-data.ts`). It removes the customer profile, saved addresses, wishlist and carts. Orders stay with no link to the shopper, or, if the merchant ticks "Also clear their email, addresses and notes", lose the contact email, shipping and billing addresses, the order note, history notes and return notes (totals, items and dates stay). Reviews are not touched: they carry an author name only and are not linked to the shopper. A review that names the shopper is outside this tool. Prood can do the same by hand only if the merchant cannot use the tool, and records that it did. The tool writes no log of its own: the merchant answers its own request, and Prood records only requests that reach hello@prood.com. **The shopper's platform-wide sign-in account is Prood's data, not the merchant's.** Erasing the customer does not delete it: the shopper deletes it from their store account page, or asks Prood, and then the steps above apply.
4. **Images.** The store export has image addresses, not files. Image upload is not built (`getStorage` and `uploadForTenant` in `packages/commerce/src/storage.ts` have no caller, checked 2026-11-07), so no merchant file should be in R2 bucket `prood-public`, and there is normally nothing to remove. `/terms` ("Leaving, switching") still says image files are removed on request. If the merchant says a file exists, look in the Cloudflare console under `org/<organizationId>/` (the prefix `tenantStorageDirectory` would use), delete that store's objects only, and record what was deleted. Deleting R2 files must be built with image upload: see [open items](./open-items.md) 16.
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
