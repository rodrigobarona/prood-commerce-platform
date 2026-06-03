import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN
const MARKETING_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3001"

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase()

  if (PLATFORM_DOMAIN && host === PLATFORM_DOMAIN) {
    return NextResponse.redirect(MARKETING_URL)
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
