/**
 * Where this app lives on the shared domain (prood.com/admin). Next.js applies it to
 * assets, `next/link`, `next/navigation` and `next/image`, but not to raw strings:
 * `fetch`, `<a href>`, `window.location` and URLs built by hand go through `withBase`.
 * This is the one place it is set: next.config.ts reads it from here.
 */
export const BASE_PATH = "/admin"

/** An absolute path inside this app, as the browser must request it: `/login` becomes `/admin/login`. */
export function withBase(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(`withBase expects an absolute path inside the app, got "${path}".`)
  }
  // "/" is the app's home: `/admin`, not `/admin/`, which Next.js would redirect.
  return path === "/" ? BASE_PATH : `${BASE_PATH}${path.startsWith("/?") || path.startsWith("/#") ? path.slice(1) : path}`
}
