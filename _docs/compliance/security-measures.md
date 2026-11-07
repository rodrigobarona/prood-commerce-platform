# Security measures

Technical and organisational measures in the code, with known gaps. This backs `/dpa` Annex 2 and the public `/security` page (ships with this change: it did not exist on 2026-11-07, though `security.txt` already points to `/security#report`). Every item was checked against the code on 2026-11-07, by reading, not by running or testing it. "Library default" means Prood does not set the value in the repo and relies on Better Auth: a version upgrade can change it. A gap stays listed until the code closes it.

**Ships with this change** marks controls in the uncommitted working tree. The two-factor and audit log rows below were added the same day (2026-11-07) and are in the working tree too. Their migration (`packages/platform/drizzle/0013_two_factor_audit.sql`) was applied to production on 2026-11-07 according to the owner: not checked from the repository.

---

## In place

| Area | Control | Where |
|---|---|---|
| Hosting region | Functions in `fra1`, database in `eu-central-1`, Redis in `fra1`, R2 with EU jurisdiction. **Set in the Vercel, Neon, Upstash and Cloudflare consoles, not in the repo**: `apps/*/vercel.json` carry no `regions`. Checked by the owner on 2026-11-02 (`_docs/LEGAL.md`) | Consoles |
| Transport | HTTPS. HSTS `max-age=31536000; includeSubDomains`, no preload. **Ships with this change** | `packages/security-headers/src/index.ts`, used by every app's `next.config` |
| Headers | CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone, geolocation off). `X-Robots-Tag: noindex` on private apps. The API sends `default-src 'none'`. Checkout allows Stripe's origins only. The storefront allows Vercel Analytics and `api.geoapify.com`. **Ships with this change** | Same file, and each `apps/*/next.config.*` |
| Disclosure | `/.well-known/security.txt` (RFC 9116, contact hello@prood.com, `Expires` 330 days on, moves on each deploy). **Ships with this change**. The `/security` page it links to is not written yet | `apps/web/app/.well-known/security.txt/route.ts` |
| Passwords | Hashed with scrypt (Better Auth library default, not set in the repo). Length limits are library defaults | `packages/auth/src/shared-options.ts` |
| Password reset | Ends every other session | `revokeSessionsOnPasswordReset` in `packages/auth/src/shared-options.ts` |
| Sessions | Library defaults: 7 days, refreshed after 1 day. Listed and revocable by an admin | `apps/admin/app/(admin)/users/actions.ts` (`revokeSession`, `revokeAllUserSessions`). No self-service session list for the person |
| Rate limits | Sign-in and other auth paths, counted in Redis by client IP and path. API keys: 600 requests a minute per key (the plugin's own limit is off) | `packages/auth/src/rate-limit-storage.ts`, `apps/api/lib/api-key-limit.ts`. Better Auth enforces its auth limits in production only: unverified for previews |
| Client address | The address a limit counts on comes from a platform header, or, behind dashboard and admin, from a proxy that proves itself with a shared secret compared in constant time. With no address, a fingerprint stands in | `packages/auth/src/client-ip.ts` |
| API keys | Hashed at rest, shown once, bound to a store | `packages/auth/src/server.ts` (`storeApiKey`), `apps/api/lib/api-key-limit.ts` (`defaultKeyHasher`) |
| Two-factor | Optional, for merchants and Prood staff. An authenticator app (TOTP) with ten one-time backup codes (`twoFactor({ issuer: "Prood" })` in `apps/api/lib/auth/server.ts`; no code by email, so a mailbox cannot stand in for the app). The plugin encrypts the secret and the backup codes before they reach `two_factor` (`storeBackupCodes` defaults to `"encrypted"` in better-auth 1.7.14), with the Better Auth secret as the key, so rotating that secret would make every stored second factor unreadable. Turning it on, off, or making new codes asks for the password. The second step is `apps/dashboard/app/(auth)/two-factor` and `apps/admin/app/(auth)/two-factor`, and the Profile panel is `apps/dashboard/components/account/two-factor-panel.tsx`. The dashboard offers "Trust this device for 30 days", the admin app does not (`packages/auth/src/two-factor-panel.tsx`). Stores and the dashboard share one `user` table and one secret, so an account with two-factor on is refused a password sign-in at a store (`apps/storefront/lib/auth/two-factor-guard.ts`). The table has `failed_verification_count` and `locked_until` columns for wrong-code lockout, which the plugin manages. **Ships with this change** | `packages/auth/src/schema.ts` (`two_factor`, `user.two_factor_enabled`), `packages/auth/src/two-factor.ts`, migration `0013_two_factor_audit.sql` |
| Administrator audit log | What an administrator changes is written to `admin_audit_event`: admin, action, target, time and IP address. Actions: ban, unban, role change, sign out of one device, sign out of all devices, agent revocation. A reason or the new role goes in `metadata`, never a password or token. Kept 730 days and purged by the daily job. Shown in the admin app under **Audit log**. A failed write is logged (`[admin-audit] COULD NOT RECORD`) and not thrown, so the action still happens. Reads are not logged. Actions on a person appear in their account export. **Ships with this change** | `packages/auth/src/admin-audit.ts`, `apps/admin/app/(admin)/users/actions.ts`, `apps/admin/app/(admin)/agents/actions.ts`, `apps/admin/app/(admin)/audit/page.tsx`, `packages/auth/src/retention.ts` |
| Roles | Owner, admin, member, with `apiKey` actions spelled out. A role change is guarded, and the last admin cannot be demoted | `packages/auth/src/access.ts`, `apps/api/lib/auth/role-guard.ts`, `packages/auth/src/admin-role.ts` |
| Tenant isolation | Row-level security: every tenant table has a `tenant_isolation` policy for `prood_app`, and `withTenant()` sets the tenant and switches to that role. The role cannot read sign-in tables, except `user.id` and `user.email`. **The connecting role has BYPASSRLS**, so isolation holds only for queries that run inside `withTenant()` | `packages/platform/src/database/drizzle/schema/tenant.ts`, migrations `0000_app_role.sql`, `0006_auth_tables_private.sql`, `0011`, `0012` |
| Provider credentials | AES-256-GCM, key derived with scrypt from `INTEGRATION_ENCRYPTION_KEY`. A value with no `enc:v1:` prefix is read as plaintext. One key, no versions, so no rotation | `packages/commerce/src/crypto.ts` |
| Cross-app calls | Checkout to API with a shared secret, compared in constant time. Agent calls carry a signed per-operation token | `apps/api/lib/require-checkout-secret.ts`, `apps/api/lib/agent-proxy-token.ts` |
| Agent Auth | An agent starts with six public catalog reads and nothing else. Anything else needs a person's approval in the dashboard. Approval routes on the API origin are refused. Approving capabilities that change a store needs a sign-in from the last 10 minutes. The `autonomous` mode is enabled | `apps/api/lib/auth/agent-config.ts`, `apps/api/lib/auth/server.ts`, `packages/auth/src/agent-capabilities.ts` |
| Agent activity | Type, agent, actor, capability, status, duration. Arguments and results are never stored | `packages/auth/src/agent-events.ts`, `apps/api/lib/auth/agent-events.ts` |
| Origins and CSRF | Better Auth trusted origins from an explicit list, and on the storefront only an origin that resolves to a store | `packages/auth/src/origins.ts`, `apps/storefront/lib/auth/server.ts` |
| Cookies | Cart cookie `httpOnly`, `SameSite=Lax`, `Secure` in production. Session cookie attributes are library defaults | `apps/storefront/lib/cart-cookie.ts` |
| Minimisation | No advertising or session-replay tools. Visit statistics only after consent. No cookie set by analytics. Agent events never hold payloads. Passwords never leave the auth tables | `apps/*/c15t.config.ts`, `packages/consent/src/messages.ts` |
| Retention | Daily purge of expired sessions, verification rows, old invitations, agent events and administrator audit events. **Ships with this change** | [Retention schedule](./retention-schedule.md) |
| Self-service rights | Account export and deletion for merchants and shoppers. Store export and store deletion. Erasing one shopper (`eraseCustomer`, session only, owner or admin: an API key or an agent is refused). **Ships with this change** | [Retention schedule](./retention-schedule.md) |
| Export protection | The store export needs a signed-in owner or admin session. An API key or an agent is refused. The file is not cached | `apps/api/app/api/store/export/route.ts`, `packages/auth/src/download.ts` |
| Delivery checks | CI runs lint, typecheck, OpenAPI drift, migration drift, unit tests, platform database tests and a build | `.github/workflows/ci.yml` |
| Admin gate | The admin app asserts the admin role on every query. It does not check for two-factor | `apps/admin/lib/admin-queries.ts`, `apps/admin/lib/auth/index.ts` (`assertAdmin`) |

---

## Known gaps

| Gap | Detail | Severity | Owner |
|---|---|---|---|
| Two-factor is optional, and there are no passkeys | An account that has not turned it on signs in with a password only, so a phished password gives access to a store's customers and orders. Nothing requires it, not even for platform administrators (`assertAdmin` does not check `user.two_factor_enabled`). Passkeys are not built. `/security` and `/dpa` Annex 2 say so | Medium | Owner |
| Two-factor recovery is manual | A person who loses both phone and backup codes cannot recover alone. The owner resets it after checking identity: see "Resetting two-factor by hand" in [data subject requests](./data-subject-requests.md). The identity check is not defined beyond that, and it rests on one person | Medium | Owner |
| Trusted-device cookie is not per app | The admin screen does not offer "trust this device", but the API checks the cookie and does not know which app asked. With `AUTH_COOKIE_DOMAIN` set, a cookie from a dashboard sign-in may be sent to the admin app. Read from the plugin, not tested ([open items](./open-items.md) 14) | Medium | Owner |
| The administrator audit log has no reads and can miss a write | Reading users, sessions and organizations across stores is not recorded. Impersonation is not recorded (only `session.impersonated_by` while the session lasts). Changes made straight in the database leave no record, and the table can be edited there. A write that fails is logged and the action goes ahead. Nothing records who downloaded a store export or who erased a shopper | Medium | Owner |
| Inline scripts allowed | `script-src` and `style-src` carry `'unsafe-inline'`, because a nonce would give up static and partial prerendering. The rest of the policy holds. **Ships with this change** | Medium | Owner |
| Provider credentials in plaintext if unprefixed | `decrypt` accepts a value with no `enc:v1:` prefix. Legacy rows or a dev setup would survive as plaintext. Nobody has checked production rows | Medium | Owner |
| No key rotation for credentials | A new `INTEGRATION_ENCRYPTION_KEY` makes every stored credential unreadable | Medium | Owner |
| Row-level security depends on the code path | The connecting role bypasses RLS. A query written outside `withTenant()` sees every store. There is a platform test suite, but it needs a disposable database and may not run in CI (`CI_DATABASE_URL` secret, `_docs/PRODUCTION_READINESS.md`) | Medium | Owner |
| Limiter fails open | If Redis is unavailable or a request carries no address, limits are not enforced | Low, accepted | Owner |
| No dependency audit or Dependabot | `.github/workflows/ci.yml` runs no `pnpm audit` and there is no Dependabot file. Secret scanning and branch protection are unverified | Medium | Owner |
| No error tracking or uptime alert | No Sentry or PostHog (`_docs/PRODUCTION_READINESS.md`). `/v1/health` exists. Whether an external monitor is attached is unverified | Medium | Owner |
| No external penetration test | None commissioned. `/dpa` Annex 2 says so | Medium | Owner |
| No restore drill | Neon point-in-time restore has never been tried, and its window depends on the plan. `/dpa` Annex 2 names it. Art. 32(1)(c), (d) | Medium | Owner |
| Retention job has no alert | Failures show only in the Vercel log | Low | Owner |
| R2 deletion must come with image upload | Image upload is not built: `getStorage` has no caller (checked 2026-11-07), so no merchant file is in R2 and nothing is left behind by store deletion today. If upload ships without deletion, this becomes a real gap ([open items](./open-items.md) 16) | Low | Owner |
| Custom domain removal is best effort | The Vercel entry is removed by a second browser call | Low | Owner |
| Per-provider retention unverified | Vercel logs, Resend delivery logs, INTH consent record, Neon backups, Geoapify | Medium | Owner |
| Dormant shopper accounts are never deleted | Shopper accounts are linked to merchants' orders, so they stay until the person deletes them, reviewed yearly. A decision, not an oversight | Accepted | Owner |
| Platform administrators see all stores' accounts | Needed to run the service. Limited to the owner and anyone the owner names, with confidentiality duties. No access review process is written | Medium | Owner |
| MFA on provider consoles | Vercel, Neon, Upstash, Cloudflare, Stripe, Resend, GitHub: unverified | High | Owner |
| Unauthenticated endpoints without limits | Storefront catalogue and checkout have only platform DDoS protection and Vercel's firewall (not checked). Public `/v1` reads for agents are limited per store | Low | Owner |
| Personal data in logs | A failed shopper email logs the address (`apps/storefront/lib/auth/server.ts`) | Low | Owner |

Not a gap: the connecting role's BYPASSRLS is by design (`0000_app_role.sql`), and the auth tables are closed to the tenant role (`0006`).

---

## Cyber Resilience Act

Prood is pure SaaS and distributes nothing to install, so it is treated as outside Regulation (EU) 2024/2847 today. `@prood/api-client` and `@prood/cli` exist in the repository and are described as "available from the source repo for now" and "not published" (`_docs/BRAND.md`). If either is published as a package, reassess: software distributed to others can be a product with digital elements, with reporting duties from 11 September 2026 (verify the date). Counsel should confirm. See [EU obligations](./eu-obligations.md).

---

## Threat notes

| Threat | Main defence | Remaining risk |
|---|---|---|
| Credential stuffing | Rate limits (fail open), email verification for claiming guest orders, optional two-factor | Two-factor is off until the person turns it on. No breached-password check was found in the code |
| Tenant data leak | `withTenant()` with RLS, tenant resolved from the session or API key | A query outside `withTenant()` bypasses RLS |
| Leaked API key | Hash at rest, revocation, per-key limit | No anomaly alerting |
| Stolen merchant session | Fresh-sign-in rule for agent approval, password required for account deletion and for changing two-factor | The store export is available to the session at once, and is not logged |
| Rogue admin or stolen admin session | Admin role check, last-admin guard, optional two-factor, audit log of bans, role changes, sign-outs and agent revocations with IP address (730 days) | Two-factor is not required for admins. Reads are not logged. Impersonation exists in the plugin and is not logged. The log is an ordinary table: anyone with database access can change it, and the admin app has no screen to edit or delete rows |
| Provider compromise | Encryption at rest, minimal data | Provider holds the keys, except for provider credentials |
| XSS | React escaping, CSP | `'unsafe-inline'` |
| Malicious AI agent | Starts with public reads, approval for the rest, fresh sign-in for writes | `autonomous` mode enabled. Approval is the control, so a careless approval defeats it |
| Domain takeover | Domains are verified against Vercel's domain status (`apps/dashboard/lib/domains.ts`) | Whether a verified domain is ever rechecked is unverified |

---

## Organisational

The owner holds production access. Access should stay limited to those who need it, with confidentiality duties (`/dpa` clause 4). No written onboarding or offboarding process exists, and there is no list of who has access to which console. See [open items](./open-items.md).
