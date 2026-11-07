import { cacheLife } from "next/cache"

import { siteConfig } from "@/lib/site"

const EXPIRES_IN_DAYS = 330

/**
 * RFC 9116. Computed once per build and cached, so the route stays static and
 * `Expires` moves on with every deploy, under the recommended year. A bare
 * `Date.now()` in the handler would make it render on every request.
 */
async function securityTxt() {
  "use cache"
  cacheLife("max")
  const expires = new Date(Date.now() + EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000).toISOString()
  return [
    `Contact: mailto:${siteConfig.email}`,
    `Expires: ${expires}`,
    "Preferred-Languages: en",
    `Canonical: ${siteConfig.url}/.well-known/security.txt`,
    `Policy: ${siteConfig.url}/security#report`,
    "",
  ].join("\n")
}

export async function GET() {
  return new Response(await securityTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
