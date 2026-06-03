import { cache } from "react"
import {
  getSession as getSessionFromPackage,
} from "@prood/auth"
import { getAuth, type Session } from "./server"

export async function getSession(): Promise<Session | null> {
  return getSessionFromPackage(getAuth)
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
