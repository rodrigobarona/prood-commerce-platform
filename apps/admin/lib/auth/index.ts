import { cache } from "react"
import { connection } from "next/server"
import { cookies } from "next/headers"
import { validateSessionToken, type Session } from "./server"

export const getSession = cache(async function getSession(): Promise<Session | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null
  await connection()

  const cookieStore = await cookies()
  const sessionCookie =
    cookieStore.get("__Secure-better-auth.session_token") ??
    cookieStore.get("better-auth.session_token")
  if (!sessionCookie) return null

  const rawValue = decodeURIComponent(sessionCookie.value)
  const token = rawValue.split(".")[0]
  if (!token) return null

  try {
    return await validateSessionToken(token)
  } catch (err) {
    console.error("[admin-auth] session validation failed:", err)
    return null
  }
})

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

export const requireAdmin = cache(async function requireAdmin() {
  const session = await getSession()
  if (!session) return null
  if (session.user.role !== "admin") return null
  return session
})

export { getAuth } from "./server"
export type { Session, SessionUser } from "./server"
