import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { requiredEnv } from "@prood/types"
import { isMissingCatalogPage, isMissingPolicyPage } from "@/lib/catalog-check"
import { markdownPath } from "@/lib/markdown-route"

/** No page lives here, so Next.js answers it with the store's 404. */
const NOT_FOUND_PATH = "/not-found"

/** The store's route tree lives under its host, so cached pages are keyed by store. */
function rewriteToStore(request: NextRequest, host: string, pathname: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = `/${host}${pathname === "/" ? "" : pathname}`
  return NextResponse.rewrite(url)
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase()
  const { pathname } = request.nextUrl

  // Route Handlers read the host themselves.
  if (pathname.startsWith("/api/")) return NextResponse.next()

  // The bare store domain (prood.app) is not a store — send it to marketing.
  if (!host || host === process.env.NEXT_PUBLIC_PLATFORM_DOMAIN) {
    return NextResponse.redirect(requiredEnv(process.env.NEXT_PUBLIC_WEB_URL, "NEXT_PUBLIC_WEB_URL"))
  }

  // Optimistic, DB-free session check for authenticated routes. Authorization
  // is still enforced in Server Components/Actions via getSession().
  if (pathname.startsWith("/account")) {
    const sessionCookie = getSessionCookie(request)
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  const markdown = markdownPath(pathname, request.headers.get("accept"))
  if (markdown) return rewriteToStore(request, host, markdown)

  // In-app navigation doesn't need the status, so it skips the lookup.
  const document = request.headers.get("sec-fetch-dest") !== "empty"
  if (document) {
    if ((await isMissingCatalogPage(pathname, host)) || (await isMissingPolicyPage(pathname, host))) {
      return rewriteToStore(request, host, NOT_FOUND_PATH)
    }
  }

  return rewriteToStore(request, host, pathname)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
}
