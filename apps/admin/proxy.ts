import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/two-factor"]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request)
  const publicRoute = isPublic(pathname)

  // A server action can't follow this redirect, so let it through: every action
  // checks the session itself and sends the browser to /login.
  const serverAction = request.headers.has("next-action")

  if (!sessionCookie && !publicRoute && !serverAction) {
    // `nextUrl.pathname` has the base path stripped; cloning keeps it, so the redirect stays under /admin.
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.search = ""
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Under a base path the second pattern needs something after the slash, so the home page (/admin) is listed on its own.
  matcher: ["/", "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon).*)"],
}
