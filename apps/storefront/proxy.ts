import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { requiredEnv } from "@prood/types"
import { isMissingCatalogPage, isMissingPolicyPage } from "@/lib/catalog-check"

/** No route lives here, so Next.js answers it as a plain 404. */
const NOT_FOUND_PATH = "/not-found"

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase()

  // The bare store domain (prood.app) is not a store — send it to marketing.
  if (host === process.env.NEXT_PUBLIC_PLATFORM_DOMAIN) {
    return NextResponse.redirect(requiredEnv(process.env.NEXT_PUBLIC_WEB_URL, "NEXT_PUBLIC_WEB_URL"))
  }

  // Optimistic, DB-free session check for authenticated routes. Authorization
  // is still enforced in Server Components/Actions via getSession().
  if (request.nextUrl.pathname.startsWith("/account")) {
    const sessionCookie = getSessionCookie(request)
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // In-app navigation doesn't need the status, so it skips the lookup.
  const document = request.headers.get("sec-fetch-dest") !== "empty"
  if (document) {
    const { pathname } = request.nextUrl
    if ((await isMissingCatalogPage(pathname, host)) || (await isMissingPolicyPage(pathname, host))) {
      return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
