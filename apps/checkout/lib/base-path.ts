/**
 * Where this app lives on the public domain (prood.com/pay). Next prefixes its
 * own routes, assets and `<Link>`s, but not raw `fetch`, `<a href>` or
 * `window.location` paths: build those with `withBasePath`.
 */
export const BASE_PATH = "/pay"

/** A path inside this app as the browser addresses it, e.g. `/confirm/x` -> `/pay/confirm/x`. */
export function withBasePath(path: `/${string}`): string {
  return `${BASE_PATH}${path}`
}
