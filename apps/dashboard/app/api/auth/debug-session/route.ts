import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { getAuth } from "@/lib/auth/server"

/**
 * Development-only endpoint that diagnoses session validation failures.
 * Checks each step: cookie presence → signature verification → DB lookup.
 *
 * DELETE THIS FILE before going to production.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 })
  }

  const steps: Record<string, unknown> = {}

  // Step 1: Raw cookie presence
  const rawCookie = request.headers.get("cookie")
  const sessionCookie = getSessionCookie(request)
  steps.cookieHeaderPresent = !!rawCookie
  steps.sessionCookiePresent = !!sessionCookie
  steps.sessionCookiePreview = sessionCookie
    ? `${sessionCookie.substring(0, 8)}…${sessionCookie.substring(sessionCookie.length - 8)}`
    : null

  // Step 2: Environment check
  const secret = process.env.BETTER_AUTH_SECRET?.trim()
  const baseURL = process.env.BETTER_AUTH_URL?.trim()
  const dbURL = process.env.DATABASE_URL?.trim()
  steps.env = {
    secretSet: !!secret,
    secretLength: secret?.length ?? 0,
    secretFirst4: secret?.substring(0, 4) ?? null,
    secretLast4: secret?.substring((secret?.length ?? 0) - 4) ?? null,
    baseURL,
    databaseURLSet: !!dbURL,
    databaseURLHost: dbURL ? new URL(dbURL).host : null,
    authCookieDomain: process.env.AUTH_COOKIE_DOMAIN?.trim() ?? "(not set)",
    nodeEnv: process.env.NODE_ENV,
  }

  // Step 3: Try getSession via the auth instance
  try {
    const auth = getAuth()
    const session = await auth.api.getSession({ headers: request.headers })
    steps.getSessionResult = session
      ? { success: true, userId: session.user?.id, email: session.user?.email }
      : { success: false, returned: null }
  } catch (err) {
    steps.getSessionResult = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      name: err instanceof Error ? err.name : undefined,
    }
  }

  return NextResponse.json({ debug: steps, ts: new Date().toISOString() }, { status: 200 })
}
