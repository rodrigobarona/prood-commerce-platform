/**
 * The security headers every Prood app sends, as the array Next.js wants from
 * `headers()` in next.config.
 *
 * This file is loaded by Node while next.config is read, not bundled, so it
 * stays one dependency-free file of erasable TypeScript.
 *
 * Scripts and styles allow `'unsafe-inline'`. A nonce would need every page
 * rendered per request, which gives up the static and Partial Prerendering
 * caching the apps are built on, and Next's inline scripts (hydration data,
 * the theme script) carry none. The rest of the policy still holds: no other
 * origin may run script, load a frame, or receive a request unless the app
 * lists it.
 */

type Sources = readonly (string | undefined)[]

export type SecurityHeadersOptions = {
  /** Origins that may run script, besides the app itself. */
  scriptSrc?: Sources
  /** Origins for stylesheets, besides the app itself. */
  styleSrc?: Sources
  /** Origins for images, besides the app itself, `data:` and `blob:`. */
  imgSrc?: Sources
  /** Origins for video and audio, besides the app itself. */
  mediaSrc?: Sources
  /** Origins the browser may fetch or post to, besides the app itself. */
  connectSrc?: Sources
  /** Origins that may be embedded in a frame. None unless listed. */
  frameSrc?: Sources
  /** Origins that may use the Payment Request API in an embedded frame. */
  paymentFrames?: Sources
  /** `false` for an app that only answers JSON: nothing may load, run or frame. */
  documents?: boolean
  /** Keep the app out of search results. Only for private or non-page apps. */
  noindex?: boolean
  /** Defaults to `NODE_ENV === "development"`. React needs `eval` in dev, never in production. */
  development?: boolean
}

export type Header = { source: string; headers: { key: string; value: string }[] }

/** The origin of a URL taken from env, or `undefined` when the variable is unset. */
export function originOf(url: string | undefined): string | undefined {
  return url ? new URL(url).origin : undefined
}

function sources(base: readonly string[], extra: Sources = []): string {
  return [...new Set([...base, ...extra.filter((source): source is string => Boolean(source))])].join(" ")
}

export function contentSecurityPolicy(options: SecurityHeadersOptions = {}): string {
  if (options.documents === false) {
    return ["default-src 'none'", "frame-ancestors 'none'", "base-uri 'none'", "form-action 'none'"].join("; ")
  }
  const development = options.development ?? process.env.NODE_ENV === "development"
  return [
    "default-src 'self'",
    `script-src ${sources(["'self'", "'unsafe-inline'", ...(development ? ["'unsafe-eval'"] : [])], options.scriptSrc)}`,
    `style-src ${sources(["'self'", "'unsafe-inline'"], options.styleSrc)}`,
    `img-src ${sources(["'self'", "data:", "blob:"], options.imgSrc)}`,
    `media-src ${sources(["'self'"], options.mediaSrc)}`,
    // next/font serves its fonts from the app itself.
    "font-src 'self'",
    `connect-src ${sources(["'self'"], options.connectSrc)}`,
    `frame-src ${sources([], options.frameSrc) || "'none'"}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ")
}

function permissionsPolicy(options: SecurityHeadersOptions): string {
  const payment = (options.paymentFrames ?? []).filter(Boolean).map((origin) => `"${origin}"`)
  return [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    ...(payment.length > 0 ? [`payment=(self ${payment.join(" ")})`] : []),
  ].join(", ")
}

export function securityHeaders(options: SecurityHeadersOptions = {}): Header[] {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { key: "Permissions-Policy", value: permissionsPolicy(options) },
        ...(options.noindex ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
      ],
    },
  ]
}
