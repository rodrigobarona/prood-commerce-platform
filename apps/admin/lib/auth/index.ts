import { cache } from "react"
import { connection } from "next/server"
import { headers } from "next/headers"
import { getAuth, type Session } from "./server"

export async function getSession(): Promise<Session | null> {
  await connection()
  if (process.env.NEXT_PHASE === "phase-production-build") return null
  const headerList = await headers()
  return getAuth().api.getSession({ headers: headerList })
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

export const requireAdmin = cache(async function requireAdmin() {
  const session = await getSession()
  if (!session) return null

  const role = (session.user as Record<string, unknown>).role as
    | string
    | undefined
  if (role !== "admin") return null

  return session
})

export { getAuth } from "./server"
export type { Session, SessionUser } from "./server"
