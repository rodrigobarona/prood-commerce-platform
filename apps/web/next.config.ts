import { withConsentManifest } from "c15t/next/build"
import type { NextConfig } from "next"

import { MEDIA_URL, mediaRemotePattern } from "@prood/media/remote-pattern"
import { originOf, securityHeaders } from "@prood/security-headers"

/**
 * prood.com is one domain. This app owns it and is the gateway: the pages here are the marketing
 * site, and the rewrites below send everything else to the Vercel project that serves it, so the
 * address bar never leaves prood.com.
 *
 *   /dashboard/*  dashboard      /pay/*   hosted checkout     /v1/*  REST API
 *   /admin/*      admin          /docs/*  documentation       /mcp   MCP server
 *   /api/auth/*   sign-in API    /.well-known/agent-configuration   Agent Auth discovery
 *
 * Merchant stores are not here: they live on `{store}.prood.app`, a separate domain by design.
 */

/**
 * Where a zone runs: the origin of its own Vercel project (its `*.vercel.app` address). A deployed
 * build must set it, because a localhost fallback in production silently breaks the whole zone.
 */
function zoneOrigin(name: string, localDefault: string): string {
  const value = process.env[name]
  if (value) return value.replace(/\/+$/, "")
  if (process.env.VERCEL) {
    throw new Error(`${name} is not set. apps/web proxies traffic to it: set it on the Vercel project for this environment.`)
  }
  return localDefault
}

const dashboard = zoneOrigin("DASHBOARD_ORIGIN", "http://localhost:3002")
const docs = zoneOrigin("DOCS_ORIGIN", "http://localhost:3003")
const checkout = zoneOrigin("CHECKOUT_ORIGIN", "http://localhost:3004")
const api = zoneOrigin("API_ORIGIN", "http://localhost:3005")
const admin = zoneOrigin("ADMIN_ORIGIN", "http://localhost:3006")

/**
 * The gateway merges the headers of `/(.*)` into the responses it proxies, and every zone sends its
 * own Content-Security-Policy (the dashboard needs the image bucket, checkout needs Stripe). Two
 * policies on one response both apply, so this app's headers are limited to its own pages.
 */
const PROXIED = "(?:dashboard|admin|pay|docs|_docs|v1|mcp)(?:/|$)|api/(?:auth|search)(?:/|$)|\\.well-known/agent-configuration$"
const OWN_PAGES = `/((?!${PROXIED}).*)`

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@prood/consent", "@prood/ui", "@prood/media"],
  images: {
    remotePatterns: [mediaRemotePattern],
  },
  async rewrites() {
    return {
      // After this app's own routes, so /api/c15t, /llms.txt and the marketing pages are never shadowed.
      afterFiles: [
        // A rule for the bare path and one for what follows it: "/x/:path*" sends "/x" to "/x/",
        // which a zone redirects back to "/x".
        { source: "/dashboard", destination: `${dashboard}/dashboard` },
        { source: "/dashboard/:path*", destination: `${dashboard}/dashboard/:path*` },
        { source: "/admin", destination: `${admin}/admin` },
        { source: "/admin/:path*", destination: `${admin}/admin/:path*` },
        { source: "/pay", destination: `${checkout}/pay` },
        { source: "/pay/:path*", destination: `${checkout}/pay/:path*` },
        // The docs also publish llms.txt files at their own root; the narrower rules come first.
        { source: "/docs/llms.txt", destination: `${docs}/llms.txt` },
        { source: "/docs/llms-full.txt", destination: `${docs}/llms-full.txt` },
        { source: "/docs", destination: `${docs}/docs` },
        { source: "/docs.md", destination: `${docs}/docs.md` },
        { source: "/docs/:path*", destination: `${docs}/docs/:path*` },
        // The docs' scripts and styles are asked for under /_docs (their assetPrefix), so they can't
        // collide with this app's own /_next files.
        { source: "/_docs/_next/:path*", destination: `${docs}/_next/:path*` },
        { source: "/api/search", destination: `${docs}/api/search` },
        { source: "/v1", destination: `${api}/v1` },
        { source: "/v1/:path*", destination: `${api}/v1/:path*` },
        { source: "/mcp", destination: `${api}/mcp` },
        { source: "/api/auth/:path*", destination: `${api}/api/auth/:path*` },
        { source: "/.well-known/agent-configuration", destination: `${api}/.well-known/agent-configuration` },
      ],
    }
  },
  async redirects() {
    return [
      // The short addresses people type.
      { source: "/login", destination: "/dashboard/login", permanent: false },
      { source: "/register", destination: "/dashboard/register", permanent: false },
      { source: "/signup", destination: "/dashboard/register", permanent: false },
    ]
  },
  headers: async () =>
    securityHeaders({
      // Web Analytics, once the visitor allows `measurement`; its events post to /_vercel/insights.
      scriptSrc: ["https://va.vercel-scripts.com"],
      // The hero film plays straight from the media Worker.
      mediaSrc: [originOf(MEDIA_URL)],
    }).map((rule) => ({ ...rule, source: OWN_PAGES })),
}

// Bundles the INTH policy (see c15t.config.ts) into the build. If INTH
// can't be reached, the build still finishes and the server fetches the policy at
// runtime: until it resolves, the banner stays hidden and analytics stay off.
export default withConsentManifest(nextConfig, { onBuildError: "runtime" })
