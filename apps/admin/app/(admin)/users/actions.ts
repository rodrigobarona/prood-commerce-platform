"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { getAuth, requireAdmin } from "@/lib/auth"

async function requireAdminSession() {
  const session = await requireAdmin()
  if (!session) throw new Error("Unauthorized")
  return session
}

export async function banUser(userId: string, reason?: string) {
  await requireAdminSession()
  await getAuth().api.banUser({
    headers: await headers(),
    body: {
      userId,
      ...(reason ? { banReason: reason } : {}),
    },
  })
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}

export async function unbanUser(userId: string) {
  await requireAdminSession()
  await getAuth().api.unbanUser({
    headers: await headers(),
    body: { userId },
  })
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}

export async function setUserRole(userId: string, role: "user" | "admin") {
  await requireAdminSession()
  await getAuth().api.setRole({
    headers: await headers(),
    body: { userId, role },
  })
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}

export async function revokeUserSession(sessionToken: string) {
  await requireAdminSession()
  await getAuth().api.revokeUserSession({
    headers: await headers(),
    body: { sessionToken },
  })
  revalidatePath("/sessions")
}

export async function revokeAllUserSessions(userId: string) {
  await requireAdminSession()
  await getAuth().api.revokeUserSessions({
    headers: await headers(),
    body: { userId },
  })
  revalidatePath("/sessions")
}
