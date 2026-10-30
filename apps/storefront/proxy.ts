import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { requiredEnv } from "@prood/types"

export function proxy(request: NextRequest) {
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

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
