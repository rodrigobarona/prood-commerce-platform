"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { demoteAdmin } from "@prood/auth/admin-role"
import { getSessionToken } from "@/lib/admin-queries"
import { assertAdmin, getAuth } from "@/lib/auth"

/** An admin can't lock themselves out from their own user page, even by calling the action directly. */
async function assertNotSelf(userId: string) {
  const admin = await assertAdmin()
  if (admin.user.id === userId) {
    throw new Error("Admins can't ban, demote or sign out their own account.")
  }
}

export async function banUser(userId: string, reason?: string) {
  await assertNotSelf(userId)
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
  await assertAdmin()
  await getAuth().api.unbanUser({
    headers: await headers(),
    body: { userId },
  })
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}

export async function setUserRole(userId: string, role: "user" | "admin") {
  await assertNotSelf(userId)
  if (role !== "user" && role !== "admin") throw new Error("That isn't a role.")
  if (role === "user" && !(await demoteAdmin(userId))) {
    throw new Error("Prood needs at least one admin who can sign in.")
  }
  await getAuth().api.setRole({
    headers: await headers(),
    body: { userId, role },
  })
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}

export async function revokeAllUserSessions(userId: string) {
  await assertNotSelf(userId)
  await getAuth().api.revokeUserSessions({
    headers: await headers(),
    body: { userId },
  })
  revalidatePath("/sessions")
  revalidatePath(`/users/${userId}`)
}

/** Signs one device out. The token never reaches the page, so this looks it up by id. */
export async function revokeSession(sessionId: string, userId: string) {
  await assertAdmin()
  const sessionToken = await getSessionToken(sessionId)
  if (!sessionToken) return
  await getAuth().api.revokeUserSession({
    headers: await headers(),
    body: { sessionToken },
  })
  revalidatePath("/sessions")
  revalidatePath(`/users/${userId}`)
}
