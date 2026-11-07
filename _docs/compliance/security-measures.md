# Security measures

Technical and organisational measures in the code, with known gaps. This backs `/dpa` Annex 2 and the public `/security` page (ships with this change: it did not exist on 2026-11-07, though `security.txt` already points to `/security#report`). Every item was checked against the code on 2026-11-07, by reading, not by running or testing it. "Library default" means Prood does not set the value in the repo and relies on Better Auth: a version upgrade can change it. A gap stays listed until the code closes it.

**Ships with this change** marks controls in the uncommitted working tree.

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
| Roles | Owner, admin, member, with `apiKey` actions spelled out. A role change is guarded, and the last admin cannot be demoted | `packages/auth/src/access.ts`, `apps/api/lib/auth/role-guard.ts`, `packages/auth/src/admin-role.ts` |
| Tenant isolation | Row-level security: every tenant table has a `tenant_isolation` policy for `prood_app`, and `withTenant()` sets the tenant and switches to that role. The role cannot read sign-in tables, except `user.id` and `user.email`. **The connecting role has BYPASSRLS**, so isolation holds only for queries that run inside `withTenant()` | `packages/platform/src/database/drizzle/schema/tenant.ts`, migrations `0000_app_role.sql`, `0006_auth_tables_private.sql`, `0011`, `0012` |
| Provider credentials | AES-256-GCM, key derived with scrypt from `INTEGRATION_ENCRYPTION_KEY`. A value with no `enc:v1:` prefix is read as plaintext. One key, no versions, so no rotation | `packages/commerce/src/crypto.ts` |
| Cross-app calls | Checkout to API with a shared secret, compared in constant time. Agent calls carry a signed per-operation token | `apps/api/lib/require-checkout-secret.ts`, `apps/api/lib/agent-proxy-token.ts` |
| Agent Auth | An agent starts with six public catalog reads and nothing else. Anything else needs a person's approval in the dashboard. Approval routes on the API origin are refused. Approving capabilities that change a store needs a sign-in from the last 10 minutes. The `autonomous` mode is enabled | `apps/api/lib/auth/agent-config.ts`, `apps/api/lib/auth/server.ts`, `packages/auth/src/agent-capabilities.ts` |
| Agent activity | Type, agent, actor, capability, status, duration. Arguments and results are never stored | `packages/auth/src/agent-events.ts`, `apps/api/lib/auth/agent-events.ts` |
| Origins and CSRF | Better Auth trusted origins from an explicit list, and on the storefront only an origin that resolves to a store | `packages/auth/src/origins.ts`, `apps/storefront/lib/auth/server.ts` |
| Cookies | Cart cookie `httpOnly`, `SameSite=Lax`, `Secure` in production. Session cookie attributes are library defaults | `apps/storefront/lib/cart-cookie.ts` |
| Minimisation | No advertising or session-replay tools. Visit statistics only after consent. No cookie set by analytics. Agent events never hold payloads. Passwords never leave the auth tables | `apps/*/c15t.config.ts`, `packages/consent/src/messages.ts` |
| Retention | Daily purge of expired sessions, verification rows, old invitations and agent events. **Ships with this change** | [Retention schedule](./retention-schedule.md) |
| Self-service rights | Account export and deletion for merchants and shoppers. Store export and store deletion. **Ships with this change** | [Retention schedule](./retention-schedule.md) |
| Export protection | The store export needs a signed-in owner or admin session. An API key or an agent is refused. The file is not cached | `apps/api/app/api/store/export/route.ts`, `packages/auth/src/download.ts` |
| Delivery checks | CI runs lint, typecheck, OpenAPI drift, migration drift, unit tests, platform database tests and a build | `.github/workflows/ci.yml` |
| Admin gate | The admin app asserts the admin role on every query | `apps/admin/lib/admin-queries.ts` (`assertAdmin`) |

---

## Known gaps

| Gap | Detail | Severity | Owner |
|---|---|---|---|
| No two-factor or passkeys | Not built. `/dpa` Annex 2 says so. Merchants sign in with a password only. A phished merchant password gives access to a store's customers and orders | High | Owner |
| No administrator audit log | Status changes are not recorded. Admins can read users, sessions and organizations across stores, change roles, revoke sessions and ban users, and the admin plugin offers impersonation. Nothing records which admin did what, or who downloaded a store export | High | Owner |
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
| Store images are not deleted with the store | R2 deletion is not built | Medium | Owner |
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
| Credential stuffing | Rate limits (fail open), email verification for claiming guest orders | No second factor. No breached-password check was found in the code |
| Tenant data leak | `withTenant()` with RLS, tenant resolved from the session or API key | A query outside `withTenant()` bypasses RLS |
| Leaked API key | Hash at rest, revocation, per-key limit | No anomaly alerting |
| Stolen merchant session | Fresh-sign-in rule for agent approval, password required for account deletion | The store export is available to the session at once, and is not logged |
| Rogue admin or stolen admin session | Admin role check, last-admin guard | No audit log, impersonation exists |
| Provider compromise | Encryption at rest, minimal data | Provider holds the keys, except for provider credentials |
| XSS | React escaping, CSP | `'unsafe-inline'` |
| Malicious AI agent | Starts with public reads, approval for the rest, fresh sign-in for writes | `autonomous` mode enabled. Approval is the control, so a careless approval defeats it |
| Domain takeover | Domains are verified against Vercel's domain status (`apps/dashboard/lib/domains.ts`) | Whether a verified domain is ever rechecked is unverified |

---

## Organisational

The owner holds production access. Access should stay limited to those who need it, with confidentiality duties (`/dpa` clause 4). No written onboarding or offboarding process exists, and there is no list of who has access to which console. See [open items](./open-items.md).
