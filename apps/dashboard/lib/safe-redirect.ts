/** Only allow same-origin paths as post-auth redirects (blocks `//evil.com`). */
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/"
  }
  return value
}
