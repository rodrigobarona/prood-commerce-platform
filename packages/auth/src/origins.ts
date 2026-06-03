/** Private/LAN origins used when testing via Network URL (e.g. http://192.168.x.x:3002). */
export function isLocalDevOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === "production") return false

  try {
    const { hostname } = new URL(origin)
    if (hostname === "localhost" || hostname === "127.0.0.1") return true
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true
  } catch {
    return false
  }

  return false
}

export function resolveTrustedOrigins(): string[] {
  const origins = [
    process.env.NEXT_PUBLIC_DASHBOARD_URL,
    process.env.NEXT_PUBLIC_WEB_URL,
    process.env.NEXT_PUBLIC_AUTH_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    process.env.BETTER_AUTH_URL,
    "http://localhost:3002",
    "http://localhost:3000",
    "http://localhost:3005",
    "http://localhost:3006",
  ]

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    origins.push(`https://${vercelUrl}`)
  }

  return [...new Set(origins.filter((o): o is string => Boolean(o)))]
}

export function isTrustedAuthOrigin(origin: string | null): origin is string {
  if (!origin) return false
  if (resolveTrustedOrigins().includes(origin)) return true
  if (isLocalDevOrigin(origin)) return true

  try {
    const { hostname } = new URL(origin)
    if (hostname.endsWith(".vercel.app")) return true
  } catch {
    return false
  }

  return false
}

/** Better Auth `trustedOrigins` — static env list plus dynamic Origin when trusted. */
export function resolveBetterAuthTrustedOrigins(
  request?: Request
): string[] {
  const origins = resolveTrustedOrigins()
  if (!request) return origins

  const origin = request.headers.get("origin")
  if (origin && isTrustedAuthOrigin(origin) && !origins.includes(origin)) {
    return [...origins, origin]
  }

  return origins
}
