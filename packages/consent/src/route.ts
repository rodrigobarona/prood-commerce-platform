/**
 * Request headers c15t reads to work out the visitor's country and region.
 * Taken from @c15t/core 3.2.x; recheck on upgrade.
 */
export const LOCATION_HEADERS = [
  "x-c15t-country",
  "x-c15t-region",
  "x-vercel-ip-country",
  "x-vercel-ip-country-region",
  "cf-ipcountry",
  "x-amz-cf-ipcountry",
  "x-country",
  "x-country-code",
] as const

/**
 * The INTH project's default policy shows no banner to visitors outside the EU
 * and the UK, and its free plan can't change that. Prood asks everyone, so the
 * location is dropped before the policy is chosen: an unknown location gets the
 * strict opt-in rule.
 *
 * The request is copied, never changed, and its body is passed on untouched.
 * It is rebuilt from its parts: Next's own request class can't be handed to the
 * global `Request` constructor.
 */
export function withoutLocationHeaders(request: Request): Request {
  const headers = new Headers(request.headers)
  for (const name of LOCATION_HEADERS) headers.delete(name)
  const hasBody = request.method !== "GET" && request.method !== "HEAD" && request.body !== null
  return new Request(request.url, {
    method: request.method,
    headers,
    redirect: request.redirect,
    signal: request.signal,
    ...(hasBody ? { body: request.body, duplex: "half" } : {}),
  })
}
