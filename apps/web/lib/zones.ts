/**
 * What the dashboard owns on prood.com. The dashboard is the root of the domain: signed in, `/` is
 * your store's overview and `/orders`, `/products` and the rest sit right under it. Signed out, `/` is
 * the marketing homepage. The gateway (next.config.ts) reads these lists; nothing else decides.
 */

/**
 * The first path segment of each dashboard page. A marketing page can't use one of these names, or the
 * dashboard would answer it: lib/__tests__/zones.test.ts checks every folder in `app/`.
 */
export const DASHBOARD_SEGMENTS = [
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "two-factor",
  "new-store",
  "account",
  "billing",
  "customers",
  "domains",
  "orders",
  "payments",
  "products",
  "settings",
  "team",
  "device",
  "invite",
] as const

/**
 * Better Auth's session cookie, as the browser sends it: `__Secure-` in front on https. Seeing one
 * means "probably signed in". It is not proof (the dashboard checks the session itself and sends a
 * stale cookie to /login), but it is enough to decide which app answers `/`.
 */
export const SESSION_COOKIES = ["better-auth.session_token", "__Secure-better-auth.session_token"] as const
