import { withConsentManifest } from "c15t/next/build"
import type { NextConfig } from "next"

import { MEDIA_URL, mediaRemotePattern } from "@prood/media/remote-pattern"
import { originOf, securityHeaders } from "@prood/security-headers"
import { DASHBOARD_SEGMENTS, SESSION_COOKIES } from "./lib/zones"

/**
 * prood.com is one domain. This app owns it and is the gateway: the pages here are the marketing
 * site, and the rewrites below send everything else to the Vercel project that serves it, so the
 * address bar never leaves prood.com.
 *
 *   /                  the dashboard when signed in, the marketing homepage when not (`/home` is the
 *                      marketing homepage for a signed-in visitor)
 *   /orders, /login... the dashboard, for everyone (DASHBOARD_SEGMENTS in lib/zones.ts)
 *   /admin/*  admin    /pay/*  hosted checkout    /v1/*  REST API       /docs/*  documentation
 *   /api/auth/*  sign-in API    /mcp  MCP server    /.well-known/agent-configuration  Agent Auth discovery
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
 * The gateway merges the headers of its own rules into the responses it proxies, and every zone sends
 * its own Content-Security-Policy (the dashboard needs the image bucket, checkout needs Stripe). Two
 * policies on one response both apply, so this app's headers are limited to its own pages.
 */
const PROXIED = [
  `(?:${DASHBOARD_SEGMENTS.join("|")}|admin|pay|docs|_dashboard|_docs|v1|mcp)(?:/|$)`,
  "api/(?:auth|search|export)(?:/|$)",
  "\\.well-known/agent-configuration$",
].join("|")
/** Every page except `/` and the proxied ones. */
const OWN_PAGES = `/((?!${PROXIED}).+)`
const signedIn = SESSION_COOKIES.map((key) => ({ type: "cookie" as const, key }))

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@prood/consent", "@prood/ui", "@prood/media"],
  images: {
    remotePatterns: [mediaRemotePattern],
  },
  async rewrites() {
    return {
      // Before this app's own routes, because `/` is one of them: a visitor with a session cookie gets
      // the dashboard's home instead of the marketing homepage. One rule per cookie name, since a
      // rule's `has` needs all of its entries.
      // The home page's prefetch files (`/index.rsc`, `/index.segments/...`) go with it, or a signed-in
      // browser prefetching "/" would be handed the marketing site's.
      beforeFiles: SESSION_COOKIES.flatMap((key) => {
        const has = [{ type: "cookie" as const, key }]
        return [
          { source: "/", has, destination: `${dashboard}/` },
          { source: "/index.rsc", has, destination: `${dashboard}/index.rsc` },
          { source: "/index.segments/:path*", has, destination: `${dashboard}/index.segments/:path*` },
        ]
      }),
      // After this app's own routes, so /api/c15t, /llms.txt and the marketing pages are never shadowed.
      afterFiles: [
        // A rule for the bare path and one for what follows it: "/x/:path*" sends "/x" to "/x/",
        // which a zone redirects back to "/x".
        ...DASHBOARD_SEGMENTS.flatMap((segment) => [
          { source: `/${segment}`, destination: `${dashboard}/${segment}` },
          { source: `/${segment}/:path*`, destination: `${dashboard}/${segment}/:path*` },
        ]),
        { source: "/api/export/:path*", destination: `${dashboard}/api/export/:path*` },
        // The dashboard's scripts, styles and images are asked for under /_dashboard (its assetPrefix),
        // so they can't collide with this app's own /_next files.
        { source: "/_dashboard/_next/:path*", destination: `${dashboard}/_next/:path*` },
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
      // The short address people type.
      { source: "/signup", destination: "/register", permanent: false },
      // The dashboard used to live under /dashboard. Links in old emails and bookmarks still work.
      { source: "/dashboard", destination: "/", permanent: false },
      { source: "/dashboard/integrations/:path*", destination: "/payments/:path*", permanent: false },
      { source: "/dashboard/integrations", destination: "/payments", permanent: false },
      { source: "/dashboard/:path*", destination: "/:path*", permanent: false },
    ]
  },
  headers: async () => {
    const rules = securityHeaders({
      // Web Analytics, once the visitor allows `measurement`; its events post to /_vercel/insights.
      scriptSrc: ["https://va.vercel-scripts.com"],
      // The hero film plays straight from the media Worker.
      mediaSrc: [originOf(MEDIA_URL)],
    })
    return [
      // The homepage only without a session cookie: with one, `/` is the dashboard, which sends its own.
      ...rules.map((rule) => ({ ...rule, source: "/", missing: signedIn })),
      ...rules.map((rule) => ({ ...rule, source: OWN_PAGES })),
    ]
  },
}

// Bundles the INTH policy (see c15t.config.ts) into the build. If INTH
// can't be reached, the build still finishes and the server fetches the policy at
// runtime: until it resolves, the banner stays hidden and analytics stay off.
export default withConsentManifest(nextConfig, { onBuildError: "runtime" })
