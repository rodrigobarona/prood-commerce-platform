# Legitimate interest assessments

Three-part tests for each use of Art. 6(1)(f) GDPR by Prood as controller: purpose, necessity, balancing. `/privacy` names the basis for each activity, and this page is the source behind it. Art. 21 lets anyone object to these uses: follow [data subject requests](./data-subject-requests.md).

Last reviewed: 2026-11-07. Counsel has not reviewed these yet. The activity names match [records of processing](./records-of-processing.md).

---

## 1. Hosting logs

| Test | Assessment |
|---|---|
| Purpose | Delivering pages, preventing abuse, diagnosing faults |
| Necessity | A server cannot answer without the IP address. Short logs are the normal means of detecting attacks. Vercel runs them, and Prood adds no logging of its own to follow visitors |
| Balancing | Visitors expect this. Provider under a DPA. Low impact. The retention period is not known (`/privacy` says "a limited time"), which weakens the test until it is stated |
| Outcome | Passes, conditionally. State the real Vercel log period in the privacy text ([open items](./open-items.md)) |

---

## 2. Privacy choice record

| Test | Assessment |
|---|---|
| Purpose | Showing the banner, remembering the choice, proving that consent was given or refused (Art. 7(1)) |
| Necessity | The record is the proof. It holds the choice, a random session ID, IP address, language and browser details (`/privacy`). The browser talks only to the site's own `/api/c15t`, which forwards the choice to INTH, so visitors never contact INTH directly (`packages/consent/src/route.ts`) |
| Balancing | The banner treats "Accept all" and "Reject all" equally (`packages/consent/src/messages.ts`). The record is kept in the EU (INTH, Frankfurt). The INTH retention period is **unverified**, and "as long as we may need to prove it" is open-ended |
| Outcome | Passes if INTH's period is shortened to what proof needs. Ask INTH for the setting |

**Location.** `packages/consent/src/route.ts` removes the visitor's country headers before the policy is chosen, so everyone gets the strict opt-in rule, whatever their location.

---

## 3. Merchant accounts

| Test | Assessment |
|---|---|
| Purpose | Giving a merchant's organization the accounts it asked for. The Customer is the contract party, so Art. 6(1)(b) fits only someone holding an account for themselves (`/privacy`) |
| Necessity | Name, email and password hash are the minimum for a named login. No profile is built |
| Balancing | The member uses the account for work and expects it. They can leave. Account deletion is blocked only while the person is the sole owner of a store |
| Outcome | Passes |

---

## 4. Invitations

| Test | Assessment |
|---|---|
| Purpose | Letting an organization add a colleague |
| Necessity | An invitation needs the email address, organization, role and inviter (`invitation` table) |
| Balancing | The invitee did not ask for this, so Prood sends one message. The invitation is valid for 48 hours and deleted 30 days after expiry (ships with this change). Team invites start on the Grow plan, which cannot be bought yet, so volumes are near zero today |
| Outcome | Passes. Prood is controller |

---

## 5. Account and API security

| Test | Assessment |
|---|---|
| Purpose | Showing sessions, stopping credential attacks and API abuse |
| Necessity | A rate limit needs a per-client key, so the IP address is the key (`packages/auth/src/rate-limit-storage.ts`, in Redis, for seconds to a minute). Sessions keep IP address and user agent so the owner can recognise a session. When the address cannot be found, a hash of user agent and language stands in (`packages/auth/src/client-ip.ts`) |
| Balancing | Users benefit directly. Counters last at most a minute. Sessions are deleted once expired (ships with this change). The limiter fails open when Redis is down, so it never blocks a legitimate sign-in |
| Outcome | Passes |

---

## 6. Platform administration

| Test | Assessment |
|---|---|
| Purpose | Support, abuse handling, revoking sessions and agents, checking plans |
| Necessity | The admin app reads users, sessions, organizations, domains, keys and agents across stores (`apps/admin/lib/admin-queries.ts`). Admin role is required (`assertAdmin`), and the last admin cannot be demoted (`packages/auth/src/admin-role.ts`) |
| Balancing | Broad visibility is the risk. Access is limited to the owner and anyone the owner names. **No audit log records what an admin did**, and impersonation exists in the Better Auth admin plugin. `/dpa` Annex 2 says the audit log does not exist yet, so the text is honest, but the control is weak |
| Outcome | Passes with a condition: record admin actions, or disable impersonation. Both are open ([open items](./open-items.md)) |

---

## 7. Agent activity log

| Test | Assessment |
|---|---|
| Purpose | Showing a merchant what AI agents did on their store, and keeping stores safe |
| Necessity | The record holds event type, agent, actor ID, capability, status and duration. Arguments and results are never stored, because they can hold customer data (`packages/auth/src/agent-events.ts`, `apps/api/lib/auth/agent-events.ts`) |
| Balancing | Actors are the merchant's own members and agents. 24 months, then deleted (ships with this change). Low impact |
| Outcome | Passes. The 24-month period is a proposal: counsel to confirm |

---

## 8. Linking guest orders to a shopper account

| Test | Assessment |
|---|---|
| Purpose | Letting a shopper see orders they placed as a guest, once they verify the same email address |
| Necessity | The link is made only after email verification (`afterEmailVerification` in `apps/storefront/lib/auth/server.ts` and `apps/api/lib/auth/server.ts`, calling `autoLinkGuestCustomers`). It sets `customers.auth_user_id` and changes nothing else |
| Balancing | A verified email proves control of the address, which is what the shopper expects. The link crosses stores, so one account sees orders from several merchants, and each merchant still sees only its own. The cost of a wrong link is an account holder seeing someone else's order, which verification prevents |
| Outcome | Passes. Counsel to confirm that Prood, a processor for the merchants' customer rows, may create this link on its own purpose. It is described in `/privacy` ("Store shoppers") |

---

## 9. Correspondence

| Test | Assessment |
|---|---|
| Purpose | Answering people, keeping a record of what was said |
| Necessity | A reply needs the address. Two years covers follow-up and common disputes |
| Balancing | The person wrote to Prood and expects this. Delete on request unless needed for a claim |
| Outcome | Passes |

---

## Not Prood's basis

**Address suggestions at checkout.** The shopper's browser sends the address text, and the shopper's IP address, directly to Geoapify (`NEXT_PUBLIC_GEOAPIFY_API_KEY`). The merchant is the controller and Prood its processor, so the merchant needs its own basis. The shopper types into a field that is labelled as address search, which supports Art. 6(1)(b) for the order. Whether Geoapify sets any storage on the device is **unverified**.

**Payments.** A store's own Stripe, Easypay or Ifthenpay account is the merchant's provider. Prood passes the data a payment needs on the merchant's instruction (`/dpa`, "The Customer's responsibilities").

---

## Cookies and Art. 5 of Lei 41/2004

Prood relies on two positions. Counsel has not reviewed either.

1. **Strictly necessary.** The session cookie, cart cookie, sidebar state and privacy choice (`c15t`) are needed for the service the person asked for or remember a choice they made. No consent is claimed for them. The cart cookie is `httpOnly` and lasts 30 days (`apps/storefront/lib/cart-cookie.ts`): a 30-day period for a cart is defensible but is the longest of the four.
2. **Consent.** Vercel Web Analytics loads only after the visitor allows `measurement` (`vercelAnalytics()` in `apps/web/c15t.config.ts` and `apps/storefront/c15t.config.ts`). `consentCategories` is limited to `necessary` and `measurement`. Nothing else may be added without changing the banner text, `/privacy` and `/subprocessors` in the same change.

**Residual risk.** The dashboard, admin and API apps set only the session cookie and `sidebar_state`, and load no analytics. The `theme` and `saved-for-later` entries sit in `localStorage` and never leave the browser. If a second optional tool is added, this page and the banner must change first.
