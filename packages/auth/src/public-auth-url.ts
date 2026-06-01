declare global {
  interface Window {
    __PROOD_AUTH_BASE_URL__?: string
  }
}

const LOCAL_AUTH_URL = "http://localhost:3005"

/** Server-side resolver for the browser auth client base URL. */
export function resolveServerPublicAuthBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_AUTH_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_URL?.trim() ??
    process.env.API_PUBLIC_URL?.trim()

  if (url) return url

  if (
    process.env.VERCEL === "1" &&
    process.env.NODE_ENV === "production"
  ) {
    return ""
  }

  return LOCAL_AUTH_URL
}

export interface ResolvePublicAuthBaseUrlOptions {
  /** Optional override (e.g. dashboard LAN dev). */
  resolveDevBrowserUrl?: () => string | undefined
}

/**
 * Browser auth client base URL. Prefers a runtime value injected from the server
 * (see `resolveServerPublicAuthBaseUrl`) so production builds work when only
 * `API_PUBLIC_URL` is set on the Vercel project.
 */
export function resolvePublicAuthBaseUrl(
  options: ResolvePublicAuthBaseUrlOptions = {}
): string {
  if (typeof window !== "undefined") {
    const injected = window.__PROOD_AUTH_BASE_URL__?.trim()
    if (injected) return injected
  }

  const fromEnv =
    process.env.NEXT_PUBLIC_AUTH_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_URL?.trim()

  if (fromEnv) return fromEnv

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return LOCAL_AUTH_URL
  }

  const devBrowserUrl = options.resolveDevBrowserUrl?.()
  if (devBrowserUrl) return devBrowserUrl

  throw new Error(
    "Auth API URL is not configured. On Vercel, set NEXT_PUBLIC_AUTH_URL or API_PUBLIC_URL on the dashboard project (e.g. https://api-prood.vercel.app)."
  )
}
