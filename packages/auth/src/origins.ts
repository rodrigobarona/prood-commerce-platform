/**
 * Origins allowed to call the platform auth issuer (apps/api): the origin of each Prood app URL
 * in env, plus this deployment's own Vercel URL. Some of them carry a path (the admin console is
 * https://prood.com/admin), which is not part of an origin, so on the shared domain they all
 * collapse to https://prood.com. NEXT_PUBLIC_AUTH_URL is left out on purpose: it is the API
 * project's internal address, reached by the apps' auth proxy, and no browser calls from it.
 */
export function resolveTrustedOrigins(): string[] {
  const urls = [
    process.env.NEXT_PUBLIC_DASHBOARD_URL,
    process.env.NEXT_PUBLIC_WEB_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    process.env.NEXT_PUBLIC_DOCS_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]
  return [
    ...new Set(
      urls
        .filter((url): url is string => Boolean(url?.trim()))
        .map((url) => new URL(url.trim()).origin),
    ),
  ]
}

export function isTrustedAuthOrigin(origin: string | null): origin is string {
  return !!origin && resolveTrustedOrigins().includes(origin)
}

/** Better Auth `trustedOrigins` option for the platform auth issuer. */
export function resolveBetterAuthTrustedOrigins(): string[] {
  return resolveTrustedOrigins()
}
