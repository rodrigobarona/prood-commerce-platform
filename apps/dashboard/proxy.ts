import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

// Public routes that don't require an authenticated merchant.
const PUBLIC_PATHS = ["/login", "/register"]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

// Optimistic, DB-free session check at the network boundary. Real authorization
// (and active-organization resolution) is enforced in Server Components/Actions
// via getSession().
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request)
  const publicRoute = isPublic(pathname)

  if (!sessionCookie && !publicRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Do not redirect away from /login based on cookie presence alone.
  // getSessionCookie only checks that a token exists; the dashboard layout
  // validates the session against the database. A stale or invalid cookie
  // otherwise bounces /login -> / -> /login indefinitely on Vercel.

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
