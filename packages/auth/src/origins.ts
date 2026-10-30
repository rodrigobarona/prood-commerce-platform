/**
 * Origins allowed to call the platform auth issuer (apps/api): the Prood apps
 * configured through env, plus this deployment's own Vercel URL.
 */
export function resolveTrustedOrigins(): string[] {
  const origins = [
    process.env.NEXT_PUBLIC_DASHBOARD_URL,
    process.env.NEXT_PUBLIC_WEB_URL,
    process.env.NEXT_PUBLIC_AUTH_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    process.env.NEXT_PUBLIC_DOCS_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]
  return [
    ...new Set(
      origins
        .filter((o): o is string => Boolean(o?.trim()))
        .map((o) => new URL(o.trim()).origin),
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
