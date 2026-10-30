const BASE = 'https://prood.invalid'

/**
 * Only allow same-origin paths as post-auth redirects. Backslashes and control
 * characters are rejected outright because URL parsing normalizes them, which
 * turns `/\\evil.com` and `/\n/evil.com` into `//evil.com`.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = '/'): string {
  // eslint-disable-next-line no-control-regex
  if (!value || !value.startsWith('/') || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback
  if (!URL.canParse(value, BASE)) return fallback
  const url = new URL(value, BASE)
  // Dot segments can collapse into a protocol-relative path: `/a/../..//evil.com`.
  if (url.origin !== BASE || url.pathname.startsWith('//')) return fallback
  return `${url.pathname}${url.search}${url.hash}`
}
